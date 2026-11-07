import assert from 'node:assert/strict';
import {test} from 'node:test';
import {emptyData,isFinanceData,type FinanceData} from './finance';
import {addCategoryRule,matchCategoryRule,moveCategoryRule,removeCategoryRule,setRuleEnabled,validCategoryRules} from './category-rules';
import {addCategory,categoryUsage,removeCategory,renameCategory} from './category-settings';
import {sameFinanceData} from './cloud-state';
import {parseWorkspaceInput} from './sync';

const first={id:'r1',phrase:'Café',category:'Alimentação',type:'expense',space:'all',enabled:true} as const;
const second={id:'r2',phrase:'Café central',category:'Lazer',type:'expense',space:'personal',enabled:true} as const;
const base:FinanceData={...emptyData,categoryRules:[first,second]};

test('legacy finance snapshots without automation remain valid and equivalent to empty rules',()=>{
 assert.ok(isFinanceData(emptyData));
 assert.ok(isFinanceData({...emptyData,categoryRules:[]}));
 assert.ok(sameFinanceData(emptyData,{...emptyData,categoryRules:[]}));
});

test('ordered, accent-insensitive matching uses first applicable active rule',()=>{
 assert.ok(validCategoryRules(base));
 assert.ok(isFinanceData(base));
 assert.equal(matchCategoryRule(base,{description:'CAFÉ CENTRAL mensal',type:'expense',space:'personal'})?.category,'Alimentação');
 const reordered=moveCategoryRule(base,'r2',-1);
 assert.equal(matchCategoryRule(reordered,{description:'Cafe central mensal',type:'expense',space:'personal'})?.category,'Lazer');
 assert.notDeepEqual(reordered.categoryRules,base.categoryRules);
 assert.equal(matchCategoryRule(base,{description:'Café central',type:'income',space:'personal'}),null);
 assert.equal(matchCategoryRule(base,{description:'Internet',type:'expense',space:'personal'}),null);
 assert.equal(matchCategoryRule(reordered,{description:'Café central',type:'expense',space:'work'})?.category,'Alimentação');
});

test('disabling or removing rule affects future matches only',()=>{
 const paused=setRuleEnabled(base,'r1',false);
 assert.equal(matchCategoryRule(paused,{description:'Café da tarde',type:'expense',space:'work'}),null);
 const removed=removeCategoryRule(base,'r1');
 assert.equal(removed.categoryRules?.length,1);
 assert.deepEqual(base.categoryRules?.length,2);
 assert.equal(matchCategoryRule(removed,{description:'Café da tarde',type:'expense',space:'work'}),null);
});

test('duplicate matching terms, missing categories and invalid lengths are rejected',()=>{
 assert.throws(()=>addCategoryRule(base,{...first,id:'different',phrase:'cafe'}),/não são permitidas/i);
 assert.throws(()=>addCategoryRule(base,{...first,id:'different',category:'Inventada',phrase:'Cinema'}),/não são permitidas/i);
 assert.throws(()=>addCategoryRule(base,{...first,id:'different',phrase:'x'}),/não são permitidas/i);
 assert.equal(validCategoryRules({...emptyData,categoryRules:[{...first,enabled:'true' as unknown as boolean}]}),false);
 assert.equal(parseWorkspaceInput({revision:0,data:{...base,categoryRules:[first,first]}}),null);
});

test('custom categories cannot be deleted while rules reference them; rename preserves rule destinations',()=>{
 const withCustom=addCategory(emptyData,'Educação');
 const next=addCategoryRule(withCustom,{...first,id:'edu',phrase:'Faculdade',category:'Educação'});
 assert.ok(isFinanceData(next));
 assert.equal(categoryUsage(next,'Educação').rules,1);
 assert.throws(()=>removeCategory(next,'Educação'),/possui/);
 const renamed=renameCategory(next,'Educação','Estudos');
 assert.ok(isFinanceData(renamed));
 assert.equal(renamed.categoryRules?.[0].category,'Estudos');
 assert.equal(matchCategoryRule(renamed,{description:'Mensalidade faculdade',type:'expense',space:'personal'})?.category,'Estudos');
});
