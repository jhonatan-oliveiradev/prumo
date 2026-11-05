'use client';
import {createContext,useCallback,useContext,useEffect,useRef,useState,type ReactNode} from 'react';
import * as AlertDialog from '@radix-ui/react-alert-dialog';
import {AlertTriangle,ShieldCheck} from 'lucide-react';
type Options={title?:string;action?:string;destructive?:boolean};
type Confirm=(description:string,options?:Options)=>Promise<boolean>;
const Context=createContext<Confirm|null>(null);
export function ConfirmationProvider({children}:{children:ReactNode}){
 const [request,setRequest]=useState<(Options&{description:string})|null>(null);
 const resolve=useRef<((value:boolean)=>void)|null>(null);
 const ask=useCallback<Confirm>((description,options={})=>{if(resolve.current)return Promise.resolve(false);return new Promise<boolean>(done=>{resolve.current=done;setRequest({description,...options});});},[]);
 function finish(value:boolean){const done=resolve.current;resolve.current=null;setRequest(null);done?.(value);}
 useEffect(()=>()=>{resolve.current?.(false);resolve.current=null;},[]);
 return <Context.Provider value={ask}>{children}<AlertDialog.Root open={Boolean(request)} onOpenChange={open=>{if(!open)finish(false);}}><AlertDialog.Portal><AlertDialog.Overlay className="overlay confirmation-overlay"/><AlertDialog.Content className="dialog confirmation-dialog"><span className={`confirmation-symbol ${request?.destructive?'danger':''}`}>{request?.destructive?<AlertTriangle size={24}/>:<ShieldCheck size={24}/>}</span><AlertDialog.Title>{request?.title??'Confirmar alteração'}</AlertDialog.Title><AlertDialog.Description>{request?.description}</AlertDialog.Description><div className="confirmation-actions"><AlertDialog.Cancel className="secondary" onClick={()=>finish(false)}>Cancelar</AlertDialog.Cancel><AlertDialog.Action className={request?.destructive?'danger-button':'primary'} onClick={()=>finish(true)}>{request?.action??'Confirmar'}</AlertDialog.Action></div></AlertDialog.Content></AlertDialog.Portal></AlertDialog.Root></Context.Provider>;
}
export function useConfirm(){const confirm=useContext(Context);if(!confirm)throw Error('ConfirmationProvider ausente.');return confirm;}
