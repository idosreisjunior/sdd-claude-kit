# Tarefas — Feed de atividade no Painel SDD

Complexidade: **P** pequena (≤ meio dia) · **M** média (≈ 1 dia) · **G** grande.

> Estende o Painel SDD (0025). Feed derivado do history de todos os status.yaml (ADR-027).

---

## TASK-FEED-001 — ADR-027: feed derivado do history, junto do board

**Requisitos:** REQ-FEED-001
**Dependências:** —
**Complexidade:** P
**Status:** done

### Descrição

Registrar: feed = transições do `history:` de todos os status.yaml, montado na mesma leitura do board
e postado junto; ordenação por data desc; visão separada; clique no id reusa o dashboard.

### Arquivos prováveis

- `.specs/features/0029-board-activity-feed/decisions/ADR-027-feed-derivado-do-history.md`

### Testes esperados

- Nenhum — decisão/documentação.

### Critério de conclusão

- ADR-027 escrito.

### Evidências necessárias

- ADR-027 presente com Decisão e Alternativas.

---

## TASK-FEED-002 — Núcleo puro: `buildActivityFeed`

**Requisitos:** REQ-FEED-001, NFR-FEED-001
**Dependências:** TASK-FEED-001
**Complexidade:** P
**Status:** done

### Descrição

`boardModel.ts`: `FeedItem`/`FeedSource`, parsing do `history:` (robusto), `buildActivityFeed` (agrega,
ordena por data desc, limita). Sem import de `vscode`.

### Arquivos prováveis

- `src/sdd/boardModel.ts`

### Testes esperados

- TEST-FEED-001 — agrega as transições, mais recente primeiro (SCN-FEED-001)
- TEST-FEED-002 — respeita o limite; robusto a YAML inválido

### Critério de conclusão

- TEST-FEED-001/002 passam.

### Evidências necessárias

- Saída de `npm test` com TEST-FEED-001/002 verdes.

---

## TASK-FEED-003 — Visão "Atividade" (boardHtml) + wiring (boardPanel)

**Requisitos:** REQ-FEED-001, REQ-FEED-002, NFR-FEED-002
**Dependências:** TASK-FEED-002
**Complexidade:** M
**Status:** done

### Descrição

`boardPanel.ts`: `buildBoardAndFeed` lê os status.yaml uma vez e monta board + feed; `open`/`refresh`
postam `{type:'board', board, feed}`. `boardHtml.ts`: embute o feed inicial; botão "Atividade" na
barra alterna para a visão; `renderActivity` lista os itens (id clicável → openDashboard); atualização
ao vivo re-renderiza o feed. CSS do feed.

### Arquivos prováveis

- `src/sdd/boardPanel.ts`, `src/sdd/boardHtml.ts`

### Testes esperados

- Nenhum automatizado próprio — render/interação no host; a montagem está em TASK-FEED-002. Abrir o
  painel é coberto por E2E (0025); revisão manual do feed.

### Critério de conclusão

- `compile`/`lint`/`test` limpos; a visão Atividade lista as transições e atualiza ao vivo.

### Evidências necessárias

- Revisão manual: "Atividade" mostra as transições; salvar um `.specs` atualiza o feed.

---

## Resumo

| Complexidade | Quantidade |
| --- | --- |
| P | 2 |
| M | 1 |
| G | 0 |

Total: 3 tarefas · 3 concluídas · 0 pendentes.

> Implementado em 2026-08-04. `compile`, `lint` e **161** testes (+2: TEST-FEED-001/002). Render/
> interação no host — revisão manual; abrir o painel coberto por E2E (0025).
