'use client';
import {useConfirm} from '@/components/confirmation-provider';
import {useCallback,useEffect,useRef,useState} from 'react';
import {emptyData,isFinanceData,type FinanceData} from '@/lib/finance';
import {hydrateWorkspace,cloudStateForRevision} from '@/lib/cloud-state';
import type {WorkspaceSnapshot} from '@/lib/sync';
export type CloudUser={id:string;name:string;email:string};
type Cache={data:FinanceData;revision:number;dirty:boolean};
export type SyncState='local'|'loading'|'connected'|'ready'|'saving'|'offline'|'conflict'|'error';
const GUEST_KEY='prumo:data:v1';
export function useFinanceStore(){
 const confirm=useConfirm();
 const [data,setData]=useState<FinanceData>(emptyData),[ready,setReady]=useState(false),[user,setUser]=useState<CloudUser|null>(null),[enabled,setEnabled]=useState(false),[state,setState]=useState<SyncState>('loading'),[message,setMessage]=useState(''),[localAvailable,setLocalAvailable]=useState(false),[storageError,setStorageError]=useState(false);
 const owner=useRef<CloudUser|null>(null),current=useRef<Cache>({data:emptyData,revision:0,dirty:false}),busy=useRef(false),mounted=useRef(true),conflict=useRef(false),undo=useRef<FinanceData|null>(null);
 const cacheKey=()=>owner.current?`prumo:cloud:v1:${owner.current.id}`:GUEST_KEY;
 function writeCache(cache:Cache){localStorage.setItem(cacheKey(),owner.current?JSON.stringify(cache):JSON.stringify(cache.data));}
 const flush=useCallback(async()=>{
  if(!owner.current||busy.current||conflict.current||!current.current.dirty)return;
  if(!navigator.onLine){setState('offline');return;}
  busy.current=true;setState('saving');
  const outgoing=current.current;
  try{
   const response=await fetch('/api/v1/workspace',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({data:outgoing.data,revision:outgoing.revision})});
   if(response.status===409){conflict.current=true;setState('conflict');setMessage('Há alterações em outro dispositivo. Sua cópia local foi preservada.');return;}
   if(!response.ok)throw Error(response.status===401?'Sua sessão expirou. Entre novamente para sincronizar.':'Não foi possível sincronizar. Sua cópia local está preservada.');
   const saved=await response.json() as {revision:number};
   const changed=current.current.data!==outgoing.data;
   current.current={...current.current,revision:saved.revision,dirty:changed};writeCache(current.current);
   setState(changed?'saving':'ready');setMessage('');
  }catch(error){setState(navigator.onLine?'error':'offline');setMessage((error as Error).message);}
  finally{busy.current=false;}
 },[]);
 useEffect(()=>{
  mounted.current=true;
  async function initialize(){
   let guest=emptyData;
   try{const raw=localStorage.getItem(GUEST_KEY);if(raw){const parsed=JSON.parse(raw);if(!isFinanceData(parsed))throw Error('Dados locais inválidos.');guest=parsed;}setLocalAvailable(guest.accounts.length>0||guest.transactions.length>0||guest.goals.length>0||guest.budgets.length>0||Boolean(guest.creditCards?.length));}
   catch{setStorageError(true);setMessage('Não foi possível ler os dados locais. Eles não foram substituídos.');}
   setData(guest);current.current={data:guest,revision:0,dirty:false};
   try{
    const response=await fetch('/api/v1/session',{cache:'no-store'});
    if(!response.ok)throw Error();
    const session=await response.json() as {enabled:boolean;user:CloudUser|null};
    if(!mounted.current)return;setEnabled(session.enabled);
    if(!session.user){setState('local');return;}
    owner.current=session.user;setUser(session.user);
    let cache:Cache|null=null;
    try{const raw=localStorage.getItem(cacheKey());if(raw){const parsed=JSON.parse(raw);if(isFinanceData(parsed.data)&&Number.isSafeInteger(parsed.revision)&&parsed.revision>=0&&typeof parsed.dirty==='boolean')cache=parsed;}}catch{}
    if(cache){current.current=cache;setData(cache.data);}else{current.current={data:{...emptyData,name:session.user.name},revision:0,dirty:false};setData(current.current.data);}
    const remoteResponse=await fetch('/api/v1/workspace',{cache:'no-store'});
    if(!remoteResponse.ok)throw Error();
    const {workspace}=await remoteResponse.json() as {workspace:WorkspaceSnapshot|null};
    if(!mounted.current)return;
    if(cache?.dirty){
     if((workspace?.revision??0)!==cache.revision){conflict.current=true;setState('conflict');setMessage('Há alterações em outro dispositivo. Sua cópia local foi preservada.');}
     else {setState('ready');void flush();}
    }else{
     current.current=hydrateWorkspace(workspace,session.user.name);setData(current.current.data);writeCache(current.current);setStorageError(false);setState(cloudStateForRevision(current.current.revision));
    }
   }catch{setState(owner.current?(navigator.onLine?'error':'offline'):'local');setMessage('Não foi possível carregar a nuvem. As alterações locais continuam disponíveis.');}
   finally{if(mounted.current)setReady(true);}
  }
  void initialize();
  const retry=()=>void flush();
  const onFocus=()=>{if(!conflict.current)void refresh();};
  window.addEventListener('online',retry);
  window.addEventListener('focus',onFocus);
  const interval=setInterval(retry,4000);
  return()=>{mounted.current=false;window.removeEventListener('online',retry);window.removeEventListener('focus',onFocus);clearInterval(interval);};
 },[flush]);
 function change(next:FinanceData,recover=false){
  if(storageError&&!recover){setMessage('Restaure um backup válido antes de alterar os dados locais.');return false;}
  try{const cache={data:next,revision:current.current.revision,dirty:Boolean(owner.current)};writeCache(cache);undo.current=current.current.data;current.current=cache;setData(next);if(recover)setStorageError(false);if(owner.current){if(!conflict.current)setState(navigator.onLine?'saving':'offline');void flush();}setMessage('Alterações salvas neste dispositivo.');return true;}
  catch{setMessage('Não foi possível salvar neste dispositivo. A alteração não foi aplicada.');return false;}
 }
 function undoChange(){if(!undo.current)return;const previous=undo.current;if(change(previous))undo.current=null;}
 async function refresh(){
  if(!owner.current||busy.current)return;
  if(current.current.dirty){await flush();return;}
  try{setState('loading');const response=await fetch('/api/v1/workspace',{cache:'no-store'});if(!response.ok)throw Error();const {workspace}=await response.json() as {workspace:WorkspaceSnapshot|null};
   // A local edit may have happened while the request was in flight.
   if(current.current.dirty)return;
   current.current=hydrateWorkspace(workspace,owner.current.name);writeCache(current.current);setData(current.current.data);setState(cloudStateForRevision(current.current.revision));
  }catch{setState(navigator.onLine?'error':'offline');setMessage('Não foi possível atualizar a nuvem. Sua cópia local foi mantida.');}
 }
 async function useRemote(){
  if(!owner.current||busy.current)return;
  try{const response=await fetch('/api/v1/workspace',{cache:'no-store'});if(!response.ok)throw Error();const {workspace}=await response.json() as {workspace:WorkspaceSnapshot|null};
   if(!await confirm('Usar os dados da nuvem? Exporte um backup primeiro se quiser preservar as alterações locais não sincronizadas.',{title:'Usar a versão da nuvem?',action:'Usar versão da nuvem',destructive:true}))return;
   const cache=hydrateWorkspace(workspace,owner.current.name);writeCache(cache);current.current=cache;undo.current=null;conflict.current=false;setData(cache.data);setState(cloudStateForRevision(cache.revision));setMessage('Dados da nuvem carregados.');
  }catch{setMessage('Não foi possível carregar a nuvem. Nenhum dado foi substituído.');}
 }
 async function importLocal(){
  if(!owner.current||!['ready','connected'].includes(state))return;
  if(!await confirm('Copiar os dados do modo local para sua conta? Isso substituirá o conteúdo atual da conta após sincronizar. O backup local original será mantido.',{title:'Importar dados locais?',action:'Importar para minha conta',destructive:true}))return;
  try{const d=JSON.parse(localStorage.getItem(GUEST_KEY)||'null');if(!isFinanceData(d))throw Error();change(d);}catch{setMessage('Os dados locais não puderam ser importados.');}
 }
 return {data,ready,user,enabled,state,storageError,restore:(next:FinanceData)=>change(next,true),message,change,undoChange,canUndo:Boolean(undo.current),setMessage,refresh,useRemote,importLocal,localAvailable};
}
export type FinanceStore=ReturnType<typeof useFinanceStore>;
