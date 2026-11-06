import {emptyData,type FinanceData} from './finance';
import type {WorkspaceSnapshot} from './sync';

/** An empty finance workspace must not erase the authenticated user's profile. */
export function hydrateWorkspace(workspace:WorkspaceSnapshot|null,userName:string){
 const source=workspace?.data??emptyData;
 return {data:{...source,name:source.name.trim()||userName.trim()},revision:workspace?.revision??0,dirty:false};
}
export const cloudStateForRevision=(revision:number)=>revision>0?'ready' as const:'connected' as const;
export function profileInitials(name:string){
 const words=name.trim().split(/\s+/).filter(Boolean);
 return words.length?`${words[0][0]}${words.length>1?words[words.length-1][0]:''}`.toLocaleUpperCase('pt-BR'):'P';
}

/** Workspace rows can return in a different order and omit fields at their defaults. */
export function sameFinanceData(left: FinanceData, right: FinanceData) {
 const byId = <T extends {id: string}>(items: T[]) => [...items].sort((a,b)=>a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
 const normalize = (data: FinanceData) => ({
  ...data,
  accounts: byId(data.accounts),
  transactions: byId(data.transactions),
  transfers: byId(data.transfers??[]),
  reconciliations: byId(data.reconciliations??[]),
  budgets: byId(data.budgets),
  goals: byId(data.goals).map(goal=>({...goal,cover:goal.cover??'abstract',featured:goal.featured??false})),
  recurringRules: byId(data.recurringRules??[]),
  creditCards: byId(data.creditCards??[]),
  creditPurchases: byId(data.creditPurchases??[]),
 });
 return stableJson(normalize(left)) === stableJson(normalize(right));
}

function stableJson(value: unknown) {
 return JSON.stringify(value, (_key, item) => {
  if (!item || typeof item !== 'object' || Array.isArray(item)) return item;
  return Object.fromEntries(Object.keys(item).sort().map(key=>[key,item[key]]));
 });
}
