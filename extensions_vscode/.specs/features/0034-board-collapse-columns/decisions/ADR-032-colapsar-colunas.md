# ADR-032 — Colapsar colunas por botão, estado puro + persistência

- **Status:** Aceito
- **Data:** 2026-08-04
- **Origem:** design da feature 0034-board-collapse-columns.
- **Decidido em:** TASK-COLLAPSE-001

---

## Contexto

Colapsar colunas precisa de um controle no cabeçalho e de um estado que sobreviva às re-renderizações
ao vivo (o `#boardarea` é redesenhado a cada mudança). Segue o padrão do reordenar (0033, ADR-031).

## Decisão

**Botão ▾/▸ no cabeçalho.** Cada coluna tem um botão que alterna colapsada/expandida; colapsada, o
`.col` ganha a classe `collapsed`, os cartões não são renderizados e a coluna encolhe (`flex: 0 0
auto`). O `drop` continua funcionando na coluna colapsada (arrastar um cartão ainda transiciona).

**Estado puro + espelho.** A alternância é `toggleLabel(labels, label)` (em `boardModel.ts`, puro,
testado, não muta) — a lógica canônica que o cliente espelha. `state.collapsed` guarda os rótulos das
colunas colapsadas.

**Persistência no webview.** `state.collapsed` é gravado por `vscode.setState` (junto de `columnOrder`)
e relido no início, sobrevivendo às atualizações ao vivo e a reloads do webview.

## Alternativas consideradas

| Alternativa | Por que não |
| --- | --- |
| **Colapsar como faixa vertical** (título rotacionado) | CSS mais frágil; a faixa horizontal compacta já resolve |
| **Estado só em memória** | Perderia o colapso ao esconder/mostrar o painel |
| **Colapsar todas de uma vez** | Fora do pedido; incremento futuro |

## Consequências

**Positivas**

- Foco no que interessa; estado estável ao vivo; regra testada; reusa `setState` do 0033.

**Negativas**

- Duplicação trivial (predicado TS testado + JS do cliente). **Mitigação:** teste da versão canônica.
- Persistência não sobrevive à reabertura do painel. **Mitigação:** aceitável; futuro.

## Limite desta decisão

Decide **o controle** (botão), **o estado** (`toggleLabel` puro + espelho) e **a persistência**
(webview state). **Não** implementa colapsar todas nem largura customizável.
