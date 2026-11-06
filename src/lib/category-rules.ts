import type {FinanceData} from './finance';
import {categoryCatalog} from './category-settings';

export type CategoryRule = {
 id:string;
 phrase:string;
 category:string;
 type:'income'|'expense';
 space:'all'|'personal'|'work';
 enabled:boolean;
};
export type CategoryRuleSubject = {
 description:string;
 type:'income'|'expense';
 space:'personal'|'work';
};
export const maxCategoryRules=50;

const fold=(text:string)=>text.normalize('NFD')
 .replace(/\p{Diacritic}/gu,'').toLocaleLowerCase('pt-BR')
 .replace(/\s+/g,' ').trim();
const validPhrase=(text:unknown)=>typeof text==='string'&&text===text.trim()
 &&text.length>=3&&text.length<=60&&!/[\p{C}<>]/u.test(text);

export function validCategoryRules(data:FinanceData):boolean{
 const rules=data.categoryRules;
 if(rules===undefined)return true;
 if(!Array.isArray(rules)||rules.length>maxCategoryRules)return false;
 const allowed=new Set(categoryCatalog(data));
 if(!rules.every(rule=>rule&&typeof rule.id==='string'&&rule.id.length>0&&rule.id.length<=100
  &&validPhrase(rule.phrase)&&allowed.has(rule.category)
  &&(rule.type==='income'||rule.type==='expense')
  &&(rule.space==='all'||rule.space==='personal'||rule.space==='work')
  &&typeof rule.enabled==='boolean'))return false;
 if(new Set(rules.map(rule=>rule.id)).size!==rules.length)return false;
 const signatures=rules.map(rule=>[rule.type,rule.space,fold(rule.phrase)].join('|'));
 return new Set(signatures).size===rules.length;
}

/** First active match wins. No fuzzy guessing, calls to AI or external services. */
export function matchCategoryRule(data:FinanceData,subject:CategoryRuleSubject):CategoryRule|null{
 const description=fold(subject.description);
 for(const rule of data.categoryRules??[]){
  if(rule.enabled&&rule.type===subject.type
   &&(rule.space==='all'||rule.space===subject.space)
   &&description.includes(fold(rule.phrase)))return rule;
 }
 return null;
}

export function addCategoryRule(data:FinanceData,entry:CategoryRule):FinanceData{
 const next:FinanceData={...data,categoryRules:[...(data.categoryRules??[]),entry]};
 if(!validCategoryRules(next))throw Error('Confira o texto, a categoria e as regras existentes. Não são permitidas regras iguais.');
 return next;
}
export function setRuleEnabled(data:FinanceData,id:string,enabled:boolean):FinanceData{
 if(!(data.categoryRules??[]).some(rule=>rule.id===id))throw Error('Regra não encontrada.');
 return {...data,categoryRules:(data.categoryRules??[]).map(rule=>rule.id===id?{...rule,enabled}:rule)};
}
export function removeCategoryRule(data:FinanceData,id:string):FinanceData{
 return {...data,categoryRules:(data.categoryRules??[]).filter(rule=>rule.id!==id)};
}
export function moveCategoryRule(data:FinanceData,id:string,direction:-1|1):FinanceData{
 const list=[...(data.categoryRules??[])],index=list.findIndex(rule=>rule.id===id);
 if(index<0||index+direction<0||index+direction>=list.length)return data;
 [list[index],list[index+direction]]=[list[index+direction],list[index]];
 return {...data,categoryRules:list};
}
