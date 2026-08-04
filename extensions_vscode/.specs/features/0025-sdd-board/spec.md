# Feature: Painel SDD — Kanban + Overview ao vivo

- **ID:** 0025-sdd-board
- **Escopo dos identificadores:** BOARD
- **Estado:** ver `status.yaml` — a autoridade é ele

---

## Objetivo

Dar à extensão um **Painel SDD** com **cara de sistema**: um kanban das mudanças por status, um
overview de saúde do projeto e um drill-down das tarefas — **atualizando em tempo real** conforme os
`.specs` mudam. Inspirado na SDD Builder AI, adaptado ao nosso modelo.

## Contexto

Os webviews atuais (dashboard, painel Projeto) são **sem script** (ADR-005), então a UI "parece
simples" e não atualiza sozinha de forma fluida. Um kanban ao vivo — colunas, cartões que mudam de
coluna, drill-down — pede **script no webview** + passagem de mensagens. O watcher de `.specs/*.yaml`
já existe (dá o "tempo real"). Este painel é a **exceção** ao ADR-005; os demais webviews seguem sem
script.

## Escopo

### Incluído (incremento 1)

- **Kanban das mudanças** por grupo de status (os de `groupFor`: Rascunho, Em desenvolvimento,
  Bloqueadas, Em validação, Concluídas, Canceladas), cartões com id/tipo/status e **progresso de
  tarefas**; **atualização ao vivo** pelo watcher.
- **Overview** no topo (total de mudanças, % concluídas = VERIFIED+ARCHIVED).
- **Drill-down de tarefas** de uma mudança (pendente/em progresso/concluída), do `tasks.md`.
- **Somente leitura**: clicar num cartão abre o dashboard da mudança.

### Não incluído

- **Arrastar cartão = transicionar estado** (escreve `status.yaml`) — incremento 2.
- Requirement board / split-diff da referência.

---

## Decisões de escopo (2026-08-04)

| # | Decisão | Efeito |
| --- | --- | --- |
| D-Q1 | Painel = **webview com script** (nonce), exceção ao ADR-005; os demais webviews seguem sem script. | NFR-BOARD-002. |
| D-Q2 | Tempo real reusa o **watcher `.specs/*.yaml`** existente → `refresh` → `postMessage` (sem recarregar o HTML). | REQ-BOARD-001. |
| D-Q3 | Colunas = grupos de `groupFor`. Incremento 1 **somente leitura**; arrastar-para-transicionar é o incremento 2. | REQ-BOARD-001/003. |

---

## Requisitos funcionais

> Feature de **UI/qualidade interna**. Reusa o modelo de `.specs` e os comandos existentes.

### REQ-BOARD-001 — Kanban das mudanças ao vivo, com overview

O painel deve exibir as mudanças em **colunas por status** (grupos de `groupFor`), cada cartão com
id, tipo, status e progresso de tarefas, e um **overview** no topo (total, % concluídas). Deve
**atualizar** quando os `.specs` mudam, sem recarregar o painel.

#### SCN-BOARD-001 — Kanban e overview renderizados

DADO `.specs` com mudanças
QUANDO o painel é aberto
ENTÃO há colunas por grupo de status (sem colunas vazias) com um cartão por mudança, e um overview
com o total e o percentual de concluídas.

#### SCN-BOARD-003 — Painel abre sem lançar

DADO o host do VS Code com um workspace `.specs`
QUANDO se executa o comando "Painel (Kanban)"
ENTÃO o painel abre sem lançar exceção.

### REQ-BOARD-002 — Drill-down das tarefas

O painel deve permitir abrir, a partir de um cartão, o **kanban das tarefas** daquela mudança
(pendente/em progresso/concluída), lido do `tasks.md`.

#### SCN-BOARD-002 — Kanban de tarefas

DADO o `tasks.md` de uma mudança, com tarefas em vários status
QUANDO o drill-down de tarefas é aberto
ENTÃO as tarefas aparecem em colunas por status; tarefa sem status reconhecido cai em "Pendente".

### REQ-BOARD-003 — Navegação (somente leitura)

Clicar num cartão de mudança deve **abrir o dashboard** daquela mudança. O painel não escreve em
`.specs` (incremento 1).

---

## Requisitos não funcionais

### NFR-BOARD-001 — Núcleo puro e robusto

A montagem do board (colunas/overview) e o parsing das tarefas são **puros** (sem a API do VS Code),
testáveis, e robustos: YAML/markdown inválido ou vazio resultam em board vazio, nunca em exceção.

### NFR-BOARD-002 — Webview seguro, mesmo com script

CSP com nonce (`default-src 'none'`; `style-src`/`script-src` restritos ao nonce); o texto dos
artefatos é inserido no cliente via `textContent` (nunca `innerHTML`) — sem injeção de HTML.
`enableScripts` é habilitado **apenas** neste painel (exceção ao ADR-005).

### NFR-BOARD-003 — Somente leitura

No incremento 1, o painel não escreve em `.specs`. As transições de estado por arrastar ficam para
o incremento 2.

---

## Critérios de aceite

- [ ] O painel mostra o kanban das mudanças por status e o overview (total, % concluídas), e abre
      sem lançar (REQ-BOARD-001, SCN-BOARD-001/003).
- [ ] O painel atualiza ao vivo quando os `.specs` mudam, sem recarregar (REQ-BOARD-001, D-Q2).
- [ ] O drill-down mostra as tarefas da mudança por status (REQ-BOARD-002, SCN-BOARD-002).
- [ ] Clicar num cartão abre o dashboard; o painel não escreve em `.specs` (REQ-BOARD-003,
      NFR-BOARD-003).
- [ ] Núcleo puro testado; webview com CSP+nonce e sem injeção (NFR-BOARD-001/002).

---

## Questões pendentes

As questões de escopo (Q1–Q3) foram decididas — ver **Decisões de escopo**. O **incremento 2**
(arrastar = transicionar) permanece como trabalho futuro, não bloqueante.

## Hipóteses assumidas

> HIPÓTESE: O render client-side monta as colunas por `createElement`+`textContent`; a atualização
> ao vivo é por `postMessage` do watcher — a confirmar/detalhar no ADR-024.
