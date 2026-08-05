# Tarefas — Reordenar as colunas do quadro

Complexidade: **P** pequena (≤ meio dia) · **M** média (≈ 1 dia) · **G** grande.

> Estende o Painel SDD (0025). Setas de mover + ordem pura + persistência (ADR-031).

---

## TASK-COLORD-001 — ADR-031: setas, ordem pura, persistência

**Requisitos:** REQ-COLORD-001, REQ-COLORD-002
**Dependências:** —
**Complexidade:** P
**Status:** done

### Descrição

Registrar: setas ◂/▸ (não arrastar, para não conflitar com cartões); `orderColumns`/`moveColumn`
puros espelhados pelo cliente; ordem persistida por `vscode.setState`.

### Arquivos prováveis

- `.specs/features/0033-board-column-order/decisions/ADR-031-reordenar-colunas-por-setas.md`

### Testes esperados

- Nenhum — decisão/documentação.

### Critério de conclusão

- ADR-031 escrito.

### Evidências necessárias

- ADR-031 presente com Decisão e Alternativas.

---

## TASK-COLORD-002 — Núcleo puro: `orderColumns` / `moveColumn`

**Requisitos:** REQ-COLORD-001, NFR-COLORD-001
**Dependências:** TASK-COLORD-001
**Complexidade:** P
**Status:** done

### Descrição

`boardModel.ts`: `orderColumns(columns, order)` (ordena por rótulo, anexa o resto, ignora ausentes) e
`moveColumn(labels, label, dir)` (move uma posição, respeita bordas). Não mutam. Sem `vscode`.

### Arquivos prováveis

- `src/sdd/boardModel.ts`

### Testes esperados

- TEST-COLORD-001 — orderColumns respeita a ordem e anexa o resto
- TEST-COLORD-002 — moveColumn move o rótulo e respeita as bordas; não muta

### Critério de conclusão

- TEST-COLORD-001/002 passam.

### Evidências necessárias

- Saída de `npm test` com os testes verdes.

---

## TASK-COLORD-003 — Setas + reset + persistência (boardHtml)

**Requisitos:** REQ-COLORD-001, REQ-COLORD-002, NFR-COLORD-002
**Dependências:** TASK-COLORD-002
**Complexidade:** P
**Status:** done

### Descrição

`boardHtml.ts`: `state.columnOrder` (lido/gravado por `vscode.getState`/`setState`); `column()` ganha
setas ◂/▸ (desabilitadas nas bordas) que chamam a lógica de mover; `renderBoardArea` ordena as colunas
(espelha `orderColumns`); botão "↺ Colunas" na barra reseta. Controles com `aria-label`.

### Arquivos prováveis

- `src/sdd/boardHtml.ts`

### Testes esperados

- Nenhum automatizado próprio — render/interação no host; a lógica está em TASK-COLORD-002. Abrir o
  painel é coberto por E2E (0025); revisão manual.

### Critério de conclusão

- `compile`/`lint`/`test` limpos; as colunas reordenam e a ordem persiste.

### Evidências necessárias

- Revisão manual: mover/resetar colunas; a ordem sobrevive à atualização ao vivo.

---

## Resumo

| Complexidade | Quantidade |
| --- | --- |
| P | 3 |
| M | 0 |
| G | 0 |

Total: 3 tarefas · 3 concluídas · 0 pendentes.

> Implementado em 2026-08-04. `compile`, `lint` e **167** testes (+2: TEST-COLORD-001/002). Render/
> interação no host — revisão manual; abrir o painel coberto por E2E (0025).
