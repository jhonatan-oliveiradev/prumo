'use client';
import {useConfirm} from '@/components/confirmation-provider';
import {useCallback,useEffect,useRef,useState} from 'react';
import {emptyData,isFinanceData,type FinanceData} from '@/lib/finance';
import {hydrateWorkspace,cloudStateForRevision,sameFinanceData} from '@/lib/cloud-state';
import type {WorkspaceSnapshot} from '@/lib/sync';
import {describeWorkspaceConflict,type ConflictPreview} from '@/lib/conflict-preview';
import {preservesReconciliationHistory} from '@/lib/balance-reconciliation';
export type CloudUser={id:string;name:string;email:string};
type Cache={data:FinanceData;revision:number;dirty:boolean};
export type SyncState='local'|'loading'|'connected'|'ready'|'saving'|'offline'|'conflict'|'error';
const GUEST_KEY='prumo:data:v1';
async function readRemote():Promise<WorkspaceSnapshot|null>{
 const response=await fetch('/api/v1/workspace',{cache:'no-store'});
 if(!response.ok)throw Error(response.status===401?'Sua sessão expirou. Entre novamente para sincronizar.':'Não foi possível acessar a nuvem. Sua cópia neste dispositivo foi mantida.');
 const {workspace}=await response.json() as {workspace:WorkspaceSnapshot|null};
 if(workspace!==null&&(!workspace||!Number.isSafeInteger(workspace.revision)||workspace.revision<=0||!isFinanceData(workspace.data)))throw Error('A versão da nuvem não pôde ser lida. Sua cópia neste dispositivo foi mantida.');
 return workspace;
}
export function useFinanceStore(){
 const confirm=useConfirm();
 const [conflictPreview,setConflictPreview]=useState<ConflictPreview|null>(null);
 const [data,setData]=useState<FinanceData>(emptyData),[ready,setReady]=useState(false),[user,setUser]=useState<CloudUser|null>(null),[enabled,setEnabled]=useState(false),[state,setState]=useState<SyncState>('loading'),[message,setMessage]=useState(''),[localAvailable,setLocalAvailable]=useState(false),[storageError,setStorageError]=useState(false),[resolving,setResolving]=useState(false);
 const owner=useRef<CloudUser|null>(null),current=useRef<Cache>({data:emptyData,revision:0,dirty:false}),busy=useRef(false),resolvingRef=useRef(false),conflict=useRef(false),undo=useRef<FinanceData|null>(null);
 const cacheKey=()=>owner.current?`prumo:cloud:v1:${owner.current.id}`:GUEST_KEY;
 function describeConflict(local:FinanceData,remote:WorkspaceSnapshot|null){
  setConflictPreview(describeWorkspaceConflict(local,remote?.data??emptyData,remote?.revision??0));
 }
 function writeCache(cache:Cache){localStorage.setItem(cacheKey(),owner.current?JSON.stringify(cache):JSON.stringify(cache.data));}
 const flush=useCallback(async()=>{
  if(!owner.current||busy.current||resolvingRef.current||conflict.current||!current.current.dirty)return;
  if(!navigator.onLine){setState('offline');return;}
  busy.current=true;setState('saving');
  const outgoing=current.current;
  try{
   const response=await fetch('/api/v1/workspace',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({data:outgoing.data,revision:outgoing.revision})});
   if(response.status===409){
    const workspace=await readRemote();
    const latest=current.current;
    if(workspace&&(sameFinanceData(workspace.data,latest.data)||sameFinanceData(workspace.data,outgoing.data))){
     const cache={...latest,revision:workspace.revision,dirty:!sameFinanceData(workspace.data,latest.data)};
     writeCache(cache);current.current=cache;setState(cache.dirty?'saving':'ready');setMessage('');
    }else{
     describeConflict(latest.data,workspace);
     conflict.current=true;setState('conflict');setMessage('A nuvem tem uma versão diferente. Escolha qual cópia manter em Configurações.');
    }
    return;
   }
   if(!response.ok)throw Error(response.status===401?'Sua sessão expirou. Entre novamente para sincronizar.':'Não foi possível sincronizar. Sua cópia local está preservada.');
   const saved=await response.json() as {revision:number};
   if(!Number.isSafeInteger(saved.revision)||saved.revision!==outgoing.revision+1)throw Error('A nuvem não confirmou o envio. Sua cópia neste dispositivo foi mantida.');
   const changed=current.current.data!==outgoing.data;
   const cache={...current.current,revision:saved.revision,dirty:changed};
   writeCache(cache);current.current=cache;
   setState(changed?'saving':'ready');setMessage('');
  }catch(error){setState(navigator.onLine?'error':'offline');setMessage((error as Error).message);}
  finally{busy.current=false;}
 },[]);
 useEffect(()=>{
  let active=true,initialized=false;
  async function initialize(){
   let guest=emptyData;
   try{const raw=localStorage.getItem(GUEST_KEY);if(raw){const parsed=JSON.parse(raw);if(!isFinanceData(parsed))throw Error('Dados locais inválidos.');guest=parsed;}setLocalAvailable(guest.accounts.length>0||guest.transactions.length>0||guest.goals.length>0||guest.budgets.length>0||Boolean(guest.creditCards?.length));}
   catch{setStorageError(true);setMessage('Não foi possível ler os dados locais. Eles não foram substituídos.');}
   setData(guest);current.current={data:guest,revision:0,dirty:false};
   try{
    const response=await fetch('/api/v1/session',{cache:'no-store'});
    if(!response.ok)throw Error();
    const session=await response.json() as {enabled:boolean;user:CloudUser|null};
    if(!active)return;setEnabled(session.enabled);
    if(!session.user){setState('local');return;}
    owner.current=session.user;setUser(session.user);
    let cache:Cache|null=null;
    try{const raw=localStorage.getItem(cacheKey());if(raw){const parsed=JSON.parse(raw);if(isFinanceData(parsed.data)&&Number.isSafeInteger(parsed.revision)&&parsed.revision>=0&&typeof parsed.dirty==='boolean')cache=parsed;}}catch{}
    if(cache){current.current=cache;setData(cache.data);}else{current.current={data:{...emptyData,name:session.user.name},revision:0,dirty:false};setData(current.current.data);}
    const workspace=await readRemote();
    if(!active)return;
    if(cache?.dirty){
     if((workspace?.revision??0)!==cache.revision){
      if(workspace&&sameFinanceData(workspace.data,cache.data)){
       const synchronized={...cache,revision:workspace.revision,dirty:false};
       writeCache(synchronized);current.current=synchronized;setState('ready');
      }else{
       describeConflict(cache.data,workspace);
       conflict.current=true;setState('conflict');setMessage('A nuvem tem uma versão diferente. Escolha qual cópia manter em Configurações.');
      }
     }
     else {setState('ready');void flush();}
    }else{
     const synchronized=hydrateWorkspace(workspace,session.user.name);
     writeCache(synchronized);current.current=synchronized;setData(synchronized.data);setStorageError(false);setState(cloudStateForRevision(synchronized.revision));
    }
   }catch{if(active){setState(owner.current?(navigator.onLine?'error':'offline'):'local');setMessage('Não foi possível carregar a nuvem. As alterações locais continuam disponíveis.');}}
   finally{if(active){initialized=true;setReady(true);}}
  }
  void initialize();
  const retry=()=>{if(initialized)void flush();};
  const onFocus=()=>{if(initialized&&!conflict.current)void refresh();};
  window.addEventListener('online',retry);
  window.addEventListener('focus',onFocus);
  const interval=setInterval(retry,4000);
  return()=>{active=false;window.removeEventListener('online',retry);window.removeEventListener('focus',onFocus);clearInterval(interval);};
 },[flush]);
 function change(next:FinanceData,recover=false){
  if(!isFinanceData(next)){setMessage('A alteração contém dados inválidos e não foi salva.');return false;}
  if(!preservesReconciliationHistory(current.current.data,next)){
   setMessage('O histórico de conciliações é permanente. Ele não pode ser removido ou modificado por uma restauração ou sincronização.');
   return false;
  }
  if(storageError&&!recover){setMessage('Restaure um backup válido antes de alterar os dados locais.');return false;}
  try{const cache={data:next,revision:current.current.revision,dirty:Boolean(owner.current)};writeCache(cache);undo.current=(next.reconciliations?.length??0)>(current.current.data.reconciliations?.length??0)?null:current.current.data;current.current=cache;setData(next);if(recover)setStorageError(false);if(owner.current){if(!conflict.current)setState(navigator.onLine?'saving':'offline');void flush();}setMessage('Alterações salvas neste dispositivo.');return true;}
  catch{setMessage('Não foi possível salvar neste dispositivo. A alteração não foi aplicada.');return false;}
 }
 function undoChange(){if(!undo.current)return;const previous=undo.current;if(change(previous))undo.current=null;}
 async function refresh(){
  if(!owner.current||busy.current||resolvingRef.current||conflict.current)return;
  if(current.current.dirty){await flush();return;}
  try{busy.current=true;setState('loading');const workspace=await readRemote();
   // A local edit may have happened while the request was in flight.
   if(current.current.dirty)return;
   const cache=hydrateWorkspace(workspace,owner.current.name);
   writeCache(cache);current.current=cache;setData(cache.data);setState(cloudStateForRevision(cache.revision));
  }catch(error){setState(navigator.onLine?'error':'offline');setMessage((error as Error).message);}
  finally{busy.current=false;}
 }
 async function resolveConflict(source:'cloud'|'device'){
  const account=owner.current;
  if(!account||busy.current||resolvingRef.current||!conflict.current)return;
  resolvingRef.current=true;setResolving(true);
  let upload=false;
  try{
   const workspace=await readRemote();
   const cloud=source==='cloud';
   const accepted=await confirm(
    cloud?'Os dados deste navegador serão substituídos pela versão da nuvem. Exporte um backup primeiro para guardar os registros locais.':'Os dados deste navegador serão enviados para a sua conta e substituirão a versão da nuvem. Confira se esta cópia tem os registros que você quer manter.',
    {title:cloud?'Usar a versão da nuvem?':'Enviar a cópia deste dispositivo?',action:cloud?'Usar versão da nuvem':'Substituir versão da nuvem',destructive:true},
   );
   if(!accepted||owner.current!==account)return;
   const cache=cloud?hydrateWorkspace(workspace,account.name):{data:current.current.data,revision:workspace?.revision??0,dirty:true};
   writeCache(cache);
   current.current=cache;undo.current=null;conflict.current=false;setConflictPreview(null);setStorageError(false);
   setData(cache.data);setState(cloud?cloudStateForRevision(cache.revision):'saving');
   setMessage(cloud?'Dados da nuvem carregados.':'Enviando a cópia deste dispositivo…');
   upload=!cloud;
  }catch(error){setMessage((error as Error).message);}
  finally{
   resolvingRef.current=false;setResolving(false);
   if(upload)void flush();
  }
 }
 async function importLocal(){
  if(!owner.current||!['ready','connected'].includes(state))return;
  if(!await confirm('Copiar os dados do modo local para sua conta? Isso substituirá o conteúdo atual da conta após sincronizar. O backup local original será mantido.',{title:'Importar dados locais?',action:'Importar para minha conta',destructive:true}))return;
  try{const d=JSON.parse(localStorage.getItem(GUEST_KEY)||'null');if(!isFinanceData(d))throw Error();change(d);}catch{setMessage('Os dados locais não puderam ser importados.');}
 }
 return {data,ready,user,enabled,state,storageError,conflictPreview,restore:(next:FinanceData)=>change(next,true),message,change,undoChange,canUndo:Boolean(undo.current),setMessage,refresh,resolveConflict,resolving,importLocal,localAvailable};
}
export type FinanceStore=ReturnType<typeof useFinanceStore>;
