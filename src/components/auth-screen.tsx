'use client';

import {useState, type FormEvent} from 'react';
import {authClient} from '@/lib/auth-client';
import {PortalShell} from './portal-shell';

export function AuthScreen({signup, enabled}: {signup: boolean; enabled: boolean}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

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

  return <PortalShell label={signup ? '/ 02' : '/ 01'}>
    <p className="portal-eyebrow">Sua conta</p>
    <h1>{signup ? 'Crie sua conta' : 'Entre no Prumo'}</h1>
    <p>{signup ? 'Sincronize seus registros para continuar em outros dispositivos.' : 'Acesse os registros sincronizados na sua conta.'}</p>
    {enabled ? <form onSubmit={submit} aria-busy={busy}>
      {signup && <label>Nome<input name="name" autoComplete="name" maxLength={100} required /></label>}
      <label>E-mail<input name="email" type="email" autoComplete="email" maxLength={254} required /></label>
      <label>Senha<input name="password" type="password" autoComplete={signup ? 'new-password' : 'current-password'} minLength={signup ? 12 : undefined} maxLength={128} required /></label>
      {signup && <p>Use pelo menos 12 caracteres.</p>}
      {error && <p role="alert" className="portal-error">{error}</p>}
      <button className="portal-action" disabled={busy}>{busy ? 'Conectando…' : signup ? 'Criar conta' : 'Entrar'}</button>
    </form> : <p role="status">O acesso à conta está indisponível. Você pode continuar no modo local.</p>}
    <div className="portal-actions">
      {enabled && <a href={signup ? '/login' : '/cadastro'}>{signup ? 'Já tenho conta' : 'Criar conta'}</a>}
      <a href="/app">Usar sem conta</a>
    </div>
  </PortalShell>;
}
