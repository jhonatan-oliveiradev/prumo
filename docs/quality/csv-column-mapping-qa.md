# QA — Importação de CSV com mapeamento

## Fluxo
CSV reconhecido: direto para revisão. CSV com títulos desconhecidos: escolher colunas distintas para data, descrição e valor, conferir amostra e então revisar.
Arquivos são processados localmente no navegador. Limites preservados: 256 KB, 500 linhas.

## Verificações
- Cabeçalhos Data/Descrição/Valor, inclusive aspas e vírgulas: importar sem pedir mapeamento.
- Cabeçalhos desconhecidos e colunas fora de ordem: selecionar manualmente; bloquear colunas ausentes ou repetidas.
- Mostrar amostra fiel e números monetários corretamente formatados; rejeitar datas e valores inválidos.
- Duplicidades importadas e pagamento de fatura: preservar bloqueios existentes.
- Transferências internas e linhas de saldo inicial: aviso e desmarcação por padrão.
- Selecionar e limpar itens em lote; totais devem refletir apenas itens selecionados.
- Revisar lote antes de salvar, sem fechamento se a gravação falhar.
- Mobile a 320 px, teclado, tabulação, rolagem da amostra, redução de movimento e modo escuro.
- Sem chamadas de upload de arquivo para backend; sem logs de conteúdo financeiro.

## Release
Exigir npm test, tsc --noEmit e Next build verdes. Sem migrations nesta PR. Merge manual depois do QA.
