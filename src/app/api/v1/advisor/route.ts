import {randomUUID} from 'node:crypto';
import {getAuth,cloudEnabled} from '@/lib/server/auth';
import {readWorkspace} from '@/lib/server/workspace';
import {prisma} from '@/lib/server/prisma';
import {canWriteOrigin} from '@/lib/sync';
import {askGemini,AdvisorError} from '@/lib/server/gemini';
import {advisorTasks,buildAdvisorContext,type AdvisorTask} from '@/lib/advisor';
export const dynamic='force-dynamic';
export const maxDuration=40;
const headers={'Cache-Control':'private, no-store'};
export async function GET(request:Request){
 if(!cloudEnabled())return Response.json({configured:false},{headers});
 try{const session=await getAuth().api.getSession({headers:request.headers});if(!session)return Response.json({error:'Entre na sua conta para consultar o conselheiro.'},{status:401,headers});return Response.json({configured:Boolean(process.env.GEMINI_API_KEY),dailyLimit:10},{headers});}catch{return Response.json({error:'Serviço indisponível.'},{status:503,headers});}
}
export async function POST(request:Request){
 if(!cloudEnabled())return Response.json({error:'Entre na sua conta para consultar o conselheiro.'},{status:503,headers});
 if(!canWriteOrigin(request.headers.get('origin'),process.env.BETTER_AUTH_URL!))return Response.json({error:'Origem inválida.'},{status:403,headers});
 if(!process.env.GEMINI_API_KEY)return Response.json({error:'Configure GEMINI_API_KEY no servidor para ativar o conselheiro.'},{status:503,headers});
 if(!request.headers.get('content-type')?.startsWith('application/json'))return Response.json({error:'Envie JSON.'},{status:415,headers});
 try{
  const session=await getAuth().api.getSession({headers:request.headers});if(!session)return Response.json({error:'Sua sessão expirou. Entre novamente.'},{status:401,headers});
  const reader=request.body?.getReader();if(!reader)throw new AdvisorError('Solicitação vazia.',400);let length=0;const chunks:Uint8Array[]=[];
  for(;;){const {done,value}=await reader.read();if(done)break;length+=value.length;if(length>2048){await reader.cancel();throw new AdvisorError('Solicitação muito grande.',413);}chunks.push(value);}
  const bytes=new Uint8Array(length);let position=0;for(const c of chunks){bytes.set(c,position);position+=c.length;}
  let input:{consent?:boolean;task?:string;month?:string;space?:string;contextSignature?:string};try{input=JSON.parse(new TextDecoder().decode(bytes));}catch{throw new AdvisorError('Solicitação inválida.',400);}
  if(!input||input.consent!==true||!input.task||!Object.hasOwn(advisorTasks,input.task)||!/^\d{4}-(0[1-9]|1[0-2])$/.test(input.month??'')||!['all','personal','work'].includes(input.space??''))throw new AdvisorError('Confirme o envio dos indicadores e selecione uma análise.',400);
  const workspace=await readWorkspace(session.user.id);if(!workspace)throw new AdvisorError('Sincronize seus dados antes de pedir uma análise.',409);
  const today=new Date().toLocaleDateString('en-CA',{timeZone:'America/Sao_Paulo'});
  const visible={...workspace.data,transactions:workspace.data.transactions.filter(t=>input.space==='all'||t.space===input.space)};
  const indicators=buildAdvisorContext(visible,input.month!,today);
  if(input.contextSignature!==JSON.stringify(indicators))throw new AdvisorError('Os indicadores mudaram. Atualize os dados e confirme o envio novamente.',409);
  const day=today,key=`advisor:${session.user.id}:${day}`;
  const quota=await prisma.$queryRaw<{count:number}[]>`INSERT INTO "auth_rate_limit" ("id","key","count","lastRequest") VALUES (${randomUUID()},${key},1,${BigInt(Date.now())}) ON CONFLICT ("key") DO UPDATE SET "count"="auth_rate_limit"."count"+1,"lastRequest"=${BigInt(Date.now())} WHERE "auth_rate_limit"."count"<10 RETURNING "count"`;
  if(!quota.length)throw new AdvisorError('Seu limite de 10 análises por dia foi atingido.',429);
  const result=await askGemini(indicators,input.task as AdvisorTask,process.env.GEMINI_API_KEY,process.env.GEMINI_MODEL||'gemini-2.5-flash');
  return Response.json({...result,revision:workspace.revision,remaining:10-quota[0].count,indicators},{headers});
 }catch(e){if(e instanceof AdvisorError)return Response.json({error:e.message},{status:e.status,headers});if(e instanceof Error&&(e.name==='TimeoutError'||e.name==='AbortError'))return Response.json({error:'O Gemini demorou para responder. Tente novamente.'},{status:504,headers});return Response.json({error:'Não foi possível preparar a análise. Seus dados não foram alterados.'},{status:503,headers});}
}
