import {advisorTasks,type AdvisorTask,type buildAdvisorContext} from '@/lib/advisor';
export class AdvisorError extends Error{constructor(message:string,public status:number){super(message);}}
export async function askGemini(context:ReturnType<typeof buildAdvisorContext>,task:AdvisorTask,apiKey:string,model='gemini-2.5-flash',fetcher:typeof fetch=fetch){
 if(!/^[a-z0-9.-]+$/.test(model))throw new AdvisorError('Modelo de IA não configurado corretamente.',503);
 const response=await fetcher(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,{method:'POST',headers:{'Content-Type':'application/json','x-goog-api-key':apiKey},signal:AbortSignal.timeout(25000),body:JSON.stringify({systemInstruction:{parts:[{text:'Você é o conselheiro do Prumo. Responda em português brasileiro, com respeito, sem julgamento. Ajude a organizar o orçamento. Você recebe somente indicadores aproximados sem identificação, não recebe extratos ou valores. Não invente valores, percentuais, renda, dívidas ou causas. Diferencie saldo atual de recebimentos previstos. Dê até 4 ações práticas e curtas, explicando os indicadores que sustentam cada sugestão. Se faltam dados, diga isso. Não recomende investimentos, empréstimos, produtos financeiros ou operações; não faça promessas. Não há ferramentas para alterar dados. Não use títulos pomposos nem linguagem alarmista. Resposta de até 350 palavras.'}]},contents:[{role:'user',parts:[{text:JSON.stringify({question:advisorTasks[task],indicators:context})}]}],generationConfig:{temperature:.3,maxOutputTokens:1400,...(model.startsWith('gemini-2.5')?{thinkingConfig:{thinkingBudget:0}}:{})}})});
 if(response.status===429)throw new AdvisorError('A cota do Gemini foi atingida. Tente novamente mais tarde.',429);
 if(!response.ok)throw new AdvisorError('Não foi possível consultar o Gemini. Confira a configuração e tente novamente.',502);
 const body=await response.json() as {candidates?:{finishReason?:string;content?:{parts?:{text?:string;thought?:boolean}[]}}[]};
 const candidate=body.candidates?.[0];
 if(candidate?.finishReason&&candidate.finishReason!=='STOP'&&candidate.finishReason!=='MAX_TOKENS')throw new AdvisorError('A IA não conseguiu produzir uma análise para esta solicitação.',502);
 const text=candidate?.content?.parts?.filter(p=>!p.thought).map(p=>p.text??'').join('\n').trim();
 if(!text)throw new AdvisorError('A IA retornou uma resposta vazia. Tente novamente.',502);
 return {text:text.slice(0,12000),incomplete:candidate?.finishReason==='MAX_TOKENS'};
}
