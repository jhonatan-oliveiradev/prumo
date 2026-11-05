import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
function shell(){const handlers:Record<string,(event:unknown)=>void>={};const matched:string[]=[];runInNewContext(readFileSync('public/sw.js','utf8'),{URL,Promise,self:{location:{origin:'https://prumo.test'},addEventListener:(name:string,handler:(event:unknown)=>void)=>{handlers[name]=handler;}},caches:{match:async(path:string)=>{matched.push(path);return new Response(path);}},fetch:async()=>{throw Error('offline');}});return {handlers,matched};}
test('offline navigation restores each route independently',async()=>{
 const {handlers,matched}=shell();
 for(const route of ['/','/app']){let result:Promise<Response>|undefined;handlers.fetch({request:{method:'GET',url:'https://prumo.test'+route,mode:'navigate'},respondWith:(promise:Promise<Response>)=>{result=promise;}});assert.equal(await (await result)!.text(),route);}
 assert.deepEqual(matched,['/','/app']);
});
test('RSC and API requests never receive a cached HTML shell',()=>{
 const {handlers}=shell();for(const path of ['/app?_rsc=123','/api/v1/workspace'])handlers.fetch({request:{method:'GET',url:'https://prumo.test'+path,mode:'cors'},respondWith:()=>assert.fail('must not intercept dynamic request')});
});
