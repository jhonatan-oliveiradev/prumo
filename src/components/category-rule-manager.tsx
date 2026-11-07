'use client';
import {useState,type FormEvent} from 'react';
import {ArrowDown,ArrowUp,CheckCircle2,Plus,ShieldCheck,Sparkles,Trash2} from 'lucide-react';
import {AppSelect} from './form-controls';
import {useConfirm} from './confirmation-provider';
import {categoryCatalog} from '@/lib/category-settings';
import {addCategoryRule,matchCategoryRule,maxCategoryRules,moveCategoryRule,removeCategoryRule,setRuleEnabled} from '@/lib/category-rules';
import type {CategoryRule} from '@/lib/category-rules';
import type {FinanceData} from '@/lib/finance';

const spaces={'all':'Ambos','personal':'Pessoal','work':'Trabalho'} as const;

export function CategoryRuleManager({data,onChange}:{data:FinanceData;onChange:(data:FinanceData)=>boolean}){
 const confirm=useConfirm();
 const [phrase,setPhrase]=useState('');
 const [type,setType]=useState<CategoryRule['type']>('expense');
 const [space,setSpace]=useState<CategoryRule['space']>('all');
 const [category,setCategory]=useState('Outros');
 const [sample,setSample]=useState('');
 const [error,setError]=useState('');
 const [notice,setNotice]=useState('');
 const rules=data.categoryRules??[];
 const catalog=categoryCatalog(data);
 const selectedCategory=catalog.includes(category)?category:'Outros';

 function persist(next:FinanceData,success:string){
  if(!onChange(next))throw Error('Não foi possível salvar a alteração. Revise a sincronização e tente novamente.');
  setError('');setNotice(success);
 }
 function create(event:FormEvent<HTMLFormElement>){
  event.preventDefault();
  try{
   const rule:CategoryRule={
    id:crypto.randomUUID(),phrase:phrase.trim(),type,space,
    category:selectedCategory,enabled:true,
   };
   persist(addCategoryRule(data,rule),'Regra criada. Será usada nas próximas importações.');
   setPhrase('');
  }catch(cause){setNotice('');setError(cause instanceof Error?cause.message:'Não foi possível cadastrar a regra.');}
 }
 function toggle(id:string,enabled:boolean){
  try{persist(setRuleEnabled(data,id,enabled),enabled?'Regra ativada.':'Regra pausada.');}
  catch(cause){setError(cause instanceof Error?cause.message:'Não foi possível alterar a regra.');}
 }
 function move(id:string,direction:-1|1){
  try{persist(moveCategoryRule(data,id,direction),'Prioridade atualizada.');}
  catch(cause){setError(cause instanceof Error?cause.message:'Não foi possível reordenar.');}
 }
 async function remove(rule:CategoryRule){
  if(!await confirm(`Remover a regra “${rule.phrase} → ${rule.category}”? Ela deixará de classificar importações futuras. Lançamentos já importados não serão alterados.`,{
   title:'Remover regra?',action:'Remover regra',destructive:true,
  }))return;
  try{persist(removeCategoryRule(data,rule.id),'Regra removida. Lançamentos anteriores permanecem como estavam.');}
  catch(cause){setError(cause instanceof Error?cause.message:'Não foi possível remover a regra.');}
 }
 const previewPersonal=sample.trim()?matchCategoryRule(data,{description:sample,type,space:'personal'}):null;
 const previewWork=sample.trim()?matchCategoryRule(data,{description:sample,type,space:'work'}):null;
 const describe=(rule:CategoryRule|null)=>rule?`${rule.phrase} → ${rule.category}`:'Nenhuma regra correspondente';
 return <section className="category-rule-manager" aria-labelledby="category-rules-title">
  <div className="category-rule-heading">
   <span className="category-rule-symbol"><Sparkles size={18} aria-hidden="true"/></span>
   <div><h3 id="category-rules-title">Regras de categorização</h3>
    <p>Classifique automaticamente novas importações quando a descrição contiver um termo definido por você.</p></div>
  </div>
  <div className="category-rule-note"><ShieldCheck size={17} aria-hidden="true"/>
   <p>As regras funcionam neste dispositivo e sincronizam com sua conta. Não usam IA, não enviam descrições a terceiros e <strong>não alteram lançamentos existentes</strong>.</p>
  </div>
  <form className="rule-create" onSubmit={create}>
   <h4>Criar regra</h4>
   <label>Quando a descrição contiver
    <input type="text" maxLength={60} minLength={3} required placeholder="Ex.: Netflix" value={phrase} onChange={e=>setPhrase(e.target.value)}/>
   </label>
   <div className="rule-create-grid">
    <label>Tipo
     <AppSelect value={type} onChange={e=>setType(e.target.value as CategoryRule['type'])}><option value="expense">Despesa</option><option value="income">Receita</option></AppSelect>
    </label>
    <label>Espaço
     <AppSelect value={space} onChange={e=>setSpace(e.target.value as CategoryRule['space'])}><option value="all">Pessoal e trabalho</option><option value="personal">Pessoal</option><option value="work">Trabalho</option></AppSelect>
    </label>
    <label>Categoria
     <AppSelect value={selectedCategory} onChange={e=>setCategory(e.target.value)}>
      {catalog.map(item=><option key={item} value={item}>{item}</option>)}
     </AppSelect>
    </label>
   </div>
   <button type="submit" className="primary" disabled={rules.length>=maxCategoryRules}><Plus size={16}/> Criar regra</button>
   <small>{rules.length} de {maxCategoryRules} regras · A primeira regra correspondente tem prioridade.</small>
  </form>
  {error&&<p className="category-feedback error" role="alert">{error}</p>}
  {notice&&<p className="category-feedback success" role="status"><CheckCircle2 size={16}/>{notice}</p>}
  <div className="category-rule-list-heading"><h4>Regras cadastradas</h4><span>{rules.filter(r=>r.enabled).length} ativas</span></div>
  {rules.length===0?<div className="category-rule-empty"><Sparkles size={21}/><p>Nenhuma regra criada. Comece por um termo frequente, como o nome de um estabelecimento.</p></div>:
   <ol className="category-rule-list">
    {rules.map((rule,index)=><li className={`category-rule-row ${!rule.enabled?'is-disabled':''}`} key={rule.id}>
     <span className="category-rule-priority" aria-label={`Prioridade ${index+1}`}>{String(index+1).padStart(2,'0')}</span>
     <div className="category-rule-description"><strong>Contém “{rule.phrase}”</strong><small>{rule.type==='expense'?'Despesa':'Receita'} · {spaces[rule.space]} · <span>{rule.category}</span></small></div>
     <div className="category-rule-actions">
      <button type="button" className="icon-button" disabled={index===0} onClick={()=>move(rule.id,-1)} aria-label={`Aumentar prioridade de ${rule.phrase}`} title="Subir"><ArrowUp size={16}/></button>
      <button type="button" className="icon-button" disabled={index===rules.length-1} onClick={()=>move(rule.id,1)} aria-label={`Diminuir prioridade de ${rule.phrase}`} title="Descer"><ArrowDown size={16}/></button>
      <button type="button" className="secondary rule-status" onClick={()=>toggle(rule.id,!rule.enabled)}>{rule.enabled?'Pausar':'Ativar'}</button>
      <button type="button" className="icon-button delete" onClick={()=>void remove(rule)} aria-label={`Excluir regra ${rule.phrase}`}><Trash2 size={16}/></button>
     </div>
    </li>)}
   </ol>}
  {rules.length>0&&<div className="category-rule-test">
   <label htmlFor="category-rule-example">Experimente uma descrição</label>
   <input id="category-rule-example" placeholder="Ex.: Netflix mensalidade" maxLength={100} value={sample} onChange={e=>setSample(e.target.value)}/>
   <p aria-live="polite">{sample.trim()
    ?`Pessoal: ${describe(previewPersonal)}. Trabalho: ${describe(previewWork)}.`
    :'Digite uma descrição para conferir as regras já salvas em cada espaço.'}</p>
  </div>}
  <p className="category-rule-footer">Ao importar um CSV, a categoria sugerida é apresentada para revisão. Ajustes manuais em registros anteriores nunca são substituídos automaticamente.</p>
 </section>;
}
