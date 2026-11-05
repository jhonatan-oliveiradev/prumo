'use client';
import {MotionLabel} from './motion-label';
import {useEffect,useRef,useState} from 'react';
import {ArrowUpRight,Check,Plus,Sparkles,Target,Repeat2,Wallet} from 'lucide-react';
const cases=[{title:'Contas e transações',subtitle:'Entradas e saídas',description:'Registre receitas e despesas por conta. Veja quanto sobra depois dos compromissos do mês.',points:['Contas e categorias','Receitas e despesas','Separação pessoal e trabalho'],label:'PANORAMA DO MÊS',value:'R$ 4.280,00',Icon:Wallet,items:[['Receitas recebidas','R$ 5.400,00'],['Despesas pagas','R$ 1.120,00']]},{title:'Parcelas e recorrências',subtitle:'Contas a vencer',description:'Cadastre salário, aluguel e assinaturas uma vez. Acompanhe as próximas ocorrências sem antecipar valores no saldo.',points:['Recorrências semanais, mensais ou anuais','Parcelas e vencimentos','Confirmação de pago ou recebido'],label:'PRÓXIMOS COMPROMISSOS',value:'Vencimentos do mês',Icon:Repeat2,items:[['Aluguel · dia 10','R$ 900,00'],['Internet · dia 15','R$ 99,90']]},{title:'Orçamentos e metas',subtitle:'Progresso da meta',description:'Defina um limite por categoria e acompanhe quanto já reservou para cada meta.',points:['Orçamentos por categoria','Metas com progresso','Planejamento dos próximos meses'],label:'META DE RESERVA',value:'Reserva de emergência',Icon:Target,items:[['Guardado','R$ 1.800,00'],['Objetivo','R$ 6.000,00']]},{title:'Conselheiro',subtitle:'Indicadores do mês',description:'Autorize o envio de indicadores gerais ao Gemini para receber sugestões práticas. Sem entregar descrições ou valores exatos.',points:['Consentimento em cada análise','Somente indicadores gerais','Registros preservados'],label:'CONSELHEIRO PRUMO',value:'Revise os vencimentos',Icon:Sparkles,items:[['Prioridade','Revisar compromissos'],['Próxima ação','Conferir recebimentos']]}];
const landscapes=[{src:'/images/prumo-canyon.webp',position:'50% 50%'},{src:'/images/prumo-ridge.webp',position:'54% 50%'},{src:'/images/prumo-lake.webp',position:'50% 50%'},{src:'/images/prumo-river.webp',position:'50% 50%'}];
export function UseCaseExplorer() {
 const [loaded,setLoaded]=useState<boolean[]>([false,false,false,false]);
 const photos=useRef<(HTMLImageElement|null)[]>([]);
 useEffect(()=>{setLoaded(previous=>previous.map((ready,index)=>ready||Boolean(photos.current[index]?.complete&&photos.current[index]?.naturalWidth)));},[]);
 const [active,setActive]=useState(0),[mode,setMode]=useState<'overview'|'detail'>('overview');
 return <section className="use-case-section" id="recursos">
  <div className="use-case-copy"><p className="eyebrow">RECURSOS</p><h2>Acompanhe o mês.<br/>Planeje o próximo.</h2>
   <div className="use-case-accordion">{cases.map((item,index)=><div key={item.title} className={active===index?'active':''}>
    <h3><button id={`case-trigger-${index}`} aria-expanded={active===index} aria-controls={`case-panel-${index}`} onClick={()=>setActive(index)}><MotionLabel>{item.title}</MotionLabel><Plus size={18}/></button></h3>
    <div className="case-panel-wrap" inert={active!==index} aria-hidden={active!==index}><div className="case-panel-clip"><div id={`case-panel-${index}`} role="region" aria-labelledby={`case-trigger-${index}`}><p>{item.description}</p><ul>{item.points.map(point=><li key={point}><Check size={15}/>{point}</li>)}</ul><a href="/app" className="ref-text-link"><MotionLabel>Abrir o Prumo</MotionLabel> <ArrowUpRight size={15}/></a></div></div></div>
   </div>)}</div>
  </div>
  <div className={`use-case-visual scene-${active}`} data-background={mode==='overview'?'image':'mesh'}>
   <div className="use-case-landscapes" data-ready={loaded[active]} aria-hidden="true">{landscapes.map((photo,index)=><img ref={node=>{photos.current[index]=node;}} className="use-case-forest" data-active={active===index&&loaded[index]} key={photo.src} src={photo.src} alt="" loading="lazy" decoding="async" width="1920" height="1072" style={{objectPosition:photo.position}} onLoad={()=>setLoaded(previous=>previous.map((ready,i)=>i===index||ready))}/>)}</div>
   <div className="use-case-mesh" aria-hidden="true"><span/><span/></div>
   <div className="demo-stage">{cases.flatMap((item,index)=>(['overview','detail'] as const).map(view=>{
    const selected=active===index&&mode===view,Icon=item.Icon;
    return <div className="demo-scene" data-active={selected} aria-hidden={!selected} inert={!selected} key={`${index}-${view}`}>
     <div className="use-case-demo">
      <div className="demo-window-bar"><div><img src="/logo.svg" alt="" width="22" height="22"/><span>prumo.</span></div><span className="demo-tag">EXEMPLO ILUSTRATIVO</span></div>
      <div className="use-case-demo-title"><Icon size={18}/><span>{item.label}</span><span className="demo-state">{index===3?'Você autoriza':'Seu espaço'}</span></div>
      <strong>{view==='overview'?item.value:item.subtitle}</strong>
      {index===0&&view==='overview'&&<div className="demo-cash-flow" aria-label="Exemplo de movimentos ao longo do mês"><div>{[36,53,43,69,56,81,73,94,67,83,72,89].map((height,i)=><span key={i} style={{height:height+'%'}}/>)}</div><span>INÍCIO DO MÊS</span><span>HOJE</span></div>}
      {index===2&&view==='overview'&&<div className="demo-goal"><div><span>Seu progresso</span><b>30%</b></div><div className="demo-progress"><span/></div></div>}
      {view==='overview'?<dl>{item.items.map(([label,value],i)=><div key={label}><dt><span className={`demo-dot dot-${index}-${i}`}/>{label}</dt><dd>{value}</dd></div>)}</dl>:<ul className="demo-checklist">{item.points.map(point=><li key={point}><Check size={16}/>{point}</li>)}</ul>}
      <div className="demo-watermark"><span className="demo-status-dot"/><span>{index===3?'NENHUMA AÇÃO SEM VOCÊ.':'SEU DINHEIRO, NO EIXO.'}</span></div>
     </div>
     <div className="demo-context"><div><Icon size={16}/><span>{view==='overview'?'UM POUCO MAIS DE DIREÇÃO':'NO SEU RITMO'}</span><Check size={14}/></div><strong>{view==='overview'?item.subtitle:item.title}</strong><p>{index===3?'Indicadores gerais. Sem nomes, descrições ou valores exatos.':item.points.join(' · ')}</p></div>
    </div>;
   }))}</div>
   <div className="visual-mode" role="group" aria-label="Visualização do exemplo"><button aria-pressed={mode==='overview'} onClick={()=>setMode('overview')}><MotionLabel>Panorama</MotionLabel></button><button aria-pressed={mode==='detail'} onClick={()=>setMode('detail')}><MotionLabel>Detalhes</MotionLabel></button></div><p className="visual-disclaimer">Dados fictícios. Nenhuma operação ou consulta à IA é realizada.</p>
  </div>
 </section>;
}
