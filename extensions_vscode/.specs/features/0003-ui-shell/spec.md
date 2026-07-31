# Feature: Interface — dashboard da feature e editor de especificações

- **ID:** 0003-ui-shell
- **Escopo dos identificadores:** UI
- **Estado:** ver `status.yaml` — a autoridade é ele
- **Requisitos de produto cobertos:** RF-005, RF-006 (PRD §11); PRD §13.2

---

## Objetivo

Dar ao usuário a **tela da feature**: um dashboard que reúne, em um só lugar, o
estado de uma mudança do SDD (objetivo, progresso, requisitos, tarefas, bloqueios,
histórico, evidências) — o "cockpit" que o PRD (§13.2) descreve.

## Contexto

A fundação (0001) entregou a Activity Bar, a status bar e o diagnóstico; o
gerenciamento (0002) tornou o painel Features útil (listar, agrupar, abrir a spec,
progresso). Falta o passo que transforma "abrir o `spec.md`" em "ver a feature" —
uma visão consolidada e legível dos artefatos, sem obrigar o usuário a ler seis
arquivos YAML/Markdown à mão.

Este é um épico grande no PRD (dashboard **e** editor visual). Ele é entregue em
incrementos: **este incremento cobre o dashboard read-only (RF-005)**; a edição
visual (RF-006) é o incremento seguinte — ver Questões e Escopo.

## Escopo

### Incluído (este incremento)

- Abrir um **dashboard da feature** (webview) a partir do painel Features.
- Renderizar, somente-leitura, os dados já disponíveis nos artefatos `.specs`:
  objetivo, status, progresso `done/total`, contagem de requisitos/critérios/
  tarefas, bloqueios, histórico e arquivos relacionados.
- Degradar com elegância: campos que dependem de features futuras aparecem como
  pendentes, sem quebrar o dashboard.

### Não incluído

- **Editor visual / edição Markdown estruturada (RF-006)** — incremento seguinte
  desta feature; decidido junto de Q1 (webview vs. custom editor).
- **Consumo de tokens e tempo** (RF-005, itens finais) — dependem do Context
  Guardian (feature 0005); exibidos como "—".
- **Commits relacionados** — dependem do Git Adapter (feature 0007).
- **Testes executados, evidências, validação** como dados vivos — dependem do
  Evidence + Validation Engine (feature 0008); o dashboard apenas aponta o
  `evidence.md` quando existir.
- Ações que executam o fluxo (research, clarificar, gerar design/tarefas,
  implementar, abrir no Claude Code) — dependem do Workflow Engine e do adapter
  (features 0004+); o dashboard pode **exibir** os botões desabilitados, mas não
  os implementa aqui (ver Q3).
- Novas seções da Activity Bar (Contexto, Qualidade, Métricas) — features
  0005/0006/0008/0009.

---

## Requisitos funcionais

### REQ-UI-001 — Abrir o dashboard da feature

A partir do painel Features, o usuário deve poder abrir um dashboard da mudança
selecionada, exibido como um painel próprio (webview) ao lado do editor.

#### SCN-UI-001 — Abrir o dashboard

DADO uma feature listada no painel Features
QUANDO o usuário aciona "Abrir dashboard" na feature
ENTÃO um painel abre exibindo os dados daquela mudança
E o painel é reutilizado (não abre um novo a cada clique na mesma feature).

### REQ-UI-002 — Conteúdo do dashboard (somente-leitura)

O dashboard deve apresentar, a partir dos artefatos da mudança, ao menos:
cabeçalho (id, tipo, título), status, progresso `done/total`, contagem de
requisitos, de critérios de aceite e de tarefas, bloqueios ativos, histórico de
transições e arquivos relacionados (implementação e testes).

#### SCN-UI-002 — Dashboard reflete os artefatos

DADO uma mudança com `spec.md`, `status.yaml` e `traceability.yaml`
QUANDO o dashboard é aberto
ENTÃO cabeçalho, status, progresso e contagens correspondem aos artefatos
E os bloqueios e o histórico de `status.yaml` são listados.

### REQ-UI-003 — Degradação de campos indisponíveis

Campos que dependem de features ainda não entregues (tokens, tempo, commits,
testes executados, evidências/validação) devem aparecer como pendentes
(ex.: "—" ou "feature 000X"), nunca como erro nem em branco silencioso.

#### SCN-UI-003 — Artefato ausente ou incompleto

DADO uma mudança sem `traceability.yaml` (ou com YAML inválido)
QUANDO o dashboard é aberto
ENTÃO o dashboard exibe o que há e marca o restante como indisponível
E não lança exceção nem fica em branco (NFR-UI-001).

---

## Requisitos não funcionais

### NFR-UI-001 — Leitura robusta

Artefato ausente, YAML/Markdown inválido ou estrutura inesperada não podem quebrar
o dashboard: o resultado é uma seção marcada como indisponível, nunca uma exceção.

### NFR-UI-002 — Webview seguro

O webview deve usar Content-Security-Policy restritiva com `nonce`, sem carregar
conteúdo remoto e sem executar código do projeto; `localResourceRoots` limitado
aos recursos da extensão (PRD §22, arquitetura §6). Nenhum dado sai da máquina.

### NFR-UI-003 — Compatibilidade e responsividade

Funciona em Windows, Linux e WSL usando `workspace.fs` (sem caminhos do SO —
NFR herdada de 0001). A leitura e a renderização são assíncronas e não bloqueiam
a UI.

---

## Critérios de aceite

- [ ] O painel Features oferece "Abrir dashboard" e o dashboard abre (SCN-UI-001).
- [ ] Cabeçalho, status, progresso e contagens correspondem aos artefatos
      (SCN-UI-002).
- [ ] Bloqueios e histórico de `status.yaml` são exibidos.
- [ ] Campos dependentes de features futuras aparecem como pendentes (SCN-UI-003).
- [ ] Artefato ausente/ inválido não quebra o dashboard (NFR-UI-001).
- [ ] O webview aplica CSP com `nonce` e não acessa a rede (NFR-UI-002).

---

## Questões pendentes

Nenhuma em aberto — Q1, Q2 e Q3 resolvidas por **ADR-005** (`decisions/`):

- **Q1 (alta)** → **Webview panel** para o dashboard read-only; a base do editor
  (RF-006) fica para o próprio incremento (candidato a `CustomTextEditor`).
- **Q2 (média)** → contagens de fontes estruturadas: tarefas de `status.yaml`;
  requisitos/cenários/testes/arquivos de `traceability.yaml`; objetivo da seção
  `## Objetivo` e critérios pela contagem de checkbox (`- [ ]`) do `spec.md`.
- **Q3 (baixa)** → ações do §13.2 **não** aparecem neste incremento (read-only;
  pertencem ao Workflow Engine / adapter, features 0004+).

## Hipóteses assumidas

Nenhuma pendente — as hipóteses do rascunho viraram decisões em ADR-005 (dashboard
somente-leitura via webview; contagens de fontes estruturadas; um painel por
mudança).
