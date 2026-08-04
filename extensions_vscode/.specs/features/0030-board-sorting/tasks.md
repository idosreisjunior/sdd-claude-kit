# Tarefas — Ordenação do quadro e do feed

Complexidade: **P** pequena (≤ meio dia) · **M** média (≈ 1 dia) · **G** grande.

> Estende o Painel SDD (0025). Ordenação client-side espelhando função pura (ADR-028).

---

## TASK-SORT-001 — ADR-028: ordenação client-side

**Requisitos:** REQ-SORT-001, REQ-SORT-002
**Dependências:** —
**Complexidade:** P
**Status:** done

### Descrição

Registrar: ordenação no cliente espelhando `sortBoardCards`/`orderFeed` (puros, testados); `<select>`
para o quadro, alternador para o feed.

### Arquivos prováveis

- `.specs/features/0030-board-sorting/decisions/ADR-028-ordenacao-client-side.md`

### Testes esperados

- Nenhum — decisão/documentação.

### Critério de conclusão

- ADR-028 escrito.

### Evidências necessárias

- ADR-028 presente com Decisão e Alternativas.

---

## TASK-SORT-002 — Núcleo puro: `sortBoardCards` / `orderFeed`

**Requisitos:** REQ-SORT-001, REQ-SORT-002, NFR-SORT-001
**Dependências:** TASK-SORT-001
**Complexidade:** P
**Status:** done

### Descrição

`boardModel.ts`: `BoardSort`/`FeedOrder`, `sortBoardCards` (id/título/progresso, sem mutar), `orderFeed`
(desc/asc). Sem import de `vscode`.

### Arquivos prováveis

- `src/sdd/boardModel.ts`

### Testes esperados

- TEST-SORT-001 — sortBoardCards por id/título/progresso; não muta
- TEST-SORT-002 — orderFeed desc/asc

### Critério de conclusão

- TEST-SORT-001/002 passam.

### Evidências necessárias

- Saída de `npm test` com TEST-SORT-001/002 verdes.

---

## TASK-SORT-003 — Controles no `boardHtml`

**Requisitos:** REQ-SORT-001, REQ-SORT-002, NFR-SORT-002
**Dependências:** TASK-SORT-002
**Complexidade:** P
**Status:** done

### Descrição

`boardHtml.ts`: `state.sort`/`state.feedOrder`; `<select>` na barra (espelha `sortCards`) aplicado após
o filtro em `renderBoardArea`; alternador na visão Atividade aplicando a ordem. Controles acessíveis
(`aria-label`).

### Arquivos prováveis

- `src/sdd/boardHtml.ts`

### Testes esperados

- Nenhum automatizado próprio — render/interação no host; a lógica está em TASK-SORT-002. Abrir o
  painel é coberto por E2E (0025); revisão manual.

### Critério de conclusão

- `compile`/`lint`/`test` limpos; quadro e feed ordenam.

### Evidências necessárias

- Revisão manual: seletor reordena o quadro; alternador inverte o feed.

---

## Resumo

| Complexidade | Quantidade |
| --- | --- |
| P | 3 |
| M | 0 |
| G | 0 |

Total: 3 tarefas · 3 concluídas · 0 pendentes.

> Implementado em 2026-08-04. `compile`, `lint` e **163** testes (+2: TEST-SORT-001/002). Render/
> interação no host — revisão manual; abrir o painel coberto por E2E (0025).
