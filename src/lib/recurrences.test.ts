import {test} from 'node:test';
import assert from 'node:assert/strict';
import {emptyData,isFinanceData,type FinanceData,type RecurringRule} from './finance';
import {generateRecurrences,saveRecurringRule,toggleRecurringRule} from './recurrences';
const rule:RecurringRule={id:'rent',description:'Aluguel',amount:150000,type:'expense',category:'Moradia',accountId:'a',space:'personal',frequency:'monthly',status:'active',startsOn:'2026-01-31'};
const data:FinanceData={...emptyData,accounts:[{id:'a',name:'Conta',openingBalance:0}],recurringRules:[rule]};
test('monthly recurring dates retain original day and generation is idempotent',()=>{
 const result=generateRecurrences(data,'2026-04-01');
 assert.deepEqual(result.transactions.map(t=>t.date),['2026-01-31','2026-02-28','2026-03-31']);
 assert.ok(result.transactions.every(t=>t.status==='pending'));
 assert.equal(generateRecurrences(result,'2026-04-01'),result);
 assert.ok(isFinanceData(result));
 assert.equal(data.transactions.length,0);
});
test('deleting one generated occurrence does not regenerate it on horizon extension',()=>{
 const result=generateRecurrences(data,'2026-04-01');
 const deleted={...result,transactions:result.transactions.filter(t=>t.date!=='2026-02-28')};
 assert.deepEqual(generateRecurrences(deleted,'2026-05-01').transactions.map(t=>t.date),['2026-01-31','2026-03-31','2026-04-30']);
});
test('pause preserves paid and overdue; resume skips the paused past',()=>{
 const generated=generateRecurrences(data,'2026-06-01');
 generated.transactions[2]={...generated.transactions[2],status:'paid'};
 const paused=toggleRecurringRule(generated,'rent','2026-02-10');
 assert.deepEqual(paused.transactions.map(t=>t.date),['2026-01-31','2026-03-31']);
 assert.equal(generateRecurrences(paused,'2026-12-01'),paused);
 const resumed=toggleRecurringRule(paused,'rent','2026-04-10');
 assert.equal(resumed.transactions.some(t=>t.date==='2026-02-28'),false);
 assert.equal(resumed.transactions.filter(t=>t.date==='2026-03-31').length,1);
 assert.ok(resumed.transactions.some(t=>t.date==='2026-04-30'));
});
test('edits only replace future pending, and weekly/yearly/end dates work',()=>{
 const result=generateRecurrences(data,'2026-04-01');
 const changed=saveRecurringRule(result,{...rule,amount:200000,startsOn:'2026-02-28'},'2026-02-01');
 assert.equal(changed.transactions.find(t=>t.date==='2026-01-31')?.amount,150000);
 assert.equal(changed.transactions.find(t=>t.date==='2026-02-28')?.amount,200000);
 const weekly=generateRecurrences({...data,recurringRules:[{...rule,frequency:'weekly',startsOn:'2026-01-01',endsOn:'2026-01-15'}]},'2026-03-01');
 assert.deepEqual(weekly.transactions.map(t=>t.date),['2026-01-01','2026-01-08','2026-01-15']);
 const yearly=generateRecurrences({...data,recurringRules:[{...rule,frequency:'yearly',startsOn:'2024-02-29'}]},'2026-03-01');
 assert.deepEqual(yearly.transactions.map(t=>t.date),['2024-02-29','2025-02-28','2026-02-28']);
});

test('old backups remain valid and recurrence references must belong to this snapshot',()=>{
 assert.ok(isFinanceData(emptyData));
 const generated=generateRecurrences(data,'2026-03-01');
 assert.equal(isFinanceData({...generated,recurringRules:[]}),false);
 assert.equal(isFinanceData({...data,recurringRules:[rule,{...rule}]}),false);
 assert.equal(isFinanceData({...data,recurringRules:[{...rule,accountId:'other'}]}),false);
});
