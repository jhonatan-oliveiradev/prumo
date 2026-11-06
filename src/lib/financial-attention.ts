import {creditInvoices} from './credit';
import type {FinanceData} from './finance';

export type AttentionSummary = {
  overdueCount: number;
  overdueAmount: number;
  upcomingCount: number;
  upcomingAmount: number;
};

/**
 * Counts unpaid expenses and card statements, once per obligation.
 * Does not treat forecast income as cash on hand.
 */
export function financialAttention(data:FinanceData,today:string,daysAhead=7):AttentionSummary{
 const end=new Date(`${today}T12:00:00Z`);
 end.setUTCDate(end.getUTCDate()+daysAhead);
 const endDate=end.toISOString().slice(0,10);
 const obligations=[
  ...data.transactions.filter(t=>t.type==='expense'&&t.status==='pending')
   .map(t=>({date:t.date,amount:t.amount})),
  ...creditInvoices(data).filter(i=>!i.payment)
   .map(i=>({date:i.dueOn,amount:i.amount})),
 ];
 const overdue=obligations.filter(t=>t.date<today);
 const upcoming=obligations.filter(t=>t.date>=today&&t.date<=endDate);
 return {
  overdueCount:overdue.length,
  overdueAmount:overdue.reduce((sum,t)=>sum+t.amount,0),
  upcomingCount:upcoming.length,
  upcomingAmount:upcoming.reduce((sum,t)=>sum+t.amount,0),
 };
}
