# ADR-031 — Reordenar colunas por setas, ordem pura + persistência no webview

- **Status:** Aceito
- **Data:** 2026-08-04
- **Origem:** design da feature 0033-board-column-order.
- **Decidido em:** TASK-COLORD-001

---

## Contexto

Reordenar colunas pode ser por **arrastar** ou por **controles** (setas/botões). O quadro já usa
arrastar para mover **cartões** entre colunas — arrastar colunas também conflitaria com isso. A ordem
precisa sobreviver às re-renderizações ao vivo (o `#boardarea` é redesenhado a cada mudança).

## Decisão

**Setas ◂/▸ no cabeçalho.** Cada coluna tem setas para mover à esquerda/direita (desabilitadas nas
bordas); um botão "↺ Colunas" restaura o padrão. Evita o conflito com o arrastar de cartões e é claro.

**Ordem pura + espelho.** `orderColumns(columns, order)` e `moveColumn(labels, label, dir)` (em
`boardModel.ts`, puros, testados, não mutam) são a lógica canônica; o cliente os espelha. A ordem
(`state.columnOrder`) guarda os rótulos visíveis reordenados + os ocultos ao final, então uma coluna
escondida por filtro mantém posição estável.

**Persistência no webview.** `state.columnOrder` é gravado por `vscode.setState` e relido no início
(`vscode.getState`), sobrevivendo às atualizações ao vivo e a reloads do webview. Persistir entre
reaberturas do painel (workspaceState) fica para depois.

## Alternativas consideradas

| Alternativa | Por que não |
| --- | --- |
| **Arrastar colunas** | Conflita com o arrastar de cartões; mais código; ambiguidade de drop |
| **Ordem só em memória (sem setState)** | Perderia a ordem ao esconder/mostrar o painel |
| **Persistir em workspaceState** | Mais plumbing (mensagens); `setState` cobre a sessão do webview, suficiente para o incremento |

## Consequências

**Positivas**

- Reordenar claro, sem conflito; ordem estável nas atualizações ao vivo; regra testada.

**Negativas**

- Duplicação do predicado (TS testado + JS do cliente), trivial. **Mitigação:** teste da versão
  canônica.
- Persistência não sobrevive à reabertura do painel. **Mitigação:** aceitável no incremento; futuro.

## Limite desta decisão

Decide **o mecanismo** (setas), **a ordem** (pura + espelho) e **a persistência** (webview state).
**Não** implementa arrastar colunas nem persistência entre reaberturas.
