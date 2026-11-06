# Prumo — Segurança da conta (PR de novembro/2026)

## Funcionalidades entregues

Acesse **Aplicação → Configurações → Segurança da conta** depois de fazer login.

- Alterar senha informando a senha atual, nova senha (12–128 caracteres) e confirmação.
- Encerrar automaticamente as outras sessões ao alterar a senha, via Better Auth.
- Listar sessões ativas, reconhecer navegador e sistema operacional sem mostrar tokens, IPs ou User-Agent completos.
- Identificar a sessão deste dispositivo e permitir encerrar uma sessão remota ou todas as demais.
- Exigir confirmação antes de encerrar sessões e dar feedback diferenciado para senha atual inválida, sessão expirada, sessão antiga, rate limit e indisponibilidade do servidor.
- Não apagar backups nem dados locais quando uma sessão remota é revogada.
- Nenhuma migração de banco ou configuração nova é necessária.

## Critérios de segurança

1. Não registrar ou transmitir senhas fora do endpoint nativo do Better Auth.
2. Não incluir tokens de sessão, hashes, e-mails ou IPs em logs client-side, mensagens de erro ou métricas.
3. Senhas com menos de 12 caracteres ou não coincidentes são rejeitadas antes de enviar ao servidor.
4. O usuário nunca deve conseguir revogar a sessão atual individualmente pela lista; deve usar Sair.
5. Alterar senha com `revokeOtherSessions:true` encerra sessões remotas, sem destruir a atual.
6. Ações remotas exigem sessão autenticada e autorização pelo Better Auth.
7. Não tratar o bloqueio temporário, senha incorreta e falha de servidor como equivalentes.

## QA no Preview / Production

- Com uma conta de teste, abrir `/app/configuracoes` e conferir a área de segurança.
- Digitar senha nova inválida / confirmação diferente, verificar o feedback e que o formulário permanece aberto.
- Tentar senha atual incorreta e validar feedback.
- Alterar a senha com sucesso; tentar login com a senha antiga e nova em outra aba privada.
- Abrir uma sessão em dois navegadores distintos; conferir que a lista representa ambos sem expor tokens na interface.
- Encerrar somente a sessão remota e verificar que ela perde autenticação na próxima requisição ao servidor.
- Entrar novamente e usar Encerrar outras sessões.
- Usar somente o domínio canônico `https://www.prumo-finance.online`. Os previews de PR não possuem acesso autenticado por padrão.
- Testar desktop, iOS/Android, modo escuro, navegação com teclado e zoom a 200%.

## Pendências deliberadas

- Recuperação de senha por e-mail: requer serviço de envio transacional verificado (ex.: Resend), domínio/remetente autorizado e link assinado de curta duração; **não está disponível nesta entrega**.
- E-mail de alerta para alteração de senha e novas sessões: depende do mesmo serviço.
- Cadastro e autenticação por Google/Apple: aguardam credenciais OAuth oficiais.

Nunca publicar uma tela de recuperação que prometa entregar um e-mail sem a integração transacional funcionando.
