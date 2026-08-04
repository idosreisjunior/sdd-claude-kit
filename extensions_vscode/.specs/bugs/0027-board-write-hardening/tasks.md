# Tarefas — Endurecimento da escrita do Painel SDD

Complexidade: **P** pequena (≤ meio dia) · **M** média (≈ 1 dia) · **G** grande.

> Bug: correções de integridade da escrita do 0026, a partir da revisão. Sem design próprio.

---

## TASK-BUG27-001 — `statusWriter`: preservar fim de linha, comentário inline; exigir ambos os campos

**Requisitos:** REQ-BUG27-001, REQ-BUG27-002
**Dependências:** —
**Complexidade:** P
**Status:** done

### Descrição

`statusWriter.ts`: detectar e reusar o fim de linha (LF/CRLF); trocar só o VALOR de `status:`
(preservando comentário inline) em `appendHistoryAndSetStatus` e `setIndexStatus`; e só alterar se
`status:` (topo) e `history:` existirem.

### Arquivos prováveis

- `src/sdd/statusWriter.ts`

### Testes esperados

- TEST-DND-007w — CRLF preservado (status e index)
- TEST-DND-008w — comentário inline preservado (status e index)
- TEST-DND-009w — sem `history:`/`status:` → inalterado

### Critério de conclusão

- TEST-DND-007w/008w/009w passam; validação sobre `status.yaml` real segue íntegra.

### Evidências necessárias

- Saída de `npm test` com os testes verdes; check sobre arquivo real.

---

## TASK-BUG27-002 — `boardPanel`: all-or-nothing e drop na mesma coluna

**Requisitos:** REQ-BUG27-003, REQ-BUG27-004
**Dependências:** TASK-BUG27-001
**Complexidade:** P
**Status:** done

### Descrição

`boardPanel.ts` `moveChange`: ler `status.yaml` e `index.yaml` antes de escrever; escrever o status,
tentar o índice e, em falha, restaurar o status; ignorar drop quando `groupFor(from) == toLabel`.

### Arquivos prováveis

- `src/sdd/boardPanel.ts`

### Testes esperados

- Nenhum automatizado próprio — IO e diálogos no host; a lógica de escrita está em TASK-BUG27-001. O
  grafo completo ganha teste (TEST-DND-007). Revisão manual da restauração/no-op.

### Critério de conclusão

- `compile`/`lint`/`test` limpos; revisão da borda.

### Evidências necessárias

- Revisão de código: leitura dos dois arquivos antes de escrever; restauração em falha; no-op na
  mesma coluna.

---

## Resumo

| Complexidade | Quantidade |
| --- | --- |
| P | 2 |
| M | 0 |
| G | 0 |

Total: 2 tarefas · 2 concluídas · 0 pendentes.

> Corrigido em 2026-08-04. `compile`, `lint` e **156** testes (+4: TEST-DND-007 grafo completo e
> TEST-DND-007w/008w/009w de preservação). Writer revalidado sobre um `status.yaml` real.
