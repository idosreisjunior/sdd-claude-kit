# Feature: Superfície de ações da feature (dashboard + submenu)

- **ID:** 0024-feature-action-surface
- **Escopo dos identificadores:** DASH
- **Estado:** ver `status.yaml` — a autoridade é ele

---

## Objetivo

Tornar os recursos da mudança **visíveis e descobríveis**, expondo os comandos existentes como
**botões no dashboard da feature** e reorganizando o menu de contexto num **submenu agrupado** — sem
adicionar comandos nem mudar comportamento.

## Contexto

Os nove recursos pós-MVP (0014–0022) foram adicionados só ao **menu de contexto** da feature (16
itens no grupo `sdd@*`) e à paleta. Os painéis não ganharam nada visível, então a extensão "parece
simples" e os recursos "não aparecem". O dashboard é um webview **sem scripts** (ADR-005, CSP
`default-src 'none'`), então a interação precisa ser por `command:` URIs — não por JavaScript.

## Escopo

### Incluído

- Seção **"Ações"** no dashboard, com botões (por `command:` URI) para os comandos da mudança.
- Submenu **"SDD: Ações"** no menu de contexto da feature, agrupando as ações.

### Não incluído

- **Novos comandos** ou mudança de comportamento das ações.
- **Scripts no webview** — mantém-se sem JS (ADR-005).
- Redesenho dos painéis Projeto/Features além do submenu.

---

## Decisões de escopo (2026-08-03)

| # | Decisão | Efeito |
| --- | --- | --- |
| D-Q1 | O botão do dashboard dispara o comando por `command:` URI, cujo argumento é um nó sintético `{ kind: 'feature', change }` — o mesmo formato que os handlers já resolvem (`featureChangeOf`). Nenhum handler muda. | REQ-DASH-001; NFR-DASH-001. |
| D-Q2 | `enableCommandUris` restrito à **allowlist** dos comandos da extensão (não `true`). | NFR-DASH-001. |
| D-Q3 | Mecanismo do submenu, forma dos botões e agrupamento são **de design** → ADR-023. | REQ-DASH-001/002. |

---

## Requisitos funcionais

> Origem: a solicitação e a lacuna de descoberta acumulada de 0014–0022. Feature de **UX/qualidade
> interna**; não materializa um RF de usuário do PRD (reusa os comandos existentes).

### REQ-DASH-001 — Ações visíveis no dashboard

O dashboard da feature deve exibir uma seção **"Ações"** com um botão por comando da mudança. Cada
botão dispara o comando **sobre aquela mudança** (o id vai no argumento do `command:` URI).

#### SCN-DASH-001 — Seção Ações renderizada

DADO o dashboard de uma mudança
QUANDO ele é renderizado
ENTÃO há uma seção "Ações" com um botão por comando de ação, e cada botão é um `command:` URI com o
id da mudança embutido no argumento.

#### SCN-DASH-002 — Botão age sobre a mudança certa

DADO o dashboard de uma mudança X
QUANDO o usuário clica num botão de ação
ENTÃO o comando correspondente é acionado tendo X como alvo (sem QuickPick de seleção).

### REQ-DASH-002 — Menu de contexto organizado em submenu

As ações da feature no menu de clique-direito devem ficar num **submenu "SDD: Ações"** agrupado por
seção, em vez de uma lista plana.

#### SCN-DASH-003 — Submenu no menu de contexto

DADO o menu de contexto de uma mudança no painel Features
QUANDO ele é aberto
ENTÃO as ações aparecem sob o submenu "SDD: Ações", agrupadas (com separadores), e todos os comandos
continuam declarados.

---

## Requisitos não funcionais

### NFR-DASH-001 — Segurança do webview preservada

O dashboard continua **sem scripts**; a CSP com nonce é preservada; os `command:` URIs são
habilitados por **allowlist** (`enableCommandUris` com a lista dos comandos da extensão), não para
qualquer comando do VS Code.

### NFR-DASH-002 — Sem novo comando nem regressão

Nenhum comando novo é declarado; o comportamento das ações não muda. A suíte unitária permanece
verde e a paridade de comandos (E2E TEST-E2E-002) continua válida.

### NFR-DASH-003 — Núcleo puro e testável

A montagem das ações (lista de ações + `actionHref`) é pura, sem a API do VS Code, testável fora do
host (standards §6).

---

## Critérios de aceite

- [ ] O dashboard mostra a seção "Ações" com um botão por comando, cada um com o id da mudança no
      `command:` URI (REQ-DASH-001, SCN-DASH-001).
- [ ] O botão aciona o comando sobre a mudança do dashboard, sem seleção manual (SCN-DASH-002).
- [ ] O menu de contexto usa o submenu "SDD: Ações" agrupado; todos os comandos seguem declarados
      (REQ-DASH-002, SCN-DASH-003).
- [ ] Webview sem scripts, CSP preservada, `command:` URIs por allowlist; núcleo puro testado; sem
      comando novo (NFR-DASH-001/002/003).

---

## Questões pendentes

As questões de escopo (Q1/Q2) foram decididas — ver **Decisões de escopo**. Permanece a Q3, de
**design**, que não impede a spec de sair de DRAFT:

| # | Questão | Bloqueia | Prioridade |
| --- | --- | --- | --- |
| Q3 | Mecanismo do submenu (`submenus` do package.json), forma dos botões (anchors com `command:` URI vs. outra) e agrupamento. Decisão de design → ADR. | design | média |

## Hipóteses assumidas

> HIPÓTESE: Os botões são âncoras `<a href="command:…">` com o argumento URI-encodado; o submenu usa
> a contribuição `submenus` do package.json — a confirmar em Q3 no design (ADR-023).
