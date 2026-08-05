# Tarefas — Colapsar colunas do quadro

Complexidade: **P** pequena (≤ meio dia) · **M** média (≈ 1 dia) · **G** grande.

> Estende o Painel SDD (0025/0033). Botão de colapsar + estado puro + persistência (ADR-032).

---

## TASK-COLLAPSE-001 — ADR-032: colapsar por botão, estado puro, persistência

**Requisitos:** REQ-COLLAPSE-001, REQ-COLLAPSE-002
**Dependências:** —
**Complexidade:** P
**Status:** done

### Descrição

Registrar: botão ▾/▸ no cabeçalho; `toggleLabel` puro espelhado pelo cliente; `state.collapsed`
persistido por `vscode.setState` (junto de `columnOrder`).

### Arquivos prováveis

- `.specs/features/0034-board-collapse-columns/decisions/ADR-032-colapsar-colunas.md`

### Testes esperados

- Nenhum — decisão/documentação.

### Critério de conclusão

- ADR-032 escrito.

### Evidências necessárias

- ADR-032 presente com Decisão e Alternativas.

---

## TASK-COLLAPSE-002 — Núcleo puro: `toggleLabel`

**Requisitos:** REQ-COLLAPSE-001, NFR-COLLAPSE-001
**Dependências:** TASK-COLLAPSE-001
**Complexidade:** P
**Status:** done

### Descrição

`boardModel.ts`: `toggleLabel(labels, label)` (adiciona se ausente, remove se presente; não muta).
Sem `vscode`.

### Arquivos prováveis

- `src/sdd/boardModel.ts`

### Testes esperados

- TEST-COLLAPSE-001 — toggleLabel adiciona/remove sem mutar

### Critério de conclusão

- TEST-COLLAPSE-001 passa.

### Evidências necessárias

- Saída de `npm test` com TEST-COLLAPSE-001 verde.

---

## TASK-COLLAPSE-003 — Botão de colapsar + persistência (boardHtml)

**Requisitos:** REQ-COLLAPSE-001, REQ-COLLAPSE-002, NFR-COLLAPSE-002
**Dependências:** TASK-COLLAPSE-002
**Complexidade:** P
**Status:** done

### Descrição

`boardHtml.ts`: `state.collapsed` lido/gravado por `vscode.getState/setState`; `column()` ganha um
botão ▾/▸ (aria-expanded) que alterna via `toggleCollapse`; coluna colapsada recebe a classe
`collapsed` e não renderiza cartões; CSS `.col.collapsed`.

### Arquivos prováveis

- `src/sdd/boardHtml.ts`

### Testes esperados

- Nenhum automatizado próprio — render/interação no host; a lógica está em TASK-COLLAPSE-002. Abrir o
  painel é coberto por E2E (0025); revisão manual.

### Critério de conclusão

- `compile`/`lint`/`test` limpos; colapsar/expandir funciona e persiste.

### Evidências necessárias

- Revisão manual: colapsar/expandir uma coluna; o estado sobrevive à atualização ao vivo.

---

## Resumo

| Complexidade | Quantidade |
| --- | --- |
| P | 3 |
| M | 0 |
| G | 0 |

Total: 3 tarefas · 3 concluídas · 0 pendentes.

> Implementado em 2026-08-04. `compile`, `lint` e **168** testes (+1: TEST-COLLAPSE-001). Render/
> interação no host — revisão manual; abrir o painel coberto por E2E (0025).
