import type {Metadata} from 'next';
import Link from 'next/link';
import {SITE_DESCRIPTION, SITE_TITLE, SITE_URL} from '@/lib/seo';
import {SeoJsonLd} from '@/components/seo-json-ld';
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
export const metadata: Metadata = {
  title: {absolute: SITE_TITLE},
  description: SITE_DESCRIPTION,
  alternates: {canonical: SITE_URL},
};
export default function Landing(){return <main className="landing reference-landing"><SeoJsonLd/><LandingMotion/><LandingScroll/><a href="#conteudo" className="ref-skip">Pular para o conteúdo</a><ReferenceNavigation/>
 <LandingHero/>
 <AlignmentField/>
 <div className="ref-capabilities" aria-label="Recursos do Prumo">{[{Icon:Wallet,label:'Contas e transações'},{Icon:Repeat2,label:'Compromissos e recorrências'},{Icon:Target,label:'Orçamentos e metas'},{Icon:Sparkles,label:'Orientação por IA'}].map(({Icon,label})=><a key={label} href="#recursos"><Icon size={19}/><MotionLabel>{label}</MotionLabel><ArrowUpRight size={13}/></a>)}</div>
 <FinanceLayers/>
 <UseCaseExplorer/>
 <section className="ref-product-directory" aria-labelledby="directory-title"><div data-reveal><p className="eyebrow">RECURSOS DO PRUMO</p><h2 id="directory-title">Do saldo do mês<br/>às suas metas.</h2></div><div>{[{title:'Entenda',items:[['Visão geral','Saldo e movimento do mês.'],['Transações','Receitas e despesas por conta e categoria.']]},{title:'Organize',items:[['Compromissos','Pagamentos e recebimentos pendentes.'],['Recorrências','Lançamentos que se repetem.']]},{title:'Planeje',items:[['Orçamentos e metas','Limites por categoria e valores reservados.'],['Conselheiro','Análise dos indicadores do mês.']]}].map(group=><div className="directory-group" key={group.title}><h3>{group.title}</h3>{group.items.map(([title,detail])=><Link key={title} href="/app"><div><strong><MotionLabel>{title}</MotionLabel></strong><p>{detail}</p></div><ArrowUpRight size={18}/></Link>)}</div>)}</div></section>
 <section className="ref-advisor-section" id="conselheiro"><div className="ref-advisor-copy" data-reveal><p className="eyebrow">CONSELHEIRO</p><h2>Uma leitura dos<br/>números do mês.</h2><p>Peça ao Conselheiro para apontar gastos, compromissos e metas que merecem atenção. Você autoriza cada análise.</p><ul><li><Check size={17}/>Indicadores gerais, sem valores exatos</li><li><Check size={17}/>Sem nomes ou descrições dos registros</li><li><Check size={17}/>A análise não altera seus registros</li></ul><Link href="/app" className="secondary"><MotionLabel>Abrir o Prumo</MotionLabel> <ArrowUpRight size={16}/></Link><small>Requer conta, sincronização e disponibilidade do Gemini. A IA pode errar.</small></div><div className="ref-advisor-art"><div className="ref-orbit" aria-hidden="true"><span/><span/><Sparkles size={40}/></div><div className="ref-advice-card"><span>EXEMPLO DE ORIENTAÇÃO</span><h3>Confira as contas<br/>a vencer.</h3><p>Confira os compromissos e confirme os recebimentos antes de planejar novos gastos.</p><span><ShieldCheck size={14}/> Análise somente para consulta</span></div></div></section>
 <section className="ref-start-section"><div><p className="eyebrow">PRIMEIROS PASSOS</p><h2>Comece com<br/>o saldo de hoje.</h2></div><div className="ref-start-links"><Link href="/app"><span><MotionLabel>Adicionar a primeira conta</MotionLabel></span><p>Abra o app e informe quanto há na conta hoje.</p><ArrowUpRight size={19}/></Link><a href="#instalar"><span><MotionLabel>Instalar o Prumo</MotionLabel></span><p>Instale a versão web no celular ou computador.</p><ArrowUpRight size={19}/></a><Link href="/app"><span><MotionLabel>Sincronizar seus dados</MotionLabel></span><p>Entre na conta para sincronizar entre dispositivos.</p><ArrowUpRight size={19}/></Link></div></section>
 <section className="ref-closing" id="instalar"><img src="/logo.svg" alt="" width="54" height="54"/><h2>Prumo no celular<br/>e no computador.</h2><p>Instale para abrir pela tela inicial.<br/>Você também pode usar direto no navegador.</p><div><InstallPrumo/><Link href="/app" className="ref-text-link"><MotionLabel>Usar no navegador</MotionLabel> <ArrowUpRight size={17}/></Link></div></section>
 <LandingFooter/>
 </main>}
