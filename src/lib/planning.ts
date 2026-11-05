import {summary,type FinanceData,type Transaction} from './finance';

export function addMonthsClamped(date:string,offset:number){
 const [year,month,day]=date.split('-').map(Number);
 const target=new Date(Date.UTC(year,month-1+offset,1));
 const last=new Date(Date.UTC(target.getUTCFullYear(),target.getUTCMonth()+1,0)).getUTCDate();
 return `${target.getUTCFullYear()}-${String(target.getUTCMonth()+1).padStart(2,'0')}-${String(Math.min(day,last)).padStart(2,'0')}`;
}

/** The amount is the full purchase total, not the per-installment amount. */
export function createInstallments(transaction:Transaction,count:number,groupId:string,newId:()=>string):Transaction[]{
 if(!Number.isInteger(count)||count<1||count>60)throw Error('Escolha entre 1 e 60 parcelas.');
 if(transaction.type!=='expense'&&count>1)throw Error('O parcelamento está disponível para despesas.');
 if(!Number.isSafeInteger(transaction.amount)||transaction.amount<count)throw Error('O valor total precisa permitir parcelas de pelo menos R$ 0,01.');
 if(count===1)return [transaction];
 const base=Math.floor(transaction.amount/count),remainder=transaction.amount%count;
 return Array.from({length:count},(_,index)=>({...transaction,id:index===0?transaction.id:newId(),amount:base+(index<remainder?1:0),date:addMonthsClamped(transaction.date,index),status:index===0?transaction.status:'pending',installment:{groupId,number:index+1,count}}));
}

export function removePendingInstallments(data:FinanceData,groupId:string,fromNumber:number):FinanceData{
 return {...data,transactions:data.transactions.filter(t=>!(t.installment?.groupId===groupId&&t.installment.number>=fromNumber&&t.status==='pending'))};
}

export function projectCashFlow(data:FinanceData,today:string,months=6){
 const start=today.slice(0,7)+'-01';
 const {balance,reserved}=summary(data,today.slice(0,7));
 let conservative=balance-reserved,expected=conservative;
 return Array.from({length:months},(_,index)=>{
  const date=addMonthsClamped(start,index),next=addMonthsClamped(start,index+1);
  const pending=data.transactions.filter(t=>t.status==='pending'&&t.date<next&&(index===0||t.date>=date));
  const income=pending.filter(t=>t.type==='income').reduce((sum,t)=>sum+t.amount,0);
  const expense=pending.filter(t=>t.type==='expense').reduce((sum,t)=>sum+t.amount,0);
  const installments=pending.filter(t=>t.type==='expense'&&t.installment).reduce((sum,t)=>sum+t.amount,0);
  conservative-=expense;expected+=income-expense;
  return {month:date.slice(0,7),income,expense,installments,conservative,expected};
 });
}
