import type {FinanceData} from './finance';

/** Default labels stay stable for old workspaces and imported backups. */
export const defaultCategories = ['Alimentação','Moradia','Transporte','Pets','Saúde','Lazer','Assinaturas','Trabalho','Outros'] as const;
export const maxCustomCategories = 30;
const folded = (name:string)=>name.normalize('NFD').replace(/\p{Diacritic}/gu,'').toLocaleLowerCase('pt-BR');
const clean = (name:string)=>name.trim().replace(/\s+/g,' ');

export function categoryCatalog(data: Pick<FinanceData,'customCategories'>): string[] {
  return [...defaultCategories,...(data.customCategories??[])];
}

export function validCustomCategories(value:unknown):boolean {
  if(value===undefined)return true;
  if(!Array.isArray(value)||value.length>maxCustomCategories)return false;
  const names=value.map(item=>typeof item==='string'?clean(item):'');
  return names.every((name,i)=>name===value[i]&&name.length>=2&&name.length<=40
    && !/[\p{C}<>]/u.test(name)
    && !defaultCategories.some(category=>folded(category)===folded(name)))
    &&new Set(names.map(folded)).size===names.length;
}

export function hasCategory(data:Pick<FinanceData,'customCategories'>,name:string):boolean{
 return categoryCatalog(data).includes(name);
}

export function addCategory(data:FinanceData,rawName:string):FinanceData {
 const name=clean(rawName);
 const next={...data,customCategories:[...(data.customCategories??[]),name]};
 if(!validCustomCategories(next.customCategories))throw Error('Escolha um nome único de 2 a 40 caracteres, diferente das categorias existentes.');
 return next;
}

/** Renaming is atomic across every place referring to the label. */
export function renameCategory(data:FinanceData,previous:string,rawName:string):FinanceData {
 const name=clean(rawName);
 if(!(data.customCategories??[]).includes(previous))throw Error('Somente categorias personalizadas podem ser renomeadas.');
 if(name===previous)return data;
 const next:FinanceData={
  ...data,
  customCategories:(data.customCategories??[]).map(item=>item===previous?name:item),
  transactions:data.transactions.map(row=>row.category===previous?{...row,category:name}:row),
  budgets:data.budgets.map(row=>row.category===previous?{...row,category:name}:row),
  recurringRules:data.recurringRules?.map(row=>row.category===previous?{...row,category:name}:row),
  categoryRules:data.categoryRules?.map(row=>row.category===previous?{...row,category:name}:row),
  creditPurchases:data.creditPurchases?.map(row=>row.category===previous?{...row,category:name}:row),
 };
 if(!validCustomCategories(next.customCategories))throw Error('Já existe uma categoria com esse nome ou o nome é inválido.');
 return next;
}

export function categoryUsage(data:FinanceData,name:string){
 return {
  transactions:data.transactions.filter(row=>row.category===name).length,
  purchases:(data.creditPurchases??[]).filter(row=>row.category===name).length,
  budgets:data.budgets.filter(row=>row.category===name).length,
  recurrences:(data.recurringRules??[]).filter(row=>row.category===name).length,
  rules:(data.categoryRules??[]).filter(rule=>rule.category===name).length,
 };
}

/** Never delete a label that is in active or historical use. */
export function removeCategory(data:FinanceData,name:string):FinanceData {
 if(!(data.customCategories??[]).includes(name))throw Error('Apenas categorias personalizadas podem ser removidas.');
 const counts=categoryUsage(data,name);
 if(Object.values(counts).some(count=>count>0))
  throw Error('Esta categoria possui lançamentos, compras, orçamentos ou recorrências. Renomeie-a ou mova os registros antes de remover.');
 return {...data,customCategories:(data.customCategories??[]).filter(item=>item!==name)};
}
