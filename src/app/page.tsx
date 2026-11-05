import type {Metadata} from 'next';
import Link from 'next/link';
import {ArrowUpRight,ShieldCheck,Sparkles,Wallet,Repeat2,Target,Check} from 'lucide-react';
import {ReferenceNavigation} from '@/components/reference-navigation';
import {LandingHero} from '@/components/landing-hero';
import {AlignmentField} from '@/components/alignment-field';
import {LandingScroll} from '@/components/landing-scroll';
import {FinanceLayers} from '@/components/finance-layers';
import {UseCaseExplorer} from '@/components/use-case-explorer';
import {LandingMotion} from '@/components/landing-motion';
import {InstallPrumo} from '@/components/install-prumo';
import {MotionLabel} from '@/components/motion-label';
import {LandingFooter} from '@/components/landing-footer';
import './landing-reference.css';
import './landing-composition.css';
import './landing-footer.css';
import './landing-motion.css';
export const metadata:Metadata={title:'Prumo — Seu dinheiro, no eixo.',description:'Registre seus gastos, organize compromissos e planeje seus próximos passos. No navegador ou instalado como aplicativo.'};
export default function Landing(){return <main className="landing reference-landing"><LandingMotion/><LandingScroll/><a href="#conteudo" className="ref-skip">Pular para o conteúdo</a><ReferenceNavigation/>
 <LandingHero/>
 <AlignmentField/>
 <div className="ref-capabilities" aria-label="Recursos do Prumo">{[{Icon:Wallet,label:'Contas e movimentos'},{Icon:Repeat2,label:'Compromissos e recorrências'},{Icon:Target,label:'Orçamentos e metas'},{Icon:Sparkles,label:'Orientação por IA'}].map(({Icon,label})=><a key={label} href="#recursos"><Icon size={19}/><MotionLabel>{label}</MotionLabel><ArrowUpRight size={13}/></a>)}</div>
 <FinanceLayers/>
 <UseCaseExplorer/>
 <section className="ref-product-directory" aria-labelledby="directory-title"><div data-reveal><p className="eyebrow">O QUE IMPORTA, CONECTADO</p><h2 id="directory-title">O seu dinheiro.<br/>Por inteiro.</h2></div><div>{[{title:'Entenda',items:[['Visão geral','Saldo e movimento do mês.'],['Transações','Contexto para cada entrada e saída.']]},{title:'Organize',items:[['Compromissos','O que ainda precisa acontecer.'],['Recorrências','O que volta a cada período.']]},{title:'Planeje',items:[['Orçamentos e metas','Limites claros e objetivos possíveis.'],['Conselheiro','Indicadores transformados em orientação.']]}].map(group=><div className="directory-group" key={group.title}><h3>{group.title}</h3>{group.items.map(([title,detail])=><Link key={title} href="/app"><div><strong><MotionLabel>{title}</MotionLabel></strong><p>{detail}</p></div><ArrowUpRight size={18}/></Link>)}</div>)}</div></section>
 <section className="ref-advisor-section" id="conselheiro"><div className="ref-advisor-copy" data-reveal><p className="eyebrow">CLAREZA PARA DECIDIR</p><h2>Um conselheiro.<br/>As escolhas são suas.</h2><p>A IA ajuda a interpretar os sinais do orçamento e sugere ações para o dia a dia. Cada análise começa com a sua autorização.</p><ul><li><Check size={17}/>Indicadores gerais, sem valores exatos</li><li><Check size={17}/>Sem nomes ou descrições dos registros</li><li><Check size={17}/>Orientação que você confere antes de agir</li></ul><Link href="/app" className="secondary"><MotionLabel>Conhecer meu espaço</MotionLabel> <ArrowUpRight size={16}/></Link><small>Requer conta, sincronização e disponibilidade do Gemini. A IA pode errar.</small></div><div className="ref-advisor-art"><div className="ref-orbit" aria-hidden="true"><span/><span/><Sparkles size={40}/></div><div className="ref-advice-card"><span>EXEMPLO DE ORIENTAÇÃO</span><h3>Comece pelo que<br/>já está combinado.</h3><p>Confira os compromissos e confirme os recebimentos antes de planejar novos gastos.</p><span><ShieldCheck size={14}/> Você decide. O Prumo orienta.</span></div></div></section>
 <section className="ref-start-section"><div><p className="eyebrow">SEM COMPLICAR O COMEÇO</p><h2>Menos etapas.<br/>Mais direção.</h2></div><div className="ref-start-links"><Link href="/app"><span><MotionLabel>Comece no seu ritmo</MotionLabel></span><p>Abra o espaço e registre sua primeira conta.</p><ArrowUpRight size={19}/></Link><a href="#instalar"><span><MotionLabel>Leve com você</MotionLabel></span><p>Instale a versão web no celular ou computador.</p><ArrowUpRight size={19}/></a><Link href="/app"><span><MotionLabel>Continue conectado</MotionLabel></span><p>Entre na conta para sincronizar entre dispositivos.</p><ArrowUpRight size={19}/></Link></div></section>
 <section className="ref-closing" id="instalar"><img src="/logo.svg" alt="" width="54" height="54"/><h2>Registre. Entenda.<br/>Encontre seu eixo.</h2><p>No navegador ou na sua tela inicial.<br/>Um espaço para cuidar do seu dinheiro.</p><div><InstallPrumo/><Link href="/app" className="ref-text-link"><MotionLabel>Usar no navegador</MotionLabel> <ArrowUpRight size={17}/></Link></div></section>
 <LandingFooter/>
 </main>}
