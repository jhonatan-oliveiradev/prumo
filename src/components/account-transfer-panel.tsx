'use client';
import {useState,type FormEvent} from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import {ArrowLeftRight,ArrowRight,CheckCircle2,Plus,Trash2,X} from 'lucide-react';
import {AppSelect,DateField} from './form-controls';
import {useConfirm} from './confirmation-provider';
import {accountBalance,createAccountTransfer,removeAccountTransfer,type AccountTransfer} from '@/lib/account-transfers';
import {isFinanceData,money,toCents,type FinanceData} from '@/lib/finance';

export function AccountTransferPanel({data,format,onChange,today}:{
 data:FinanceData;
 format:(amount:number)=>string;
 onChange:(next:FinanceData)=>boolean;
 today:string;
}){
 const confirm=useConfirm();
 const [open,setOpen]=useState(false);
 const [error,setError]=useState('');
 const [source,setSource]=useState(data.accounts[0]?.id??'');
 const [destination,setDestination]=useState(data.accounts[1]?.id??'');
 const [amount,setAmount]=useState('');
 const [busy,setBusy]=useState(false);
 const accounts=new Map(data.accounts.map(a=>[a.id,a]));
 const entries=[...(data.transfers??[])].sort((a,b)=>b.date.localeCompare(a.date)||a.id.localeCompare(b.id));
 const from=accounts.get(source);
 const to=accounts.get(destination);
 const available=from?accountBalance(data,from.id):0;
 let value:number|null=null;
 try{value=amount?toCents(amount):null;}catch{}
 const after=value===null?null:available-value;

 function begin(){
  setError('');setAmount('');
  setSource(data.accounts[0]?.id??'');
  setDestination(data.accounts[1]?.id??'');
  setOpen(true);
 }
 function submit(event:FormEvent<HTMLFormElement>){
  event.preventDefault();
  if(busy)return;
  const f=new FormData(event.currentTarget);
  setBusy(true);
  setError('');
  try{
   const row:AccountTransfer={
    id:crypto.randomUUID(),
    sourceAccountId:String(f.get('sourceAccountId')??''),
    targetAccountId:String(f.get('targetAccountId')??''),
    amount:toCents(String(f.get('amount')??'')),
    date:String(f.get('date')??''),
    note:String(f.get('note')??'').trim()||undefined,
   };
   if(row.date>today)throw Error('Registre transferências realizadas até a data de hoje. Transferências futuras ainda não são agendadas.');
   const next=createAccountTransfer(data,row);
   if(!isFinanceData(next))throw Error('Não foi possível validar a transferência.');
   if(!onChange(next))throw Error('Não foi possível salvar no dispositivo. Nenhum movimento foi confirmado.');
   setOpen(false);
   setAmount('');
  }catch(cause){setError(cause instanceof Error?cause.message:'Não foi possível registrar a transferência.');}
  finally{setBusy(false);}
 }
 async function remove(row:AccountTransfer){
  const from=accounts.get(row.sourceAccountId)?.name??'Conta de origem';
  const to=accounts.get(row.targetAccountId)?.name??'Conta de destino';
  if(!await confirm(`Excluir a transferência de ${money(row.amount)} de “${from}” para “${to}”? Os dois saldos serão recalculados. Você poderá desfazer.`,{
   title:'Excluir transferência?',action:'Excluir transferência',destructive:true,
  }))return;
  const next=removeAccountTransfer(data,row.id);
  if(!onChange(next))setError('Não foi possível excluir a transferência. Seus dados foram mantidos.');
 }
 return <section className="card account-transfer-panel" aria-labelledby="transfer-heading">
  <div className="section-title">
   <div><h2 id="transfer-heading">Transferências entre contas</h2><p className="muted">Mova valores entre suas contas sem criar receitas ou despesas artificiais.</p></div>
   <button type="button" className="secondary" disabled={data.accounts.length<2} onClick={begin}><Plus size={16}/> Nova transferência</button>
  </div>
  {error&&!open&&<p className="error" role="alert">{error}</p>}
  {entries.length?<div className="account-transfer-history">{entries.slice(0,30).map(row=><article className="transfer-history-row" key={row.id}>
   <span className="transfer-history-icon"><ArrowLeftRight size={18}/></span>
   <div className="transfer-history-details"><strong>{accounts.get(row.sourceAccountId)?.name??'Conta'} <ArrowRight size={13} aria-hidden="true"/> {accounts.get(row.targetAccountId)?.name??'Conta'}</strong>
    <small>{row.date.split('-').reverse().join('/')}{row.note?' · '+row.note:''}</small></div>
   <b>{format(row.amount)}</b>
   <button className="icon-button delete" aria-label="Excluir transferência" onClick={()=>void remove(row)}><Trash2 size={16}/></button>
  </article>)}
   {entries.length>30&&<p className="muted">Exibindo as 30 transferências mais recentes de {entries.length}.</p>}
  </div>:<div className="transfer-empty">
   <ArrowLeftRight size={23}/><h3>Suas transferências aparecerão aqui</h3>
   <p>Registre movimentações entre contas para manter os saldos consistentes. O total do patrimônio permanece igual.</p>
   {data.accounts.length<2&&<p>Cadastre pelo menos duas contas para começar.</p>}
  </div>}

  <Dialog.Root open={open} onOpenChange={setOpen}><Dialog.Portal>
   <Dialog.Overlay className="overlay"/>
   <Dialog.Content className="dialog transfer-dialog" aria-describedby="transfer-description">
    <Dialog.Title>Transferir entre contas</Dialog.Title>
    <Dialog.Description id="transfer-description" className="muted">A transferência afeta os saldos das duas contas, mas não entra nos relatórios de receitas ou despesas.</Dialog.Description>
    <Dialog.Close className="close icon-button" aria-label="Fechar"><X size={20}/></Dialog.Close>
    <form onSubmit={submit} className="transfer-form">
     <label>Conta de origem
      <AppSelect name="sourceAccountId" value={source} onChange={e=>setSource(e.target.value)} required>
       {data.accounts.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}
      </AppSelect>
     </label>
     <label>Conta de destino
      <AppSelect name="targetAccountId" value={destination} onChange={e=>setDestination(e.target.value)} required>
       {data.accounts.filter(a=>a.id!==source).map(a=><option key={a.id} value={a.id}>{a.name}</option>)}
      </AppSelect>
     </label>
     <div className="transfer-form-grid">
      <label>Valor (R$)<input name="amount" required inputMode="decimal" placeholder="0,00" value={amount} onChange={e=>setAmount(e.target.value)} autoComplete="off"/></label>
      <label>Data<DateField name="date" required defaultValue={today}/></label>
     </div>
     <label>Observação (opcional)<input name="note" maxLength={160} placeholder="Ex.: reserva mensal"/></label>
     {from&&to&&from.id!==to.id&&<div className="transfer-balance-preview" aria-live="polite">
      <span>Saldo atual em {from.name}: <strong>{format(available)}</strong></span>
      {after!==null&&<span>Após a transferência: <strong>{format(after)}</strong></span>}
      {after!==null&&after<0&&<small role="note">O saldo de origem ficará negativo. Confira os valores antes de continuar.</small>}
     </div>}
     {error&&<p className="error" role="alert">{error}</p>}
     <button type="submit" className="primary submit" disabled={busy||!source||!destination||source===destination}>
      <CheckCircle2 size={16}/>{busy?'Salvando…':'Registrar transferência'}
     </button>
    </form>
   </Dialog.Content>
  </Dialog.Portal></Dialog.Root>
 </section>;
}
