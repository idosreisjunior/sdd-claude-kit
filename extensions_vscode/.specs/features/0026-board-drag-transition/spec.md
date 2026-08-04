# Feature: Transição por arrastar no Painel SDD (incremento 2)

- **ID:** 0026-board-drag-transition
- **Escopo dos identificadores:** DND
- **Estado:** ver `status.yaml` — a autoridade é ele

---

## Objetivo

Tornar o Painel SDD (0025) **interativo**: arrastar um cartão entre colunas **transiciona o estado**
da mudança, respeitando a máquina de estados e registrando o motivo — escrevendo `status.yaml` e
`index.yaml` sem corromper os arquivos.

## Contexto

O incremento 1 é somente leitura. As colunas são **grupos** de status (`groupFor`), enquanto as
transições são entre **estados** (`workflow.json`). Soltar um cartão numa coluna precisa resolver
qual estado-alvo (dos estados do grupo, o alcançável a partir do estado atual), e pode ser ambíguo
(a coluna "Em desenvolvimento" tem APPROVED e IN_PROGRESS). A escrita precisa **preservar** o arquivo
(comentários, block scalars dos `reason`), o que um round-trip por js-yaml não faz.

## Escopo

### Incluído

- Arrastar-soltar no kanban de mudanças; resolução do estado-alvo (candidatos = estados da coluna
  alcançáveis do estado atual); QuickPick se ambíguo; recusa se inválido.
- Motivo obrigatório (InputBox); escrita de `status.yaml` (history + status) e `index.yaml`,
  preservando o resto.

### Não incluído

- Edição de estado fora do grafo; desfazer/redo próprio.

---

## Decisões de escopo (2026-08-04)

| # | Decisão | Efeito |
| --- | --- | --- |
| D-Q1 | Alvo = interseção dos estados da coluna com as transições válidas do estado atual; 1 → direto, >1 → QuickPick, 0 → recusa. | REQ-DND-001; NFR-DND-001. |
| D-Q2 | Escrita por **manipulação de texto** (preserva comentários/block scalars), não round-trip de YAML. | NFR-DND-002. |
| D-Q3 | Motivo obrigatório (InputBox); data pelo host; transições **embutidas** (espelham workflow.json). | NFR-DND-001/002. |

---

## Requisitos funcionais

### REQ-DND-001 — Transição de estado por arrastar

Arrastar um cartão para outra coluna deve **transicionar** o estado da mudança para um estado válido
daquela coluna, escrevendo `status.yaml` (nova entrada de `history` com `status`/`date`/`reason` e o
campo `status`) e `index.yaml`. Transição inválida é recusada.

#### SCN-DND-001 — Arrastar para uma coluna alcançável

DADO um cartão no estado X e uma coluna cujo(s) estado(s) são alcançáveis de X
QUANDO o cartão é solto na coluna
ENTÃO o estado-alvo é resolvido (QuickPick se houver mais de um), pede-se o motivo, e a mudança
transiciona para o alvo.

#### SCN-DND-002 — Arrastar para uma coluna inválida

DADO um cartão no estado X e uma coluna sem estado alcançável de X
QUANDO o cartão é solto na coluna
ENTÃO a transição é recusada com aviso e nada é escrito.

#### SCN-DND-003 — Escrita preserva o arquivo

DADO uma transição válida com motivo
QUANDO os arquivos são escritos
ENTÃO `status.yaml` ganha a entrada de `history` e o `status` de topo atualizado, preservando
comentários e demais chaves; e o `index.yaml` reflete o novo status da entrada.

---

## Requisitos não funcionais

### NFR-DND-001 — Respeita a máquina de estados

Só transições válidas do grafo (`workflow.json`, embutido) são permitidas; a inválida é recusada.

### NFR-DND-002 — Escrita não destrutiva; motivo obrigatório

A escrita preserva comentários, block scalars e demais chaves (manipulação de texto). O `reason` é
obrigatório e não vazio (schema).

### NFR-DND-003 — Núcleo puro e testável

A resolução de candidatos (`stateMachine`) e a escrita (`statusWriter`) são puras, sem a API do VS
Code, testadas fora do host.

---

## Critérios de aceite

- [ ] Arrastar para uma coluna alcançável transiciona a mudança (QuickPick se ambíguo), com motivo
      obrigatório (REQ-DND-001, SCN-DND-001).
- [ ] Arrastar para uma coluna inválida é recusado, sem escrever (SCN-DND-002, NFR-DND-001).
- [ ] `status.yaml` (history + status) e `index.yaml` são atualizados preservando o resto
      (SCN-DND-003, NFR-DND-002).
- [ ] Núcleo (`stateMachine`, `statusWriter`) puro e testado (NFR-DND-003).

---

## Questões pendentes

Q1–Q3 decididas (ver **Decisões de escopo**). Sem questão em aberto.

## Hipóteses assumidas

> HIPÓTESE: A coluna-grupo resolve para o estado-alvo por interseção com o grafo; a escrita é
> cirúrgica no texto — detalhado no ADR-025.
