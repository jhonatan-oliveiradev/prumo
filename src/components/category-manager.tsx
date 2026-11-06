'use client';

import {useState,type FormEvent} from 'react';
import {Check,FolderPlus,Pencil,Trash2,X} from 'lucide-react';
import {useConfirm} from './confirmation-provider';
import {addCategory,categoryCatalog,categoryUsage,defaultCategories,removeCategory,renameCategory,maxCustomCategories} from '@/lib/category-settings';
import type {FinanceData} from '@/lib/finance';

/** One workspace catalog shared by transactions, credit cards, budgets and recurring rules. */
export function CategoryManager({data,onChange}:{data:FinanceData;onChange:(data:FinanceData)=>boolean}){
 const confirm=useConfirm();
 const [name,setName]=useState('');
 const [editing,setEditing]=useState<string|null>(null);
 const [draft,setDraft]=useState('');
 const [error,setError]=useState('');
 const [notice,setNotice]=useState('');
 const custom=data.customCategories??[];
 const all=categoryCatalog(data);

 function save(next:FinanceData,success:string){
  if(!onChange(next))throw Error('Não foi possível salvar as categorias neste dispositivo. Nenhuma alteração foi confirmada.');
  setError('');setNotice(success);
 }
 function add(event:FormEvent<HTMLFormElement>){
  event.preventDefault();
  try{save(addCategory(data,name),'Categoria criada. Ela já pode ser usada em lançamentos, cartões e orçamentos.');setName('');}
  catch(cause){setNotice('');setError(cause instanceof Error?cause.message:'Não foi possível criar a categoria.');}
 }
 function rename(oldName:string){
  try{save(renameCategory(data,oldName,draft),'Categoria renomeada. Todas as referências existentes foram atualizadas.');setEditing(null);}
  catch(cause){setNotice('');setError(cause instanceof Error?cause.message:'Não foi possível renomear.');}
 }
 async function remove(name:string){
  const usage=categoryUsage(data,name);
  if(Object.values(usage).some(count=>count>0)){
   setNotice('');setError('Esta categoria tem lançamentos, compras, orçamentos ou recorrências. Renomeie-a ou mova os registros antes de remover.');return;
  }
  if(!await confirm(`Remover a categoria “${name}”? Ela não possui registros associados.`,{
   title:'Remover categoria?',action:'Remover categoria',destructive:true,
  }))return;
  try{save(removeCategory(data,name),'Categoria removida com segurança.');}
  catch(cause){setNotice('');setError(cause instanceof Error?cause.message:'Não foi possível remover a categoria.');}
 }

 return <section className="category-manager" aria-labelledby="category-manager-title">
  <div className="category-manager-heading">
   <span className="category-manager-symbol"><FolderPlus size={19} aria-hidden="true"/></span>
   <div><h3 id="category-manager-title">Categorias financeiras</h3><p>Personalize a organização do seu dinheiro, sem perder os registros existentes.</p></div>
  </div>
  <div className="category-manager-inner">
   <h4>Criar categoria</h4>
   <form onSubmit={add} className="category-add-form">
    <label htmlFor="new-category">Nome</label>
    <div><input id="new-category" required maxLength={40} minLength={2} placeholder="Ex.: Educação" value={name} onChange={e=>setName(e.target.value)}/>
     <button className="primary" type="submit" disabled={custom.length>=maxCustomCategories}><FolderPlus size={16}/> Adicionar</button>
    </div>
    <small>{custom.length} de {maxCustomCategories} categorias personalizadas</small>
   </form>
   {error&&<p className="category-feedback error" role="alert">{error}</p>}
   {notice&&<p className="category-feedback success" role="status">{notice}</p>}
   <div className="category-list-heading"><h4>Suas categorias</h4><span>{all.length} disponíveis</span></div>
   <div className="category-list" role="list">
    {defaultCategories.map(category=><div key={category} className="category-item" role="listitem">
     <span className="category-name">{category}</span><span className="category-fixed">Padrão</span>
    </div>)}
    {custom.map(category=>{
     const use=categoryUsage(data,category);
     const referenced=Object.values(use).reduce((sum,n)=>sum+n,0);
     return <div key={category} className="category-item custom" role="listitem">
      {editing===category?<form className="category-edit" onSubmit={e=>{e.preventDefault();rename(category);}}>
       <input required autoFocus maxLength={40} minLength={2} aria-label={`Novo nome de ${category}`} value={draft} onChange={e=>setDraft(e.target.value)}/>
       <button className="icon-button" type="submit" aria-label="Salvar nome"><Check size={17}/></button>
       <button className="icon-button" type="button" aria-label="Cancelar edição" onClick={()=>setEditing(null)}><X size={17}/></button>
      </form>:<>
       <div className="category-name"><strong>{category}</strong><small>{referenced} {referenced===1?'referência':'referências'}</small></div>
       <div className="category-item-actions">
        <button className="icon-button" type="button" aria-label={`Renomear ${category}`} onClick={()=>{setEditing(category);setDraft(category);setError('');setNotice('');}}><Pencil size={16}/></button>
        <button className="icon-button delete" type="button" aria-label={`Remover ${category}`} onClick={()=>void remove(category)} disabled={referenced>0} title={referenced?'Renomeie ou mova os registros associados antes de remover':'Remover categoria'}><Trash2 size={16}/></button>
       </div>
      </>}
     </div>;
    })}
   </div>
   <p className="category-manager-help">As categorias padrão ficam disponíveis permanentemente. Ao renomear uma categoria personalizada, os históricos, cartões, orçamentos e recorrências também são atualizados.</p>
  </div>
 </section>;
}
