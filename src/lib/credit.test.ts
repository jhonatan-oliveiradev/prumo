import {test} from 'node:test';
import assert from 'node:assert/strict';
import {addCreditPurchase, creditInvoices, expenseBreakdown, payCreditInvoice, type CreditCard, type CreditPurchase} from './credit';
import {emptyData, filterFinanceSpace, isFinanceData, summary, type FinanceData} from './finance';
import {projectCashFlow} from './planning';

const card: CreditCard = {id:'card',name:'Principal',color:'forest',limit:100000,closingDay:25,dueDay:5,space:'personal'};
const purchase: CreditPurchase = {id:'purchase',cardId:card.id,description:'Mercado',amount:10001,installments:3,date:'2026-01-25',category:'Alimentação'};
const data: FinanceData = {...emptyData,accounts:[{id:'account',name:'Conta',openingBalance:60000}],creditCards:[card],creditPurchases:[purchase]};

test('compra no fechamento entra no ciclo seguinte e mantém o total exato em centavos', () => {
  assert.deepEqual(creditInvoices(data).map(({closesOn,dueOn,amount}) => [closesOn,dueOn,amount]), [
    ['2026-02-25','2026-03-05',3334],
    ['2026-03-25','2026-04-05',3334],
    ['2026-04-25','2026-05-05',3333],
  ]);
  assert.deepEqual(creditInvoices({...data,creditCards:[{...card,closingDay:30,dueDay:31}]}).map(i => i.dueOn), ['2026-01-31','2026-02-28','2026-03-31']);
});

test('fatura em aberto afeta a previsão e somente o pagamento sai da conta', () => {
  const invoice = creditInvoices(data)[0];
  assert.equal(summary(data,'2026-03').balance,60000);
  assert.equal(summary(data,'2026-03').pending,3334);
  assert.equal(projectCashFlow(data,'2026-03-01',1)[0].expense,3334);
  assert.throws(() => payCreditInvoice(data,invoice,'account','2026-02-24','pay'));
  const paid = payCreditInvoice(data,invoice,'account','2026-03-01','pay');
  assert.ok(isFinanceData(paid));
  assert.equal(summary(paid,'2026-03').balance,56666);
  assert.equal(summary(paid,'2026-03').pending,0);
  assert.equal(projectCashFlow(paid,'2026-03-01',1)[0].expense,0);
  assert.equal(payCreditInvoice(paid,invoice,'account','2026-03-01','duplicate'),paid);
  assert.deepEqual([...expenseBreakdown(paid,'2026-03',false)],[['Alimentação',3334]]);
  assert.deepEqual([...expenseBreakdown(paid,'2026-03',true)],[['Alimentação',3334]]);
  assert.throws(() => addCreditPurchase(paid,{...purchase,id:'retroativa'}),/fatura já paga/);
  const reopened = {...paid,transactions:[]};
  assert.equal(summary(reopened,'2026-03').balance,60000);
  assert.equal(summary(reopened,'2026-03').pending,3334);
});

test('backup rejeita pagamento duplicado ou divergente, e filtro preserva o vínculo da carteira', () => {
  const paid = payCreditInvoice(data,creditInvoices(data)[0],'account','2026-03-01','pay');
  const payment = paid.transactions[0];
  assert.equal(isFinanceData({...paid,transactions:[payment,{...payment,id:'duplicate'}]}),false);
  assert.equal(isFinanceData({...paid,transactions:[{...payment,amount:payment.amount+1}]}),false);
  assert.equal(isFinanceData({...paid,creditPurchases:[]}),false);
  assert.equal(isFinanceData({...paid,creditCards:[{...card,closingDay:32}]}),false);
  assert.equal(creditInvoices(filterFinanceSpace(paid,'work')).length,0);
  assert.equal(creditInvoices(filterFinanceSpace(paid,'personal'))[0].payment?.id,'pay');
  assert.ok(isFinanceData(emptyData));
});
