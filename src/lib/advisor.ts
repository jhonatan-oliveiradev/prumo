import {summary,type FinanceData} from './finance';
import {projectCashFlow} from './planning';
export const advisorTasks={priorities:'Qual deve ser minha prioridade agora?',spending:'Como posso organizar melhor meus gastos?',forecast:'Como me preparar para os próximos meses?',habits:'Que hábitos posso adotar para manter o controle?'} as const;
export type AdvisorTask=keyof typeof advisorTasks;
/** Only coarse, non-identifying indicators leave Prumo. Never copy transaction/user text here. */
export function buildAdvisorContext(data:FinanceData,month:string,today:string){
 const s=summary(data,month);
 const ratio=s.income>0?s.expense/s.income:null;
 const future=projectCashFlow(data,today);
 const overBudget=data.budgets.filter(b=>data.transactions.filter(t=>t.type==='expense'&&t.date.startsWith(month)&&t.category===b.category).reduce((sum,t)=>sum+t.amount,0)>b.limit).length;
 return {period:month,hasRecordedIncome:s.income>0,spendingPressure:ratio===null?'unknown':ratio>1?'above_income':ratio>.8?'near_income':ratio>.5?'moderate':'lower',freeBalance:s.available<0?'negative':s.available===0?'zero':'positive',hasPendingExpenses:s.pending>0,hasReservedGoals:s.reserved>0,budgetPressure:overBudget===0?'none':overBudget===1?'one_category':'multiple_categories',futureDeficit:future.some(m=>m.conservative<0),dependsOnExpectedIncome:future.some(m=>m.conservative<0&&m.expected>=0),hasInstallments:data.transactions.some(t=>t.status==='pending'&&Boolean(t.installment)),hasRecurrences:Boolean(data.recurringRules?.some(r=>r.status==='active'))};
}
