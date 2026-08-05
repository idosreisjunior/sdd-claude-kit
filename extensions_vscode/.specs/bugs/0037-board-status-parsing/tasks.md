# Tarefas — Kanban de tarefas conta `**done**` como pendente

Complexidade: **P** pequena (≤ meio dia) · **M** média (≈ 1 dia) · **G** grande
(deve ser dividida antes de começar).

---

## Ordem de execução

```
TASK-BSTAT-001 (teste de regressão, vermelho) ─► TASK-BSTAT-002 (correção, verde)

Caminho crítico: 001 → 002
```

---

## TASK-BSTAT-001 — Teste de regressão que reproduz o defeito

**Requisitos:** SCN-BSTAT-001, SCN-BSTAT-002, SCN-BSTAT-003
**Dependências:** —
**Complexidade:** P
**Status:** done

### Descrição

Escrever o teste que reproduz o defeito com a forma literal usada no repositório
(`**Status:** **done** — 2026-07-29`), mais as formas já suportadas e o caso irreconhecível
que deve continuar caindo em "pendente". Arquivo separado de `boardModel.test.ts`: os
testes de lá cobrem a feature 0025 e não podem ser tocados por esta correção.

### Arquivos prováveis

- `src/test/boardStatusParsing.test.ts`

### Testes esperados

- TEST-BSTAT-001

### Critério de conclusão

- O teste **falha** antes da correção, e falha apenas no cenário do defeito (SCN-BSTAT-001).

### Evidências necessárias

- Saída do teste vermelho, com os demais cenários verdes.

---

## TASK-BSTAT-002 — Reconhecer a palavra dentro do valor do status

**Requisitos:** SCN-BSTAT-001, SCN-BSTAT-002, SCN-BSTAT-003
**Dependências:** TASK-BSTAT-001
**Complexidade:** P
**Status:** done

### Descrição

Separar o reconhecimento em duas partes: uma regex reconhece a LINHA de status e outra
procura a palavra conhecida dentro do valor. Preserva a ressalva do SCN-BOARD-002 — valor
sem palavra conhecida deixa o estado indefinido e o bloco cai em "pendente".

### Arquivos prováveis

- `src/sdd/boardModel.ts`

### Testes esperados

- TEST-BSTAT-001

### Critério de conclusão

- TEST-BSTAT-001 passa inteiro; a suíte existente passa sem alteração de expectativa.
- O drill-down do `0001-plugin-foundation` mostra 17 de 17 concluídas.

### Evidências necessárias

- Saída da suíte; contagem real do arquivo antes e depois.

---

## Resumo

| Complexidade | Quantidade |
| --- | --- |
| P | 2 |
| M | 0 |
| G | 0 |

Total: 2 tarefas · 2 concluídas · 0 pendentes.

**Caminho crítico:** TASK-BSTAT-001 → TASK-BSTAT-002

**Bloqueios ativos:** Nenhum.

**Paralelizáveis agora:** Nenhuma — a correção depende do teste vermelho.
