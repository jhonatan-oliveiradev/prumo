/**
 * Presentation helpers for security and device management.
 * Never include session tokens, full user-agent strings, IP addresses or API
 * diagnostics in the visible UI or event logs.
 */

export type AuthSecurityError = {status?:number|null;code?:string|null};

export function securityFailure(error:AuthSecurityError|null|undefined, action:'password'|'sessions'):string{
 const status=Number(error?.status)||0;
 const code=(error?.code??'').toUpperCase();

 if(status===429||code==='TOO_MANY_REQUESTS')
  return 'Muitas tentativas. Aguarde alguns minutos antes de tentar novamente.';
 if(status===401||code==='UNAUTHORIZED'||code==='INVALID_SESSION')
  return 'Sua sessão expirou. Entre novamente para continuar.';
 if(code==='SESSION_NOT_FRESH')
  return 'Para proteger sua conta, entre novamente antes de alterar as configurações de segurança.';
 if(action==='password'&&['INVALID_PASSWORD','INVALID_CREDENTIALS','INVALID_EMAIL_OR_PASSWORD'].includes(code))
  return 'A senha atual não confere. Verifique e tente novamente.';
 if(action==='password'&&['PASSWORD_TOO_SHORT','PASSWORD_TOO_LONG'].includes(code))
  return 'A nova senha precisa ter entre 12 e 128 caracteres.';
 if(status===503||status>=500)
  return 'O serviço de contas não conseguiu concluir a operação. Tente novamente sem alterar seus dados locais.';
 if(action==='sessions')return 'Não foi possível atualizar suas sessões. Tente novamente.';
 return 'Não foi possível alterar a senha. Confira a senha atual e tente novamente.';
}

export function describeSessionDevice(userAgent:string|null|undefined):string{
 const ua=userAgent??'';
 if(!ua)return 'Dispositivo não identificado';
 const os=/iPhone|iPad|iPod/i.test(ua)?'iOS':/Android/i.test(ua)?'Android':
  /Windows NT/i.test(ua)?'Windows':/Macintosh|Mac OS X/i.test(ua)?'macOS':
  /Linux/i.test(ua)?'Linux':'outro dispositivo';
 const browser=/Vivaldi/i.test(ua)?'Vivaldi':/Edg\/|EdgiOS\/|EdgA\//i.test(ua)?'Edge':
  /OPR\/|Opera/i.test(ua)?'Opera':/Firefox\/|FxiOS\//i.test(ua)?'Firefox':
  /CriOS\/|Chrome\//i.test(ua)?'Chrome':/Safari\//i.test(ua)?'Safari':'Navegador';
 return `${browser} · ${os}`;
}

export function humanSessionDate(date:string|Date|null|undefined):string{
 const d=date?new Date(date):null;
 if(!d||!Number.isFinite(d.valueOf()))return 'Data indisponível';
 return new Intl.DateTimeFormat('pt-BR',{dateStyle:'medium'}).format(d);
}
