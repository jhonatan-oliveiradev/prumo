import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {applyCsv, importBatches, inspectCsv, parseCsv, previewCsv, undoImportBatch, validCsvMapping} from './csv-import';
import {creditInvoices, payCreditInvoice} from './credit';
import type {FinanceData} from './finance';

const data: FinanceData = {
  version: 1, name: '', accounts: [{id: 'main', name: 'Conta', openingBalance: 0}],
  transactions: [], budgets: [], goals: [],
  creditCards: [{id: 'card', name: 'Cartão', color: 'forest', limit: 500000, closingDay: 10, dueDay: 20, space: 'personal'}],
};
const bank = {kind: 'bank', accountId: 'main', space: 'personal'} as const;
const card = {kind: 'card', cardId: 'card', cycle: '2026-11'} as const;
const timestamp = '2026-11-06T00:00:00.000Z';

test('lê centavos em reais e ignora valores ambíguos com coluna excedente', () => {
  const {rows, invalidLines} = parseCsv('Data,Descrição,Valor\r\n06/11/2026,"Loja, Centro","-1.234,56"\r\n2026-11-06,Mercado,-12,50\r\n31/11/2026,Mercado,-20\r\n2026-11-06,Depósito,100.10');
  assert.deepEqual(rows.map(row => [row.description, row.amount]), [['Loja, Centro', -123456], ['Depósito', 10010]]);
  assert.deepEqual(invalidLines, [3, 4]);
});

test('preserva duas ocorrências iguais no arquivo e bloqueia sua reimportação', async () => {
  const {rows} = parseCsv('Data;Descrição;Valor\n06/11/2026;Café;-12,50\n06/11/2026;Café;-12,50\n06/11/2026;Pagamento de fatura;-50');
  const first = await previewCsv(rows, data, bank);
  assert.notEqual(first[0].key, first[1].key);
  assert.equal(first[2].blocked, true);
  const batchId = randomUUID();
  const saved = applyCsv(data, bank, first.slice(0, 2), batchId, timestamp, randomUUID);
  assert.deepEqual(saved.transactions.map(row => [row.amount, row.type, row.status]), [[1250, 'expense', 'paid'], [1250, 'expense', 'paid']]);
  assert.equal(importBatches(saved)[0].count, 2);
  assert.ok((await previewCsv(rows, saved, bank)).every(row => row.blocked));
  assert.throws(() => applyCsv(saved, bank, first.slice(0, 2), randomUUID(), timestamp, randomUUID), /mudaram/);
  assert.deepEqual(undoImportBatch(saved, batchId).transactions, []);
});

test('usa o fechamento selecionado e protege fatura paga contra importação e reversão', async () => {
  const {rows} = parseCsv('date,title,amount\n2026-10-02,Compra antiga,50.30\n2026-10-03,Estorno,-5.30');
  const preview = await previewCsv(rows, data, card);
  assert.equal(preview[1].blocked, true);
  const batchId = randomUUID();
  const saved = applyCsv(data, card, [preview[0]], batchId, timestamp, randomUUID);
  assert.equal(creditInvoices(saved)[0].cycle, '2026-11');
  assert.equal(creditInvoices(saved)[0].amount, 5030);
  const paid = payCreditInvoice(saved, card, 'main', '2026-11-20', randomUUID());
  assert.throws(() => undoImportBatch(paid, batchId), /fatura paga/);
  const bankPayment = await previewCsv(parseCsv('Data;Descrição;Valor\n20/11/2026;Transferência;-50,30').rows, paid, bank);
  assert.match(bankPayment[0].issue ?? '', /fatura já registrada/);
  const newRows = parseCsv('Data;Descrição;Valor\n06/11/2026;Nova compra;27,31').rows;
  assert.equal((await previewCsv(newRows, paid, card))[0].blocked, true);
});

test('reconhece cabeçalhos bancários comuns sem mudar o significado de sinal e centavos',()=>{
 const variants=[
  'Data Lançamento;Histórico do Lançamento;Valor da Movimentação\n06/11/2026;Mercado;-1.234,56',
  'Transaction Date,Merchant,Amount (BRL)\n2026-11-06,Farmácia,-29.90',
  'Data da transação;Descrição da transação;Valor em reais\n06/11/2026;Cinema;-45,00',
 ];
 const expected=[-123456,-2990,-4500];
 variants.forEach((csv,index)=>{
  const result=parseCsv(csv);
  assert.deepEqual(result.invalidLines,[]);
  assert.equal(result.rows.length,1);
  assert.equal(result.rows[0].amount,expected[index]);
 });
});

test('inspeciona colunas desconhecidas e permite mapeamento sem alterar valores',()=>{
 const csv='Operação;Texto do lançamento;Quantia recebida;Data da operação\nA1;Mercado;-1.234,56;06/11/2026\nA2;Pagamento;205,40;2026-11-06';
 const inspected=inspectCsv(csv);
 assert.equal(inspected.delimiter,';');
 assert.deepEqual(inspected.headers,['Operação','Texto do lançamento','Quantia recebida','Data da operação']);
 assert.equal(inspected.sample[0][1],'Mercado');
 assert.equal(inspected.rowCount,2);
 assert.deepEqual(inspected.suggested,{date:-1,description:-1,amount:-1});
 assert.throws(()=>parseCsv(csv),/Escolha cada coluna/);
 const mapped={date:3,description:1,amount:2};
 assert.equal(validCsvMapping(mapped,inspected.headers.length),true);
 const result=parseCsv(csv,mapped);
 assert.deepEqual(result.invalidLines,[]);
 assert.deepEqual(result.rows.map(r=>[r.date,r.description,r.amount]),[
  ['2026-11-06','Mercado',-123456],['2026-11-06','Pagamento',20540],
 ]);
});

test('rejeita mapeamento ambíguo, com colunas repetidas ou inexistentes',()=>{
 const csv='Primeira;Segunda;Terceira\n06/11/2026;Mercado;-40,00';
 assert.equal(validCsvMapping({date:0,description:1,amount:1},3),false);
 assert.equal(validCsvMapping({date:0,description:1,amount:3},3),false);
 assert.equal(validCsvMapping({date:0,description:-1,amount:2},3),false);
 assert.throws(()=>parseCsv(csv,{date:0,description:1,amount:1}),/três colunas diferentes/);
 assert.throws(()=>parseCsv(csv,{date:0,description:1,amount:3}),/três colunas diferentes/);
 const mapped=parseCsv(csv,{date:0,description:1,amount:2});
 assert.equal(mapped.rows[0].amount,-4000);
});

test('detecta colunas entre aspas no CSV com vírgulas embutidas',()=>{
 const csv='data,"Nome, do local","R$ total"\n06/11/2026,"Loja, Central","-29,90"';
 const info=inspectCsv(csv);
 assert.equal(info.delimiter,',');
 assert.deepEqual(info.headers,['data','Nome, do local','R$ total']);
 const parsed=parseCsv(csv,{date:0,description:1,amount:2});
 assert.deepEqual(parsed.rows.map(r=>[r.description,r.amount]),[['Loja, Central',-2990]]);
});

test('protege limites de tamanho e quantidade de linhas na etapa de mapeamento',()=>{
 assert.throws(()=>inspectCsv('a;b;c\n'+Array.from({length:501},()=> '2026-11-06;Mercado;-5').join('\n')),/500/);
 assert.throws(()=>inspectCsv('x'.repeat(256*1024+10)),/256 KB/);
});

test('alerta sobre transferência interna e saldo inicial sem bloquear decisões informadas',async()=>{
 const csv='Data;Descrição;Valor\n06/11/2026;Transferência entre contas;-250,00\n06/11/2026;Saldo anterior;1.250,00\n06/11/2026;Pagamento de cliente;400,00';
 const rows=parseCsv(csv).rows;
 const preview=await previewCsv(rows,data,bank);
 assert.equal(preview.length,3);
 assert.match(preview[0].issue??'',/transferência interna/i);
 assert.match(preview[1].issue??'',/saldo inicial/i);
 assert.equal(preview[0].blocked,false);
 assert.equal(preview[1].blocked,false);
 assert.equal(preview[2].issue,undefined);
});


test('rules suggest categories for new bank entries and preserve historical classifications',async()=>{
 const catalog:FinanceData={...data,
  transactions:[{id:'prior',description:'Netflix antiga',type:'expense',amount:1990,date:'2026-10-01',category:'Lazer',accountId:'main',status:'paid',space:'personal'}],
  categoryRules:[
   {id:'netflix',phrase:'Netflix',category:'Assinaturas',type:'expense',space:'personal',enabled:true},
   {id:'income',phrase:'Salário',category:'Trabalho',type:'income',space:'all',enabled:true},
  ],
 };
 const csv='Data;Descrição;Valor\n06/11/2026;Netflix mensalidade;-39,90\n06/11/2026;Salário de novembro;4.500,00\n06/11/2026;Feira local;-70,00';
 const rows=parseCsv(csv).rows;
 const preview=await previewCsv(rows,catalog,bank);
 assert.deepEqual(preview.map(row=>row.suggestedCategory??'Outros'),['Assinaturas','Trabalho','Outros']);
 const saved=applyCsv(catalog,bank,preview,'batch-rules',timestamp,randomUUID);
 assert.deepEqual(saved.transactions.slice(1).map(t=>t.category),['Assinaturas','Trabalho','Outros']);
 assert.equal(saved.transactions[0].category,'Lazer');
 assert.equal(catalog.transactions.length,1);
});

test('rules respect card space and never recategorize an already imported statement',async()=>{
 const withRules:FinanceData={...data,categoryRules:[
  {id:'streaming',phrase:'Netflix',category:'Assinaturas',type:'expense',space:'personal',enabled:true},
  {id:'work',phrase:'Serviço',category:'Trabalho',type:'expense',space:'work',enabled:true},
 ]};
 const csv='Data;Descrição;Valor\n06/11/2026;Netflix;45,50\n06/11/2026;Serviço hospedagem;120,00';
 const preview=await previewCsv(parseCsv(csv).rows,withRules,card);
 assert.deepEqual(preview.map(r=>r.suggestedCategory??'Outros'),['Assinaturas','Outros']);
 const saved=applyCsv(withRules,card,preview,'batch-card',timestamp,randomUUID);
 assert.deepEqual(saved.creditPurchases?.map(t=>t.category),['Assinaturas','Outros']);
 assert.equal(withRules.creditPurchases,undefined);
});

test('import rejects a stale preview after a category rule changed',async()=>{
 const rules:FinanceData={...data,categoryRules:[
  {id:'r',phrase:'Mercado',category:'Alimentação',type:'expense',space:'all',enabled:true},
 ]};
 const rows=parseCsv('Data;Descrição;Valor\n06/11/2026;Mercado;-28,50').rows;
 const preview=await previewCsv(rows,rules,bank);
 assert.equal(preview[0].suggestedCategory,'Alimentação');
 const changed={...rules,categoryRules:rules.categoryRules?.map(rule=>({...rule,enabled:false}))};
 assert.throws(()=>applyCsv(changed,bank,preview,'new',timestamp,randomUUID),/regras de categorização mudaram/i);
});
