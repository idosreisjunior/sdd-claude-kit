# Solicitação original

- **ID:** 0033-board-column-order
- **Tipo:** feature
- **Criada em:** 2026-08-04
- **Origem:** /sdd-kit:new

---

## Texto da solicitação

> Ordenar as colunas do quadro.

## Interpretação

Permitir **reordenar as colunas** do kanban (grupos de status). Cada cabeçalho de coluna ganha setas
**◂ / ▸** para mover a coluna à esquerda/direita; um botão **"↺ Colunas"** restaura a ordem padrão. A
ordem escolhida **persiste** na sessão do painel (webview state), sobrevivendo às atualizações ao vivo
e a reloads.

Como o resto do painel, a lógica de reordenar é pura e testável; a UI a espelha.

## O que esta mudança entrega

- Setas de mover em cada coluna + reset; ordem persistida por `vscode.setState`.

## Fora de escopo

- Arrastar colunas (evita conflito com o arrastar de cartões); persistência entre reaberturas do
  painel (fica no estado do webview) — futuros.

## Restrições

- Client-side, CSP com nonce; sem rede. Compatibilidade Windows/Linux/WSL.
