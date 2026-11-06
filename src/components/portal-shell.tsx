import type {ReactNode} from 'react';
import '@/app/portal.css';

export function PortalShell({children, label, fullHeight = false}: {children: ReactNode; label: string; fullHeight?: boolean}) {
  return <main className={fullHeight ? "prumo-portal prumo-portal--auth" : "prumo-portal"}>
    <header className="portal-header">
      <a href="/" className="portal-brand"><img src="/logo.svg" width="32" height="32" alt="" /><span>prumo.</span></a>
      <a href="/">Página inicial <span aria-hidden="true">↗</span></a>
    </header>
    <div className="portal-layout">
      <section className="portal-content">{children}</section>
      <div className="portal-art" aria-hidden="true">
        <span className="portal-art-kicker">SEU DINHEIRO, NO EIXO.</span>
        <div className="portal-art-cross" />
        <span className="portal-art-code">{label}</span>
        <span className="portal-art-caption">PRUMO / CONTROLE FINANCEIRO</span>
      </div>
    </div>
  </main>;
}
