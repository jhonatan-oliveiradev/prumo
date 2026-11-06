# Autenticação em ambientes Preview (Vercel)

O formulário de `/login` e `/cadastro` só aparece quando `cloudEnabled()` encontra três variáveis no processo servidor:

| Chave | Finalidade |
| --- | --- |
| `DATABASE_URL` | PostgreSQL de Preview, isolado do Production |
| `BETTER_AUTH_SECRET` | Segredo longo e exclusivo do ambiente Preview |
| `BETTER_AUTH_URL` | Origem HTTPS exata usada para testar o Preview |

## Por que o login pode desaparecer no preview

Na Vercel, variáveis marcadas apenas como `Production` **não** são disponibilizadas automaticamente a `Preview`. Variáveis de `Preview` associadas a uma branch específica só são usadas naquela branch. Se alguma das três variáveis faltar, `src/lib/server/auth.ts` devolve `cloudEnabled() === false`, e a tela mostra o estado indisponível em vez dos campos. A rota `/api/auth/[...all]` retorna 503 nesse caso.

## Configuração segura

1. Em **Vercel → Prumo → Settings → Environment Variables**, configure as três chaves para o ambiente **Preview** (ou para a branch de teste desejada).
2. Use **outro banco** (e outro segredo) em Preview. Nunca replique por conveniência o banco de Production em cada PR.
3. Use uma origem estável para os testes de autenticação e configure `BETTER_AUTH_URL` para essa origem, respeitando os redirects e origens permitidas pelo Better Auth.
4. Execute as migrations do Prisma explicitamente no banco de Preview antes dos testes (não pelo build).
5. Faça um novo deploy do Preview e teste a rota de login e a criação de conta; não basta somente a build terminar com `READY`.

A aplicação continua utilizável em modo local quando o backend de conta não está configurado. **Nenhum segredo deve ser salvo no repositório ou no cliente.**
