'use client';

import {RefreshCw} from 'lucide-react';
import {PortalShell} from './portal-shell';

export function RecoveryScreen({notFound = false, retry}: {notFound?: boolean; retry?: () => void}) {
  return <PortalShell label={notFound ? '404' : ' / !'}>
    <p className="portal-eyebrow">{notFound ? 'Erro 404' : 'Falha de carregamento'}</p>
    <h1>{notFound ? 'Página não encontrada' : 'Não foi possível carregar'}</h1>
    <p>{notFound ? 'Confira o endereço ou volte para o Prumo.' : 'Tente novamente. Se o erro continuar, volte à página inicial.'}</p>
    <div className="portal-actions">
      {retry && <button className="portal-action" onClick={retry}><RefreshCw size={15} />Tentar novamente</button>}
      <a className={notFound ? 'portal-action' : undefined} href="/app">Abrir aplicativo</a>
      <a href="/">Página inicial</a>
    </div>
  </PortalShell>;
}
