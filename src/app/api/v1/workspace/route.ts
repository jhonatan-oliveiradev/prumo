import {getAuth,cloudEnabled} from '@/lib/server/auth';
import {readWorkspace,writeWorkspace,RevisionConflict} from '@/lib/server/workspace';
import {MAX_SYNC_BYTES,parseWorkspaceInput,canWriteOrigin} from '@/lib/sync';
export const dynamic='force-dynamic';
const headers={'Cache-Control':'private, no-store'};
export async function GET(request:Request){
 if(!cloudEnabled())return Response.json({error:'Sincronização indisponível.'},{status:503,headers});
 try{
  const session=await getAuth().api.getSession({headers:request.headers});
  if(!session)return Response.json({error:'Entre na sua conta.'},{status:401,headers});
  const workspace=await readWorkspace(session.user.id);
  return Response.json({workspace},{headers});
 }catch{return Response.json({error:'Não foi possível carregar seus dados.'},{status:503,headers});}
}
export async function PUT(request:Request){
 if(!cloudEnabled())return Response.json({error:'Sincronização indisponível.'},{status:503,headers});
 if(!canWriteOrigin(request.headers.get('origin'),process.env.BETTER_AUTH_URL!))return Response.json({error:'Origem inválida.'},{status:403,headers});
 if(!request.headers.get('content-type')?.startsWith('application/json'))return Response.json({error:'Envie JSON.'},{status:415,headers});
 // Limit while reading, including requests without a Content-Length header.
 const reader=request.body?.getReader();
 if(!reader)return Response.json({error:'Dados ausentes.'},{status:400,headers});
 let size=0;const chunks:Uint8Array[]=[];
 for(;;){const {value,done}=await reader.read();if(done)break;size+=value.length;if(size>MAX_SYNC_BYTES){await reader.cancel();return Response.json({error:'Backup maior que 1 MB.'},{status:413,headers});}chunks.push(value);}
 const body=new Uint8Array(size);let position=0;for(const c of chunks){body.set(c,position);position+=c.length;}
 let parsed:unknown;try{parsed=JSON.parse(new TextDecoder().decode(body));}catch{return Response.json({error:'JSON inválido.'},{status:400,headers});}
 const input=parseWorkspaceInput(parsed);
 if(!input)return Response.json({error:'Dados financeiros inválidos.'},{status:400,headers});
 try{
  const session=await getAuth().api.getSession({headers:request.headers});
  if(!session)return Response.json({error:'Entre na sua conta.'},{status:401,headers});
  try{return Response.json(await writeWorkspace(session.user,input.data,input.revision),{headers});}
  catch(e){if(e instanceof RevisionConflict)return Response.json({error:'Os dados foram alterados em outro dispositivo.'},{status:409,headers});throw e;}
 }catch{return Response.json({error:'Não foi possível salvar na nuvem. Sua cópia local foi mantida.'},{status:503,headers});}
}
