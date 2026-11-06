import type {FinanceData} from './finance';

export type CsvOrigin = {batchId: string; key: string; importedAt: string};

export function isCsvOrigin(value: unknown): value is CsvOrigin {
  if (!value || typeof value !== 'object') return false;
  const origin = value as CsvOrigin;
  return typeof origin.batchId === 'string' && /^[a-f\d-]{36}$/.test(origin.batchId) &&
    typeof origin.key === 'string' && /^[a-f\d]{64}$/.test(origin.key) &&
    typeof origin.importedAt === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(origin.importedAt) &&
    Number.isFinite(Date.parse(origin.importedAt)) && new Date(origin.importedAt).toISOString() === origin.importedAt;
}

export function validCsvOrigins(data: FinanceData) {
  const keys = new Set<string>(), batches = new Map<string, string>();
  for (const row of [...data.transactions, ...(data.creditPurchases ?? [])]) {
    if (row.imported === undefined) continue;
    if (!isCsvOrigin(row.imported) || keys.has(row.imported.key)) return false;
    if ('creditInvoice' in row && row.creditInvoice) return false;
    const {batchId, key, importedAt} = row.imported;
    const batch = JSON.stringify([importedAt, 'cardId' in row ? 'card' : 'bank', 'cardId' in row ? row.statementCycle : null]);
    if (batches.has(batchId) && batches.get(batchId) !== batch) return false;
    keys.add(key);
    batches.set(batchId, batch);
  }
  return true;
}
