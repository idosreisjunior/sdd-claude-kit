# Tarefas — Busca e filtros no Painel SDD

Complexidade: **P** pequena (≤ meio dia) · **M** média (≈ 1 dia) · **G** grande.

> Estende o Painel SDD (0025). Filtro client-side espelhando função pura (ADR-026).

---

## TASK-FILTER-001 — ADR-026: filtro client-side + barra persistente

**Requisitos:** REQ-FILTER-001, REQ-FILTER-003
**Dependências:** —
**Complexidade:** P
**Status:** done

### Descrição

Registrar: filtro no cliente espelhando `cardMatchesFilter`/`filterChangesBoard` (puros, testados);
barra persistente (`#toolbar`) com a `#boardarea` re-renderizada nas atualizações ao vivo.

### Arquivos prováveis

- `.specs/features/0028-board-filter-search/decisions/ADR-026-filtro-client-side-espelhando-funcao-pura.md`

### Testes esperados

- Nenhum — decisão/documentação.

### Critério de conclusão

- ADR-026 escrito.

### Evidências necessárias

- ADR-026 presente com Decisão e Alternativas.

---

## TASK-FILTER-002 — Núcleo puro: `cardMatchesFilter` / `filterChangesBoard`

**Requisitos:** REQ-FILTER-001, REQ-FILTER-002, NFR-FILTER-001
**Dependências:** TASK-FILTER-001
**Complexidade:** P
**Status:** done

### Descrição

`boardModel.ts`: `BoardFilter`, `cardMatchesFilter` (id/título + tipo), `filterChangesBoard` (aplica,
omite colunas vazias, calcula `overview.shown`). `BoardOverview` ganha `shown?`.

### Arquivos prováveis

- `src/sdd/boardModel.ts`

### Testes esperados

- TEST-FILTER-001 — busca casa id/título; colunas sem match omitidas; total preservado
- TEST-FILTER-002 — filtro por tipo; vazio = todos
- TEST-FILTER-003 — `cardMatchesFilter` combina busca e tipo

### Critério de conclusão

- TEST-FILTER-001..003 passam; `boardModel.ts` sem import de `vscode`.

### Evidências necessárias

- Saída de `npm test` com TEST-FILTER-001..003 verdes.

---

## TASK-FILTER-003 — Barra (busca + chips) no `boardHtml`, ao vivo

**Requisitos:** REQ-FILTER-001, REQ-FILTER-002, REQ-FILTER-003, NFR-FILTER-002
**Dependências:** TASK-FILTER-002
**Complexidade:** M
**Status:** done

### Descrição

`boardHtml.ts`: barra `#toolbar` (input de busca + chips de tipo derivados dos cartões presentes);
`state.filter`; `renderBoardArea` aplica o filtro (espelha `cardMatchesFilter`) e mostra "N exibidas";
a atualização ao vivo re-renderiza só a `#boardarea` (barra/foco preservados). CSS da barra/chips.

### Arquivos prováveis

- `src/sdd/boardHtml.ts`

### Testes esperados

- Nenhum automatizado próprio — o render/interação do cliente é host; a lógica está em TASK-FILTER-002.
  Abrir o painel é coberto por E2E; revisão manual do filtro/foco.

### Critério de conclusão

- `compile`/`lint`/`test` limpos; a barra filtra ao vivo e não perde foco na atualização.

### Evidências necessárias

- Revisão manual: buscar/selecionar tipo filtra; salvar um `.specs` não perde o foco da busca.

---

## Resumo

| Complexidade | Quantidade |
| --- | --- |
| P | 2 |
| M | 1 |
| G | 0 |

Total: 3 tarefas · 3 concluídas · 0 pendentes.

> Implementado em 2026-08-04. `compile`, `lint` e **159** testes (+3: TEST-FILTER-001..003). Render e
> interação no host — revisão manual; abrir o painel coberto por E2E (0025).
