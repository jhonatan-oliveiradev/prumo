import {geminiRequest} from './gemini-request';
import {advisorTasks,type AdvisorTask,type buildAdvisorContext} from '@/lib/advisor';
export class AdvisorError extends Error{constructor(message:string,public status:number){super(message);}}
export async function askGemini(context:ReturnType<typeof buildAdvisorContext>,task:AdvisorTask,apiKey:string,model='gemini-3.5-flash-lite',fetcher:typeof fetch=fetch){
 model=model.trim();
 if(!/^[a-z0-9.-]+$/.test(model))throw new AdvisorError('Modelo de IA não configurado corretamente.',503);
 const response=await geminiRequest(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,{method:'POST',headers:{'Content-Type':'application/json','x-goog-api-key':apiKey.trim()},body:JSON.stringify({systemInstruction:{parts:[{text:'Você é o conselheiro do Prumo. Responda em português brasileiro, com respeito, sem julgamento. Ajude a organizar o orçamento. Você recebe somente indicadores aproximados sem identificação, não recebe extratos ou valores. Não invente valores, percentuais, renda, dívidas ou causas. Nunca exiba nomes de campos, enums, JSON ou valores técnicos dos indicadores. Traduza tudo para linguagem cotidiana. Use Markdown simples: parágrafos curtos, uma lista numerada de até 4 ações e negrito nos títulos das ações. Não use tabelas, links ou imagens. Diferencie saldo atual de recebimentos previstos. Dê até 4 ações práticas e curtas, explicando os indicadores que sustentam cada sugestão. Se faltam dados, diga isso. Não recomende investimentos, empréstimos, produtos financeiros ou operações; não faça promessas. Não há ferramentas para alterar dados. Não use títulos pomposos nem linguagem alarmista. Resposta de até 350 palavras.'}]},contents:[{role:'user',parts:[{text:JSON.stringify({question:advisorTasks[task],indicators:context})}]}],generationConfig:{temperature:.3,maxOutputTokens:1400,...(model.startsWith('gemini-2.5')?{thinkingConfig:{thinkingBudget:0}}:{})}})},fetcher);
 if(response.status===429)throw new AdvisorError('A cota do Gemini foi atingida. Tente novamente mais tarde.',429);
 if(!response.ok){
  // Never expose Google's message: it can echo credentials or request content.
  const errorBody=await response.json().catch(()=>null) as {error?:{status?:string;details?:{reason?:string}[]}}|null;
  const invalidKey=errorBody?.error?.details?.some(detail=>detail.reason==='API_KEY_INVALID');
  if(invalidKey||response.status===401)throw new AdvisorError('A chave do Gemini é inválida ou expirou. Atualize GEMINI_API_KEY na Vercel e faça um novo deploy.',503);
  if(response.status===403)throw new AdvisorError('O Google negou acesso ao Gemini. Confira as restrições da chave, a API habilitada e a disponibilidade do plano gratuito no Google AI Studio.',503);
  if(response.status===404)throw new AdvisorError('O modelo Gemini configurado não está disponível para este projeto. Atualize GEMINI_MODEL na Vercel e faça um novo deploy.',503);
  if(errorBody?.error?.status==='FAILED_PRECONDITION')throw new AdvisorError('Este projeto ou região não atende aos requisitos de acesso do Gemini. Confira a disponibilidade no Google AI Studio.',503);
  if(response.status>=500)throw new AdvisorError('O Gemini está temporariamente indisponível. Tente novamente em alguns minutos.',502);
  throw new AdvisorError('O Gemini recusou a solicitação. Confira a configuração da chave e do modelo na Vercel.',502);
 }
 const body=await response.json() as {candidates?:{finishReason?:string;content?:{parts?:{text?:string;thought?:boolean}[]}}[]};
 const candidate=body.candidates?.[0];
 if(candidate?.finishReason&&candidate.finishReason!=='STOP'&&candidate.finishReason!=='MAX_TOKENS')throw new AdvisorError('A IA não conseguiu produzir uma análise para esta solicitação.',502);
 const text=candidate?.content?.parts?.filter(p=>!p.thought).map(p=>p.text??'').join('\n').trim();
 if(!text)throw new AdvisorError('A IA retornou uma resposta vazia. Tente novamente.',502);
 return {text:text.slice(0,12000),incomplete:candidate?.finishReason==='MAX_TOKENS'};
}
