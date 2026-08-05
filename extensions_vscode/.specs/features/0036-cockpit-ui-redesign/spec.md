# Feature: Identidade visual do Cockpit nas telas existentes

- **ID:** 0036-cockpit-ui-redesign
- **Escopo dos identificadores:** COCK
- **Estado:** ver `status.yaml` — a autoridade é ele

> Spec clarificada e refinada. Os requisitos estão fundamentados no texto da solicitação
> (`request.md`), no estado verificado do repositório e nas sete decisões que o usuário
> tomou em `/sdd-kit:clarify` — nunca em invenção. O **como** (arquitetura dos painéis,
> estratégia de migração) fica para `design.md`.
>
> **Nota sobre Q2 e Q3.** As decisões "migrar para esbuild + Preact" e "biblioteca interna
> de componentes" são escolhas de **implementação**, não requisitos: nenhuma delas é
> observável por quem usa a extensão. Elas ficam registradas em "Questões resolvidas" e
> viram ADR no design — deliberadamente **não** foram transformadas em requisito, para a
> spec não passar a descrever o *como*.

---

## Objetivo

Fazer a extensão se apresentar como um produto único: todas as suas superfícies visuais
passam a usar a mesma linguagem de design do SDD Cockpit, em vez de só o wizard tê-la.

## Contexto

A feature 0035 criou a camada de design system — os tokens `--sdd-*` derivados de
`--vscode-*` (`themeTokens.ts`, ADR-035) — e a aplicou **apenas ao wizard**, por decisão
registrada (Q3 da 0035: o redesenho das demais telas ficaria para a iteração seguinte).

Essa iteração é esta. Hoje o estado é mensurável:

| Superfície | Módulo | Usa `--sdd-*`? | Tem mockup? |
| --- | --- | --- | --- |
| Painel SDD (Board) | `boardHtml.ts` (529 linhas) | não | `03-board-kanban` |
| Dashboard de feature | `dashboardHtml.ts` (214 linhas) | não | `13-feature-dashboard` |
| Visão do projeto | `projectOverviewHtml.ts` (159 linhas) | não | parcial (`01`) |
| Histórico e decisões | `historyHtml.ts` (57 linhas) | não | **não** |
| Métricas | `metricsHtml.ts` (77 linhas) | não | **não** |
| Relatório de validação | `validationHtml.ts` (86 linhas) | não | **não** |
| Editor de spec | `specEditorHtml.ts` (69 linhas) | não | **não** |
| Sidebar | `FeaturesTreeProvider` + `ProjectViewProvider` | não se aplica | `01-sidebar-cockpit` |
| Boas-vindas | `viewsWelcome` no `package.json` (markdown) | não se aplica | `02-welcome-onboarding` |
| Wizard | `wizardHtml.ts` | **sim** | `04`–`12` |

Nove superfícies com o tema cru do VS Code e uma com identidade própria. É exatamente o
que o usuário relatou ao instalar a versão nova e dizer que "a interface ainda está a
mesma coisa": ele não estava olhando o wizard.

Os mockups aprovados em `docs/ui-redesign/mockups/` e o contrato de estilo
(`STYLE-CONTRACT.md`) já definem cores, tipografia, raios e o mapeamento para o tema do
VS Code. Não falta desenho — falta implementação.

## Escopo

### Incluído

- Adoção da camada de tokens `--sdd-*` por todas as superfícies de webview da extensão.
- Implementação dos mockups `01-sidebar-cockpit`, `02-welcome-onboarding`,
  `03-board-kanban` e `13-feature-dashboard` nas superfícies correspondentes.
- Consistência de componentes entre painéis: cartão, badge de status, cabeçalho de
  painel, estado vazio e estado de carregamento.
- Substituição da `TreeView` da sidebar por uma superfície de webview (Q1).
- Redesenho das quatro superfícies sem mockup, cada uma derivada de um mockup análogo
  nomeado (Q6).
- Boas-vindas como estado da sidebar, no lugar do `viewsWelcome` em markdown (Q4, Q7).

### Não incluído

- **Mudança de comportamento, comando ou fluxo.** O pedido é visual; alterar o que a
  extensão faz sob o pretexto de mudar como ela parece seria ampliar o pedido.
  Confirmado em Q5 e preservado por Q7.
- **Substituir a sidebar e os painéis por uma janela única.** Oferecido ao usuário e
  recusado em favor de redesenhar o que existe; a troca da arquitetura de navegação
  precisa de spec e ADR próprios.
- **Redesenho do wizard.** Já tem a identidade (0035) e está em implementação ativa —
  mexer nele agora conflita com as tarefas WIZ-012..015.
- **Produzir novos mockups.** As 14 telas existem e foram aprovadas; as quatro
  superfícies sem mockup são derivadas por analogia (Q6), não desenhadas do zero.

---

## Requisitos funcionais

### REQ-COCK-001 — Toda superfície de webview consome a camada de tokens

Todo webview da extensão emite os tokens `--sdd-*` no seu documento e usa esses tokens
para cor, borda e superfície, em vez de referenciar `--vscode-*` diretamente ou fixar
cores em hex.

*Origem: "os recursos visuais têm que mudar" + estado verificado (nenhum módulo usa os
tokens).*

#### SCN-COCK-001 — Um painel existente passa a usar os tokens

DADO o Painel SDD renderizado pela versão atual, que referencia `--vscode-*` diretamente
QUANDO ele é renderizado após esta mudança
ENTÃO o documento inclui o bloco de tokens `--sdd-*`
E as cores de superfície, borda e texto do painel vêm desses tokens

#### SCN-COCK-002 — Nenhuma cor de conteúdo fixa em hex

DADO qualquer módulo de HTML de painel da extensão
QUANDO seu CSS é inspecionado
ENTÃO nenhuma cor de conteúdo aparece como hex fixo, salvo a camada de marca declarada
em `themeTokens.ts`

### REQ-COCK-002 — Componentes visuais consistentes entre painéis

Os elementos que se repetem entre painéis — cartão, badge de status do ciclo de vida,
cabeçalho de painel e estado vazio — têm a mesma aparência em todos eles, a partir de uma
definição única e não de cópias por painel.

*Origem: "quero que a extensão funcione como se fosse um sistema desktop" — a coerência
entre telas é o que distingue um produto de um conjunto de painéis.*

#### SCN-COCK-003 — O mesmo status tem a mesma cor em painéis diferentes

DADO uma mudança em status `DESIGNED`
QUANDO ela aparece no Painel SDD e no dashboard de feature
ENTÃO o badge de status tem a mesma cor e a mesma forma nos dois

### REQ-COCK-003 — Painel SDD conforme o mockup do Kanban

O Painel SDD adota o layout, o espaçamento e os componentes do mockup `03-board-kanban`,
preservando as funcionalidades já entregues (arrastar para transicionar, filtro e busca,
feed de atividade, ordenação, ordem e recolhimento de colunas).

*Origem: mockup aprovado + a superfície mais visível da extensão.*

#### SCN-COCK-004 — O Board redesenhado preserva o que já fazia

DADO o Painel SDD com filtro aplicado e uma coluna recolhida
QUANDO ele é renderizado após o redesenho
ENTÃO o filtro, o recolhimento, a ordenação e o arrastar continuam funcionando como antes
E o visual passa a seguir o mockup

### REQ-COCK-004 — Dashboard de feature conforme o mockup

O dashboard de feature adota o layout do mockup `13-feature-dashboard`, apresentando
objetivo, progresso, contagens, bloqueios e histórico nos componentes do design system.

*Origem: mockup aprovado.*

#### SCN-COCK-005 — Contagem indisponível continua legível

DADO uma mudança cujo `traceability.yaml` está ausente
QUANDO o dashboard é aberto
ENTÃO os campos indisponíveis aparecem com a nota explicativa, no estilo do design system
E o painel não apresenta erro

### REQ-COCK-005 — Boas-vindas como estado da sidebar, conforme o mockup

As boas-vindas deixam de ser o `viewsWelcome` em markdown do `package.json` e passam a
ser um **estado da própria sidebar**, seguindo o mockup `02-welcome-onboarding`: em um
projeto sem `.specs/`, a sidebar apresenta o método e a ação de inicializar o SDD, no
lugar da lista de mudanças. A ação executa o mesmo comando de inicialização já existente.
Nenhuma superfície é aberta automaticamente.

*Origem: mockup aprovado + decisões Q4 e Q7. O `viewsWelcome` atual é markdown com um
link de comando e não é estilizável; como a sidebar passa a ser webview (Q1), ela é a
superfície natural — assim as boas-vindas mudam de aparência sem mudar de lugar.*

#### SCN-COCK-006 — Projeto não inicializado apresenta as boas-vindas

DADO um projeto sem `.specs/`
QUANDO o usuário abre a sidebar do SDD
ENTÃO as boas-vindas são apresentadas ali, com a ação de inicializar
E a ação executa o mesmo comando de inicialização já existente

#### SCN-COCK-010 — Projeto já inicializado não recebe as boas-vindas

DADO um projeto que já tem `.specs/`
QUANDO o usuário abre a sidebar do SDD
ENTÃO as boas-vindas não são apresentadas
E a lista de mudanças é exibida no lugar

#### SCN-COCK-011 — Nada abre sem o usuário pedir

DADO um projeto sem `.specs/` recém-aberto no VS Code
QUANDO a extensão é ativada
ENTÃO nenhum painel é aberto automaticamente no editor
E as boas-vindas ficam disponíveis na sidebar, à espera do usuário

### REQ-COCK-006 — Sidebar como superfície de webview, sem perder o que a árvore fazia

A sidebar deixa de ser uma `TreeView` e passa a ser uma superfície de webview que segue o
mockup `01-sidebar-cockpit`. As operações que a árvore oferecia nativamente permanecem
disponíveis: navegar entre os itens pelo teclado, selecionar um item, acionar as ações de
um item e revelar o item correspondente a uma mudança.

*Origem: decisão Q1. A `TreeView` não aceita CSS — a API expõe rótulo, ícone, descrição e
cor temática, e nada mais —, então seguir o mockup exige trocar a superfície.*

#### SCN-COCK-007 — Navegação por teclado preservada

DADO a sidebar com várias mudanças listadas
QUANDO o usuário percorre a lista apenas pelo teclado
ENTÃO o foco caminha item a item de forma visível
E a ação padrão do item em foco pode ser acionada sem o mouse

#### SCN-COCK-008 — Ações de um item permanecem acessíveis

DADO uma mudança listada na sidebar
QUANDO o usuário aciona as ações desse item
ENTÃO as mesmas ações disponíveis hoje pelo menu de contexto da árvore são oferecidas
E acioná-las produz o mesmo efeito de antes

### REQ-COCK-007 — Superfície sem mockup deriva de um mockup nomeado

Cada superfície redesenhada que não tem mockup próprio — histórico e decisões, métricas,
relatório de validação e editor de spec — declara explicitamente de qual mockup aprovado
ela deriva o seu layout.

*Origem: decisão Q6. Sem essa amarra, o layout dessas quatro telas seria decidido durante
a implementação e ficaria sem rastro — o oposto do que o método exige.*

#### SCN-COCK-009 — A derivação é declarada, não improvisada

DADO o painel de métricas, que não tem mockup próprio
QUANDO o design dele é registrado
ENTÃO consta de qual mockup aprovado o layout foi derivado
E a escolha pode ser conferida por outra pessoa

---

## Requisitos não funcionais

### NFR-COCK-001 — Tema claro e escuro

Toda superfície redesenhada permanece legível nos temas claro e escuro do VS Code, com
contraste suficiente entre texto e fundo em ambos.

### NFR-COCK-002 — Segurança do webview preservada

O redesenho não enfraquece a postura de segurança já estabelecida: CSP com nonce, sem
acesso a rede, e todo texto de artefato inserido de forma escapada (ADR-024, NFR-WIZ-001).

### NFR-COCK-003 — Sem regressão de comportamento

Nenhuma funcionalidade existente muda de comportamento observável em consequência do
redesenho. Os testes atuais continuam passando sem alteração de expectativa. Nenhuma
superfície passa a abrir sozinha (SCN-COCK-011).

### NFR-COCK-004 — Acessibilidade

Os controles interativos das superfícies redesenhadas expõem rótulo acessível e estado
(`aria-*`) e permanecem operáveis por teclado.

**Requisito de risco elevado por Q1:** com a sidebar deixando de ser `TreeView`, a
navegação por teclado, a seleção, as ações por item e o "revelar item" deixam de vir
prontos da plataforma e passam a ser responsabilidade desta implementação. Este NFR é o
principal ponto de regressão da mudança e precisa de verificação própria, não de inspeção
de rotina. REQ-COCK-006 existe para tornar isso verificável.

---

## Critérios de aceite

- [ ] Nenhum módulo de HTML de painel referencia `--vscode-*` para cor de conteúdo sem
      passar pela camada `--sdd-*` (REQ-COCK-001).
- [ ] O badge de status e o cartão têm definição única, reutilizada por todos os painéis
      (REQ-COCK-002).
- [ ] Painel SDD, dashboard de feature e sidebar correspondem visualmente aos mockups
      `03`, `13` e `01`/`02`, verificado por comparação com captura (REQ-COCK-003/004/005).
- [ ] As superfícies redesenhadas foram conferidas nos temas claro e escuro (NFR-COCK-001).
- [ ] A suíte de testes existente passa sem alteração de expectativa (NFR-COCK-003).
- [ ] A sidebar em webview mantém navegação por teclado, seleção, ações por item e
      revelar-item, verificado explicitamente (REQ-COCK-006, NFR-COCK-004).
- [ ] Cada uma das quatro superfícies sem mockup declara no design de qual mockup análogo
      derivou (REQ-COCK-007).
- [ ] As boas-vindas aparecem só em projeto não inicializado, na sidebar, e nada abre
      sozinho (SCN-COCK-010, SCN-COCK-011).

---

## Questões pendentes

Nenhuma. As sete questões levantadas foram respondidas pelo usuário e estão registradas
abaixo.

## Questões resolvidas

### Q1 — Sidebar: trocar a `TreeView` por superfície de webview (crítica)

**Decisão:** trocar. A sidebar passa a seguir o mockup `01-sidebar-cockpit` fielmente.

**Consequência aceita:** perde-se o que a `TreeView` dá pronto — navegação por teclado,
seleção, ações por item e "revelar item" — e tudo isso passa a ser responsabilidade da
implementação. Formalizado em REQ-COCK-006 e em NFR-COCK-004. Exige ADR.

### Q2 — Stack: migrar todos os painéis para esbuild + Preact (alta)

**Decisão:** migrar todos, unificando com o wizard (ADR-034).

**Consequência aceita:** sete módulos que funcionam e estão cobertos por teste são
reescritos, com risco de regressão nas funcionalidades já entregues do Board. O
`design.md` precisa de estratégia de migração incremental — painel a painel, com os
testes existentes como rede. Decisão de implementação: vira ADR, não requisito.

### Q3 — Componentes: biblioteca interna de componentes Preact (alta)

**Decisão:** uma biblioteca interna (`src/webview/ui/`) com `Card`, `StatusBadge`,
`PanelHeader`, `EmptyState`, `Toolbar` e afins, importada por todos os painéis.
Consequência coerente de Q2. Decisão de implementação: vira ADR, não requisito — o
requisito observável correspondente é REQ-COCK-002.

### Q4 — Boas-vindas: superfície própria no lugar do `viewsWelcome` (média)

**Decisão:** as boas-vindas saem do markdown do `package.json` e passam a ser uma
superfície de webview fiel ao mockup `02-welcome-onboarding`. **Onde** elas vivem ficou
em aberto como Q7, e foi resolvido lá.

### Q5 — Expectativa: o redesenho visual satisfaz "sistema desktop" (média)

**Decisão:** sim, por agora. Comportamento de app (atalhos, toolbar persistente, painel
de detalhes lateral, undo) não entra e vira mudança nova se necessário. Formalizado em
NFR-COCK-003.

### Q6 — Superfícies sem mockup: entram, derivadas por analogia (média)

**Decisão:** histórico, métricas, validação e editor de spec entram por completo,
derivando o layout de mockups análogos. Formalizado em REQ-COCK-007, que exige a
derivação **declarada** — a compensação por não haver mockup aprovado para elas.

### Q7 — Boas-vindas como estado da sidebar (alta)

**Contexto:** Q4 e Q5 se contradiziam. Q5 decidiu que nada de comportamento muda; Q4
tirava as boas-vindas da sidebar e as punha num painel que abriria no editor — mudança de
comportamento observável.

**Decisão:** as boas-vindas viram um **estado da sidebar**, que já passa a ser webview por
Q1. Projeto sem `.specs/` mostra o onboarding do mockup `02` no lugar da lista de
mudanças. A contradição desaparece: Q4 é cumprida (a tela fica estilizável e fiel ao
mockup) sem violar Q5 (nada abre sozinho, e o usuário encontra no mesmo lugar de hoje).
Formalizado em REQ-COCK-005, SCN-COCK-011 e NFR-COCK-003.

## Hipóteses assumidas

> HIPÓTESE: os mockups aprovados são a referência visual final e não serão renegociados
> durante a implementação. Assumida porque foram produzidos e aprovados antes da 0035 e
> já orientaram o wizard. Se o usuário quiser revisá-los, isso precede a implementação.

> HIPÓTESE: as superfícies continuam separadas, com a mesma navegação de hoje. Assumida a
> partir da recusa explícita da opção "janela única". Q1 e Q2 mudam a *implementação* de
> cada superfície, não a navegação entre elas.

> HIPÓTESE: "as mesmas ações disponíveis hoje pelo menu de contexto" (SCN-COCK-008)
> significa o conjunto atual de ações por item, sem acréscimo nem remoção. Assumida a
> partir de Q5 (nada de comportamento muda).
