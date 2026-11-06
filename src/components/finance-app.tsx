'use client';
import {useConfirm} from './confirmation-provider';
import {CsvImportDialog} from './csv-import-dialog';
import {AppLoading} from './app-loading';
import {FinanceOnboarding} from './finance-onboarding';
import {AppSelect,DateField,MonthField} from './form-controls';
import {useEffect,useState,useRef,useMemo} from 'react';
import {usePathname,useRouter} from 'next/navigation';
import {sectionFromPath,sectionPath} from '@/lib/app-navigation';
import * as Dialog from '@radix-ui/react-dialog';
import {LayoutDashboard,ArrowLeftRight,ChartNoAxesCombined,Target,Settings,Wallet,Plus,Eye,EyeOff,Sun,Moon,Download,Trash2,X,ArrowUpRight,ArrowDownLeft,Search,ChevronRight,Menu,ShieldCheck,CalendarDays,Check,Repeat2,Sparkles,CreditCard as CardIcon} from 'lucide-react';
import {createInstallments,removePendingInstallments} from '@/lib/planning';
import {CreditCardFace,CreditDueList,CreditWallet} from './credit-wallet';
import {creditInvoices,expenseBreakdown,type CreditInvoiceRef} from '@/lib/credit';
import {GoalCard,GoalCoverPicker} from './goal-card';
import {isGoalCover,maxFeaturedGoals} from '@/lib/goal-covers';
import {CashForecast} from './cash-forecast';
import {generateRecurrences,recurrenceHorizon} from '@/lib/recurrences';
import {RecurringRules} from './recurring-rules';
import {FinancialAdvisor} from './financial-advisor';
import {profileInitials} from '@/lib/cloud-state';
import {useFinanceStore} from '@/hooks/use-finance-store';
import {AccountControls} from './account-controls';
import {CashFlow, MetricStrip, categoryIcons} from './finance-visuals';
import {categories,filterFinanceSpace,isFinanceData,money,summary,availableToday,toCents,commitments,settleTransaction,type FinanceData,type Goal,type Transaction} from '@/lib/finance';
const navigation=[['Visão geral',LayoutDashboard],['Transações',ArrowLeftRight],['Compromissos',CalendarDays],['Recorrências',Repeat2],['Conselheiro',Sparkles],['Contas',Wallet],['Cartões',CardIcon],['Orçamentos',ChartNoAxesCombined],['Metas',Target],['Relatórios',ChartNoAxesCombined],['Configurações',Settings]] as const;
const navigationGroups=[
 {label:'DIA A DIA',items:['Visão geral','Transações','Compromissos','Contas','Cartões']},
 {label:'PLANEJAMENTO',items:['Recorrências','Orçamentos','Metas']},
 {label:'ANÁLISE',items:['Relatórios','Conselheiro']},
 {label:'SUA CONTA',items:['Configurações']},
] as const;
const today=()=>new Date().toLocaleDateString('en-CA',{timeZone:'America/Sao_Paulo'});
type FormKind='transaction'|'account'|'budget'|'goal';
export function FinanceApp(){
 const pathname=usePathname();
 const router=useRouter();
 const page=sectionFromPath(pathname)??'Visão geral';
 function setPage(next:string){const destination=sectionPath(next);if(destination!==pathname)router.push(destination,{scroll:false});}
 const store=useFinanceStore();
 const [onboardingDismissed,setOnboardingDismissed]=useState(false);
 const onboardingKey=`prumo:onboarding-dismissed:${store.user?.id??'local'}`;
 useEffect(()=>{
  if(!store.ready)return;
  try{setOnboardingDismissed(localStorage.getItem(onboardingKey)==='true');}
  catch{setOnboardingDismissed(false);}
 },[store.ready,onboardingKey]);
 function dismissOnboarding(){
  setOnboardingDismissed(true);
  try{localStorage.setItem(onboardingKey,'true');}catch{}
 }
 const [selectedInvoice,setSelectedInvoice]=useState<CreditInvoiceRef|null>(null);
 const [editingGoal,setEditingGoal]=useState<Goal|null>(null);
 const confirm=useConfirm();
 const [importKind,setImportKind]=useState<'bank'|'card'|null>(null);
 const importOpener=useRef<HTMLElement|null>(null);
 function openImport(kind:'bank'|'card'){
  importOpener.current=document.activeElement instanceof HTMLElement?document.activeElement:null;
  setImportKind(kind);
 }
 const {data,ready,message:notice,setMessage:setNotice,storageError}=store;
 const displayName=data.name.trim()||store.user?.name.trim()||'';
 const generatedDay=useRef('');
 useEffect(()=>{if(!ready||!['local','ready','connected'].includes(store.state)||generatedDay.current===today())return;generatedDay.current=today();try{const next=generateRecurrences(data,recurrenceHorizon(today()));if(next!==data)store.change(next);}catch(e){store.setMessage((e as Error).message);}},[ready,data,store.state]);
 const [dark,setDark]=useState(false),[menuOpen,setMenuOpen]=useState(false),[hidden,setHidden]=useState(false),[month,setMonth]=useState(today().slice(0,7)),[query,setQuery]=useState(''),[filter,setFilter]=useState('all'),[statusFilter,setStatusFilter]=useState('all'),[space,setSpace]=useState('all'),[form,setForm]=useState<FormKind|null>(null),[editing,setEditing]=useState<Transaction|null>(null),[transactionType,setTransactionType]=useState<'income'|'expense'>('expense'),[error,setError]=useState('');
 useEffect(()=>{try{setDark(localStorage.getItem('prumo:theme')?localStorage.getItem('prumo:theme')==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches)}catch{}if('serviceWorker'in navigator)navigator.serviceWorker.register('/sw.js').catch(()=>{});},[]);
 useEffect(()=>{document.documentElement.dataset.theme=dark?'dark':'light';},[dark]);
 function change(next:FinanceData){return store.change(next);}
 const visible=useMemo(()=>filterFinanceSpace(data,space),[data,space]);
 const invoices=useMemo(()=>creditInvoices(visible),[visible]);
 const openInvoices=invoices.filter(invoice=>!invoice.payment);
 const dueInvoices=openInvoices.filter(invoice=>invoice.dueOn.startsWith(month)||invoice.dueOn<today());
 const featuredCard=openInvoices[0]?.card??visible.creditCards?.[0];
 const featuredInvoice=openInvoices[0];
 function openInvoice(ref:CreditInvoiceRef){setSelectedInvoice({cardId:ref.cardId,cycle:ref.cycle});setPage('Cartões');}
 function openWallet(){setSelectedInvoice(null);setPage('Cartões');}
 // Distinguish today's total balances from activity in the selected month.
 const totals=summary(visible,month);
 const currentTotals=summary(data,today().slice(0,7));
 const spendable=availableToday(data,today());
 const format=(n:number)=>hidden?'••••••':money(n);
 const normalizedSearch=query.trim().toLocaleLowerCase('pt-BR');
 const transactions=visible.transactions.filter(t=>
  t.date.startsWith(month)
  &&(!normalizedSearch||[t.description,t.category,data.accounts.find(a=>a.id===t.accountId)?.name??''].some(value=>value.toLocaleLowerCase('pt-BR').includes(normalizedSearch)))
  &&(filter==='all'||t.type===filter)
  &&(statusFilter==='all'||t.status===statusFilter)
 ).sort((a,b)=>b.date.localeCompare(a.date));
 function open(kind:FormKind,t:Transaction|null=null){if(t?.creditInvoice){openInvoice(t.creditInvoice);return;}setEditingGoal(null);setTransactionType(t?.type??'expense');setEditing(t);setError('');setForm(kind);}
 function editGoal(goal:Goal){open('goal');setEditingGoal(goal);}
 async function deleteGoal(goal:Goal){
  if(await confirm(`A meta “${goal.name}” será excluída. O saldo das contas permanece o mesmo e o valor reservado volta a ficar disponível.`,{title:'Excluir meta?',action:'Excluir meta',destructive:true})){
   change({...data,goals:data.goals.filter(item=>item.id!==goal.id)});
  }
 }
 function submit(event:React.FormEvent<HTMLFormElement>){
  event.preventDefault();
  const f=new FormData(event.currentTarget);
  const value=(name:string)=>String(f.get(name)||'').trim();
  try{
   let next:FinanceData;
   if(form==='transaction'){
    if(!data.accounts.length)throw Error('Adicione uma conta antes de registrar um lançamento.');
    const t:Transaction={
     ...(editing??{}),
     id:editing?.id||crypto.randomUUID(),
     description:value('description'),
     amount:toCents(value('amount')),
     type:editing?.installment?'expense':value('type') as Transaction['type'],
     category:value('category'),
     date:value('date'),
     accountId:value('accountId'),
     status:value('status') as Transaction['status'],
     space:value('space') as Transaction['space'],
    };
    if(!t.description||!t.date)throw Error('Preencha a descrição e a data.');
    next={...data,transactions:editing
     ?data.transactions.map(x=>x.id===t.id?t:x)
     :[...data.transactions,...createInstallments(t,Number(value('installments')||1),crypto.randomUUID(),()=>crypto.randomUUID())]};
   }else if(form==='account'){
    const name=value('name');
    if(!name)throw Error('Informe o nome da conta.');
    const amount=value('amount');
    const openingBalance=/^0+(?:[.,]0{1,2})?$/.test(amount)?0:toCents(amount);
    next={...data,accounts:[...data.accounts,{id:crypto.randomUUID(),name,openingBalance}]};
   }else if(form==='budget'){
    const category=value('category');
    next={...data,budgets:[...data.budgets.filter(b=>b.category!==category),{id:crypto.randomUUID(),category,limit:toCents(value('amount'))}]};
   }else if(form==='goal'){
    const name=value('name'),cover=value('cover'),featured=f.has('featured'),saved=value('saved');
    if(!name)throw Error('Informe o nome da meta.');
    if(!isGoalCover(cover))throw Error('Escolha uma capa para a meta.');
    if(featured&&data.goals.filter(g=>g.featured&&g.id!==editingGoal?.id).length>=maxFeaturedGoals)throw Error('Retire uma meta dos destaques antes de adicionar outra.');
    const goal:Goal={id:editingGoal?.id??crypto.randomUUID(),name,target:toCents(value('amount')),saved:!saved||/^0+(?:[.,]0{1,2})?$/.test(saved)?0:toCents(saved),cover,featured};
    next={...data,goals:editingGoal?data.goals.map(g=>g.id===goal.id?goal:g):[...data.goals,goal]};
   }else{return;}
   if(!isFinanceData(next))throw Error('Os dados informados não são válidos. Revise os campos e tente novamente.');
   // Never close the dialog when the device failed to persist the change.
   if(!change(next))throw Error('Não foi possível salvar neste dispositivo. Verifique o armazenamento e tente novamente.');
   setError('');
   setForm(null);
  }catch(cause){setError(cause instanceof Error?cause.message:'Não foi possível salvar. Revise os campos.');}
 }
 function exportData(){const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download=`prumo-${today()}.json`;a.click();URL.revokeObjectURL(url);}
 const featuredGoals=data.goals.filter(goal=>goal.featured).slice(0,maxFeaturedGoals);
 const pending=commitments(visible,month,today());
 const pendingExpenses=pending.filter(t=>t.type==='expense').reduce((sum,t)=>sum+t.amount,0)+dueInvoices.reduce((sum,invoice)=>sum+invoice.amount,0);
 const pendingIncome=pending.filter(t=>t.type==='income').reduce((sum,t)=>sum+t.amount,0);
 const overdue=pending.filter(t=>t.date<today()).length+dueInvoices.filter(i=>i.dueOn<today()).length;
 function settle(t:Transaction){change(settleTransaction(data,t.id));}
 async function removeTransaction(t:Transaction){
  if(!await confirm(`Excluir “${t.description}” no valor de ${money(t.amount)}? O lançamento será removido do saldo e dos relatórios. Você poderá desfazer.`,
   {title:'Excluir lançamento?',action:'Excluir lançamento',destructive:true}))return;
  change({...data,transactions:data.transactions.filter(x=>x.id!==t.id)});
 }
 async function removeBudget(category:string){
  if(!await confirm(`Excluir o limite mensal de ${category}? Seus lançamentos não serão apagados. Você poderá desfazer.`,
   {title:'Excluir orçamento?',action:'Excluir orçamento',destructive:true}))return;
  change({...data,budgets:data.budgets.filter(x=>x.category!==category)});
 }
 function pendingRows(list:Transaction[]){return list.length?<div className="commitment-list">{list.map(t=><article className="commitment-row" key={t.id}><span className={`category-icon ${t.date<today()?'overdue-icon':''}`}><CalendarDays size={18}/></span><button className="commitment-description" onClick={()=>open('transaction',t)}><strong>{t.description}{t.recurrence&&<span className="installment-badge">Recorrente</span>}{t.installment&&<span className="installment-badge">{t.installment.number}/{t.installment.count}</span>}</strong><small>{t.date.split('-').reverse().join('/')} · {data.accounts.find(a=>a.id===t.accountId)?.name} · {t.date<today()?'Vencido':t.date===today()?'Hoje':'Agendado'}</small></button><b className={t.type==='income'?'positive':''}>{t.type==='income'?'+':'−'} {format(t.amount)}</b><button className="secondary settle" onClick={()=>settle(t)} aria-label={`${t.type==='income'?'Marcar como recebido':'Marcar como pago'}: ${t.description}`}><Check size={15}/><span>{t.type==='income'?'Recebido':'Pago'}</span></button></article>)}</div>:<div className="empty"><CalendarDays size={27}/><h3>Nenhum compromisso pendente</h3><p>Lançamentos pendentes do período aparecem aqui.</p><button className="secondary" onClick={()=>open(data.accounts.length?'transaction':'account')}>{data.accounts.length?'Adicionar lançamento':'Adicionar conta'}</button></div>}

 function rows(list:Transaction[],filtered=false){if(!list.length&&filtered)return <div className="empty"><Search size={24}/><h3>Nenhum lançamento encontrado</h3><p>Altere a busca ou limpe os filtros deste mês.</p><button className="secondary" onClick={()=>{setQuery('');setFilter('all');setStatusFilter('all');}}>Limpar filtros</button></div>;return list.length?list.map(t=><div className="transaction" key={t.id}><button className="transaction-main" onClick={()=>open('transaction',t)}><span className={`category-icon ${t.type==='income'?'positive':''}`}>{t.type==='income'?<ArrowUpRight size={19}/>:<ArrowDownLeft size={19}/>}</span><span><strong>{t.description}{t.recurrence&&<span className="installment-badge">Recorrente</span>}{t.installment&&<span className="installment-badge">{t.installment.number}/{t.installment.count}</span>}</strong><small>{t.date.split('-').reverse().slice(0,2).join('/')} · {t.category}{t.status==='pending'?' · Pendente':''}</small></span><b className={t.type==='income'?'positive':''}>{t.type==='income'?'+':'−'} {format(t.amount)}</b></button>{!t.creditInvoice&&<button className="icon-button delete" aria-label={`Excluir ${t.description}`} onClick={()=>void removeTransaction(t)}><Trash2 size={15}/></button>}</div>):<div className="empty"><ArrowLeftRight size={28}/><h3>Nenhum lançamento neste mês</h3><p>Adicione uma receita ou despesa para este período.</p><button className="secondary" onClick={()=>open(data.accounts.length?'transaction':'account')}>{data.accounts.length?'Adicionar lançamento':'Adicionar primeira conta'}</button></div>}
 // Budgets cover the full workspace. A partial filter must not lower their spend.
 const budgetExpenses=page==='Orçamentos'?expenseBreakdown(data,month,false):new Map<string,number>();
 const paidExpenses=page==='Relatórios'?expenseBreakdown(visible,month,true):new Map<string,number>();
 const budgetRows=data.budgets.map(b=>({...b,spent:budgetExpenses.get(b.category)??0}));
 const budgetTotal=budgetRows.reduce((sum,b)=>sum+b.limit,0),budgetSpent=budgetRows.reduce((sum,b)=>sum+b.spent,0);
 const goalTotal=data.goals.reduce((sum,g)=>sum+g.target,0);
 function budgets(){return budgetRows.map(b=>{const Icon=categoryIcons[b.category]||Wallet;const ratio=Math.round(b.spent/b.limit*100);return <article className={`budget-row ${ratio>100?'over-budget':ratio>=90?'near-budget':''}`} key={b.id}><span className="category-icon"><Icon size={19}/></span><div className="budget-name"><h3>{b.category}</h3><small>{b.spent>b.limit?'Acima do limite em '+format(b.spent-b.limit):format(b.limit-b.spent)+' restantes'}</small></div><span className="budget-percentage">{hidden?'••':ratio+'%'}</span><progress aria-label={`Orçamento de ${b.category}`} value={Math.min(b.spent,b.limit)} max={b.limit}/><span className="budget-money">{format(b.spent)} <small>/ {format(b.limit)}</small></span><button className="icon-button delete" aria-label={`Excluir orçamento ${b.category}`} onClick={()=>void removeBudget(b.category)}><Trash2 size={16}/></button></article>})}
 if(!ready)return <AppLoading/>;
 return <div className="app"><aside className="sidebar"><a className="brand" href="/app" aria-label="Prumo início"><img src="/logo.svg" width="55" height="55" alt=""/><span>prumo.</span></a><label className="space-label" htmlFor="space">FILTRAR LANÇAMENTOS</label><AppSelect id="space" value={space} onChange={e=>setSpace(e.target.value)}><option value="all">Pessoal e trabalho</option><option value="personal">Pessoal</option><option value="work">Trabalho</option></AppSelect><nav aria-label="Seções do Prumo">{navigationGroups.map(group=><div className="sidebar-nav-group" key={group.label}>
 <p className="sidebar-nav-caption">{group.label}</p>
 {group.items.map(label=>{const Icon=navigation.find(([name])=>name===label)?.[1]??Wallet;return <button
  key={label} className={page===label?'active':''} onClick={()=>label==='Cartões'?openWallet():setPage(label)}
  aria-current={page===label?'page':undefined}><Icon size={19}/><span>{label}</span></button>})}
 </div>)}</nav><button className="theme" onClick={()=>{setDark(!dark);try{localStorage.setItem('prumo:theme',!dark?'dark':'light')}catch{}}}>{dark?<Sun size={18}/>:<Moon size={18}/>} Tema {dark?'claro':'escuro'}</button><AccountControls store={store}/></aside>
 <main><header><div><p className="eyebrow">{new Date().toLocaleDateString('pt-BR',{weekday:'long',day:'numeric',month:'long',timeZone:'America/Sao_Paulo'})}</p><h1>{page==='Visão geral'?`Olá${displayName?', '+displayName:''}`:page}</h1>{page==='Visão geral'&&<p className="muted">Saldo atual e movimentações do período selecionado.</p>}</div><div className="header-actions"><span className="avatar">{profileInitials(displayName)}</span>{!['Configurações','Recorrências','Conselheiro','Cartões'].includes(page)&&<button className="primary" onClick={()=>open(page==='Orçamentos'?'budget':page==='Metas'?'goal':page==='Contas'?'account':data.accounts.length?'transaction':'account')}><Plus size={17}/>{page==='Orçamentos'?'Criar orçamento':page==='Metas'?'Nova meta':page==='Contas'||!data.accounts.length?'Adicionar conta':'Adicionar lançamento'}</button>}</div></header>
 <div className="toolbar"><div className="month-control"><span>Mês</span><MonthField value={month} onChange={setMonth}/></div><button className={`local-status sync-status sync-${store.state}`} onClick={()=>setPage('Configurações')} aria-label="Abrir configurações de sincronização"><ShieldCheck size={14}/>{{local:'Dados neste dispositivo',loading:'Conectando…',connected:'Conta conectada · sem dados na nuvem',ready:'Sincronizado',saving:'Salvando na nuvem…',offline:'Offline · salvo no dispositivo',conflict:'Conflito · revisar versões',error:'Sincronização pendente'}[store.state]}</button></div>
 {store.user&&store.localAvailable&&store.state==='connected'&&<section className="migration-banner" aria-labelledby="migration-title"><span className="category-icon"><Download size={20}/></span><div><h3 id="migration-title">Seus dados anteriores estão neste navegador</h3><p>Você entrou na sua conta. Agora importe os dados do modo local para acessá-los também em outros dispositivos.</p></div><button className="primary" onClick={store.importLocal}>Importar meus dados</button></section>}
 {store.user&&!store.localAvailable&&store.state==='connected'&&<section className="migration-banner"><span className="category-icon"><Wallet size={20}/></span><div><h3>Bem-vindo, {displayName||'vamos começar'}</h3><p>Sua conta está conectada. Adicione a primeira conta financeira ou restaure um backup em Configurações.</p></div><button className="secondary" onClick={()=>open('account')}>Adicionar conta</button></section>}
 {storageError&&<p role="alert" className="alert">Os dados deste navegador não puderam ser lidos. Se você tiver um backup, restaure-o em Configurações.</p>}
 {page==='Visão geral'&&<>
 {!onboardingDismissed&&(!data.accounts.length||(!data.transactions.length&&!data.creditPurchases?.length))&&<FinanceOnboarding
  data={data}
  onAddAccount={()=>open('account')}
  onAddTransaction={()=>open('transaction')}
  onImport={()=>openImport('bank')}
  onDismiss={dismissOnboarding}
 />}
 <div className="hero-grid"><section className="hero"><div className="section-title"><span className="eyebrow">Saldo atual em contas</span><button className="privacy" aria-label={hidden?'Mostrar valores':'Ocultar valores'} onClick={()=>setHidden(!hidden)}>{hidden?<EyeOff size={19}/>:<Eye size={19}/>}</button></div><strong>{format(currentTotals.balance)}</strong><p>Saldo de hoje, independente do mês selecionado.</p></section><section className="card goal"><p className="eyebrow">RESERVADO PARA METAS</p><h3>{format(currentTotals.reserved)}</h3><p className="muted">Valor do saldo separado para seus objetivos.</p><button className="text-button" onClick={()=>data.goals.length?setPage('Metas'):open('goal')}>{data.goals.length?'Ver metas':'Criar meta'} <ChevronRight size={16}/></button></section></div><div className="metrics">{[['Receitas do mês',totals.income,'Valores recebidos'],['Despesas do mês',totals.expense,'Valores pagos'],['Livre após compromissos',spendable.available,'Saldo atual menos vencidos, pendências deste mês e reservas']].map(([title,value,caption])=><section className="card metric" key={title}><p className="muted">{title}</p><strong>{format(Number(value))}</strong><small>{caption}</small></section>)}</div><div className="details-grid"><CashFlow data={visible} month={month} format={format}/><section className="card recent"><div className="section-title"><h3>Atividade recente</h3><button className="text-button" onClick={()=>setPage('Transações')}>Ver todas</button></div>{rows(transactions.slice(0,4))}</section></div>{(pending.length>0||!dueInvoices.length)&&<section className="card upcoming"><div className="section-title"><div><h3>Próximos compromissos</h3><p className="muted">Pendências do mês e valores vencidos de outros meses.</p></div><button className="text-button" onClick={()=>setPage('Compromissos')}>Ver todos <ChevronRight size={15}/></button></div>{pendingRows(pending.slice(0,4))}</section>}{dueInvoices.length>0&&<CreditDueList invoices={dueInvoices.slice(0,3)} today={today()} format={format} onOpen={openInvoice}/>}<section className="credit-preview" aria-label="Cartões"><div className="section-title"><h2>Cartões</h2><button className="text-button" onClick={openWallet}>{featuredCard?'Ver carteira':'Adicionar cartão'} <ChevronRight size={15}/></button></div>{featuredCard&&<button data-stacked={(visible.creditCards?.length??0)>1} aria-label={`Abrir cartão ${featuredCard.name}`} onClick={()=>openInvoice(featuredInvoice??{cardId:featuredCard.id,cycle:''})}><CreditCardFace card={featuredCard} invoice={featuredInvoice} available={featuredCard.limit-openInvoices.filter(i=>i.cardId===featuredCard.id).reduce((sum,i)=>sum+i.amount,0)} format={format}/></button>}</section><section className="goal-gallery" aria-labelledby="featured-goals"><div className="section-title"><h2 id="featured-goals">Metas em destaque</h2><button className="text-button" onClick={()=>setPage('Metas')}>Ver todas <ChevronRight size={15}/></button></div>{featuredGoals.length?<div className="goal-gallery-grid">{featuredGoals.map(goal=><GoalCard key={goal.id} goal={goal} format={format} hidden={hidden} onEdit={()=>editGoal(goal)}/>)}</div>:<div className="card empty"><Target size={24}/><h3>{data.goals.length?'Escolha suas metas em destaque':'Nenhuma meta cadastrada'}</h3><p>{data.goals.length?'Edite uma meta e marque “Mostrar na visão geral”.':'Defina quanto quer guardar e acompanhe o valor reservado.'}</p><button className="secondary" onClick={()=>data.goals.length?setPage('Metas'):open('goal')}>{data.goals.length?'Escolher metas':'Criar meta'}</button></div>}</section></>}
 {page==='Transações'&&<section className="card"><div className="csv-toolbar"><h2>Lançamentos</h2><button className="secondary" onClick={()=>openImport('bank')}>Importar extrato CSV</button></div><div className="filters"><label className="search"><Search size={18}/><input aria-label="Buscar lançamento" placeholder="Descrição, categoria ou conta" value={query} onChange={e=>setQuery(e.target.value)}/></label><AppSelect aria-label="Tipo de lançamento" value={filter} onChange={e=>setFilter(e.target.value)}><option value="all">Todos os tipos</option><option value="income">Receitas</option><option value="expense">Despesas</option></AppSelect><AppSelect aria-label="Situação do lançamento" value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}><option value="all">Todas as situações</option><option value="paid">Pagos / recebidos</option><option value="pending">Pendentes</option></AppSelect></div>{rows(transactions,Boolean(query)||filter!=='all'||statusFilter!=='all')}</section>}
 {page==='Compromissos'&&<><MetricStrip items={[{label:'A pagar',value:format(pendingExpenses),caption:'Despesas pendentes no período e vencidas'},{label:'A receber',value:format(pendingIncome),caption:'Previsões ainda não incluídas no saldo'},{label:'Vencidos',value:String(overdue),caption:'Pendências anteriores a hoje'}]}/>{(pending.length>0||!dueInvoices.length)&&<section className="card"><div className="section-title"><div><h3>Vencimentos</h3><p className="muted">Veja os vencimentos do mês e as pendências atrasadas. A data original é mantida ao marcar como pago ou recebido.</p></div></div>{pendingRows(pending)}</section>}{dueInvoices.length>0&&<CreditDueList invoices={dueInvoices} today={today()} format={format} onOpen={openInvoice}/>}{space!=='all'&&<p className="muted" role="note">A projeção utiliza todas as contas e espaços para não mostrar um saldo parcial como se fosse o saldo total.</p>}<CashForecast data={data} today={today()} format={format}/></>}
 {page==='Cartões'&&<CreditWallet key={selectedInvoice?JSON.stringify(selectedInvoice):'wallet'} data={data} today={today()} format={format} initialInvoice={selectedInvoice} onChange={store.change} onAccounts={()=>open('account')} onImport={()=>openImport('card')}/>}
 {page==='Recorrências'&&<RecurringRules data={data} today={today()} format={format} onChange={change}/>}
 {page==='Conselheiro'&&<FinancialAdvisor onNavigate={setPage} data={visible} month={month} today={today()} space={space} synchronized={Boolean(store.user)&&store.state==='ready'}/>}
 {page==='Contas'&&<><div className="section-title"><h2>Saldos por conta</h2></div><div className="tiles">{data.accounts.map(a=><section className="card" key={a.id}><Wallet size={24}/><h3>{a.name}</h3><strong className="amount">{format(summary({...data,accounts:[a],transactions:data.transactions.filter(t=>t.accountId===a.id)},month).balance)}</strong><small>Saldo inicial: {format(a.openingBalance)}</small></section>)}</div>{!data.accounts.length&&<p className="empty">Adicione uma conta com o saldo atual para começar.</p>}</>}
 {page==='Orçamentos'&&<><MetricStrip items={[{label:'Orçado para o mês',value:format(budgetTotal),caption:`${data.budgets.length} categorias com limite definido`},{label:'Já utilizado',value:format(budgetSpent),caption:'Despesas do mês, incluindo parcelas com vencimento no período'},{label:'Disponível',value:format(budgetTotal-budgetSpent),caption:'Saldo entre as categorias orçadas'}]}/><section className="card budget-overview"><div className="section-title"><div><h3>Suas categorias</h3><p className="muted">Limites e gastos de todos os espaços no mês selecionado.</p></div></div>{data.budgets.length?budgets():<div className="empty"><ChartNoAxesCombined size={28}/><h3>Nenhum orçamento criado</h3><p>Defina um limite mensal por categoria.</p><button className="secondary" onClick={()=>open('budget')}>Criar primeiro orçamento</button></div>}</section></>}
 {page==='Metas'&&<><MetricStrip items={[{label:'Total reservado',value:format(currentTotals.reserved),caption:'Reservado nas suas contas'},{label:'Total das metas',value:format(goalTotal),caption:`${data.goals.length} metas cadastradas`},{label:'Ainda falta reservar',value:format(data.goals.reduce((sum,g)=>sum+Math.max(0,g.target-g.saved),0)),caption:'Soma do que falta em cada meta'}]}/><div className="section-title"><h2>Todas as metas</h2></div><p className="muted">Valores reservados são descontados do livre para gastar. Reserve apenas dinheiro já incluído nas contas.</p><div className="goal-gallery goal-gallery-grid">{data.goals.map(goal=><GoalCard key={goal.id} goal={goal} format={format} hidden={hidden} onEdit={()=>editGoal(goal)} onDelete={()=>void deleteGoal(goal)}/>)}</div>{!data.goals.length&&<div className="card empty"><Target size={28}/><h3>Nenhuma meta cadastrada</h3><p>Dê um nome à meta e informe quanto você pretende guardar.</p><button className="secondary" onClick={()=>open('goal')}>Criar primeira meta</button></div>}</>}
 {page==='Relatórios'&&<><MetricStrip items={[{label:'Entradas',value:format(totals.income),caption:'Receitas recebidas no mês'},{label:'Saídas',value:format(totals.expense),caption:'Despesas pagas no mês'},{label:'Resultado do período',value:format(totals.income-totals.expense),caption:'Entradas menos saídas'}]}/><div className="report-grid"><section className="card"><h2>Despesas por categoria</h2><p className="muted">Despesas pagas no mês selecionado.</p>{categories.map(c=>{const amount=paidExpenses.get(c)??0;return amount>0&&<div className="report-row" key={c}><span>{c}</span><progress value={amount} max={totals.expense||1}/><strong>{format(amount)}</strong><small>{Math.round(amount/(totals.expense||1)*100)}%</small></div>})}{totals.expense===0&&<p className="empty">Seus gastos por categoria aparecerão aqui.</p>}<hr/><h3>Como calculamos</h3><p className="muted">Livre para gastar hoje = {format(spendable.balance)} em contas − {format(spendable.overdueExpenses)} em despesas pendentes deste mês e atrasadas − {format(spendable.reserved)} reservados em metas. Receitas pendentes não aumentam seu saldo.</p>{space!=='all'&&<p className="muted">O filtro de espaço limita movimentações do relatório. Saldos, orçamentos e reservas são compartilhados entre espaços.</p>}</section><CashFlow data={visible} month={month} format={format}/></div></>}
 {page==='Configurações'&&<section className="card settings"><h2>Conta e dados</h2><AccountControls store={store} expanded onExport={exportData}/><label>Como quer ser chamado?<input defaultValue={data.name} maxLength={40} onBlur={e=>{const name=e.target.value.trim();if(name!==data.name)change({...data,name});}}/></label><h3>Backup</h3><p className="muted">Mantenha uma cópia dos seus dados. No modo local, limpar o navegador pode apagá-los. Na sua conta, alterações ainda não sincronizadas também dependem deste dispositivo.</p><button className="secondary" onClick={exportData}><Download size={17}/>Exportar backup JSON</button><label className="import">Restaurar backup JSON<input type="file" accept="application/json" onChange={async e=>{const file=e.target.files?.[0];if(!file)return;try{const d=JSON.parse(await file.text());if(!isFinanceData(d))throw Error('Arquivo incompatível ou inválido.');if(await confirm('Os registros atuais serão substituídos pelo arquivo selecionado. Exporte uma cópia antes se quiser preservá-los.',{title:'Restaurar este backup?',action:'Restaurar backup',destructive:true}))store.restore(d);}catch(err){setNotice((err as Error).message)}e.target.value='';}}/></label><h3>Instalar o Prumo</h3><p className="muted">No menu do navegador, use “Instalar aplicativo” ou “Adicionar à Tela de Início”. Abra uma vez com internet para preparar o uso offline.</p></section>}
 <footer>prumo. <span>O seu dinheiro, no eixo.</span></footer></main>
 <nav className="mobile-nav" aria-label="Navegação principal">{[['Visão geral','Início',LayoutDashboard],['Transações','Atividade',ArrowLeftRight],['Metas','Metas',Target]].map(([destination,label,Icon])=>{const Glyph=Icon as typeof Target;return <button key={String(destination)} className={page===destination?'active':''} aria-current={page===destination?'page':undefined} onClick={()=>setPage(String(destination))}><Glyph size={21}/><span>{String(label)}</span></button>})}<button className={!['Visão geral','Transações','Metas'].includes(page)?'active':''} onClick={()=>setMenuOpen(true)} aria-label="Abrir menu"><Menu size={21}/><span>Menu</span></button></nav>
 {importKind&&<CsvImportDialog kind={importKind} data={data} month={month} space={space} onChange={store.change} onClose={()=>setImportKind(null)} restoreFocus={()=>importOpener.current?.focus()}/>}
 <Dialog.Root open={menuOpen} onOpenChange={setMenuOpen}><Dialog.Portal><Dialog.Overlay className="overlay"/><Dialog.Content className="dialog menu-sheet"><Dialog.Title>Menu do Prumo</Dialog.Title><Dialog.Description className="muted">Escolha uma seção.</Dialog.Description><Dialog.Close className="close icon-button" aria-label="Fechar menu"><X size={20}/></Dialog.Close><div className="menu-links">{navigation.map(([label,Icon])=><button key={label} onClick={()=>{if(label==='Cartões')openWallet();else setPage(label);setMenuOpen(false)}}><span className="category-icon"><Icon size={20}/></span><strong>{label}</strong><ChevronRight size={17}/></button>)}</div></Dialog.Content></Dialog.Portal></Dialog.Root>
 {notice&&<div className="toast" role="status"><span>{notice}</span>{store.canUndo&&<button onClick={store.undoChange}>Desfazer</button>}<button className="icon-button" aria-label="Fechar aviso" onClick={()=>setNotice('')}><X size={16}/></button></div>}
 <Dialog.Root open={form!==null} onOpenChange={v=>!v&&setForm(null)}><Dialog.Portal><Dialog.Overlay className="overlay"/><Dialog.Content className="dialog"><Dialog.Title>{form==='transaction'?(editing?'Editar lançamento':'Novo lançamento'):form==='account'?'Adicionar conta':form==='budget'?'Definir orçamento':editingGoal?'Editar meta':'Criar meta'}</Dialog.Title><Dialog.Description className="muted">{form==='account'?'Informe o saldo atual. Registre apenas movimentações posteriores para evitar duplicidade.':form==='goal'?'O valor reservado é descontado do saldo livre. Nenhuma transferência é feita.':form==='budget'?'Defina quanto pode gastar por mês nesta categoria.':'Use “Pendente” para valores que ainda não foram pagos ou recebidos.'}</Dialog.Description><Dialog.Close className="close icon-button" aria-label="Fechar"><X size={20}/></Dialog.Close><form onSubmit={submit} key={editing?.id||editingGoal?.id||form}>
 {form==='transaction'?<><div className="form-grid"><label>Tipo<AppSelect name="type" defaultValue={editing?.type||'expense'} disabled={Boolean(editing?.installment)} onChange={e=>setTransactionType(e.target.value as 'income'|'expense')}><option value="expense">Despesa</option><option value="income">Receita</option></AppSelect></label><label>Situação<AppSelect name="status" defaultValue={editing?.status||'paid'}><option value="paid">Pago / recebido</option><option value="pending">Pendente</option></AppSelect></label></div><label>Descrição<input name="description" maxLength={100} required defaultValue={editing?.description} placeholder="Ex.: Mercado"/></label></>:form!=='budget'&&<label>Nome<input name="name" maxLength={80} required defaultValue={editingGoal?.name} placeholder={form==='account'?'Ex.: Conta principal':'Ex.: Reserva de emergência'}/></label>}
 <label>{form==='account'?'Saldo atual':form==='budget'?'Limite mensal':form==='goal'?'Valor da meta':editing?.installment?'Valor desta parcela':!editing&&transactionType==='expense'?'Valor total':'Valor'} (R$)<input name="amount" inputMode="decimal" required placeholder="0,00" defaultValue={editing?(editing.amount/100).toFixed(2):editingGoal?(editingGoal.target/100).toFixed(2):undefined}/></label>
 {(form==='transaction'||form==='budget')&&<label>Categoria<AppSelect name="category" defaultValue={editing?.category}>{categories.map(c=><option key={c}>{c}</option>)}</AppSelect></label>}
 {form==='transaction'&&!editing&&transactionType==='expense'&&<><label>Número de parcelas<input name="installments" type="number" min="1" max="60" step="1" defaultValue="1" required/></label><small>Informe o valor total da compra. As parcelas serão mensais; somente a primeira usará a situação escolhida acima. As demais ficarão pendentes.</small></>}
 {editing?.recurrence&&<p className="installment-note">Este lançamento faz parte de uma recorrência. A edição afeta somente esta ocorrência; altere as próximas em Recorrências.</p>}
 {editing?.installment&&<p className="installment-note">Parcela {editing.installment.number} de {editing.installment.count}. As alterações afetam somente esta parcela.</p>}
 {form==='transaction'&&<><div className="form-grid"><label>{!editing&&transactionType==='expense'?'Primeiro vencimento':'Data'}<DateField name="date" required defaultValue={editing?.date||today()}/></label><label>Espaço<AppSelect name="space" defaultValue={editing?.space||(space==='work'?'work':'personal')}><option value="personal">Pessoal</option><option value="work">Trabalho</option></AppSelect></label></div><label>Conta<AppSelect name="accountId" defaultValue={editing?.accountId} required>{data.accounts.map(a=><option value={a.id} key={a.id}>{a.name}</option>)}</AppSelect></label>{!data.accounts.length&&<p role="alert">Adicione uma conta primeiro.</p>}</>}
 {form==='goal'&&<><label>Valor reservado (R$)<input name="saved" inputMode="decimal" placeholder="0,00" defaultValue={editingGoal?(editingGoal.saved/100).toFixed(2):undefined}/></label><GoalCoverPicker selected={editingGoal?.cover}/><label className="goal-featured-option"><input name="featured" type="checkbox" defaultChecked={editingGoal?.featured}/><span>Mostrar na visão geral</span></label><small>Até três metas podem ficar em destaque.</small></>}
 {editing?.installment&&form==='transaction'&&<button type="button" className="text-button installment-delete" onClick={async()=>{if(!editing.installment)return;const next=removePendingInstallments(data,editing.installment.groupId,editing.installment.number);const removed=data.transactions.length-next.transactions.length;if(!removed){setError('Não há parcelas pendentes a partir desta parcela.');return;}if(await confirm(`Excluir ${removed} parcela(s) pendente(s), a partir desta? Parcelas pagas serão mantidas. Você poderá desfazer.`,{title:'Excluir parcelas pendentes?',action:'Excluir parcelas',destructive:true})){change(next);setForm(null);}}}>Excluir esta e as próximas pendentes</button>}
 {error&&<p className="error" role="alert">{error}</p>}<button className="primary submit" disabled={storageError}>Salvar {form==='transaction'?'lançamento':form==='account'?'conta':form==='budget'?'orçamento':'meta'}</button></form></Dialog.Content></Dialog.Portal></Dialog.Root></div>
}
