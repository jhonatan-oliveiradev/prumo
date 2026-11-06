import {test} from 'node:test';
import assert from 'node:assert/strict';
import {emptyData,isFinanceData,summary,type FinanceData} from './finance';
import {accountBalance,createAccountTransfer,removeAccountTransfer,transferNet,validTransfers} from './account-transfers';
import {parseWorkspaceInput} from './sync';
import {sameFinanceData} from './cloud-state';

const starting:FinanceData={...emptyData,accounts:[
 {id:'checking',name:'Conta principal',openingBalance:120000},
 {id:'savings',name:'Reserva',openingBalance:10000},
],transactions:[
 {id:'expense',accountId:'checking',description:'Supermercado',type:'expense',category:'Alimentação',amount:25000,status:'paid',date:'2026-11-02',space:'personal'},
 {id:'income',accountId:'checking',description:'Salário',type:'income',category:'Trabalho',amount:30000,status:'paid',date:'2026-11-03',space:'work'},
]};
const transfer={id:'transfer-1',sourceAccountId:'checking',targetAccountId:'savings',amount:40000,date:'2026-11-06',note:'Para a reserva'};

test('transfer balances the accounts without generating income or expense',()=>{
 const before=summary(starting,'2026-11');
 const next=createAccountTransfer(starting,transfer);
 assert.equal(accountBalance(starting,'checking'),125000);
 assert.equal(accountBalance(next,'checking'),85000);
 assert.equal(accountBalance(next,'savings'),50000);
 assert.equal(transferNet(next),0);
 assert.deepEqual(summary(next,'2026-11'),before);
 assert.equal(next.transactions.length,starting.transactions.length);
 assert.ok(isFinanceData(next));
 assert.ok(parseWorkspaceInput({data:next,revision:0}));
});
test('undoing a transfer restores both account balances and leaves historical transactions unchanged',()=>{
 const moved=createAccountTransfer(starting,transfer);
 const reverted=removeAccountTransfer(moved,transfer.id);
 assert.equal(accountBalance(reverted,'checking'),accountBalance(starting,'checking'));
 assert.equal(accountBalance(reverted,'savings'),accountBalance(starting,'savings'));
 assert.deepEqual(reverted.transactions,starting.transactions);
});
test('invalid destinations, duplicate IDs, impossible dates and amounts are refused',()=>{
 assert.throws(()=>createAccountTransfer(starting,{...transfer,targetAccountId:'checking'}));
 assert.throws(()=>createAccountTransfer(starting,{...transfer,targetAccountId:'missing'}));
 assert.throws(()=>createAccountTransfer(starting,{...transfer,amount:-1}));
 assert.throws(()=>createAccountTransfer(starting,{...transfer,date:'2026-02-30'}));
 assert.throws(()=>createAccountTransfer(createAccountTransfer(starting,transfer),transfer));
 assert.equal(validTransfers({...starting,transfers:[{...transfer,amount:0}]}),false);
});
test('old backups without transfers remain valid and equal to empty transfer arrays',()=>{
 assert.ok(isFinanceData(starting));
 assert.ok(sameFinanceData(starting,{...starting,transfers:[]}));
 assert.equal(isFinanceData({...starting,transfers:[]}),true);
});
test('synchronization rejects disconnected accounts and invalid transfer IDs',()=>{
 const next=createAccountTransfer(starting,transfer);
 assert.equal(parseWorkspaceInput({data:{...next,accounts:starting.accounts.slice(1)},revision:1}),null);
 assert.equal(parseWorkspaceInput({data:{...next,transfers:[transfer,{...transfer}]},revision:1}),null);
});
