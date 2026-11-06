import {creditInvoices} from './credit';
import {isFinanceData, validDate, type FinanceData, type Transaction} from './finance';

export const maxCsvBytes = 256 * 1024;
export const maxCsvRows = 500;
export const validStatementCycle = (value: string) => /^20\d{2}-(0[1-9]|1[0-2])$/.test(value);
export type ImportTarget =
  | {kind: 'bank'; accountId: string; space: Transaction['space']}
  | {kind: 'card'; cardId: string; cycle: string};

type CsvRow = {line: number; date: string; description: string; amount: number};
export type CsvPreviewRow = CsvRow & {key: string; issue?: string; blocked: boolean};

const normalized = (value: string) => value.normalize('NFD').replace(/\p{Diacritic}/gu, '').trim().toLowerCase().replace(/\s+/g, ' ');
const invoicePayment = (value: string) => /\b(fatura paga|pagamento recebido|pag(?:amento|to)?\b.{0,30}\b(?:fatura|cartao)|fatura\b.{0,20}\bpag(?:amento|to)?)\b/.test(normalized(value));

function records(text: string, delimiter: string) {
  const result: {cells: string[]; line: number}[] = [];
  let cells: string[] = [], cell = '', quoted = false, closed = false, line = 1, start = 1;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (quoted) {
      if (char === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (char === '"') { quoted = false; closed = true; }
      else { cell += char; if (char === '\n') line++; }
    } else if (char === delimiter || char === '\r' || char === '\n') {
      cells.push(cell.trim());
      cell = '';
      closed = false;
      if (char === delimiter) continue;
      if (char === '\r' && text[i + 1] === '\n') i++;
      if (cells.some(Boolean)) result.push({cells, line: start});
      cells = [];
      start = ++line;
    } else if (char === '"' && !cell.trim() && !closed) {
      cell = '';
      quoted = true;
    } else if (closed ? !/\s/.test(char) : char === '"') {
      throw Error(`Confira as aspas na linha ${start}.`);
    } else if (!closed) {
      cell += char;
    }
  }
  if (quoted) throw Error(`Faltam aspas de fechamento na linha ${start}.`);
  cells.push(cell.trim());
  if (cells.some(Boolean)) result.push({cells, line: start});
  return result;
}

function parseAmount(text: string) {
  let clean = text.replace(/^(-?)\s*R\$\s*/, '$1').trim();
  if (/^[+-]?\d{1,3}(?:\.\d{3})+(?:,\d{1,2})?$/.test(clean)) clean = clean.replace(/\./g, '');
  if (!/^[+-]?\d+(?:[.,]\d{1,2})?$/.test(clean)) return 0;
  const [whole, fraction = ''] = clean.replace(/^[+-]/, '').split(/[.,]/);
  const cents = (Number(whole) * 100 + Number(fraction.padEnd(2, '0'))) * (clean.startsWith('-') ? -1 : 1);
  return Number.isSafeInteger(cents) ? cents : 0;
}

export function parseCsv(text: string): {rows: CsvRow[]; invalidLines: number[]} {
  if (new TextEncoder().encode(text).byteLength > maxCsvBytes) throw Error('Escolha um CSV de até 256 KB.');
  const clean = text.replace(/^\uFEFF/, '');
  const aliases = [
    ['data','date','data da compra','data de lancamento','data lancamento','data da transacao','data da movimentacao','data do movimento','transaction date','data efetiva'],
    ['descricao','description','titulo','title','historico','descricao do lancamento','descricao da transacao','historico do lancamento','estabelecimento','nome do estabelecimento','detalhes','memo','merchant'],
    ['valor','amount','valor (r$)','valor r$','valor da transacao','valor da movimentacao','valor em reais','valor total','montante','amount (brl)'],
  ];
  let parsed: ReturnType<typeof records> | undefined;
  let columns: number[] = [];
  for (const separator of [';', ',', '\t']) {
    const header = clean.split(/\r?\n/,1)[0].split(separator).map(value => normalized(value.replace(/"/g,'')));
    const indices = aliases.map(group => header.findIndex(value => group.includes(value)));
    if (indices.every(index => index >= 0)) {
      parsed = records(clean, separator);
      columns = indices;
      break;
    }
  }
  if (!parsed) throw Error('Não reconhecemos as colunas do CSV. O arquivo precisa identificar data, descrição e valor; confira os nomes no cabeçalho.');
  if (parsed.length - 1 > maxCsvRows) throw Error('Divida o CSV em arquivos de até 500 lançamentos.');
  const rows: CsvRow[] = [], invalidLines: number[] = [];
  for (const {cells, line} of parsed.slice(1)) {
    const [rawDate, rawDescription, rawAmount] = columns.map(index => cells[index] ?? '');
    const br = rawDate.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    const date = br ? `${br[3]}-${br[2]}-${br[1]}` : rawDate;
    const description = rawDescription.replace(/\s+/g,' ').trim();
    const amount = parseAmount(rawAmount);
    if (cells.length !== parsed[0].cells.length || description.includes('\0') || !validDate(date) || date < '2000-01-01' || date > '2099-12-31' || !description || description.length > 100 || !amount) {
      invalidLines.push(line);
    } else {
      rows.push({line, date, description, amount});
    }
  }
  return {rows, invalidLines};
}

async function fingerprint(value: string) {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(bytes), byte => byte.toString(16).padStart(2,'0')).join('');
}

function targetExists(data: FinanceData, target: ImportTarget) {
  return target.kind === 'bank' ? data.accounts.some(a => a.id === target.accountId) :
    validStatementCycle(target.cycle) && data.creditCards?.some(c => c.id === target.cardId);
}

function checkRow(row: CsvRow & {key: string}, data: FinanceData, target: ImportTarget, existing: Set<string>, invoices: ReturnType<typeof creditInvoices>): CsvPreviewRow {
  const result = (issue?: string, blocked = false) => ({...row, issue, blocked});
  if (existing.has(row.key)) return result('Já importado', true);
  if (invoicePayment(row.description)) return result('Pagamento de fatura. Confira em Cartões.', true);
  if (target.kind === 'card') {
    if (row.amount < 0) return result('Créditos e estornos ficam fora desta importação.', true);
    const invoice = invoices.find(i => i.cardId === target.cardId && i.cycle === target.cycle);
    if (invoice?.payment) return result('Esta fatura já foi paga.', true);
    if (invoice?.items.some(i => i.amount === row.amount && normalized(i.purchase.description) === normalized(row.description))) return result('Compra parecida nesta fatura');
  } else {
    const candidates = data.transactions.filter(t => t.accountId === target.accountId && t.amount === Math.abs(row.amount) && t.type === (row.amount < 0 ? 'expense' : 'income'));
    if (candidates.some(t => t.creditInvoice && Math.abs(Date.parse(t.date) - Date.parse(row.date)) <= 7 * 86400000)) {
      return result('Pode ser uma fatura já registrada. Confira em Cartões.');
    }
    if (candidates.some(t => t.date === row.date && normalized(t.description) === normalized(row.description))) {
      return result('Lançamento parecido nesta conta');
    }
  }
  return result();
}

export async function previewCsv(rows: CsvRow[], data: FinanceData, target: ImportTarget) {
  if (!targetExists(data, target)) throw Error('Escolha o destino dos lançamentos.');
  const existing = importedKeys(data);
  const invoices = creditInvoices(data);
  const occurrences = new Map<string, number>();
  const destination = target.kind === 'bank' ? ['bank', target.accountId] : ['card', target.cardId, target.cycle];
  return Promise.all(rows.map(async row => {
    const identity = JSON.stringify([...destination, row.date, row.amount, normalized(row.description)]);
    const occurrence = (occurrences.get(identity) ?? 0) + 1;
    occurrences.set(identity, occurrence);
    return checkRow({...row, key: await fingerprint(JSON.stringify([identity, occurrence]))}, data, target, existing, invoices);
  }));
}

function importedKeys(data: FinanceData) {
  return new Set([...data.transactions, ...(data.creditPurchases ?? [])].flatMap(row => row.imported ? [row.imported.key] : []));
}

export function applyCsv(data: FinanceData, target: ImportTarget, rows: CsvPreviewRow[], batchId: string, importedAt: string, newId: () => string): FinanceData {
  if (!targetExists(data, target)) throw Error('O destino mudou. Volte à prévia e revise o lote.');
  if (!rows.length) throw Error('Selecione ao menos um lançamento.');
  const existing = importedKeys(data);
  const invoices = creditInvoices(data);
  for (const row of rows) {
    const current = checkRow(row, data, target, existing, invoices);
    if (row.blocked || current.blocked || current.issue !== row.issue) throw Error('Seus registros mudaram. Revise novamente a prévia antes de importar.');
    existing.add(row.key);
  }
  const next: FinanceData = target.kind === 'bank' ? {
    ...data, transactions: [...data.transactions, ...rows.map((row): Transaction => ({
      id: newId(), description: row.description, date: row.date, amount: Math.abs(row.amount),
      type: row.amount < 0 ? 'expense' : 'income', status: 'paid', category: 'Outros',
      space: target.space, accountId: target.accountId, imported: {batchId, key: row.key, importedAt},
    }))],
  } : {
    ...data, creditPurchases: [...(data.creditPurchases ?? []), ...rows.map(row => ({
      id: newId(), cardId: target.cardId, description: row.description, date: row.date, amount: row.amount,
      category: 'Outros', installments: 1, statementCycle: target.cycle, imported: {batchId, key: row.key, importedAt},
    }))],
  };
  if (!isFinanceData(next)) throw Error('Os dados selecionados não puderam ser importados.');
  return next;
}

export function importBatches(data: FinanceData) {
  const batches = new Map<string, {id: string; at: string; count: number; kind: 'bank' | 'card'}>();
  const collect = (rows: {imported?: {batchId: string; importedAt: string}}[], kind: 'bank' | 'card') => {
    for (const {imported} of rows) if (imported) {
      const batch = batches.get(imported.batchId);
      if (batch) batch.count++;
      else batches.set(imported.batchId, {id: imported.batchId, at: imported.importedAt, count: 1, kind});
    }
  };
  collect(data.transactions,'bank');
  collect(data.creditPurchases ?? [],'card');
  return [...batches.values()].sort((a,b) => b.at.localeCompare(a.at));
}

export function undoImportBatch(data: FinanceData, id: string): FinanceData {
  if (creditInvoices(data).some(invoice => invoice.payment && invoice.items.some(({purchase}) => purchase.imported?.batchId === id))) {
    throw Error('O lote inclui uma fatura paga. Desfaça o registro do pagamento antes de remover o lote.');
  }
  return {...data, transactions: data.transactions.filter(t => t.imported?.batchId !== id),
    creditPurchases: data.creditPurchases?.filter(p => p.imported?.batchId !== id)};
}
