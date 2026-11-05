import type {FinanceData, Transaction} from './finance';

export const cardColors = {
  forest: 'Verde',
  slate: 'Grafite',
  plum: 'Ameixa',
  blue: 'Azul',
} as const;

export type CardColor = keyof typeof cardColors;
export type CreditCard = {
  id: string;
  name: string;
  color: CardColor;
  limit: number;
  closingDay: number;
  dueDay: number;
  space: 'personal' | 'work';
};
export type CreditPurchase = {
  id: string;
  cardId: string;
  description: string;
  amount: number;
  date: string;
  category: string;
  installments: number;
};
export type CreditInvoiceRef = {cardId: string; cycle: string};

type InvoiceItem = {
  purchase: CreditPurchase;
  number: number;
  amount: number;
};
export type CreditInvoice = CreditInvoiceRef & {
  card: CreditCard;
  closesOn: string;
  dueOn: string;
  amount: number;
  items: InvoiceItem[];
  payment?: Transaction;
};

export const invoiceKey = ({cardId, cycle}: CreditInvoiceRef) => JSON.stringify([cardId, cycle]);
export const isCardColor = (value: unknown): value is CardColor =>
  typeof value === 'string' && Object.hasOwn(cardColors, value);

function dateInMonth(cycle: string, day: number, offset = 0) {
  const [year, month] = cycle.split('-').map(Number);
  const end = new Date(Date.UTC(year, month + offset, 0));
  end.setUTCDate(Math.min(end.getUTCDate(), day));
  return end.toISOString().slice(0, 10);
}

function purchaseCycle(card: CreditCard, date: string) {
  const month = date.slice(0, 7);
  // Purchases on the closing date go to the next statement.
  return date < dateInMonth(month, card.closingDay) ? month : dateInMonth(month, 1, 1).slice(0, 7);
}

export function creditInvoices(data: FinanceData): CreditInvoice[] {
  const cards = new Map((data.creditCards ?? []).map(card => [card.id, card]));
  const payments = new Map(data.transactions.flatMap(t => t.creditInvoice ? [[invoiceKey(t.creditInvoice), t] as const] : []));
  const invoices = new Map<string, CreditInvoice>();
  for (const purchase of data.creditPurchases ?? []) {
    const card = cards.get(purchase.cardId);
    if (!card) continue;
    const firstCycle = purchaseCycle(card, purchase.date);
    const base = Math.floor(purchase.amount / purchase.installments);
    const remainder = purchase.amount % purchase.installments;
    for (let index = 0; index < purchase.installments; index++) {
      const closesOn = dateInMonth(firstCycle, card.closingDay, index);
      const cycle = closesOn.slice(0, 7);
      const key = invoiceKey({cardId: card.id, cycle});
      let invoice = invoices.get(key);
      if (!invoice) {
        const sameMonthDue = dateInMonth(cycle, card.dueDay);
        const dueOn = card.dueDay > card.closingDay ? sameMonthDue : dateInMonth(cycle, card.dueDay, 1);
        invoice = {card, cardId: card.id, cycle, closesOn, dueOn, amount: 0, items: [], payment: payments.get(key)};
        invoices.set(key, invoice);
      }
      const amount = base + (index < remainder ? 1 : 0);
      invoice.amount += amount;
      invoice.items.push({purchase, number: index + 1, amount});
    }
  }
  return [...invoices.values()].sort((a, b) => a.dueOn.localeCompare(b.dueOn));
}

export function addCreditPurchase(data: FinanceData, purchase: CreditPurchase) {
  const paid = new Set(creditInvoices(data).filter(invoice => invoice.payment).map(invoiceKey));
  const draft = {...data, creditPurchases: [purchase], transactions: []};
  if (creditInvoices(draft).some(invoice => paid.has(invoiceKey(invoice)))) {
    throw Error('Esta compra entraria em uma fatura já paga. Revise a data da compra ou desfaça o pagamento para corrigir a fatura.');
  }
  return {...data, creditPurchases: [...(data.creditPurchases ?? []), purchase]};
}

export function payCreditInvoice(data: FinanceData, ref: CreditInvoiceRef, accountId: string, date: string, id: string): FinanceData {
  const invoice = creditInvoices(data).find(item => invoiceKey(item) === invoiceKey(ref));
  if (!invoice || invoice.payment) return data;
  if (date < invoice.closesOn) throw Error('Registre o pagamento a partir do fechamento da fatura.');
  if (!data.accounts.some(account => account.id === accountId)) throw Error('Escolha a conta usada no pagamento.');
  const transaction: Transaction = {
    id, accountId, date, amount: invoice.amount, type: 'expense', status: 'paid',
    description: `Fatura · ${invoice.card.name}`, category: 'Outros', space: invoice.card.space,
    creditInvoice: {cardId: invoice.cardId, cycle: invoice.cycle},
  };
  return {...data, transactions: [...data.transactions, transaction]};
}

export function expenseBreakdown(data: FinanceData, month: string, paidOnly: boolean) {
  const expenses = new Map<string, number>();
  function add(category: string, amount: number) {
    expenses.set(category, (expenses.get(category) ?? 0) + amount);
  }
  for (const t of data.transactions) {
    if (t.type === 'expense' && !t.creditInvoice && t.date.startsWith(month) && (!paidOnly || t.status === 'paid')) {
      add(t.category, t.amount);
    }
  }
  for (const invoice of creditInvoices(data)) {
    const date = paidOnly ? invoice.payment?.date : invoice.dueOn;
    if (date?.startsWith(month)) for (const item of invoice.items) add(item.purchase.category, item.amount);
  }
  return expenses;
}

export function validCreditLedger(data: FinanceData, categories: string[], validDate: (date: unknown) => boolean) {
  const cards = data.creditCards ?? [];
  const purchases = data.creditPurchases ?? [];
  const id = (value: unknown) => typeof value === 'string' && value.length > 0 && value.length <= 100;
  const title = (value: unknown, max: number) => typeof value === 'string' && value.trim().length > 0 && value.length <= max;
  const day = (value: number) => Number.isInteger(value) && value >= 1 && value <= 31;
  if ((data.creditCards !== undefined && !Array.isArray(data.creditCards)) || cards.length > 100 ||
      !cards.every(c => c && id(c.id) && title(c.name, 60) && isCardColor(c.color) &&
        Number.isSafeInteger(c.limit) && c.limit > 0 && day(c.closingDay) && day(c.dueDay) &&
        (c.space === 'personal' || c.space === 'work'))) return false;
  const cardIds = new Set(cards.map(c => c.id));
  if (cardIds.size !== cards.length ||
      (data.creditPurchases !== undefined && !Array.isArray(data.creditPurchases)) || purchases.length > 2000 ||
      !purchases.every(p => p && id(p.id) && cardIds.has(p.cardId) && title(p.description, 100) &&
        categories.includes(p.category) && validDate(p.date) && p.date >= '2000-01-01' && p.date <= '2099-12-31' &&
        Number.isInteger(p.installments) && p.installments >= 1 && p.installments <= 60 &&
        Number.isSafeInteger(p.amount) && p.amount >= p.installments) ||
      new Set(purchases.map(p => p.id)).size !== purchases.length ||
      !Number.isSafeInteger(purchases.reduce((total, purchase) => total + purchase.amount, 0))) return false;
  const invoices = new Map(creditInvoices(data).map(invoice => [invoiceKey(invoice), invoice]));
  if ([...invoices.values()].some(invoice => !Number.isSafeInteger(invoice.amount))) return false;
  const paid = new Set<string>();
  for (const t of data.transactions) {
    if (t.creditInvoice === undefined) continue;
    const ref = t.creditInvoice;
    if (!ref || !cardIds.has(ref.cardId) || typeof ref.cycle !== 'string' || t.type !== 'expense' ||
        t.status !== 'paid' || t.recurrence || t.installment) return false;
    const key = invoiceKey(ref);
    const invoice = invoices.get(key);
    if (paid.has(key) || !invoice || t.amount !== invoice.amount || t.date < invoice.closesOn || t.space !== invoice.card.space) return false;
    paid.add(key);
  }
  return paid.size === 0 || new Set(data.transactions.map(t => t.id)).size === data.transactions.length;
}
