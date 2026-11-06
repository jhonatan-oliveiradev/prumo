import type {FinanceData} from './finance';
import {accountBalance} from './account-transfers';

/** An immutable correction of account balance, with values captured at the moment of reconciliation. */
export type BalanceReconciliation={
 id:string;
 accountId:string;
 date:string;
 balanceBefore:number;
 balanceAfter:number;
 delta:number;
 note:string;
};

const positive=/^0+(?:[.,]0{1,2})?$/;
export function parseAccountBalance(value:string):number{
 const trimmed=value.trim().replace(/^R\$\s*/,'').trim();
 const negative=trimmed.startsWith('-');
 const absolute=negative?trimmed.slice(1).trim():trimmed;
 if(positive.test(absolute))return 0;
 const grouped=/^\d{1,3}(?:\.\d{3})+(?:,\d{1,2})?$/.test(absolute);
 const plain=/^\d+(?:[.,]\d{1,2})?$/.test(absolute);
 if(!grouped&&!plain)throw Error('Informe um saldo válido, como 1.234,56 ou -50,00.');
 const decimal=grouped?absolute.replace(/\./g,'').replace(',','.'):absolute.replace(',','.');
 const cents=Math.round(Number(decimal)*100);
 if(!Number.isSafeInteger(cents)||cents<=0)throw Error('Informe um saldo dentro do limite permitido.');
 return negative?-cents:cents;
}

function dateOk(value:unknown):value is string{
 return typeof value==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value)
  &&!Number.isNaN(Date.parse(value))
  &&new Date(value).toISOString().slice(0,10)===value
  &&value>='2000-01-01'&&value<='2099-12-31';
}

/** One adjustment for one account; no fabricated income or expense. */
export function validReconciliations(data:FinanceData):boolean{
 const entries=data.reconciliations??[];
 const accounts=new Set(data.accounts.map(a=>a.id));
 return (data.reconciliations===undefined||Array.isArray(data.reconciliations))
  &&entries.length<=2000
  &&entries.every(row=>row&&typeof row.id==='string'&&row.id.length>0&&row.id.length<=100
   &&accounts.has(row.accountId)&&dateOk(row.date)
   &&Number.isSafeInteger(row.balanceBefore)&&Number.isSafeInteger(row.balanceAfter)
   &&Number.isSafeInteger(row.delta)&&row.delta!==0
   &&row.balanceAfter-row.balanceBefore===row.delta
   &&typeof row.note==='string'&&row.note.trim().length>=3&&row.note.length<=160)
  &&new Set(entries.map(row=>row.id)).size===entries.length;
}

export function reconcileAccount(data:FinanceData,entry:{
 id:string;accountId:string;date:string;balanceAfter:number;note:string;
}):FinanceData{
 const account=data.accounts.find(a=>a.id===entry.accountId);
 if(!account)throw Error('Escolha uma conta existente para conferir o saldo.');
 const before=accountBalance(data,entry.accountId);
 const delta=entry.balanceAfter-before;
 if(!Number.isSafeInteger(delta)||delta===0)throw Error(delta===0
  ?'O saldo informado já corresponde ao saldo do Prumo. Nenhum ajuste é necessário.'
  :'O ajuste ultrapassa o limite permitido para valores financeiros.');
 const row:BalanceReconciliation={
  id:entry.id,accountId:entry.accountId,date:entry.date,
  balanceBefore:before,balanceAfter:entry.balanceAfter,delta,note:entry.note.trim(),
 };
 const next:FinanceData={...data,reconciliations:[...(data.reconciliations??[]),row]};
 if(!validReconciliations(next))throw Error('Revise a data, a justificativa e o valor informado.');
 return next;
}

/** Once accepted, an adjustment remains part of the ledger in all future snapshots. */
export function preservesReconciliationHistory(before:FinanceData,after:FinanceData):boolean{
 const entries=new Map((after.reconciliations??[]).map(item=>[item.id,item]));
 return (before.reconciliations??[]).every(row=>{
  const next=entries.get(row.id);
  return Boolean(next)&&next!.accountId===row.accountId
   &&next!.date===row.date&&next!.balanceBefore===row.balanceBefore
   &&next!.balanceAfter===row.balanceAfter&&next!.delta===row.delta
   &&next!.note===row.note;
 });
}
