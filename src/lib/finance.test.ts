import {test} from 'node:test';
import assert from 'node:assert/strict';
import {availableToday,emptyData,summary,toCents,isFinanceData,type FinanceData} from './finance';
test('converte BRL em centavos e rejeita valores ambíguos',()=>{assert.equal(toCents('284,50'),28450);assert.throws(()=>toCents('-5'));assert.equal(toCents('1.234,56'),123456);assert.equal(toCents('R$ 1.234,56'),123456);assert.equal(toCents('1.234'),123400);assert.throws(()=>toCents('1,234'));assert.throws(()=>toCents('1.2.3'));assert.throws(()=>toCents('0'));});
test('receita pendente não aumenta saldo; reserva e compromisso descontados uma vez',()=>{const d:FinanceData={...emptyData,accounts:[{id:'a',name:'Conta',openingBalance:100000}],goals:[{id:'g',name:'Reserva',saved:20000,target:50000}],transactions:[{id:'1',description:'Receita',amount:50000,type:'income',category:'Trabalho',date:'2026-11-01',accountId:'a',status:'paid',space:'work'},{id:'2',description:'Conta',amount:10000,type:'expense',category:'Moradia',date:'2026-11-10',accountId:'a',status:'pending',space:'personal'},{id:'3',description:'Previsão',amount:90000,type:'income',category:'Trabalho',date:'2026-11-10',accountId:'a',status:'pending',space:'work'}]};assert.deepEqual(summary(d,'2026-11'),{balance:150000,income:50000,expense:0,pending:10000,reserved:20000,available:120000});assert.ok(isFinanceData(d));assert.equal(isFinanceData({...d,transactions:[{...d.transactions[0],amount:-5}]}),false);});

test('quitar pendência atualiza saldo uma vez e preserva data e desfazer', async()=>{
 const {settleTransaction}=await import('./finance');
 const d:FinanceData={...emptyData,accounts:[{id:'a',name:'Conta',openingBalance:100000}],transactions:[{id:'p',description:'Aluguel',amount:20000,type:'expense',category:'Moradia',date:'2026-11-05',accountId:'a',status:'pending',space:'personal'}]};
 const next=settleTransaction(d,'p');
 assert.equal(summary(d,'2026-11').balance,100000);
 assert.equal(summary(next,'2026-11').balance,80000);
 assert.equal(summary(next,'2026-11').pending,0);
 assert.equal(next.transactions[0].date,'2026-11-05');
 assert.equal(d.transactions[0].status,'pending');
 assert.equal(settleTransaction(next,'p'),next);
 assert.equal(settleTransaction(d,'inexistente'),d);
});

test('compromissos incluem mês selecionado e vencidos, sem pagos ou outros meses futuros',async()=>{
 const {commitments}=await import('./finance');
 const entry={description:'Conta',amount:100,type:'expense' as const,category:'Outros',accountId:'a',status:'pending' as const,space:'personal' as const};
 const d:FinanceData={...emptyData,transactions:[{...entry,id:'futuro',date:'2026-12-01'},{...entry,id:'mes',date:'2026-11-20'},{...entry,id:'vencido',date:'2026-10-20'},{...entry,id:'pago',date:'2026-11-01',status:'paid'}]};
 assert.deepEqual(commitments(d,'2026-11','2026-11-04').map(t=>t.id),['vencido','mes']);
});

test('metas de backups antigos continuam válidas e capas são limitadas ao catálogo', () => {
 const legacy={id:'reserva',name:'Reserva',target:50000,saved:10000};
 assert.ok(isFinanceData({...emptyData,goals:[legacy]}));
 assert.ok(isFinanceData({...emptyData,goals:[{...legacy,cover:'forest',featured:true}]}));
 assert.equal(isFinanceData({...emptyData,goals:[{...legacy,cover:'https://example.com/cover'}]}),false);
 assert.equal(isFinanceData({...emptyData,goals:[{...legacy,featured:'true'}]}),false);
 assert.equal(isFinanceData({...emptyData,goals:Array.from({length:4},(_,i)=>({...legacy,id:String(i),featured:true}))}),false);
});

test('saldo livre considera obrigações vencidas, faturas e reservas sem adicionar receitas pendentes',()=>{
 const data:FinanceData={
  ...emptyData,
  accounts:[{id:'a',name:'Conta principal',openingBalance:100000}],
  goals:[{id:'g',name:'Reserva',target:50000,saved:10000}],
  transactions:[
   {id:'old',description:'Aluguel atrasado',type:'expense',category:'Moradia',amount:20000,date:'2026-10-15',status:'pending',space:'personal',accountId:'a'},
   {id:'current',description:'Internet',type:'expense',category:'Assinaturas',amount:15000,date:'2026-11-12',status:'pending',space:'personal',accountId:'a'},
   {id:'income',description:'Previsão',type:'income',category:'Trabalho',amount:30000,date:'2026-11-12',status:'pending',space:'work',accountId:'a'},
  ],
  creditCards:[{id:'c',name:'Cartão',limit:100000,color:'forest',closingDay:5,dueDay:10,space:'personal'}],
  creditPurchases:[{id:'p',cardId:'c',description:'Compra',amount:5000,date:'2026-09-02',category:'Outros',installments:1}],
 };
 const view=availableToday(data,'2026-11-06');
 assert.equal(view.balance,100000);
 assert.equal(view.reserved,10000);
 assert.equal(view.overdueExpenses,40000);
 assert.equal(view.available,50000);
 assert.equal(summary(data,'2026-11').available,75000);
});
