import {test} from 'node:test';
import assert from 'node:assert/strict';
import {emptyData,type FinanceData} from './finance';
import {buildAdvisorContext} from './advisor';
import {askGemini,AdvisorError} from './server/gemini';
const data:FinanceData={...emptyData,name:'Private User',accounts:[{id:'secret-account',name:'Private Bank',openingBalance:1234567}],transactions:[{id:'private-id',description:'Private merchant',amount:13579,type:'expense',category:'Saúde',date:'2026-11-01',accountId:'secret-account',status:'paid',space:'personal'}]};
test('advisor context contains no identifiers, descriptions or exact monetary values',()=>{
 const text=JSON.stringify(buildAdvisorContext(data,'2026-11','2026-11-05'));
 for(const privateText of ['Private User','secret-account','Private Bank','private-id','Private merchant','1234567','13579','Saúde'])assert.equal(text.includes(privateText),false);
});
test('Gemini request uses server key header and only predefined task/indicators',async()=>{
 let captured='';
 const fetcher:typeof fetch=async(url,init)=>{assert.ok(String(url).endsWith(':generateContent'));assert.equal((init?.headers as Record<string,string>)['x-goog-api-key'],'test-key');captured=String(init?.body);return Response.json({candidates:[{finishReason:'STOP',content:{parts:[{text:'Organize suas prioridades.'}]}}]});};
 const result=await askGemini(buildAdvisorContext(data,'2026-11','2026-11-05'),'priorities','test-key','gemini-2.5-flash',fetcher);
 assert.equal(result.text,'Organize suas prioridades.');assert.equal(captured.includes('Private merchant'),false);assert.equal(captured.includes('test-key'),false);
});
test('provider quota, blocked and empty results are handled without exposing provider bodies',async()=>{
 const context=buildAdvisorContext(data,'2026-11','2026-11-05');
 const quota:typeof fetch=async()=>new Response('sensitive provider body',{status:429});
 await assert.rejects(()=>askGemini(context,'habits','key','gemini-2.5-flash',quota),(e:unknown)=>e instanceof AdvisorError&&e.status===429&&!e.message.includes('sensitive'));
 const blocked:typeof fetch=async()=>Response.json({candidates:[{finishReason:'SAFETY'}]});
 await assert.rejects(()=>askGemini(context,'habits','key','gemini-2.5-flash',blocked),AdvisorError);
 const empty:typeof fetch=async()=>Response.json({candidates:[]});
 await assert.rejects(()=>askGemini(context,'habits','key','gemini-2.5-flash',empty),AdvisorError);
});

test('provider configuration errors are actionable and never expose raw messages',async()=>{
 const context=buildAdvisorContext(data,'2026-11','2026-11-05');
 for(const [status,body,expected] of [
  [400,{error:{message:'secret-key',details:[{reason:'API_KEY_INVALID'}]}},'chave'],
  [403,{error:{message:'secret-key'}},'negou acesso'],
  [404,{error:{message:'secret-key'}},'GEMINI_MODEL'],
  [400,{error:{status:'FAILED_PRECONDITION',message:'secret-key'}},'requisitos'],
  [503,{error:{message:'secret-key'}},'temporariamente'],
 ] as const){
  const fetcher:typeof fetch=async()=>Response.json(body,{status});
  await assert.rejects(()=>askGemini(context,'habits','key','gemini-3.5-flash-lite',fetcher),(e:unknown)=>e instanceof AdvisorError&&e.message.includes(expected)&&!e.message.includes('secret-key'));
 }
});
test('current model request omits legacy thinking budget and trims configuration',async()=>{
 const fetcher:typeof fetch=async(url,init)=>{
  assert.ok(String(url).includes('/gemini-3.5-flash-lite:'));
  assert.equal((init?.headers as Record<string,string>)['x-goog-api-key'],'key');
  assert.equal(JSON.parse(String(init?.body)).generationConfig.thinkingConfig,undefined);
  return Response.json({candidates:[{finishReason:'STOP',content:{parts:[{text:'Resposta'}]}}]});
 };
 await askGemini(buildAdvisorContext(data,'2026-11','2026-11-05'),'habits',' key ',' gemini-3.5-flash-lite ',fetcher);
});
