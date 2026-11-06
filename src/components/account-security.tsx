'use client';

import {useCallback,useEffect,useState,type FormEvent} from 'react';
import {CheckCircle2,Eye,EyeOff,KeyRound,Laptop2,LoaderCircle,RefreshCw,ShieldCheck,ShieldX} from 'lucide-react';
import {authClient} from '@/lib/auth-client';
import {describeSessionDevice,humanSessionDate,securityFailure} from '@/lib/account-security';
import {useConfirm} from './confirmation-provider';

type SessionRow={
  token:string;
  device:string;
  createdAt:Date|string;
  expiresAt:Date|string;
  current:boolean;
};

type Notice={tone:'success'|'error';message:string};

export function AccountSecurity(){
 const confirm=useConfirm();
 const [sessions,setSessions]=useState<SessionRow[]>([]);
 const [sessionsBusy,setSessionsBusy]=useState(true);
 const [sessionAction,setSessionAction]=useState(false);
 const [sessionNotice,setSessionNotice]=useState<Notice|null>(null);
 const [passwordBusy,setPasswordBusy]=useState(false);
 const [passwordNotice,setPasswordNotice]=useState<Notice|null>(null);
 const [showCurrent,setShowCurrent]=useState(false);
 const [showNew,setShowNew]=useState(false);
 const [newPassword,setNewPassword]=useState('');
 const [confirmation,setConfirmation]=useState('');

 const loadSessions=useCallback(async()=>{
  setSessionsBusy(true);
  try{
   const [listed,active]=await Promise.all([authClient.listSessions(),authClient.getSession()]);
   if(listed.error)throw listed.error;
   if(active.error||!active.data?.session)throw {status:401,code:'UNAUTHORIZED'};
   const currentToken=active.data.session.token;
   const entries=(listed.data??[]).map(item=>({
    token:item.token,
    device:describeSessionDevice(item.userAgent),
    createdAt:item.createdAt,
    expiresAt:item.expiresAt,
    current:item.token===currentToken,
   }));
   entries.sort((a,b)=>Number(b.current)-Number(a.current)||new Date(b.createdAt).getTime()-new Date(a.createdAt).getTime());
   setSessions(entries);
   setSessionNotice(null);
  }catch(cause){
   const error=cause as {status?:number;code?:string};
   setSessionNotice({tone:'error',message:securityFailure(error,'sessions')});
  }finally{setSessionsBusy(false);}
 },[]);

 useEffect(()=>{void loadSessions();},[loadSessions]);

 async function changePassword(event:FormEvent<HTMLFormElement>){
  event.preventDefault();
  if(passwordBusy)return;
  const form=event.currentTarget;
  const input=new FormData(form);
  const currentPassword=String(input.get('currentPassword')??'');
  setPasswordNotice(null);
  if(newPassword.length<12||newPassword.length>128){
   setPasswordNotice({tone:'error',message:'A nova senha deve ter entre 12 e 128 caracteres.'});return;
  }
  if(newPassword!==confirmation){
   setPasswordNotice({tone:'error',message:'A confirmação deve ser igual à nova senha.'});return;
  }
  if(newPassword===currentPassword){
   setPasswordNotice({tone:'error',message:'Escolha uma senha diferente da atual.'});return;
  }
  setPasswordBusy(true);
  try{
   const result=await authClient.changePassword({
    currentPassword,newPassword,revokeOtherSessions:true,
   });
   if(result.error){
    setPasswordNotice({tone:'error',message:securityFailure(result.error,'password')});
    return;
   }
   // Clear plaintext form values promptly; never persist or log passwords.
   form.reset();
   setNewPassword('');
   setConfirmation('');
   setPasswordNotice({tone:'success',message:'Senha atualizada. Suas outras sessões foram encerradas.'});
   void loadSessions();
  }catch{
   setPasswordNotice({tone:'error',message:'Não foi possível conectar ao serviço de contas. Tente novamente.'});
  }finally{setPasswordBusy(false);}
 }

 async function revokeSession(session:SessionRow){
  if(session.current||sessionAction)return;
  if(!await confirm(`Encerrar a sessão em ${session.device}? Esse dispositivo precisará entrar novamente. Os dados locais não serão apagados por esta ação.`,{
   title:'Encerrar sessão?',action:'Encerrar sessão',destructive:true,
  }))return;
  setSessionAction(true);setSessionNotice(null);
  try{
   const result=await authClient.revokeSession({token:session.token});
   if(result.error)throw result.error;
   await loadSessions();
   setSessionNotice({tone:'success',message:'Sessão encerrada com sucesso.'});
  }catch(cause){
   setSessionNotice({tone:'error',message:securityFailure(cause as {status?:number;code?:string},'sessions')});
  }finally{setSessionAction(false);}
 }

 async function revokeOthers(){
  if(sessionAction||sessions.length<2)return;
  if(!await confirm('Todos os outros dispositivos precisarão entrar novamente. Movimentações ainda não sincronizadas neles poderão permanecer apenas no armazenamento local.',{
   title:'Encerrar outras sessões?',action:'Encerrar outras sessões',destructive:true,
  }))return;
  setSessionAction(true);setSessionNotice(null);
  try{
   const result=await authClient.revokeOtherSessions();
   if(result.error)throw result.error;
   await loadSessions();
   setSessionNotice({tone:'success',message:'As outras sessões foram encerradas.'});
  }catch(cause){
   setSessionNotice({tone:'error',message:securityFailure(cause as {status?:number;code?:string},'sessions')});
  }finally{setSessionAction(false);}
 }

 return <section className="account-security" aria-labelledby="account-security-heading">
  <div className="security-header">
   <span className="security-symbol"><ShieldCheck size={19} aria-hidden="true"/></span>
   <div><h3 id="account-security-heading">Segurança da conta</h3><p>Controle sua senha e os dispositivos com acesso à sua conta.</p></div>
  </div>

  <div className="security-section">
   <div className="security-section-heading"><KeyRound size={18} aria-hidden="true"/><h4>Alterar senha</h4></div>
   <p className="muted">Você precisará da senha atual. Por segurança, as demais sessões serão encerradas após a alteração.</p>
   <form onSubmit={changePassword} className="security-form" autoComplete="on">
    <label>Senha atual
     <span className="security-password-field"><input name="currentPassword" type={showCurrent?'text':'password'} autoComplete="current-password" required maxLength={128}/>
      <button type="button" aria-label={showCurrent?'Ocultar senha atual':'Mostrar senha atual'} aria-pressed={showCurrent} onClick={()=>setShowCurrent(x=>!x)}>{showCurrent?<EyeOff size={17}/>:<Eye size={17}/>}</button>
     </span>
    </label>
    <label>Nova senha
     <span className="security-password-field"><input type={showNew?'text':'password'} autoComplete="new-password" minLength={12} maxLength={128} required value={newPassword} onChange={e=>setNewPassword(e.target.value)}/>
      <button type="button" aria-label={showNew?'Ocultar nova senha':'Mostrar nova senha'} aria-pressed={showNew} onClick={()=>setShowNew(x=>!x)}>{showNew?<EyeOff size={17}/>:<Eye size={17}/>}</button>
     </span>
    </label>
    <label>Confirme a nova senha
     <input type={showNew?'text':'password'} autoComplete="new-password" minLength={12} maxLength={128} required value={confirmation} onChange={e=>setConfirmation(e.target.value)}/>
    </label>
    <p className="security-hint">Use uma senha exclusiva com pelo menos 12 caracteres.</p>
    {passwordNotice&&<p role={passwordNotice.tone==='error'?'alert':'status'} className={`security-notice ${passwordNotice.tone}`}>{passwordNotice.tone==='success'?<CheckCircle2 size={16}/>:<ShieldX size={16}/>}<span>{passwordNotice.message}</span></p>}
    <button type="submit" className="primary" disabled={passwordBusy}>{passwordBusy?<LoaderCircle size={16} className="security-spin"/>:<KeyRound size={16}/>} {passwordBusy?'Atualizando senha…':'Atualizar senha'}</button>
   </form>
  </div>

  <div className="security-section">
   <div className="security-devices-heading">
    <div className="security-section-heading"><Laptop2 size={18} aria-hidden="true"/><h4>Sessões ativas</h4></div>
    <button type="button" className="secondary" disabled={sessionsBusy||sessionAction} onClick={()=>void loadSessions()}><RefreshCw size={16}/> Atualizar</button>
   </div>
   <p className="muted">Confira onde sua conta está conectada. Encerrar uma sessão não apaga dados salvos naquele dispositivo.</p>
   {sessionNotice&&<p role={sessionNotice.tone==='error'?'alert':'status'} className={`security-notice ${sessionNotice.tone}`}>{sessionNotice.tone==='success'?<CheckCircle2 size={16}/>:<ShieldX size={16}/>}<span>{sessionNotice.message}</span></p>}
   {sessionsBusy?<p className="security-sessions-loading" role="status"><LoaderCircle size={16} className="security-spin"/> Verificando sessões…</p>:
    <div className="security-sessions">
     {sessions.map(session=><div className="security-session" key={session.token}>
      <span className="security-device-icon"><Laptop2 size={18}/></span>
      <div className="security-device-info"><strong>{session.device}</strong>
       <small>Conectado em {humanSessionDate(session.createdAt)}</small>
       {session.current&&<span className="security-current">Este dispositivo</span>}
      </div>
      {!session.current&&<button type="button" className="secondary" disabled={sessionAction} onClick={()=>void revokeSession(session)}>Encerrar</button>}
     </div>)}
     {sessions.length===0&&<p className="muted">Nenhuma sessão pôde ser listada.</p>}
    </div>}
   {sessions.length>1&&!sessionsBusy&&<button type="button" className="secondary security-revoke-all" disabled={sessionAction} onClick={()=>void revokeOthers()}><ShieldX size={16}/> Encerrar outras sessões</button>}
  </div>
 </section>;
}
