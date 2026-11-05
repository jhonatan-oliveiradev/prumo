'use client';
import {useEffect,useRef,useState} from 'react';
import Markdown from 'react-markdown';
import {Sparkles,ShieldCheck,ArrowUpRight,CheckCircle2,AlertTriangle,Info,OctagonAlert,Square,RotateCcw} from 'lucide-react';
import {advisorTasks,buildAdvisorContext,type AdvisorTask} from '@/lib/advisor';
import {advisorSignals,type AdvisorDestination} from '@/lib/advisor-signals';
import type {FinanceData} from '@/lib/finance';
const icons={positive:CheckCircle2,warning:AlertTriangle,negative:OctagonAlert,info:Info};
export function FinancialAdvisor({data,month,today,space,synchronized,onNavigate}:{data:FinanceData;month:string;today:string;space:string;synchronized:boolean;onNavigate:(page:AdvisorDestination)=>void}){
 const [configured,setConfigured]=useState<boolean|null>(null),[checked,setChecked]=useState(false),[task,setTask]=useState<AdvisorTask>('priorities'),[busy,setBusy]=useState(false),[answer,setAnswer]=useState(''),[shown,setShown]=useState(0),[error,setError]=useState(''),[remaining,setRemaining]=useState<number|null>(null),[expanded,setExpanded]=useState(true);
 const request=useRef<AbortController|null>(null);
 const context=buildAdvisorContext(data,month,today),signature=JSON.stringify(context);
 useEffect(()=>{const controller=new AbortController();fetch('/api/v1/advisor',{cache:'no-store',signal:controller.signal}).then(r=>r.json()).then(d=>setConfigured(Boolean(d.configured))).catch(()=>{if(!controller.signal.aborted)setConfigured(false);});return()=>controller.abort();},[]);
 useEffect(()=>{request.current?.abort();setBusy(false);setAnswer('');setShown(0);setError('');setChecked(false);return()=>request.current?.abort();},[signature,space,synchronized]);
 useEffect(()=>{
  if(!answer)return;
  if(window.matchMedia('(prefers-reduced-motion: reduce)').matches){setShown(answer.length);return;}
  const timer=window.setInterval(()=>setShown(n=>{const next=Math.min(answer.length,n+32);if(next===answer.length)window.clearInterval(timer);return next;}),24);
  return()=>window.clearInterval(timer);
 },[answer]);
 const revealing=shown<answer.length;
 function stop(){request.current?.abort();setBusy(false);if(answer)setShown(answer.length);}
 async function ask(){
  const controller=new AbortController();request.current=controller;setBusy(true);setError('');setAnswer('');setShown(0);setExpanded(false);
  try{const response=await fetch('/api/v1/advisor',{method:'POST',signal:controller.signal,headers:{'Content-Type':'application/json'},body:JSON.stringify({task,month,space,contextSignature:signature,consent:checked})});const result=await response.json();if(!response.ok)throw Error(result.error||'Não foi possível analisar.');if(controller.signal.aborted)return;setAnswer(result.text+(result.incomplete?'\n\nA resposta atingiu o limite de tamanho.':''));setRemaining(result.remaining);}
  catch(e){if(!controller.signal.aborted){setError((e as Error).message);setExpanded(true);}}
  finally{if(request.current===controller){setBusy(false);setChecked(false);}}
 }
 const state=busy?'thinking':revealing?'speaking':'idle';
 return <section className="advisor-workspace" aria-label="Conselheiro financeiro">
  <div className="advisor-main card">
   <div className="advisor-intro"><div className={`advisor-orb ${state}`} aria-hidden="true"><span/><span/><Sparkles size={30}/></div><p className="eyebrow">CONSELHEIRO</p><h2>Análise do mês</h2><p className="muted">Revise gastos, vencimentos e metas do período selecionado.</p><span className="advisor-state" role="status">{busy?'Analisando os indicadores…':revealing?'Exibindo a análise…':''}</span></div>
   <div className="advisor-conversation" aria-busy={busy}>
    {!answer&&!busy&&!error&&<div className="advisor-welcome"><h3>Escolha um assunto para analisar</h3><p>O Conselheiro usa os indicadores do mês e do filtro selecionado.</p></div>}
    {busy&&<div className="advisor-thinking" aria-hidden="true"><span/><span/><span/><p>Consultando o Gemini…</p></div>}
    {error&&<div className="semantic-notice tone-negative" role="alert"><OctagonAlert size={20}/><div><strong>Não foi possível concluir a análise</strong><p>{error}</p><small>Confira o aviso e autorize uma nova tentativa abaixo.</small></div></div>}
    {answer&&<article className="advisor-answer"><div className="section-title"><h3>Sua orientação</h3><ShieldCheck size={18} aria-label="Análise somente leitura"/></div><div className="advisor-prose"><Markdown skipHtml disallowedElements={['img','a']} unwrapDisallowed>{answer.slice(0,shown)}</Markdown></div><span className="sr-only" role="status">{!revealing?'Análise concluída. A orientação está disponível para leitura.':''}</span>{!revealing&&<p className="advisor-disclaimer">A IA pode errar. Confira seus registros antes de decidir. Nenhum dado foi alterado.</p>}</article>}
   </div>
   <div className={`advisor-composer ${expanded?'':'compact'}`}>
    <button className="advisor-expand secondary" aria-expanded={expanded} aria-controls="advisor-options" onClick={()=>setExpanded(v=>!v)}>{expanded?'Recolher opções':'Escolher outra orientação'}</button>
    <div id="advisor-options" hidden={!expanded}>
    <fieldset disabled={busy||revealing}><legend>O que você quer entender?</legend><div className="advisor-topics">{Object.entries(advisorTasks).map(([value,label])=><button type="button" aria-pressed={task===value} className={task===value?'selected':''} key={value} onClick={()=>setTask(value as AdvisorTask)}>{label}</button>)}</div></fieldset>
    <details><summary><ShieldCheck size={16}/> Sua privacidade nesta análise</summary><p>Serão enviados ao Google apenas indicadores gerais de {month}: pressão dos gastos, sinal do saldo, existência de pendências, metas, parcelas, recorrências e risco de déficit.</p><p>Nomes, e-mail, descrições, extratos, contas e valores exatos não são enviados. No plano gratuito, o Google pode usar entradas e respostas para melhorar seus produtos.</p><a href="https://ai.google.dev/gemini-api/terms" target="_blank" rel="noreferrer">Consultar termos do Gemini</a></details>
    <label className="forecast-toggle"><input type="checkbox" checked={checked} onChange={e=>setChecked(e.target.checked)} disabled={busy||revealing}/><span>Autorizo enviar esses indicadores ao Google para esta análise.</span></label>
    {configured===false&&<p className="semantic-notice tone-warning"><Info size={18}/> O Conselheiro está indisponível. Tente novamente mais tarde.</p>}
    {!synchronized&&<p className="semantic-notice tone-warning"><Info size={18}/> Entre na conta e aguarde a sincronização para analisar seus dados.</p>}
    </div>
    <div className="advisor-submit">{busy||revealing?<button className="secondary" onClick={stop}><Square size={15}/>{busy?'Cancelar solicitação':'Exibir resposta completa'}</button>:<button className="primary" disabled={!configured||!synchronized||!checked||remaining===0} onClick={()=>void ask()}>{answer?<RotateCcw size={16}/>:<Sparkles size={16}/>} {answer?'Analisar novamente':'Pedir orientação'}</button>}<small>{remaining===null?'Até 10 análises por dia':`${remaining} análises restantes hoje`} · Sujeito à cota do Gemini</small></div>
   </div>
  </div>
  <aside className="advisor-context" aria-label="Indicadores do período"><div><p className="eyebrow">PERÍODO SELECIONADO</p><h2>Indicadores do mês</h2><p className="muted">Calculados a partir dos seus registros no Prumo.</p></div>{advisorSignals(context).map(signal=>{const Icon=icons[signal.tone];return <article className={`card advisor-signal tone-${signal.tone}`} key={signal.title}><Icon size={20}/><h3>{signal.title}</h3><p>{signal.detail}</p><button className="text-button" onClick={()=>onNavigate(signal.destination)}>{signal.action}<ArrowUpRight size={16}/></button></article>})}<p className="advisor-local-note"><ShieldCheck size={16}/> As análises não alteram seus registros.</p></aside>
 </section>;
}
