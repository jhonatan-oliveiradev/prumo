/**
 * Messages shown after a Better Auth response.
 * Never expose raw provider messages or distinguish unknown emails from bad passwords.
 */
export type AuthAttempt = 'signin' | 'signup';
export type AuthResponseError = {
  code?: string | null;
  status?: number | null;
  message?: string | null;
};
export type AuthFeedback = {
  title: string;
  description: string;
  reference: string;
  category: 'credentials' | 'validation' | 'account' | 'rate-limit' | 'configuration' | 'service' | 'network';
};

const explain = (category:AuthFeedback['category'],title:string,description:string,reference:string):AuthFeedback=>
  ({category,title,description,reference});

const invalidLogin = () => explain(
  'credentials',
  'Não foi possível confirmar seus dados',
  'O e-mail e a senha não correspondem a uma conta deste ambiente. Revise os dados. Se você se cadastrou em uma versão de teste, o cadastro pode não estar disponível no site oficial.',
  'AUTH_INVALID_CREDENTIALS',
);

export function authNetworkFailure():AuthFeedback{
  return explain('network','Não foi possível alcançar o serviço',
    'Verifique sua conexão e tente novamente. Seus dados digitados foram mantidos.',
    'AUTH_NETWORK');
}

export function authSessionFailure():AuthFeedback{
  return explain('configuration','Não conseguimos manter sua sessão',
    'A autenticação respondeu, mas não foi possível confirmar a sessão neste navegador. Verifique se cookies estão permitidos e acesse o domínio oficial do Prumo.',
    'AUTH_SESSION');
}

export function describeAuthFailure(error:AuthResponseError,attempt:AuthAttempt):AuthFeedback{
  // Do not render raw error.message, which may contain implementation details.
  const code=(error.code??'').trim().toUpperCase();
  const status=Number(error.status)||0;

  if(status===429||code==='TOO_MANY_REQUESTS'||code==='RATE_LIMIT_EXCEEDED')
    return explain('rate-limit','Muitas tentativas de acesso',
      'Por segurança, novas tentativas foram limitadas temporariamente. Aguarde alguns minutos antes de tentar novamente.',
      'AUTH_RATE_LIMIT');

  if(status===503||status===502||status===504)
    return explain('service','Serviço de contas indisponível',
      'O Prumo não conseguiu concluir a autenticação neste momento. Isso não significa que sua senha esteja incorreta. Tente novamente mais tarde.',
      `AUTH_UNAVAILABLE_HTTP_${status}`);

  if(status>=500)
    return explain('service','Ocorreu uma falha no serviço de login',
      'O servidor não conseguiu processar seu acesso. Isso não confirma um problema na senha. Tente novamente e, se persistir, informe o código abaixo ao suporte.',
      `AUTH_SERVER_HTTP_${status}`);

  if(['INVALID_ORIGIN','CROSS_SITE_NAVIGATION_LOGIN_BLOCKED','MISSING_OR_NULL_ORIGIN','INVALID_CALLBACK_URL'].includes(code))
    return explain('configuration','O endereço de acesso não foi aceito',
      'Abra o Prumo pelo endereço oficial e tente novamente. O navegador ou a configuração do ambiente pode ter bloqueado a solicitação.',
      'AUTH_ORIGIN');

  if(code==='EMAIL_NOT_VERIFIED')
    return explain('account','Este acesso exige verificação de e-mail',
      'O serviço de contas informou que seu endereço ainda precisa ser verificado. A verificação automática não está disponível nesta tela.',
      'AUTH_EMAIL_VERIFICATION');

  if(attempt==='signin'){
    if(code==='INVALID_EMAIL')
      return explain('validation','Confira o endereço de e-mail',
        'O formato do e-mail não foi aceito. Revise o endereço digitado e tente novamente.',
        'AUTH_EMAIL_FORMAT');

    if(['INVALID_EMAIL_OR_PASSWORD','INVALID_PASSWORD','USER_NOT_FOUND','CREDENTIAL_ACCOUNT_NOT_FOUND','ACCOUNT_NOT_FOUND','INVALID_USER'].includes(code)
       ||status===401)
      return invalidLogin();
  }

  if(attempt==='signup'){
    if(['USER_ALREADY_EXISTS','USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL'].includes(code))
      return explain('account','Não foi possível cadastrar este e-mail',
        'Confira o endereço informado. Se você já possui uma conta, utilize a opção Entrar.',
        'AUTH_SIGNUP_CONFLICT');
    if(code==='PASSWORD_TOO_SHORT'||code==='PASSWORD_TOO_LONG')
      return explain('validation','Revise o tamanho da senha',
        'Use uma senha entre 12 e 128 caracteres.',
        'AUTH_PASSWORD_LENGTH');
    if(code==='INVALID_EMAIL')
      return explain('validation','Confira o endereço de e-mail',
        'Informe um e-mail válido antes de criar a conta.',
        'AUTH_EMAIL_FORMAT');
  }

  if(status===404)
    return explain('configuration','Serviço de autenticação não encontrado',
      'O serviço de contas não respondeu no endereço esperado. Abra o domínio oficial e tente novamente.',
      'AUTH_ENDPOINT_MISSING');

  if(status===403)
    return explain('account','O serviço recusou este acesso',
      'Não foi possível autorizar a solicitação. Confira se você está no endereço oficial e tente novamente.',
      'AUTH_FORBIDDEN');

  if(status===400||status===422)
    return attempt==='signin'
      ? invalidLogin()
      : explain('validation','Não foi possível validar o cadastro',
        'Revise os campos informados e tente novamente. Nenhuma conta foi confirmada por esta tentativa.',
        'AUTH_SIGNUP_VALIDATION');

  return explain('service','Não foi possível concluir a autenticação',
    'O serviço retornou uma resposta inesperada. Isso não confirma que sua senha esteja incorreta. Tente novamente ou informe o código abaixo ao suporte.',
    status?`AUTH_UNEXPECTED_HTTP_${status}`:'AUTH_UNEXPECTED');
}
