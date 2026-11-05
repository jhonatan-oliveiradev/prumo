'use client';
import {MotionLabel} from './motion-label';

import {useEffect,useRef,useState} from 'react';
import {ArrowUpRight,Wallet,CalendarDays,Sparkles,ChartNoAxesCombined,Layers,RotateCcw,Plus} from 'lucide-react';
import {teardownCenterLift,teardownParts} from '@/lib/generated/teardown';
import {clampProgress,followProgress,timelineProgress,timelineComposition} from '@/lib/timeline';

const layers=[
 {title:'Um registro de cada vez.',label:'REGISTRE',detail:'Receitas e despesas ganham lugar, categoria e contexto. Você começa a enxergar o caminho do seu dinheiro.',Icon:Wallet,tag:'Seus registros',features:['Contas e categorias','Receitas e despesas']},
 {title:'Cada compromisso, no seu tempo.',label:'ORGANIZE',detail:'Reúna vencimentos, parcelas e recorrências. O que já foi pago fica separado do que ainda precisa acontecer.',Icon:CalendarDays,tag:'Sua organização',features:['Vencimentos e parcelas','Recorrências']},
 {title:'Um destino para o próximo mês.',label:'PLANEJE',detail:'Defina limites por categoria e acompanhe suas metas. Planeje a partir do saldo disponível, sem antecipar recebimentos.',Icon:ChartNoAxesCombined,tag:'Seu planejamento',features:['Orçamentos','Metas e progresso']},
 {title:'Clareza para o próximo passo.',label:'DECIDA',detail:'Veja os sinais do orçamento por inteiro. Quando quiser, autorize uma orientação. O Prumo organiza; a decisão continua sua.',Icon:Sparkles,tag:'Suas escolhas',features:['Visão geral','Orientação autorizada']},
];

export function FinanceLayers(){
 const [active,setActive]=useState(0),[enhanced,setEnhanced]=useState(false),[manual,setManual]=useState(false),[intro,setIntro]=useState(true);
 const root=useRef<HTMLElement>(null),groups=useRef<(SVGGElement|null)[]>([]),input=useRef<HTMLInputElement>(null),output=useRef<HTMLOutputElement>(null);
 const controller=useRef<((value:number,scroll:boolean)=>void)|null>(null);
 useEffect(()=>{
  const element=root.current;if(!element)return;
  const wide=matchMedia('(min-width: 900px) and (min-height: 700px)'),reduced=matchMedia('(prefers-reduced-motion: reduce)');
  let raf=0,current=1,target=1,last=0,visible=false,enabled=false,measure=false,stage=-1,introducing=true,free=false;
  const paint=(value:number)=>{
   current=clampProgress(value);
   element.style.setProperty('--timeline-progress',String(current));
   const composition=timelineComposition(current);
   const offsets=free?teardownParts.map((part)=>part.lift*current):composition.offsets.map(offset=>offset*teardownParts[1].lift);
   const pan=teardownCenterLift-offsets.at(-1)!/2;
   groups.current.forEach((group,index)=>group?.setAttribute('transform',`translate(0 ${(pan+offsets[index]).toFixed(4)})`));
   if(input.current)input.current.value=String(Math.round(current*100));
   if(output.current)output.current.textContent=`${Math.round(current*100)}%`;
   const nextIntro=!free&&composition.intro;if(nextIntro!==introducing){introducing=nextIntro;setIntro(nextIntro);}
   const next=free?Math.round(current*(layers.length-1)):composition.active;if(next!==stage){stage=next;setActive(next);}

  };
  const read=()=>{const rect=element.getBoundingClientRect();target=timelineProgress(rect.top,rect.height,innerHeight);};
  const tick=(now:number)=>{
   raf=0;
   if(document.hidden)return;
   if(measure&&enabled){measure=false;read();}
   const elapsed=last?now-last:16.7;last=now;
   paint(reduced.matches?target:followProgress(current,target,elapsed));
   if(visible&&Math.abs(current-target)>.00001)raf=requestAnimationFrame(tick);
   else last=0;
  };
  const wake=()=>{if(!raf&&!document.hidden)raf=requestAnimationFrame(tick);};
  const schedule=()=>{if(!enabled||!visible)return;free=false;measure=true;wake();};
  const configure=()=>{
   enabled=wide.matches&&!reduced.matches;setEnhanced(enabled);
   cancelAnimationFrame(raf);raf=0;last=0;
   free=!enabled;if(enabled){read();paint(target);}else{target=1;paint(1);}
   if(visible)wake();
  };
  const visibility=()=>{cancelAnimationFrame(raf);raf=0;last=0;if(!document.hidden){if(enabled)measure=true;wake();}};
  controller.current=(value,scroll)=>{
   free=!scroll;target=clampProgress(value);
   if(scroll&&enabled){
    const rect=element.getBoundingClientRect();
    window.scrollTo({top:scrollY+rect.top-60+target*Math.max(1,rect.height-innerHeight),behavior:'smooth'});
   }
   if(reduced.matches||!visible)paint(target);else wake();
  };
  const observer=new IntersectionObserver(entries=>{
   visible=entries.some(e=>e.isIntersecting);
   if(visible){if(enabled)measure=true;wake();}else{cancelAnimationFrame(raf);raf=0;last=0;}
  });observer.observe(element);
  const resize=new ResizeObserver(()=>{if(enabled){measure=true;if(visible)wake();}});resize.observe(element);
  configure();
  window.addEventListener('scroll',schedule,{passive:true});window.addEventListener('resize',configure,{passive:true});
  document.addEventListener('visibilitychange',visibility);wide.addEventListener('change',configure);reduced.addEventListener('change',configure);
  return()=>{cancelAnimationFrame(raf);observer.disconnect();resize.disconnect();window.removeEventListener('scroll',schedule);window.removeEventListener('resize',configure);document.removeEventListener('visibilitychange',visibility);wide.removeEventListener('change',configure);reduced.removeEventListener('change',configure);controller.current=null;};
 },[]);
 function select(index:number){setManual(false);controller.current?.(.2+.8*index/(layers.length-1),true);}
 function spacing(value:number){setManual(true);controller.current?.(value,false);}
 return <section className="finance-layers living-timeline fluid-timeline reference-timeline" id="camadas" ref={root} data-enhanced={enhanced} data-active={active} data-intro={intro}>
  <div className="timeline-stage">
   <div className="timeline-copy"><div className="timeline-intro" aria-hidden={enhanced&&!intro}><p className="eyebrow">UM PLANO QUE SE CONSTRÓI</p><h2>As partes encontram<br/>o seu lugar.</h2><p>Registros, compromissos e escolhas. Cada parte se conecta para você enxergar o seu dinheiro por inteiro.</p></div>
    <div className="timeline-track" role="group" aria-label="Etapas do Prumo"><span className="timeline-track-fill"/>{layers.map((layer,index)=><button key={layer.label} onClick={()=>select(index)} aria-pressed={active===index}><i/><MotionLabel>{`${String(index+1).padStart(2,'0')} · ${layer.label}`}</MotionLabel></button>)}</div>
    <div className="timeline-stories">{layers.map((layer,index)=>{const Icon=layer.Icon;return <article className={`timeline-story ${active===index?'active':''}`} key={layer.label} style={{'--story-index':index} as React.CSSProperties} aria-hidden={enhanced&&(intro||active!==index)} inert={enhanced&&(intro||active!==index)}><span className="timeline-story-label">{String(index+1).padStart(2,'0')} · {layer.label}</span><Icon size={22}/><h3>{layer.title}</h3><p>{layer.detail}</p><div className="timeline-feature-tags">{layer.features.map(feature=><span key={feature}>{feature}</span>)}</div><a className="ref-text-link" href="/app"><MotionLabel>Abrir meu espaço</MotionLabel> <ArrowUpRight size={15}/></a></article>;})}</div>
    <p className="timeline-instruction">{enhanced?'Role para ver o seu plano ganhar forma. Volte para reunir as partes.':'Cada parte ajuda você a cuidar do próximo passo.'}</p>
   </div>
   <figure className="timeline-drawing"><div className="layers-dots" aria-hidden="true"/>
    <svg viewBox="80 0 260 297" className={`teardown-drawing active-${active}`} role="img" aria-label={`Ilustração conceitual das quatro camadas do Prumo. Destaque: ${layers[active].tag.toLocaleLowerCase()}.`}>
     {teardownParts.map((part,index)=>{const [x,y]=part.anchor,left=index%2===0,labelX=left?88:332;return <g key={part.id} ref={node=>{groups.current[index]=node;}} data-layer={part.id} transform={`translate(0 ${part.lift})`}>
      <g dangerouslySetInnerHTML={{__html:part.markup}}/>
      <g className={`teardown-callouts ${active===index?'selected':''}`} aria-hidden="true"><path d={`M${x} ${y}L${left?x-10:x+10} ${y}L${labelX} ${y}`}/><circle cx={x} cy={y} r="1.2"/><text x={labelX} y={y-5} textAnchor={left?'start':'end'}>{part.name}</text></g>
     </g>;})}
    </svg>
    <figcaption><span>REGISTRE · ORGANIZE · PLANEJE · DECIDA</span><strong>{layers[active].tag}</strong><small>Quatro partes. Um ponto de vista.</small></figcaption>
    <details className="timeline-explore"><summary><Layers size={13}/><MotionLabel>Explorar as camadas</MotionLabel><Plus size={13}/></summary><div className="timeline-drawing-controls"><div className="timeline-assembly-buttons"><button className="secondary" onClick={()=>spacing(0)}><RotateCcw size={14}/><MotionLabel>Reunir</MotionLabel></button><button className="secondary" onClick={()=>spacing(1)}><Layers size={14}/><MotionLabel>Separar</MotionLabel></button></div><label><span>Separação das camadas</span><input ref={input} aria-label="Separação das camadas" type="range" min="0" max="100" defaultValue="100" onChange={e=>spacing(Number(e.target.value)/100)}/><output ref={output} aria-hidden="true">100%</output></label>{manual&&enhanced&&<small>Explore livremente. A rolagem retoma a sequência.</small>}</div></details>
   </figure>
  </div>
 </section>;
}
