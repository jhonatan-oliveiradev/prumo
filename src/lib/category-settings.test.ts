import assert from 'node:assert/strict';
import {test} from 'node:test';
import {emptyData,isFinanceData,summary,type FinanceData} from './finance';
import {addCategory,categoryCatalog,categoryUsage,removeCategory,renameCategory,validCustomCategories} from './category-settings';
import {sameFinanceData} from './cloud-state';
import {parseWorkspaceInput} from './sync';

const base:FinanceData={...emptyData,
 accounts:[{id:'acc',name:'Conta principal',openingBalance:100000}],
 transactions:[{id:'tx',description:'Curso',type:'expense',amount:7500,date:'2026-11-06',category:'Educação',accountId:'acc',status:'paid',space:'personal'}],
 budgets:[{id:'budget',category:'Educação',limit:20000}],
 recurringRules:[{id:'rec',description:'Mensalidade',amount:7500,type:'expense',category:'Educação',accountId:'acc',space:'personal',frequency:'monthly',status:'active',startsOn:'2026-11-06'}],
 creditCards:[{id:'card',name:'Cartão de teste',color:'forest',limit:80000,closingDay:8,dueDay:15,space:'personal'}],
 creditPurchases:[{id:'purchase',cardId:'card',description:'Apostila',amount:2000,date:'2026-11-06',category:'Educação',installments:1}],
 customCategories:['Educação'],
};

test('old backups without customCategories remain valid and equivalent to empty catalogs',()=>{
 assert.equal(isFinanceData(emptyData),true);
 assert.equal(isFinanceData({...emptyData,customCategories:[]}),true);
 assert.equal(sameFinanceData(emptyData,{...emptyData,customCategories:[]}),true);
 assert.ok(categoryCatalog(emptyData).includes('Outros'));
});

test('adding a custom category validates duplicates, casing, accents and length',()=>{
 const next=addCategory(emptyData,'  Educação   continuada ');
 assert.deepEqual(next.customCategories,['Educação continuada']);
 assert.ok(isFinanceData(next));
 assert.throws(()=>addCategory(next,'educacao continuada'),/único/);
 assert.throws(()=>addCategory(emptyData,'saude'),/único/);
 assert.throws(()=>addCategory(emptyData,'a'),/único/);
 assert.throws(()=>addCategory(emptyData,'X'.repeat(41)),/único/);
 assert.equal(validCustomCategories(['Educação','educacao']),false);
 assert.equal(validCustomCategories(['Saúde']),false);
 assert.equal(validCustomCategories(['A','B']),false);
});

test('renaming a custom category updates every financial reference without changing balances',()=>{
 assert.ok(isFinanceData(base));
 const before=summary(base,'2026-11');
 const renamed=renameCategory(base,'Educação','Estudos e cursos');
 assert.ok(isFinanceData(renamed));
 assert.ok(parseWorkspaceInput({data:renamed,revision:0}));
 assert.deepEqual(renamed.customCategories,['Estudos e cursos']);
 assert.equal(renamed.transactions[0].category,'Estudos e cursos');
 assert.equal(renamed.budgets[0].category,'Estudos e cursos');
 assert.equal(renamed.recurringRules?.[0].category,'Estudos e cursos');
 assert.equal(renamed.creditPurchases?.[0].category,'Estudos e cursos');
 assert.deepEqual(summary(renamed,'2026-11'),before);
 assert.equal(base.transactions[0].category,'Educação');
 assert.equal(categoryUsage(renamed,'Estudos e cursos').transactions,1);
});

test('deletion never loses categorization of historical payments',()=>{
 assert.throws(()=>removeCategory(base,'Educação'),/possui lançamentos/);
 assert.throws(()=>removeCategory(base,'Moradia'),/personalizadas/);
 const newData=addCategory(emptyData,'Presentes');
 const removed=removeCategory(newData,'Presentes');
 assert.deepEqual(removed.customCategories,[]);
 assert.equal(isFinanceData(removed),true);
});

test('custom labels are required when referenced by financial records',()=>{
 assert.equal(isFinanceData({...base,customCategories:[]}),false);
 assert.equal(isFinanceData({...base,customCategories:['Educação','educacao']}),false);
 assert.equal(isFinanceData({...base,customCategories:['Educação']}),true);
});
