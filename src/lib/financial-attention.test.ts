import assert from 'node:assert/strict';
import {test} from 'node:test';
import {emptyData,type FinanceData} from './finance';
import {financialAttention} from './financial-attention';

test('attention indicators separate overdue expenses and next seven days',()=>{
 const data:FinanceData={...emptyData,
  accounts:[{id:'a',name:'Conta',openingBalance:100000}],
  transactions:[
   {id:'old',description:'Vencido',amount:10000,type:'expense',category:'Moradia',date:'2026-10-30',accountId:'a',status:'pending',space:'personal'},
   {id:'today',description:'Hoje',amount:2000,type:'expense',category:'Outros',date:'2026-11-06',accountId:'a',status:'pending',space:'personal'},
   {id:'week',description:'Semana',amount:5000,type:'expense',category:'Outros',date:'2026-11-13',accountId:'a',status:'pending',space:'personal'},
   {id:'later',description:'Mais tarde',amount:4000,type:'expense',category:'Outros',date:'2026-11-15',accountId:'a',status:'pending',space:'personal'},
   {id:'received',description:'Receita futura',amount:99999,type:'income',category:'Trabalho',date:'2026-11-07',accountId:'a',status:'pending',space:'work'},
   {id:'paid',description:'Pago',amount:1000,type:'expense',category:'Outros',date:'2026-10-30',accountId:'a',status:'paid',space:'personal'},
  ],
 };
 assert.deepEqual(financialAttention(data,'2026-11-06'),{
  overdueCount:1,overdueAmount:10000,upcomingCount:2,upcomingAmount:7000,
 });
});

test('empty accounts do not emit synthetic obligations',()=>{
 assert.deepEqual(financialAttention(emptyData,'2026-11-06'),{
  overdueCount:0,overdueAmount:0,upcomingCount:0,upcomingAmount:0,
 });
});
