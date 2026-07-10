# Sistema de Design Bentix

## Índice

- [1. Objetivo](#1-objetivo)
- [2. Filosofia da Bentix](#2-filosofia-da-bentix)
- [3. Princípios de Produto](#3-princípios-de-produto)
- [4. Identidade Visual](#4-identidade-visual)
- [5. Sistema de Cores](#5-sistema-de-cores)
- [6. Tipografia](#6-tipografia)
- [7. Espaçamentos](#7-espaçamentos)
- [8. Bordas e Sombras](#8-bordas-e-sombras)
- [9. Botões](#9-botões)
- [10. Hierarquia de Ações](#10-hierarquia-de-ações)
- [11. Cartões](#11-cartões)
- [12. Etiquetas de Estado e Estados](#12-etiquetas-de-estado-e-estados)
- [13. Formulários](#13-formulários)
- [14. Calendário](#14-calendário)
- [15. Estrutura e Organização de Página](#15-estrutura-e-organização-de-página)
- [16. Responsividade / Estrutura Adaptativa](#16-responsividade--estrutura-adaptativa)
- [17. Componentes Reutilizáveis](#17-componentes-reutilizáveis)
- [18. Estados da Interface](#18-estados-da-interface)
- [19. Acessibilidade](#19-acessibilidade)
- [20. Nomenclatura](#20-nomenclatura)
- [21. Regras de Evolução](#21-regras-de-evolução)

## 1. Objetivo

Este documento define o sistema de design oficial da Bentix. É a referência principal para decisões futuras de interface, usabilidade, consistência visual, responsividade e evolução do produto.

O objetivo não é apenas uniformizar a aparência. O objetivo é criar uma linguagem de interface que ajude equipas operacionais a compreender contexto, executar ações mais depressa e reduzir erro humano.

Este documento aplica-se a:

- páginas administrativas
- fluxos operacionais
- páginas móveis e PWA
- componentes reutilizáveis
- novos módulos
- refatorações visuais

Sempre que uma decisão de interface não estiver claramente documentada, este documento deve ser o ponto de partida.

## 2. Filosofia da Bentix

A Bentix é uma plataforma operacional. A sua interface deve apoiar a decisão humana, não substituí-la.

Princípios base:

- A Bentix não toma decisões operacionais pelo utilizador.
- A Bentix reduz o tempo necessário para executar decisões.
- A Bentix mostra primeiro o contexto principal e depois o detalhe.
- A Bentix privilegia clareza antes de decoração.
- A Bentix deve transmitir controlo, calma e confiança.

Isto significa que a interface deve:

- explicar rapidamente onde o utilizador está
- mostrar o que é mais importante primeiro
- tornar a ação principal evidente
- reduzir ruído visual
- reduzir passos desnecessários

O sistema de design da Bentix não é um exercício estético isolado. É uma ferramenta operacional.

## 3. Princípios de Produto

Todas as decisões de UI e UX devem respeitar estes princípios:

- A aplicação deve estar 100% em português para o utilizador.
- A interface deve adaptar-se ao ecrã disponível.
- Nunca assumir um tamanho fixo de monitor.
- Reduzir cliques sempre que possível.
- Reduzir scroll sempre que possível.
- Mostrar primeiro o contexto principal.
- Ações principais devem estar claras.
- Ações secundárias não devem competir visualmente.
- O utilizador deve perceber rapidamente qual é a próxima ação útil.
- Nenhuma página deve inventar padrões novos sem atualizar o Sistema de Design.

Regras práticas:

- Se o utilizador tiver de procurar o contexto principal da página, a hierarquia está errada.
- Se a página depender de larguras fixas para funcionar bem, a solução está errada.
- Se uma ação secundária parecer mais importante do que a principal, a solução está errada.
- Se o utilizador vir textos misturados entre português e inglês, a solução está errada.

## 4. Identidade Visual

A identidade visual da Bentix combina robustez operacional com acabamento contemporâneo. A linguagem visual deve parecer séria, estável e confortável de utilizar ao longo de muitas horas.

Características visuais principais:

- fundos claros com atmosfera suave
- cabeçalhos fortes em azul escuro
- superfícies quentes e legíveis
- acentos laranja para ação primária
- cantos arredondados generosos
- sombras suaves e controladas
- contraste suficiente para leitura imediata

Direção visual:

- profissional, mas não fria
- moderna, mas não experimental
- sofisticada, mas não luxuosa
- densa o suficiente para operação, mas nunca apertada

Padrão visual de referência atual:

- A página de Planeamento Diário é o padrão visual de referência da Bentix neste momento.
- A data funciona como contexto central.
- Os cartões de resumo têm contraste elevado.
- O calendário abre em painel flutuante.
- Os cartões operacionais adaptam-se responsivamente ao ecrã.

Novas páginas devem aproximar-se desta linguagem quando o caso de uso for semelhante.

## 5. Sistema de Cores

O sistema de cores da Bentix é semântico. As cores devem ser escolhidas pelo papel que desempenham, não apenas pela aparência.

Tokens base atualmente definidos:

- `--vp-page-start`: `#f5efe7`
- `--vp-page-end`: `#ffe2bc`
- `--vp-surface`: `#fff5e8`
- `--vp-surface-alt`: `#fff0de`
- `--vp-surface-muted`: `#ffedd8`
- `--vp-highlight`: `#e5efff`
- `--vp-highlight-text`: `#1d4ed8`
- `--vp-border`: `#e7ccb0`
- `--vp-border-strong`: `#dcb48b`
- `--vp-accent`: `#ff8c00`
- `--vp-accent-strong`: `#ea7b00`
- `--vp-text`: `#14243d`
- `--vp-text-muted`: `#5d7391`
- `--vp-text-soft`: `#7991b2`

Superfícies e gradientes principais:

- `--vp-page-background`: fundo atmosférico global
- `--vp-module-hero`: cabeçalho principal azul escuro
- `--vp-hero-surface`: camada translúcida para conteúdo sobre cabeçalho escuro
- `--vp-stat-surface`: superfície de cartões de resumo
- `--vp-surface-soft`: superfície principal de painéis
- `--vp-surface-soft-strong`: superfície clara com maior presença visual

Regras de utilização:

- azul escuro para contexto forte, cabeçalhos e zonas de autoridade visual
- laranja para ações primárias e destaques funcionais
- superfícies claras para leitura, organização e conforto visual
- texto principal sempre em tons escuros de boa legibilidade
- texto secundário pode ser mais suave, mas nunca difícil de ler
- nenhuma informação crítica deve depender apenas de cor

Estados e cores:

- sucesso deve transmitir confirmação sem agressividade
- rascunho deve parecer transitório, mas claramente visível
- vazio deve ser legível e calmo
- perigo deve ser reservado a ações destrutivas ou alertas reais

## 6. Tipografia

A tipografia da Bentix deve privilegiar leitura rápida, autoridade e estabilidade visual.

A Bentix Design System referencia a especificação tipográfica oficial em [Bentix Typography Guide](./BENTIX_TYPOGRAPHY_GUIDE.md). O [Bentix Visual Identity](./BENTIX_VISUAL_IDENTITY.md) descreve a identidade da marca. Este documento define como a tipografia é aplicada na interface.

Fonte oficial implementada:

- `Inter`

Implementação tipográfica oficial:

- `next/font/google`
- tokens tipográficos partilhados
- classes tipográficas partilhadas

Princípios tipográficos:

- títulos devem criar contexto imediato
- datas ou elementos operacionais centrais podem assumir maior destaque
- rótulos devem ser curtos, claros e legíveis
- números devem ter peso visual suficiente
- texto auxiliar deve apoiar, não competir

Hierarquia recomendada:

- título de página
- contexto primário da página
- título de secção
- rótulo de cartão
- valor de cartão
- texto auxiliar

Regras:

- nunca usar inglês em texto apresentado ao utilizador
- evitar textos longos dentro de cartões de resumo
- evitar excesso de estilos tipográficos diferentes na mesma página
- garantir que os valores principais continuam legíveis em ecrãs móveis

### Official Decision Log

| Item | Decision |
| --- | --- |
| Status | IMPLEMENTED |
| Official Font | `Inter` |
| Reason | Legibilidade enterprise, consistência cross-platform, conforto em sessões longas, sustentabilidade open source, integração nativa com Next.js |
| Implementation | `next/font/google` mais tokens tipográficos partilhados e classes tipográficas partilhadas |

## 7. Espaçamentos

O espaçamento na Bentix deve criar ordem e ritmo. Não deve desperdiçar altura útil nem comprimir a leitura.

Escala recomendada:

- `8px` para micro-ajustes
- `12px` para proximidade funcional
- `16px` para espaçamento base entre elementos
- `18px` a `20px` para densidade de cartões
- `24px` para painéis e secções
- `32px` ou mais para separação entre grandes blocos

Princípios:

- reduzir vazio sem sacrificar clareza
- separar blocos por importância, não por hábito
- permitir leitura rápida do topo para a base
- manter relações previsíveis entre secções

Aplicação:

- títulos e contexto central precisam de mais respiração do que listas internas
- painéis devem ter margem interna suficiente para não parecer apertados
- listas operacionais devem ser compactas, mas nunca esmagadas
- em ecrãs móveis, o espaçamento deve continuar confortável ao toque

## 8. Bordas e Sombras

A Bentix usa cantos arredondados e profundidade suave para transmitir modernidade, organização e conforto visual.

Referências atuais:

- painel principal: raio aproximado de `24px`
- cartão estatístico: raio aproximado de `20px`
- cartão operacional: raio aproximado de `22px`
- zona de largada: raio aproximado de `18px`

Sombras principais:

- `--vp-shadow-soft`
- `--vp-shadow-panel`
- `--vp-shadow-hero`
- `--vp-shadow-modal`

Regras:

- sombras devem ser macias e difusas
- modais podem ter sombra mais marcada do que painéis normais
- bordas claras ajudam a separar superfícies sem endurecer a interface
- não usar sombras fortes como substituto de hierarquia

## 9. Botões

Os botões devem refletir prioridade operacional.

Hierarquia de ações:

- primário: ação principal da área atual
- secundário: ação útil, mas não dominante
- terciário ou discreto: ação de apoio
- destrutivo: ação com impacto negativo ou irreversível

Regras:

- cada área deve ter, no máximo, uma ação visualmente dominante
- ações secundárias não devem competir com a principal
- ações destrutivas devem ser claras e prudentes
- foco e reação ao cursor devem ser subtis e previsíveis
- em ecrãs móveis, o alvo de toque deve permanecer confortável

Aplicação prática:

- `Publicar`, `Guardar` ou `Adicionar` podem ser ações principais, consoante o fluxo
- ações como `Importar mensagem` devem parecer secundárias
- grupos de ações devem ficar próximos do contexto a que pertencem

## 10. Hierarquia de Ações

A hierarquia de ações passa a ser uma regra oficial e obrigatória do sistema de design Bentix.

Cada página deve comunicar imediatamente ao utilizador:

- "Qual é a ação final desta página?"

Se a interface não responder visualmente a esta pergunta, a hierarquia está errada.

### Regra 1. Uma única ação primária por página

Cada página deve ter apenas uma ação primária com maior destaque visual.

Botão primário:

- laranja Bentix preenchido
- texto branco
- maior ênfase visual

Exemplos:

- Planeamento -> `Publicar`
- Pessoas -> `Guardar`
- Clientes -> `Guardar`
- Obras -> `Guardar`
- Aprovação de horas -> `Aprovar`
- Notificações -> `Enviar`

### Regra 2. Todas as restantes são ações secundárias

Todas as ações que apoiam o fluxo, mas não representam a decisão final da página, devem usar estilo secundário.

Botão secundário:

- fundo branco
- contorno laranja
- texto laranja

Exemplos:

- `Novo plano`
- `Copiar anterior`
- `Importar mensagem`
- `Acessos às obras`
- `Editar publicação`
- `Cancelar`

### Regra 3. Ações destrutivas

Aparência destrutiva é reservada apenas a operações destrutivas.

Exemplos:

- `Eliminar pessoa`
- `Eliminar obra`
- `Eliminar cliente`

Botão destrutivo:

- contorno vermelho
- ícone e/ou texto vermelho

### Regra 4. Ações desativadas

Estados desativados nunca devem manter cor laranja ativa.

Botão desativado:

- fundo cinzento
- texto cinzento

Regra:

- nunca usar laranja para comunicar uma ação indisponível

### Regra 5. Prioridade visual

O olhar do utilizador deve seguir naturalmente esta ordem:

- ações secundárias
- ação primária
- ações destrutivas, apenas quando existirem

O objetivo não é esconder a ação principal. O objetivo é garantir que ela é percebida como o destino final do fluxo.

### Regra 6. Consistência

Toda a nova página ou página redesenhada deve respeitar esta hierarquia.

Regras:

- não criar exceções locais sem necessidade real
- não promover ações secundárias ao mesmo nível da principal
- não usar estilo destrutivo em ações neutras

### Estratégia de Implementação

Esta hierarquia não será aplicada globalmente numa única release.

Estratégia oficial:

- não redesenhar toda a aplicação de uma vez
- aplicar a hierarquia progressivamente
- obrigar cada futura refatoração UX/UI a adotar este padrão
- melhorar consistência sem introduzir regressões visuais ou funcionais

Isto permite evolução controlada e evita corrigir visualmente uma área enquanto se parte noutra.

## 11. Cartões

Os cartões são o principal bloco de construção visual da Bentix.

Tipos principais:

- cartão de painel
- cartão de resumo
- cartão operacional
- cartão de zona de largada

Função de cada tipo:

- Painel: agrupa conteúdo e estrutura secções
- Resumo: mostra estado, contagem ou indicador principal
- Operacional: representa uma unidade de trabalho, como uma obra
- Zona de largada: recebe interação específica sem competir com a área principal

Regras:

- cartões devem ter leitura imediata
- números devem ser os elementos mais legíveis
- rótulos devem ter contraste suficiente
- conteúdo não deve partir quando a largura diminuir
- o mesmo tipo de cartão deve manter comportamento visual consistente em toda a aplicação

## 12. Etiquetas de Estado e Estados

Etiquetas de estado e estados servem para comunicar situação sem ambiguidade.

Estados comuns:

- Publicado
- Rascunho
- Sem planeamento
- Pendente
- Submetido
- Aprovado

Regras:

- o texto do estado deve bastar para compreensão
- a cor reforça o significado, mas não o substitui
- etiquetas devem manter contraste legível
- estados calmos continuam a precisar de visibilidade
- estados destrutivos ou críticos devem ser reservados a situações reais

Exemplos:

- `Publicado` deve parecer estável e confirmado
- `Rascunho` deve indicar trabalho em preparação
- `Sem planeamento` deve ser claramente legível e não parecer um erro visual

## 13. Formulários

Os formulários da Bentix devem privilegiar rapidez, clareza e baixo erro.

Princípios:

- rótulos claros e em português
- agrupamento lógico por tema
- mensagens de validação objetivas
- estrutura simples
- adaptação responsiva sem quebrar fluxo

Regras:

- não esconder contexto importante
- não depender de texto de exemplo como substituto de rótulo
- usar grelhas fluidas em vez de larguras rígidas
- em ecrãs pequenos, o formulário deve empilhar naturalmente

Campos obrigatórios:

- devem ser claros
- devem ser consistentes
- não devem surpreender o utilizador com regras invisíveis

## 14. Calendário

O padrão atual do calendário da Bentix é o painel flutuante acionado a partir da própria data.

Este padrão passa a ser a referência futura para seleção de data quando a data representa o contexto principal da página.

Regras:

- a data pode ser o elemento visual central da página
- o calendário deve abrir em painel flutuante, sem empurrar o conteúdo
- a própria data deve ser o acionador quando fizer sentido
- o calendário deve funcionar com rato, teclado e toque
- meses e dias da semana devem estar em português

Diretrizes visuais:

- painel leve e elegante
- cantos arredondados generosos
- sombra suave
- navegação mensal clara
- dia selecionado visível de imediato
- dia atual indicado com subtileza

## 15. Estrutura e Organização de Página

A estrutura de página Bentix deve seguir uma ordem estável:

1. Título da página
2. Contexto principal
3. Resumo operacional
4. Conteúdo de trabalho
5. Ações secundárias de apoio

Regras:

- a área de conteúdo deve absorver a rolagem quando necessário
- cabeçalho, barra lateral e navegação devem manter-se estáveis quando existirem
- evitar barras de rolagem duplas
- usar contentores consistentes em vez de estruturas arbitrárias
- a composição deve ser densa o suficiente para trabalhar bem, mas nunca confusa

Princípio de contexto:

- o utilizador deve perceber imediatamente que página está a ver
- o utilizador deve perceber imediatamente a que dia, obra, cliente ou entidade a página se refere

## 16. Responsividade / Estrutura Adaptativa

A responsividade não é uma melhoria opcional. Faz parte da qualidade funcional da Bentix.

Princípios:

- nunca assumir um monitor grande
- computador, portátil, tablet e telemóvel são suportados
- a interface deve adaptar-se ao espaço disponível
- rolagem horizontal só quando for indispensável
- uma coluna única deve continuar utilizável

Comportamentos esperados:

- grelhas reorganizam-se pela largura disponível
- cartões podem passar de várias colunas para uma coluna
- o conteúdo não deve sair fora do ecrã
- formulários, listas e áreas operacionais devem continuar utilizáveis em ecrãs pequenos

Regras:

- não usar larguras fixas que partem em portátil ou tablet
- não usar alturas fixas que escondem conteúdo
- não criar barras de rolagem internas sem necessidade
- preservar o conteúdo importante acima da dobra sempre que possível

## 17. Componentes Reutilizáveis

Os padrões visuais da Bentix devem consolidar-se em componentes reutilizáveis, mesmo quando a implementação ainda não esteja totalmente formalizada.

Primitivos recomendados:

- `BentixPage`
- `BentixPageHeader`
- `BentixHero`
- `BentixContent`
- `BentixSection`
- `BentixResponsiveGrid`
- `BentixStatCard`
- `BentixStatusBadge`
- `BentixCalendarPopover`

Objetivo destes primitivos:

- reduzir variações desnecessárias
- acelerar desenvolvimento
- garantir consistência visual
- diminuir dívida de interface

Regra:

- sempre que um padrão se repetir em várias páginas, deve ser candidato a componente reutilizável

## 18. Estados da Interface

Toda a página ou componente deve prever estados explícitos.

Estados mínimos:

- carregamento
- vazio
- pronto
- erro
- desativado

Regras:

- estados vazios devem orientar a próxima ação
- estados de erro devem ser claros e objetivos
- estados desativados não devem parecer defeitos de desenho
- estados de carregamento não devem provocar instabilidade visual desnecessária

Bom estado vazio:

- explica a ausência de conteúdo
- indica a próxima ação útil
- evita linguagem técnica
- não mostra valores técnicos sem benefício para o utilizador

## 19. Acessibilidade

A acessibilidade é um requisito estrutural da Bentix.

Regras:

- contraste suficiente em texto, números e estados
- navegação por teclado preservada
- foco visível
- alvos de toque confortáveis
- textos claros
- português consistente em toda a interface
- cor nunca como único meio de comunicar estado

Aplicação prática:

- datas clicáveis devem poder receber foco
- painéis flutuantes devem fechar com `Esc`
- elementos interativos devem reagir a `Enter` e `Espaço` quando aplicável
- etiquetas de estado claras devem ser reforçadas com contraste e bordo

## 20. Nomenclatura

O utilizador vê português. A interface comunica em português.

Regras:

- rótulos, estados, mensagens, títulos, botões e textos de ajuda devem estar em português
- o mesmo conceito deve manter o mesmo nome entre páginas
- não misturar português e inglês na camada visível

Exemplos corretos:

- `Publicado`
- `Rascunho`
- `Sem planeamento`
- `Criar novo`
- `Pessoas atribuídas`
- `Pessoas não atribuídas`
- `Obras pendentes`

Regras adicionais:

- nomes internos de código podem continuar técnicos quando não são visíveis ao utilizador
- qualquer novo texto visível deve ser validado linguisticamente antes de ficar definitivo

## 21. Regras de Evolução

O Sistema de Design Bentix deve evoluir com o produto, mas de forma controlada.

Regras obrigatórias:

- nenhuma página deve inventar um padrão novo sem atualizar este documento
- alterações visuais relevantes devem ser documentadas
- novos componentes reutilizáveis devem seguir a filosofia Bentix
- exceções devem ser justificadas por necessidade real
- consistência vale mais do que originalidade local

Regra de referência atual:

- A página de Planeamento Diário é o padrão visual de referência da Bentix neste momento.

Isto significa que futuras páginas devem observar, quando aplicável:

- data como contexto central
- resumo antes do detalhe
- cartões com alto contraste
- calendário em painel flutuante
- hierarquia clara entre a ação principal e a ação secundária
- cartões operacionais responsivos

Quando surgir um padrão melhor do que o atual, esse padrão deve ser documentado primeiro e só depois disseminado pelo produto.
