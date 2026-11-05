import {type FinanceData,type RecurringRule,type Transaction} from './finance';
import {addMonthsClamped} from './planning';
export function recurrenceHorizon(today:string){return addMonthsClamped(today.slice(0,7)+'-01',6);}
function occurrenceDate(rule:RecurringRule,index:number){
 if(rule.frequency==='monthly')return addMonthsClamped(rule.startsOn,index);
 if(rule.frequency==='yearly')return addMonthsClamped(rule.startsOn,index*12);
 const date=new Date(rule.startsOn+'T12:00:00Z');date.setUTCDate(date.getUTCDate()+7*index);return date.toISOString().slice(0,10);
}
/** Exclusive horizon, deterministic IDs and persisted checkpoint prevent duplicate/deleted occurrence regeneration. */
export function generateRecurrences(data:FinanceData,horizon:string):FinanceData{
 let changed=false;const transactions=[...data.transactions];const ids=new Set(transactions.map(t=>t.id));
 const rules=(data.recurringRules??[]).map(rule=>{
  if(rule.status==='paused'||(rule.generatedThrough&&rule.generatedThrough>=horizon)||rule.startsOn>=horizon)return rule;
  for(let index=0;index<4000;index++){
   const date=occurrenceDate(rule,index);
   if(date>=horizon||(rule.endsOn&&date>rule.endsOn))break;
   if(rule.generatedThrough&&date<rule.generatedThrough)continue;
   const id=`rec:${rule.id}:${date}`;
   if(ids.has(id))continue;
   const t:Transaction={id,description:rule.description,amount:rule.amount,type:rule.type,category:rule.category,accountId:rule.accountId,space:rule.space,status:'pending',date,recurrence:{ruleId:rule.id,scheduledOn:date}};
   transactions.push(t);ids.add(id);
   if(transactions.length>10000)throw Error('O limite de lançamentos foi atingido. Reduza o período da recorrência.');
  }
  if(occurrenceDate(rule,4000)<horizon&&(!rule.endsOn||occurrenceDate(rule,4000)<=rule.endsOn))throw Error('O início da recorrência é muito antigo. Escolha uma data mais recente.');
  changed=true;return {...rule,generatedThrough:horizon};
 });
 return changed?{...data,transactions,recurringRules:rules}:data;
}
export function saveRecurringRule(data:FinanceData,rule:RecurringRule,today:string){
 const existing=(data.recurringRules??[]).some(r=>r.id===rule.id);
 const transactions=existing?data.transactions.filter(t=>!(t.recurrence?.ruleId===rule.id&&t.date>=today&&t.status==='pending')):data.transactions;
 const rules=[...(data.recurringRules??[]).filter(r=>r.id!==rule.id),{...rule,generatedThrough:existing?today:undefined}];
 return generateRecurrences({...data,transactions,recurringRules:rules},recurrenceHorizon(today));
}
export function toggleRecurringRule(data:FinanceData,id:string,today:string){
 const rule=data.recurringRules?.find(r=>r.id===id);if(!rule)return data;
 if(rule.status==='active')return {...data,transactions:data.transactions.filter(t=>!(t.recurrence?.ruleId===id&&t.date>=today&&t.status==='pending')),recurringRules:data.recurringRules!.map(r=>r.id===id?{...r,status:'paused' as const}:r)};
 return saveRecurringRule(data,{...rule,status:'active',generatedThrough:undefined},today);
}
