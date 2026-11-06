import {test} from 'node:test';
import assert from 'node:assert/strict';
import {emptyData,isFinanceData,summary,type FinanceData} from './finance';
import {accountBalance,createAccountTransfer} from './account-transfers';
import {parseAccountBalance,reconcileAccount,validReconciliations} from './balance-reconciliation';
import {parseWorkspaceInput} from './sync';
import {sameFinanceData} from './cloud-state';

const basic:FinanceData={
 ...emptyData,
 accounts:[
  {id:'checking',name:'Conta corrente',openingBalance:100000},
  {id:'savings',name:'Conta reserva',openingBalance:20000},
 ],
 transactions:[
  {id:'purchase',accountId:'checking',date:'2026-11-01',description:'Compra',amount:15000,type:'expense',category:'Alimentação',status:'paid',space:'personal'},
 ],
};

test('reconciliation accepts signed BRL, grouped thousands and exact zero without guessing ambiguous amounts',()=>{
 assert.equal(parseAccountBalance('R$ 1.234,56'),123456);
 assert.equal(parseAccountBalance('-50,00'),-5000);
 assert.equal(parseAccountBalance('R$ -50,00'),-5000);
 assert.equal(parseAccountBalance('0'),0);
 assert.equal(parseAccountBalance('0,00'),0);
 assert.equal(parseAccountBalance('-0,00'),0);
 assert.throws(()=>parseAccountBalance('1,234'));
 assert.throws(()=>parseAccountBalance('1.2.3'));
});

test('reconciliation adjusts exactly one balance without corrupting income, expense or transfer totals',()=>{
 const moved=createAccountTransfer(basic,{
  id:'transfer',sourceAccountId:'checking',targetAccountId:'savings',amount:5000,date:'2026-11-04',
 });
 const before=summary(moved,'2026-11');
 assert.equal(accountBalance(moved,'checking'),80000);
 const next=reconcileAccount(moved,{
  id:'adjustment',accountId:'checking',date:'2026-11-06',balanceAfter:77000,
  note:'Conferido com o extrato',
 });
 const after=summary(next,'2026-11');
 assert.equal(accountBalance(next,'checking'),77000);
 assert.equal(accountBalance(next,'savings'),25000);
 assert.equal(after.balance,before.balance-3000);
 assert.equal(after.income,before.income);
 assert.equal(after.expense,before.expense);
 assert.equal(after.pending,before.pending);
 assert.equal(next.transactions.length,moved.transactions.length);
 assert.equal(next.reconciliations?.[0].delta,-3000);
 assert.ok(isFinanceData(next));
 assert.ok(parseWorkspaceInput({data:next,revision:1}));
});

test('adjustments are additive and snapshots are preserved for audit',()=>{
 const first=reconcileAccount(basic,{id:'one',accountId:'checking',date:'2026-11-05',balanceAfter:90000,note:'Diferença no saldo'});
 const second=reconcileAccount(first,{id:'two',accountId:'checking',date:'2026-11-06',balanceAfter:87500,note:'Tarifa não registrada'});
 assert.deepEqual(second.reconciliations?.map(row=>({
  id:row.id,before:row.balanceBefore,after:row.balanceAfter,delta:row.delta,
 })),[
  {id:'one',before:85000,after:90000,delta:5000},
  {id:'two',before:90000,after:87500,delta:-2500},
 ]);
 assert.equal(accountBalance(second,'checking'),87500);
 assert.equal(basic.reconciliations,undefined);
});

test('zero deltas, missing accounts and invalid or altered history are rejected',()=>{
 assert.throws(()=>reconcileAccount(basic,{id:'zero',accountId:'checking',date:'2026-11-06',balanceAfter:85000,note:'Sem diferença'}));
 assert.throws(()=>reconcileAccount(basic,{id:'missing',accountId:'unknown',date:'2026-11-06',balanceAfter:90000,note:'Extrato'}));
 assert.throws(()=>reconcileAccount(basic,{id:'invalid',accountId:'checking',date:'2026-02-30',balanceAfter:90000,note:'Extrato'}));
 const next=reconcileAccount(basic,{id:'ok',accountId:'checking',date:'2026-11-06',balanceAfter:90000,note:'Conferido'});
 assert.equal(validReconciliations({...next,reconciliations:[{...next.reconciliations![0],delta:2000}]}),false);
 assert.equal(isFinanceData({...next,reconciliations:[{...next.reconciliations![0],accountId:'other'}]}),false);
 assert.equal(parseWorkspaceInput({data:{...next,reconciliations:[next.reconciliations![0],next.reconciliations![0]]},revision:1}),null);
});

test('legacy snapshots without reconciliation records remain valid and equivalent to empty histories',()=>{
 assert.ok(isFinanceData(basic));
 assert.ok(isFinanceData({...basic,reconciliations:[]}));
 assert.ok(sameFinanceData(basic,{...basic,reconciliations:[]}));
});
