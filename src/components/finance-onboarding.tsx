'use client';

import {ArrowRight,CheckCircle2,FileUp,ReceiptText,Wallet,X} from 'lucide-react';
import type {FinanceData} from '@/lib/finance';

/** Progressive first-run guidance. Never writes fake transactions or demo balances. */
export function FinanceOnboarding({data,onAddAccount,onAddTransaction,onImport,onDismiss}:{
 data:FinanceData;
 onAddAccount:()=>void;
 onAddTransaction:()=>void;
 onImport:()=>void;
 onDismiss:()=>void;
}){
 const hasAccount=data.accounts.length>0;
 const hasTransaction=data.transactions.length>0 || Boolean(data.creditPurchases?.length);
 const completed=Number(hasAccount)+Number(hasTransaction);
 return <section className="finance-onboarding" aria-labelledby="onboarding-heading">
  <div className="onboarding-intro">
   <div>
    <span className="eyebrow">COMECE PELO ESSENCIAL</span>
    <h2 id="onboarding-heading">Seu primeiro panorama financeiro</h2>
    <p>Dois passos para transformar seus registros em informações úteis. Não é preciso configurar tudo agora.</p>
   </div>
   <button type="button" className="icon-button" aria-label="Dispensar primeiros passos" onClick={onDismiss}><X size={18}/></button>
  </div>
  <div className="onboarding-progress">
   <div role="progressbar" aria-label="Progresso dos primeiros passos" aria-valuemin={0} aria-valuemax={2} aria-valuenow={completed}>
    <span style={{width:`${completed/2*100}%`}}/>
   </div>
   <small>{completed} de 2 etapas concluídas</small>
  </div>
  <div className="onboarding-steps">
   <div className={`onboarding-step ${hasAccount?'done':'current'}`}>
    <span className="onboarding-step-symbol">{hasAccount?<CheckCircle2 size={20}/>:<Wallet size={20}/>}</span>
    <div><h3>Adicione sua primeira conta</h3><p>Informe quanto você tem hoje. Movimentos anteriores não precisam ser lançados novamente.</p></div>
    {hasAccount?<span className="onboarding-complete">Concluído</span>:
     <button className="primary" type="button" onClick={onAddAccount}>Adicionar conta <ArrowRight size={15}/></button>}
   </div>
   <div className={`onboarding-step ${hasTransaction?'done':hasAccount?'current':'future'}`}>
    <span className="onboarding-step-symbol">{hasTransaction?<CheckCircle2 size={20}/>:<ReceiptText size={20}/>}</span>
    <div><h3>Registre sua primeira movimentação</h3><p>Cadastre uma receita ou despesa, ou importe um extrato CSV quando preferir.</p></div>
    {hasTransaction?<span className="onboarding-complete">Concluído</span>:
     <div className="onboarding-step-actions">
      <button type="button" className="primary" disabled={!hasAccount} onClick={onAddTransaction}>Novo lançamento <ArrowRight size={15}/></button>
      {hasAccount&&<button type="button" className="secondary" onClick={onImport}><FileUp size={15}/>Importar CSV</button>}
     </div>}
   </div>
  </div>
 </section>;
}
