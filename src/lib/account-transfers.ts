import type {FinanceData,Transaction} from './finance';

export type AccountTransfer = {
 id:string;
 sourceAccountId:string;
 targetAccountId:string;
 amount:number;
 date:string;
 note?:string;
};

function dateOk(value:unknown):value is string{
 return typeof value==='string'
  && /^\d{4}-\d{2}-\d{2}$/.test(value)
  && !Number.isNaN(Date.parse(value))
  && new Date(value).toISOString().slice(0,10)===value
  && value>='2000-01-01' && value<='2099-12-31';
}

/** Transfers never create income or expenses. Both sides belong to one record. */
export function validTransfers(data:FinanceData):boolean{
 const list=data.transfers??[];
 const accounts=new Set(data.accounts.map(account=>account.id));
 return (data.transfers===undefined||Array.isArray(data.transfers))
  &&list.length<=2000
  &&list.every(row=>row&&typeof row.id==='string'&&row.id.length>0&&row.id.length<=100
   &&accounts.has(row.sourceAccountId)&&accounts.has(row.targetAccountId)
   &&row.sourceAccountId!==row.targetAccountId
   &&Number.isSafeInteger(row.amount)&&row.amount>0
   &&dateOk(row.date)
   &&(row.note===undefined||(typeof row.note==='string'&&row.note.length<=160)))
  &&new Set(list.map(row=>row.id)).size===list.length;
}

export function accountBalance(data:FinanceData,accountId:string):number{
 const account=data.accounts.find(item=>item.id===accountId);
 if(!account)return 0;
 const movements=data.transactions.reduce((amount,t:Transaction)=>{
  if(t.accountId!==accountId||t.status!=='paid')return amount;
  return amount+(t.type==='income'?t.amount:-t.amount);
 },0);
 const transfers=(data.transfers??[]).reduce((amount,t)=>{
  return amount+(t.targetAccountId===accountId?t.amount:0)-(t.sourceAccountId===accountId?t.amount:0);
 },0);
 return account.openingBalance+movements+transfers;
}

export function createAccountTransfer(data:FinanceData,transfer:AccountTransfer):FinanceData{
 const next:FinanceData={...data,transfers:[...(data.transfers??[]),transfer]};
 if(!validTransfers(next))throw Error('Revise as contas, a data e o valor da transferência.');
 if(next.transfers!.some((item,index)=>item.id===transfer.id&&index!==next.transfers!.length-1))
  throw Error('Esta transferência já foi registrada.');
 return next;
}

export function removeAccountTransfer(data:FinanceData,id:string):FinanceData{
 return {...data,transfers:(data.transfers??[]).filter(t=>t.id!==id)};
}

/** A transfer must always sum to zero across the workspace. */
export function transferNet(data:FinanceData):number{
 return data.accounts.reduce((sum,account)=>sum+
  (data.transfers??[]).reduce((delta,t)=>
   delta+(t.targetAccountId===account.id?t.amount:0)-(t.sourceAccountId===account.id?t.amount:0),0),0);
}
