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
