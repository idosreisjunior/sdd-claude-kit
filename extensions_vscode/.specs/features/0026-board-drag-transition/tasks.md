# Tarefas — Transição por arrastar no Painel SDD (incremento 2)

Complexidade: **P** pequena (≤ meio dia) · **M** média (≈ 1 dia) · **G** grande
(deve ser dividida antes de começar).

> Q1–Q3 resolvidas em TASK-DND-001 (ADR-025). Estende o Painel SDD (0025). Não depende da Fase 2.

---

## Ordem de execução

```
TASK-DND-001 (ADR-025)
        │
        ▼
TASK-DND-002 (núcleo puro: stateMachine + statusWriter)
        │
        ▼
TASK-DND-003 (arrastar-soltar no boardHtml + handler move no boardPanel)
```

Caminho crítico: **TASK-DND-001 → 002 → 003** (linear).

---

## TASK-DND-001 — ADR-025: resolução por grafo + escrita não destrutiva

**Requisitos:** REQ-DND-001, NFR-DND-001, NFR-DND-002
**Dependências:** —
**Complexidade:** P
**Status:** done

### Descrição

Registrar em ADR: resolução do alvo por interseção grupo × grafo (QuickPick se ambíguo, recusa se
inválido); escrita por manipulação de texto (preserva comentários/block scalars); motivo obrigatório;
transições embutidas espelhando workflow.json.

### Arquivos prováveis

- `.specs/features/0026-board-drag-transition/decisions/ADR-025-transicao-por-arrastar.md`

### Testes esperados

- Nenhum — decisão/documentação.

### Critério de conclusão

- ADR-025 escrito, decidindo Q1–Q3.

### Evidências necessárias

- ADR-025 presente com Decisão e Alternativas.

---

## TASK-DND-002 — Núcleo puro: `stateMachine` + `statusWriter`

**Requisitos:** REQ-DND-001, NFR-DND-001, NFR-DND-002, NFR-DND-003
**Dependências:** TASK-DND-001
**Complexidade:** M
**Status:** done

### Descrição

`stateMachine.ts`: `TRANSITIONS`/`GROUP_STATES` (espelham workflow.json/groupFor), `validTransitions`,
`canTransition`, `candidateTargets(from, grupo)`. `statusWriter.ts`: `appendHistoryAndSetStatus`
(troca status de topo + acrescenta entrada ao fim do history, preservando o resto) e `setIndexStatus`.

### Arquivos prováveis

- `src/sdd/stateMachine.ts`
- `src/sdd/statusWriter.ts`

### Testes esperados

- TEST-DND-001/002/003 — candidatos/validação (stateMachine)
- TEST-DND-004/005/006 — escrita de status.yaml/index.yaml preservando o arquivo (statusWriter)

### Critério de conclusão

- TEST-DND-001..006 passam; módulos sem import de `vscode`; validação também sobre um `status.yaml`
  real (parseia, status == última history, comentários preservados).

### Evidências necessárias

- Saída de `npm test` com TEST-DND-001..006 verdes; validação sobre arquivo real.

---

## TASK-DND-003 — Arrastar-soltar (boardHtml) + handler `move` (boardPanel)

**Requisitos:** REQ-DND-001
**Dependências:** TASK-DND-002
**Complexidade:** M
**Status:** done

### Descrição

`boardHtml.ts`: cartões `draggable`; colunas do kanban de mudanças como alvo de drop; ao soltar,
`postMessage {type:'move', id, toLabel}`. `boardPanel.ts`: handler `move` — resolve candidatos,
QuickPick se ambíguo, InputBox do motivo (obrigatório), escreve status.yaml + index.yaml e atualiza.

### Arquivos prováveis

- `src/sdd/boardHtml.ts`
- `src/sdd/boardPanel.ts`

### Testes esperados

- Nenhum automatizado próprio — o gesto de arrastar e o IO no host são integração; o núcleo
  (resolução + escrita) está em TASK-DND-002. Revisão manual (ver `gaps`).

### Critério de conclusão

- `compile`/`lint`/`test` limpos; arrastar um cartão para uma coluna válida transiciona a mudança
  (com motivo) e o board reflete; coluna inválida é recusada.

### Evidências necessárias

- Revisão manual: arrastar transiciona; inválido é recusado; os arquivos ficam íntegros.

---

## Resumo

| Complexidade | Quantidade |
| --- | --- |
| P | 1 |
| M | 2 |
| G | 0 |

Total: 3 tarefas · 3 concluídas · 0 pendentes.

**Caminho crítico:** TASK-DND-001 → 002 → 003 (linear; concluído).

**Bloqueios ativos:** nenhum — Q1–Q3 resolvidas por ADR-025.

> Incremento 2 implementado em 2026-08-04. Verificação: `compile`, `lint` e **152** testes unitários
> (+6: TEST-DND-001..006). O escritor foi validado também sobre um `status.yaml` real (parseia,
> status == última history, comentários e demais chaves preservados). O gesto de arrastar e o IO no
> host são integração — revisão manual.
