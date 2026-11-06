'use client';
import {useRef,useState,type FormEvent} from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import {ArrowRight,CheckCircle2,ClipboardCheck,History,Plus,X} from 'lucide-react';
import {AppSelect,DateField} from './form-controls';
import {useConfirm} from './confirmation-provider';
import {accountBalance} from '@/lib/account-transfers';
import {parseAccountBalance,reconcileAccount} from '@/lib/balance-reconciliation';
import {isFinanceData,money,type FinanceData} from '@/lib/finance';

export function AccountReconciliationPanel({data,format,onChange,today}:{
 data:FinanceData;
 format:(cents:number)=>string;
 onChange:(next:FinanceData)=>boolean;
 today:string;
}){
 const confirm=useConfirm();
 const latest=useRef(data);latest.current=data;
 const [open,setOpen]=useState(false);
 const [accountId,setAccountId]=useState(data.accounts[0]?.id??'');
 const [observed,setObserved]=useState('');
 const [error,setError]=useState('');
 const [busy,setBusy]=useState(false);
 const accounts=new Map(data.accounts.map(item=>[item.id,item]));
 const current=accountId?accountBalance(data,accountId):0;
 let computed:number|null=null;
 try{computed=observed?parseAccountBalance(observed):null;}catch{}
 const difference=computed===null?null:computed-current;
 const history=[...(data.reconciliations??[])].sort((a,b)=>b.date.localeCompare(a.date)||b.id.localeCompare(a.id));

 function start(id?:string){
  setAccountId(id??data.accounts[0]?.id??'');
  setObserved('');
  setError('');
  setOpen(true);
 }

 async function submit(event:FormEvent<HTMLFormElement>){
  event.preventDefault();
  if(busy)return;
  const values=new FormData(event.currentTarget);
  const chosen=String(values.get('accountId')??'');
  const note=String(values.get('note')??'').trim();
  const date=String(values.get('date')??'');
  setBusy(true);
  setError('');
  try{
   if(date>today)throw Error('A conciliação deve refletir um saldo já observado, não uma data futura.');
   const balanceAfter=parseAccountBalance(String(values.get('balanceAfter')??''));
   const snapshot=latest.current;
   const before=accountBalance(snapshot,chosen);
   if(balanceAfter===before)throw Error('O saldo informado já corresponde ao saldo registrado. Não há diferença para ajustar.');
   const next=reconcileAccount(snapshot,{
    id:crypto.randomUUID(),accountId:chosen,date,balanceAfter,note,
   });
   if(!isFinanceData(next))throw Error('Os dados do ajuste são inválidos.');
   const account=snapshot.accounts.find(item=>item.id===chosen);
   if(!account)throw Error('A conta selecionada não está mais disponível.');
   const accepted=await confirm(`Confirmar a conciliação de “${account.name}”? O saldo registrado passará de ${money(before)} para ${money(balanceAfter)}. A diferença de ${money(balanceAfter-before)} ficará registrada no histórico, sem criar receitas ou despesas.`,{
    title:'Confirmar conciliação?',action:'Registrar ajuste',
   });
   if(!accepted)return;
   // Do not overwrite newer data that arrived while the confirmation was open.
   if(latest.current!==snapshot)throw Error('Os dados mudaram enquanto você confirmava. Revise o saldo atualizado e tente novamente.');
   if(!onChange(next))throw Error('Não foi possível salvar o ajuste neste dispositivo. Nenhum valor foi alterado.');
   setOpen(false);
  }catch(cause){setError(cause instanceof Error?cause.message:'Não foi possível conferir o saldo.');}
  finally{setBusy(false);}
 }

 return <section className="card account-reconciliation-panel" aria-labelledby="account-reconciliation-title">
  <div className="section-title">
   <div><h2 id="account-reconciliation-title">Conciliação de saldos</h2>
    <p className="muted">Compare o saldo exibido pelo Prumo com seu extrato e registre diferenças com justificativa, sem modificar receitas e despesas.</p>
   </div>
   <button type="button" className="secondary" disabled={!data.accounts.length} onClick={()=>start()}><Plus size={16}/> Conferir saldo</button>
  </div>
  <p className="reconciliation-guidance">Antes de conciliar, registre as movimentações que ainda faltam e confira transferências. Use um ajuste apenas para diferenças que permanecerem.</p>
  {history.length>0?<div className="reconciliation-history">
   <h3><History size={17} aria-hidden="true"/> Histórico de ajustes</h3>
   {history.slice(0,20).map(item=><article className="reconciliation-row" key={item.id}>
    <span className="reconciliation-row-icon"><ClipboardCheck size={17}/></span>
    <div className="reconciliation-row-body">
     <strong>{accounts.get(item.accountId)?.name??'Conta'} · {item.date.split('-').reverse().join('/')}</strong>
     <small>{item.note}</small>
     <small>{format(item.balanceBefore)} <ArrowRight size={12} aria-hidden="true"/> {format(item.balanceAfter)}</small>
    </div>
    <b className={item.delta<0?'negative':'positive'}>{item.delta>0?'+':''}{format(item.delta)}</b>
   </article>)}
   {history.length>20&&<p className="muted">Exibindo os 20 ajustes mais recentes.</p>}
  </div>:<div className="reconciliation-empty"><ClipboardCheck size={24}/><h3>Todos os ajustes ficam documentados</h3><p>Quando houver uma diferença, você poderá registrar o saldo real e consultar a justificativa posteriormente.</p></div>}

  <Dialog.Root open={open} onOpenChange={setOpen}><Dialog.Portal>
   <Dialog.Overlay className="overlay"/>
   <Dialog.Content className="dialog reconciliation-dialog" aria-describedby="reconciliation-description">
    <Dialog.Title>Conferir saldo da conta</Dialog.Title>
    <Dialog.Description id="reconciliation-description" className="muted">Informe o saldo observado no banco ou extrato após conferir seus lançamentos.</Dialog.Description>
    <Dialog.Close className="close icon-button" aria-label="Fechar"><X size={20}/></Dialog.Close>
    <form onSubmit={e=>void submit(e)}>
     <label>Conta
      <AppSelect name="accountId" value={accountId} onChange={e=>setAccountId(e.target.value)} required>
       {data.accounts.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}
      </AppSelect>
     </label>
     <div className="reconciliation-current"><span>Saldo registrado no Prumo</span><strong>{format(current)}</strong></div>
     <label>Saldo observado (R$)
      <input name="balanceAfter" required inputMode="decimal" placeholder="Ex.: 2.150,00 ou -50,00" value={observed} onChange={e=>setObserved(e.target.value)} autoComplete="off"/>
     </label>
     <label>Data da conferência<DateField name="date" required defaultValue={today}/></label>
     <label>Motivo da diferença
      <input name="note" required minLength={3} maxLength={160} placeholder="Ex.: saldo conferido com o extrato do banco"/>
     </label>
     {difference!==null&&difference!==0&&<div className="reconciliation-preview" aria-live="polite">
      <span>Diferença a ajustar</span>
      <strong>{difference>0?'+':''}{format(difference)}</strong>
      <small>O ajuste altera apenas o saldo desta conta; não conta como receita ou despesa.</small>
     </div>}
     {error&&<p className="error" role="alert">{error}</p>}
     <button type="submit" disabled={busy||!accountId} className="primary submit"><CheckCircle2 size={16}/>{busy?'Confirmando…':'Revisar e registrar ajuste'}</button>
    </form>
   </Dialog.Content>
  </Dialog.Portal></Dialog.Root>
 </section>;
}
