'use client';

import Link from 'next/link';
import {MotionLabel} from './motion-label';
import {ArrowRight, ArrowUpRight} from 'lucide-react';
import {useCallback, useEffect, useLayoutEffect, useRef, useState} from 'react';
import GradientASCII from './gradient-ascii';
import {useLaunchReady} from './launch-provider';

const palette = ['#14291d', '#28513b', '#567b62', '#91b59c'];
const glyphs = ' /+$01:.';

/** Stable real text determines wrapping; decorative glyphs never reach AT. */
function Decode({text, play}: {text: string; play: boolean}) {
  const ref = useRef<HTMLSpanElement>(null);
  useLayoutEffect(() => {
    const node = ref.current;
    if (!node || !play || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    node.textContent = Array.from(text, (char, i) => /\s/.test(char) ? char : glyphs[i % glyphs.length]).join('');
    let frame = 0, start = 0, last = 0;
    const run = (now: number) => {
      start ||= now;
      const progress = Math.min(1, (now - start) / 520);
      if (now - last > 45 || progress === 1) {
        last = now;
        node.textContent = Array.from(text, (char, i) => /\s/.test(char) || i / text.length < progress ? char : glyphs[(i + Math.floor(now / 60)) % glyphs.length]).join('');
      }
      if (progress < 1) frame = requestAnimationFrame(run);
      else node.textContent = text;
    };
    frame = requestAnimationFrame(run);
    return () => { cancelAnimationFrame(frame); node.textContent = text; };
  }, [play, text]);
  return <span className="decode-text"><span>{text}</span><span ref={ref} aria-hidden="true">{text}</span></span>;
}

export function LandingHero() {
  const launchReady = useLaunchReady();
  const [phase, setPhase] = useState<'waiting'|'field'|'content'>('waiting');
  const complete = useCallback(() => {
    document.documentElement.classList.remove('prumo-intro');
    setPhase('content');
  }, []);
  useEffect(() => {
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    if (reduced.matches || location.hash || !document.documentElement.classList.contains('prumo-intro')) { complete(); return; }
    if (!launchReady) return;
    setPhase('field');
    const timeout = setTimeout(complete, 1900); // Fail open even on a stalled GPU.
    const onReduced = () => { if (reduced.matches) complete(); };
    reduced.addEventListener('change', onReduced);
    return () => { clearTimeout(timeout); reduced.removeEventListener('change', onReduced); };
  }, [launchReady, complete]);
  useEffect(() => {
    window.addEventListener('hashchange', complete);
    return () => window.removeEventListener('hashchange', complete);
  }, [complete]);
  const revealed = phase === 'content';
  return <section className="hero-scene" id="conteudo" data-phase={phase}>
    <div className="hero-ascii" aria-hidden="true">{phase !== 'waiting' && <GradientASCII colors={palette} characters=" /+x01$#" cellSize={16} density={.7} glyphOpacity={.95} gradientOpacity={.5} glow={.08} flow={.3} flicker={.08} speed={.5} grain={.025} dpr={1.25} onComplete={complete}/>}</div>
    <div className="ref-hero">
      <div className="ref-hero-copy">
        <p className="eyebrow"><Decode text="CLAREZA PARA A VIDA REAL" play={revealed}/></p>
        <h1><Decode text="O seu dinheiro." play={revealed}/><br/><Decode text="Um novo" play={revealed}/>{' '}<span><Decode text="ponto de vista." play={revealed}/></span></h1>
        <p><Decode text="Registre o que acontece hoje." play={revealed}/><br/><Decode text="Entenda o que está por vir." play={revealed}/><br/><Decode text="Encontre seu próximo passo." play={revealed}/></p>
        <div className="ref-hero-actions"><Link href="/app" className="primary"><MotionLabel>Começar a organizar</MotionLabel><ArrowRight size={17}/></Link><a href="#camadas" className="secondary"><MotionLabel>Explore o Prumo</MotionLabel><ArrowUpRight size={16}/></a></div>
      </div>
      <a className="ref-hero-note" href="#instalar"><span/><MotionLabel>SEU ESPAÇO. ONDE VOCÊ ESTIVER.</MotionLabel><ArrowUpRight size={14}/></a>
    </div>
    {phase !== 'content' && <button className="hero-skip-intro" onClick={complete}><MotionLabel>Pular apresentação</MotionLabel> <ArrowRight size={13}/></button>}
  </section>;
}
