import {test} from 'node:test';
import assert from 'node:assert/strict';
import {geminiRequest} from './server/gemini-request';
test('transient failures recover with bounded exponential backoff on the same model',async()=>{
 let calls=0;const delays:number[]=[];let signal:AbortSignal|null|undefined;
 const fetcher:typeof fetch=async(url,init)=>{assert.equal(url,'https://provider/model');if(signal)assert.equal(init?.signal,signal);signal=init?.signal;return ++calls<3?new Response('unavailable',{status:503}):Response.json({ok:true});};
 const response=await geminiRequest('https://provider/model',{},fetcher,async ms=>{delays.push(ms);});
 assert.equal(response.status,200);assert.equal(calls,3);assert.ok(delays[0]>=1000&&delays[0]<1250);assert.ok(delays[1]>=2000&&delays[1]<2250);
});
test('permanent failures and quota exhaustion are never retried',async()=>{
 for(const status of [400,401,403,404,429]){let calls=0;const fetcher:typeof fetch=async()=>{calls++;return new Response('',{status});};
 assert.equal((await geminiRequest('https://provider/model',{},fetcher,async()=>assert.fail('unexpected delay'))).status,status);assert.equal(calls,1);}
});
test('persistent service failures stop after three attempts',async()=>{
 let calls=0;const fetcher:typeof fetch=async()=>{calls++;return new Response('',{status:502});};
 assert.equal((await geminiRequest('https://provider/model',{},fetcher,async()=>{})).status,502);assert.equal(calls,3);
});
