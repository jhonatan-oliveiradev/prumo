import {test} from 'node:test';
import assert from 'node:assert/strict';
import {emptyData} from './finance';
import {canWriteOrigin,parseWorkspaceInput} from './sync';
test('snapshot requires valid revision and rejects malformed data without throwing',()=>{
 assert.ok(parseWorkspaceInput({data:emptyData,revision:0}));
 for(const revision of [-1,1.5,'1',2147483647])assert.equal(parseWorkspaceInput({data:emptyData,revision}),null);
 assert.equal(parseWorkspaceInput({data:{...emptyData,transactions:[null]},revision:0}),null);
});
test('rejects duplicate IDs, cross-account references, invalid dates and unsafe totals',()=>{
 const account={id:'a',name:'Conta',openingBalance:100};
 const transaction={id:'t',description:'Teste',amount:100,type:'expense',category:'Outros',date:'2026-11-04',accountId:'a',status:'pending',space:'personal'};
 assert.equal(parseWorkspaceInput({data:{...emptyData,accounts:[account,account]},revision:0}),null);
 assert.equal(parseWorkspaceInput({data:{...emptyData,transactions:[transaction]},revision:0}),null);
 assert.equal(parseWorkspaceInput({data:{...emptyData,accounts:[account],transactions:[{...transaction,date:'2026-02-31'}]},revision:0}),null);
 assert.equal(parseWorkspaceInput({data:{...emptyData,accounts:[{...account,openingBalance:Number.MAX_SAFE_INTEGER},{...account,id:'b'}]},revision:0}),null);
 assert.ok(parseWorkspaceInput({data:{...emptyData,accounts:[account],transactions:[transaction]},revision:3}));
});
test('writes require exact same origin, including rejecting missing origins',()=>{
 assert.equal(canWriteOrigin('https://prumo.example','https://prumo.example'),true);
 assert.equal(canWriteOrigin('https://prumo.example.attacker.test','https://prumo.example'),false);
 assert.equal(canWriteOrigin(null,'https://prumo.example'),false);
});
