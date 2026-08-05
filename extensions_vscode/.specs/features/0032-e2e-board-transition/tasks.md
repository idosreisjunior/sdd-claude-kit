# Tarefas — E2E da transição do painel

Complexidade: **P** pequena (≤ meio dia) · **M** média (≈ 1 dia) · **G** grande.

> Fecha o gap de borda do 0026 dentro do que o tooling permite (ADR-030).

---

## TASK-TRANS-001 — ADR-030: E2E do efeito, não do gesto

**Requisitos:** REQ-TRANS-001, NFR-TRANS-001
**Dependências:** —
**Complexidade:** P
**Status:** done

### Descrição

Registrar a limitação (gesto de DOM não dirigível) e a decisão: extrair `applyTransition` e cobrir o
efeito por E2E num workspace temporário.

### Arquivos prováveis

- `.specs/features/0032-e2e-board-transition/decisions/ADR-030-e2e-do-efeito-nao-do-gesto.md`

### Testes esperados

- Nenhum — decisão/documentação.

### Critério de conclusão

- ADR-030 escrito.

### Evidências necessárias

- ADR-030 presente com Decisão, Alternativas e a limitação.

---

## TASK-TRANS-002 — Extrair `applyTransition` + E2E

**Requisitos:** REQ-TRANS-001
**Dependências:** TASK-TRANS-001
**Complexidade:** P
**Status:** done

### Descrição

`boardPanel.ts`: extrair `applyTransition(root, id, path, target, reason)` (exportada; all-or-nothing);
`moveChange` a reusa e mostra as mensagens conforme o resultado. `src/e2e/transition.test.ts`: aplica
uma transição num workspace temporário e verifica `status.yaml`/`index.yaml`; e o caminho "ausentes".

### Arquivos prováveis

- `src/sdd/boardPanel.ts`
- `src/e2e/transition.test.ts`

### Testes esperados

- TEST-TRANS-001 — applyTransition escreve a transição no host (SCN-TRANS-001)
- TEST-TRANS-002 — sem os arquivos, retorna "missing" (SCN-TRANS-002)

### Critério de conclusão

- TEST-TRANS-001/002 verdes no CI; `compile`/`lint`/`test` unitário limpos.

### Evidências necessárias

- Run do CI com os testes E2E de transição verdes.

---

## Resumo

| Complexidade | Quantidade |
| --- | --- |
| P | 2 |
| M | 0 |
| G | 0 |

Total: 2 tarefas · 2 concluídas · 0 pendentes.

> Implementado em 2026-08-04. Compile/lint/165 testes unitários limpos; os E2E TEST-TRANS-001/002
> rodam no CI (host sob xvfb). O gesto de DOM segue como revisão manual (limitação registrada).
