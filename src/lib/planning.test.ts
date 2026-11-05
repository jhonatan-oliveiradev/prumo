import {test} from 'node:test';
import assert from 'node:assert/strict';
import {emptyData,settleTransaction,type Transaction} from './finance';
import {createInstallments,addMonthsClamped,projectCashFlow,removePendingInstallments} from './planning';
const purchase:Transaction={id:'first',description:'Notebook',amount:10000,type:'expense',category:'Trabalho',date:'2027-01-31',accountId:'a',status:'paid',space:'work'};
test('installments keep exact cents and only the first can start paid',()=>{
 let id=0;const rows=createInstallments(purchase,3,'group',()=>String(++id));
 assert.deepEqual(rows.map(t=>t.amount),[3334,3333,3333]);
 assert.equal(rows.reduce((sum,t)=>sum+t.amount,0),10000);
 assert.deepEqual(rows.map(t=>t.status),['paid','pending','pending']);
 assert.deepEqual(rows.map(t=>t.date),['2027-01-31','2027-02-28','2027-03-31']);
 assert.equal(new Set(rows.map(t=>t.id)).size,3);
 assert.equal(purchase.amount,10000);
 assert.equal(createInstallments(purchase,1,'group',()=>'' )[0],purchase);
});
test('clamps February in leap years and rolls December into January',()=>{
 assert.equal(addMonthsClamped('2028-01-31',1),'2028-02-29');
 assert.equal(addMonthsClamped('2026-12-15',1),'2027-01-15');
});
test('invalid parcel counts and zero-value parcels are rejected',()=>{
 for(const count of [0,1.5,61])assert.throws(()=>createInstallments(purchase,count,'g',()=>''));
 assert.throws(()=>createInstallments({...purchase,amount:2},3,'g',()=>''));
 assert.throws(()=>createInstallments({...purchase,type:'income'},2,'g',()=>''));
});
test('cancel future pending installments without removing paid ones or unrelated expenses',()=>{
 let id=0;const rows=createInstallments({...purchase,status:'pending'},4,'group',()=>String(++id));
 rows[2]={...rows[2],status:'paid'};
 const data={...emptyData,transactions:[...rows,{...purchase,id:'other'}]};
 const next=removePendingInstallments(data,'group',2);
 assert.deepEqual(next.transactions.map(t=>t.id),['first','2','other']);
 assert.equal(data.transactions.length,5);
});
test('forecast counts overdue once and separates pending income from confirmed funds',()=>{
 const data={...emptyData,accounts:[{id:'a',name:'Conta',openingBalance:100000}],goals:[{id:'g',name:'Reserva',target:50000,saved:20000}],transactions:[{...purchase,id:'old',amount:10000,date:'2026-10-01',status:'pending' as const},{...purchase,id:'next',amount:20000,date:'2026-12-01',status:'pending' as const},{...purchase,id:'salary',amount:50000,date:'2026-12-01',type:'income' as const,status:'pending' as const}]};
 const rows=projectCashFlow(data,'2026-11-05');
 assert.equal(rows.length,6);
 assert.equal(rows[0].conservative,70000);
 assert.equal(rows[1].conservative,50000);
 assert.equal(rows[1].expected,100000);
 assert.equal(rows[2].conservative,50000);
 const paid=projectCashFlow(settleTransaction(data,'next'),'2026-11-05');
 assert.equal(paid[1].conservative,rows[1].conservative);
 assert.equal(projectCashFlow({...data,transactions:[]},'2026-11-05')[0].conservative,80000);
});
