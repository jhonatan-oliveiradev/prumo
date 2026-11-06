'use client';

import {useState, type FormEvent} from 'react';
import {ArrowRight, ArrowUpRight, Eye, EyeOff} from 'lucide-react';
import {authClient} from '@/lib/auth-client';
import {PortalShell} from './portal-shell';

function GoogleMark() {
  return <svg viewBox="0 0 24 24" width="19" height="19" aria-hidden="true" focusable="false">
    <path fill="#4285F4" d="M21.6 12.23c0-.71-.07-1.39-.18-2.05H12v3.87h5.38a4.6 4.6 0 0 1-2 3.02v2.5h3.23c1.89-1.75 2.99-4.33 2.99-7.34Z"/>
    <path fill="#34A853" d="M12 22c2.7 0 4.97-.9 6.62-2.43l-3.23-2.5c-.9.61-2.04.97-3.39.97-2.61 0-4.83-1.76-5.62-4.13H3.05v2.57A10 10 0 0 0 12 22Z"/>
    <path fill="#FBBC05" d="M6.38 13.91a6.03 6.03 0 0 1 0-3.82V7.52H3.05a10 10 0 0 0 0 8.96l3.33-2.57Z"/>
    <path fill="#EA4335" d="M12 5.96c1.44 0 2.73.49 3.75 1.48l2.81-2.81A9.56 9.56 0 0 0 12 2a10 10 0 0 0-8.95 5.52l3.33 2.57C7.17 7.72 9.39 5.96 12 5.96Z"/>
  </svg>;
}

function AppleMark() {
  return <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">
    <path fill="currentColor" d="M16.37 12.2c.02 2.15 1.89 2.87 1.91 2.88-.02.04-.3 1.02-.98 2.03-.59.88-1.2 1.75-2.17 1.77-.95.02-1.25-.56-2.34-.56-1.08 0-1.42.54-2.31.58-.93.04-1.65-.95-2.24-1.82-1.21-1.76-2.14-4.98-.89-7.16a3.49 3.49 0 0 1 2.95-1.8c.92-.02 1.8.63 2.36.63.56 0 1.61-.78 2.72-.66.46.02 1.75.19 2.58 1.4-.07.05-1.54.9-1.53 2.71ZM14.62 6.42c.5-.6.84-1.44.75-2.27-.72.03-1.6.48-2.12 1.08-.47.54-.89 1.39-.78 2.2.8.06 1.63-.4 2.15-1.01Z"/>
  </svg>;
}

/** UI entry points only: wire each provider to Better Auth after OAuth is configured. */
function SocialProviderButtons() {
  return <div className="portal-social">
    <div className="portal-social-grid" role="group" aria-label="Outras formas de acesso">
      <button type="button" className="portal-social-button" disabled title="Google: integração em breve">
        <GoogleMark /><span>Google</span>
      </button>
      <button type="button" className="portal-social-button" disabled title="Apple: integração em breve">
        <AppleMark /><span>Apple</span>
      </button>
    </div>
    <p className="portal-social-note">Acesso com Google e Apple em breve.</p>
  </div>;
}

export function AuthScreen({signup, enabled}: {signup: boolean; enabled: boolean}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!enabled || busy) return;
    const form = new FormData(event.currentTarget);
    const input = {email: String(form.get('email')).trim(), password: String(form.get('password'))};
    const name = String(form.get('name') ?? '').trim();
    if (signup && !name) { setError('Informe seu nome.'); return; }
    setError('');
    setBusy(true);
    try {
      const result = signup ? await authClient.signUp.email({...input, name}) : await authClient.signIn.email(input);
      if (result.error) {
        setError(result.error.status === 429 ? 'Muitas tentativas. Aguarde um momento e tente novamente.' :
          signup ? 'Não foi possível criar a conta. Confira os campos ou tente entrar com esse e-mail.' :
            'Não foi possível entrar. Confira o e-mail e a senha.');
        return;
      }
      window.location.assign('/app');
    } catch {
      setError('Não foi possível conectar. Confira sua conexão e tente novamente.');
    } finally {
      setBusy(false);
    }
  }

  return <PortalShell fullHeight>
    <div className="portal-auth-heading">
      <h1>{signup ? 'Crie sua conta' : 'Entre no Prumo'}</h1>
      <p className="portal-auth-description">
        {signup ? 'Tenha seus registros à mão, em qualquer dispositivo.' : 'Continue de onde parou, com seus registros sincronizados.'}
      </p>
    </div>

    {enabled ? <>
      <SocialProviderButtons />
      <div className="portal-divider"><span>ou continue com e-mail</span></div>
      <form className="portal-auth-form" onSubmit={submit} aria-busy={busy}>
        {signup && <div className="portal-field">
          <label htmlFor="portal-name">Nome</label>
          <input id="portal-name" name="name" autoComplete="name" maxLength={100} required />
        </div>}
        <div className="portal-field">
          <label htmlFor="portal-email">E-mail</label>
          <input id="portal-email" name="email" type="email" autoComplete="email" inputMode="email" maxLength={254} required />
        </div>
        <div className="portal-field">
          <label htmlFor="portal-password">Senha</label>
          <div className="portal-password-field">
            <input id="portal-password" name="password" type={passwordVisible ? 'text' : 'password'}
              autoComplete={signup ? 'new-password' : 'current-password'}
              minLength={signup ? 12 : undefined} maxLength={128} required />
            <button type="button" className="portal-password-toggle"
              onClick={() => setPasswordVisible(value => !value)}
              aria-label={passwordVisible ? 'Ocultar senha' : 'Mostrar senha'}
              aria-pressed={passwordVisible}>
              {passwordVisible ? <EyeOff size={17} aria-hidden="true" /> : <Eye size={17} aria-hidden="true" />}
            </button>
          </div>
          {signup && <p className="portal-password-hint">Use pelo menos 12 caracteres.</p>}
        </div>
        {error && <p role="alert" className="portal-error">{error}</p>}
        <button type="submit" className="portal-action portal-submit" disabled={busy}>
          <span>{busy ? 'Conectando…' : signup ? 'Criar conta' : 'Entrar'}</span>
          {!busy && <ArrowRight size={17} aria-hidden="true" />}
        </button>
      </form>
    </> : <p className="portal-unavailable" role="status">
      O acesso com conta não está configurado neste ambiente. Você ainda pode usar o Prumo sem entrar.
    </p>}

    <div className="portal-actions">
      {enabled && <a href={signup ? '/login' : '/cadastro'}>
        {signup ? 'Já tenho conta' : 'Criar conta'} <ArrowUpRight size={15} aria-hidden="true" />
      </a>}
      <a href="/app">Usar sem conta <ArrowUpRight size={15} aria-hidden="true" /></a>
    </div>
  </PortalShell>;
}
