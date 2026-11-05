# Prumo — confirmações, recorrências e landing

## Confirmações

O provider central usa Radix AlertDialog e resolve uma Promise somente após a decisão. Cancelar recebe foco inicial; decisões destrutivas têm ação explícita e cor própria. Uma segunda solicitação simultânea é recusada, sem substituir a decisão em andamento. Desmontar o provider resolve a decisão como cancelada.

Fluxos migrados: usar versão da nuvem, importar modo local, sair da conta, restaurar backup, excluir parcelas e pausar recorrência. A API de instalação da PWA continua usando o prompt do sistema, necessário para instalar; não é um alert/confirm do JavaScript.

## Recorrências

Lista como padrão; cards compactos como alternativa, preferência salva localmente em `prumo:recurrences-view`. Busca por descrição e filtro por situação. Lista contém conta/categoria, frequência, valor por ocorrência, situação e ações com rótulos acessíveis. Em telas estreitas cada linha usa duas faixas. Frequências diferentes não são somadas como se fossem valores mensais.

## Landing: direção de movimento

Personalidade: precisa, serena, espacial.

- Entrada curta de 24px/650ms para conectar a leitura das seções; um reveal por seção.
- Troca de demonstração em 350ms; feedback de botões em 180ms.
- A composição de produto é o elemento principal; linhas de alinhamento e profundidade ficam subordinadas.
- Sem scroll hijacking, RAF permanente, parallax contínuo ou dependência de WebGL.
- CSS para estados/troca de painel; Web Animations API + IntersectionObserver para entrada única. Cleanup de observers/animations e reação a mudanças de movimento reduzido.
- Conteúdo renderizado no servidor permanece visível sem JS. Movimento reduzido deixa os mesmos recursos disponíveis, sem entrada animada.

A demonstração permite explorar panorama, planejamento e orientação por mouse, toque ou teclado (setas, Home e End). Todos os valores são fictícios e identificados como demonstração. Não há chamada à IA ou escrita financeira na landing.

## Verificação

Build, TypeScript e suíte existente. Confirmar em navegador: decisão cancelada não muda dados; Escape/cancelamento e restauração de foco; confirmação sobre modal de parcelas; lista/cards e filtro persistente; tabs por teclado; 320px/desktop; movimento reduzido; landing sem JS. A renderização e o comportamento em navegador não são inferidos do build.
