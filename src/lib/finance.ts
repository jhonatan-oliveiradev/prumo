import {validCsvOrigins, type CsvOrigin} from './import-origin';
import {categoryCatalog,defaultCategories,validCustomCategories} from './category-settings';
import {accountBalance,validTransfers,type AccountTransfer} from './account-transfers';
import {validReconciliations,type BalanceReconciliation} from './balance-reconciliation';
import {creditInvoices, validCreditLedger, type CreditCard, type CreditPurchase, type CreditInvoiceRef} from './credit';
import {isGoalCover, maxFeaturedGoals, type GoalCover} from './goal-covers';

export const categories:string[] = [...defaultCategories];
export type Installment = {groupId:string;number:number;count:number};
export type RecurringRule={id:string;description:string;amount:number;type:'income'|'expense';category:string;accountId:string;space:'personal'|'work';frequency:'weekly'|'monthly'|'yearly';status:'active'|'paused';startsOn:string;endsOn?:string;generatedThrough?:string};
export type Transaction = {imported?:CsvOrigin;creditInvoice?:CreditInvoiceRef;recurrence?:{ruleId:string;scheduledOn:string};installment?:Installment;id:string;description:string;amount:number;type:'income'|'expense';category:string;date:string;accountId:string;status:'paid'|'pending';space:'personal'|'work'};
export type Account = {id:string;name:string;openingBalance:number};
export type Goal = {id:string;name:string;target:number;saved:number;cover?:GoalCover;featured?:boolean};
export type Budget = {id:string;category:string;limit:number};
export type FinanceData = {customCategories?:string[];reconciliations?:BalanceReconciliation[];transfers?:AccountTransfer[];creditCards?:CreditCard[];creditPurchases?:CreditPurchase[];recurringRules?:RecurringRule[];version:1;name:string;accounts:Account[];transactions:Transaction[];goals:Goal[];budgets:Budget[]};
export function filterFinanceSpace(data: FinanceData, space: string): FinanceData {
  if (space === 'all') return data;
  const creditCards = data.creditCards?.filter(card => card.space === space);
  const cardIds = new Set(creditCards?.map(card => card.id));
  return {
    ...data,
    transactions: data.transactions.filter(t => t.space === space),
    creditCards,
    creditPurchases: data.creditPurchases?.filter(purchase => cardIds.has(purchase.cardId)),
  };
}
export const emptyData:FinanceData = {version:1,name:'',accounts:[],transactions:[],goals:[],budgets:[]};
export const money=(cents:number)=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(cents/100);
/** Accept standard pt-BR grouping, plain decimals and pasted R$ values without rounding ambiguity. */
export function toCents(value:string){
 const raw=value.trim().replace(/^R\$\s*/,'').trim();
 const grouped=/^\d{1,3}(?:\.\d{3})+(?:,\d{1,2})?$/.test(raw);
 const plain=/^\d+(?:[.,]\d{1,2})?$/.test(raw);
 if(!grouped&&!plain)throw new Error('Informe um valor válido, como 125,50 ou 1.234,56.');
 const normalized=grouped?raw.replace(/\./g,'').replace(',','.'):raw.replace(',','.');
 const n=Math.round(Number(normalized)*100);
 if(!Number.isSafeInteger(n)||n<=0)throw new Error('Informe um valor válido maior que zero.');
 return n;
}
export function summary(data:FinanceData,month:string){const paid=data.transactions.filter(t=>t.status==='paid');const current=data.transactions.filter(t=>t.date.startsWith(month));const total=(list:Transaction[],type:string)=>list.filter(t=>t.type===type).reduce((s,t)=>s+t.amount,0);const balance=data.accounts.reduce((sum,account)=>sum+accountBalance(data,account.id),0);const pending=total(current.filter(t=>t.status==='pending'),'expense')+creditInvoices(data).filter(i=>!i.payment&&i.dueOn.startsWith(month)).reduce((sum,i)=>sum+i.amount,0);const reserved=data.goals.reduce((s,g)=>s+g.saved,0);return {balance,income:total(current.filter(t=>t.status==='paid'),'income'),expense:total(current.filter(t=>t.status==='paid'),'expense'),pending,reserved,available:balance-pending-reserved};}
/**
 * The actual amount free to spend today, independent of a selected reporting
 * month. Includes overdue unpaid items and unpaid card invoices exactly once.
 * Receivables never increase the conservative balance until received.
 */
export function availableToday(data:FinanceData,today:string){
 const month=today.slice(0,7);
 const {balance,reserved}=summary(data,month);
 const pendingExpense=commitments(data,month,today)
  .filter(t=>t.type==='expense').reduce((sum,t)=>sum+t.amount,0);
 const cardBills=creditInvoices(data)
  .filter(i=>!i.payment&&(i.dueOn<today||i.dueOn.startsWith(month)))
  .reduce((sum,i)=>sum+i.amount,0);
 return {available:balance-reserved-pendingExpense-cardBills,
  overdueExpenses:pendingExpense+cardBills,
  reserved,balance};
}
export function isInstallment(value:unknown):value is Installment{if(!value||typeof value!=='object')return false;const i=value as Installment;return typeof i.groupId==='string'&&i.groupId.length>0&&i.groupId.length<=100&&Number.isInteger(i.number)&&Number.isInteger(i.count)&&i.count>=2&&i.count<=60&&i.number>=1&&i.number<=i.count;}
export const validDate=(d:unknown):d is string=>typeof d==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(d)&&!isNaN(Date.parse(d))&&new Date(d).toISOString().slice(0,10)===d;
export function isRecurringRule(r:RecurringRule,allowedCategories:readonly string[]=categories){return r&&typeof r.id==='string'&&r.id.length>0&&r.id.length<=60&&typeof r.description==='string'&&r.description.length>0&&r.description.length<=100&&Number.isSafeInteger(r.amount)&&r.amount>0&&['income','expense'].includes(r.type)&&allowedCategories.includes(r.category)&&['personal','work'].includes(r.space)&&['weekly','monthly','yearly'].includes(r.frequency)&&['active','paused'].includes(r.status)&&validDate(r.startsOn)&&r.startsOn>='2000-01-01'&&(!r.endsOn||(validDate(r.endsOn)&&r.endsOn>=r.startsOn))&&(!r.generatedThrough||validDate(r.generatedThrough));}
export function isFinanceData(value:unknown):value is FinanceData {if(!value||typeof value!=='object')return false;const d=value as FinanceData;const cents=(n:unknown)=>Number.isSafeInteger(n)&&Number(n)>=0;return d.version===1&&typeof d.name==='string'&&validCustomCategories(d.customCategories)&&(d.recurringRules===undefined||(Array.isArray(d.recurringRules)&&d.recurringRules.length<=100&&d.recurringRules.every(r=>isRecurringRule(r,categoryCatalog(d))&&d.accounts.some(a=>a.id===r.accountId))&&new Set(d.recurringRules.map(r=>r.id)).size===d.recurringRules.length))&&Array.isArray(d.accounts)&&d.accounts.every(a=>typeof a.id==='string'&&typeof a.name==='string'&&cents(a.openingBalance))&&Array.isArray(d.goals)&&d.goals.every(g=>typeof g.id==='string'&&typeof g.name==='string'&&cents(g.target)&&g.target>0&&cents(g.saved)&&(g.cover===undefined||isGoalCover(g.cover))&&(g.featured===undefined||typeof g.featured==='boolean'))&&d.goals.filter(g=>g.featured).length<=maxFeaturedGoals&&Array.isArray(d.budgets)&&d.budgets.every(b=>typeof b.id==='string'&&categoryCatalog(d).includes(b.category)&&cents(b.limit)&&b.limit>0)&&Array.isArray(d.transactions)&&d.transactions.every(t=>typeof t.id==='string'&&typeof t.description==='string'&&(t.recurrence===undefined||(t.recurrence&&typeof t.recurrence.ruleId==='string'&&validDate(t.recurrence.scheduledOn)&&Boolean(d.recurringRules?.some(r=>r.id===t.recurrence!.ruleId))))&&(t.installment===undefined||(t.type==='expense'&&isInstallment(t.installment)))&&cents(t.amount)&&t.amount>0&&['income','expense'].includes(t.type)&&['paid','pending'].includes(t.status)&&['personal','work'].includes(t.space)&&/^\d{4}-\d{2}-\d{2}$/.test(t.date)&&!isNaN(Date.parse(t.date))&&new Date(t.date).toISOString().slice(0,10)===t.date&&categoryCatalog(d).includes(t.category)&&d.accounts.some(a=>a.id===t.accountId))&&validTransfers(d)&&validReconciliations(d)&&validCreditLedger(d,categoryCatalog(d),validDate)&&validCsvOrigins(d);}

/** Pending obligations retain their scheduled date; paid entries are never settled twice. */
export function settleTransaction(data: FinanceData, id: string): FinanceData {
  const transaction = data.transactions.find(t => t.id === id);
  if (!transaction || transaction.status === 'paid') return data;
  return {...data, transactions: data.transactions.map(t => t.id === id ? {...t, status: 'paid'} : t)};
}

export function commitments(data: FinanceData, month: string, today: string) {
  return data.transactions
    .filter(t => t.status === 'pending' && (t.date.startsWith(month) || t.date < today))
    .sort((a, b) => a.date.localeCompare(b.date) || a.description.localeCompare(b.description));
}
