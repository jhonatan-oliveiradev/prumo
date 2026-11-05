import {isFinanceData,type FinanceData} from './finance';
export const MAX_SYNC_BYTES=1_000_000;
export type WorkspaceSnapshot={data:FinanceData;revision:number;updatedAt:string};
export function parseWorkspaceInput(value:unknown):{data:FinanceData;revision:number}|null{
 try{
  if(!value||typeof value!=='object')return null;
  const input=value as {data:FinanceData;revision:number};
  if(!Number.isSafeInteger(input.revision)||input.revision<0||input.revision>=2147483647||!isFinanceData(input.data))return null;
  const d=input.data;
  if(d.name.length>100||d.accounts.length>100||d.transactions.length>10000||d.goals.length>100||d.budgets.length>100)return null;
  const ids=[d.accounts,d.transactions,d.goals,d.budgets];
  if(ids.some(list=>list.some(x=>!x.id||x.id.length>100)||new Set(list.map(x=>x.id)).size!==list.length))return null;
  if(d.accounts.some(a=>!a.name||a.name.length>100)||d.goals.some(g=>!g.name||g.name.length>100)||d.transactions.some(t=>!t.description||t.description.length>200))return null;
  if(JSON.stringify(input).length>MAX_SYNC_BYTES)return null;
  if(new Set(d.budgets.map(b=>b.category)).size!==d.budgets.length)return null;
  const installmentKeys=d.transactions.filter(t=>t.installment).map(t=>`${t.installment!.groupId}:${t.installment!.number}`);
  if(new Set(installmentKeys).size!==installmentKeys.length)return null;
  const groupCounts=new Map<string,number>();
  for(const t of d.transactions){if(t.installment){const old=groupCounts.get(t.installment.groupId);if(old!==undefined&&old!==t.installment.count)return null;groupCounts.set(t.installment.groupId,t.installment.count);}}
  const sum=[...d.accounts.map(a=>a.openingBalance),...d.transactions.map(t=>t.amount),...d.goals.flatMap(g=>[g.saved,g.target]),...d.budgets.map(b=>b.limit)].reduce((total,n)=>total+BigInt(n),0n);
  if(sum>BigInt(Number.MAX_SAFE_INTEGER))return null;
  return {data:d,revision:input.revision};
 }catch{return null;}
}
export function canWriteOrigin(origin:string|null,expected:string){return origin!==null&&origin===new URL(expected).origin;}
