# Solicitação original

- **ID:** 0034-board-collapse-columns
- **Tipo:** feature
- **Criada em:** 2026-08-04
- **Origem:** /sdd-kit:new

---

## Texto da solicitação

> Colapsar colunas.

## Interpretação

Permitir **colapsar/expandir** cada coluna do kanban. Colapsada, a coluna mostra só o cabeçalho
(botão, título, contagem) e **oculta os cartões**, encolhendo — útil para focar em algumas colunas.
O estado colapsado **persiste** na sessão do painel (junto da ordem das colunas, 0033).

Como o resto do painel, a alternância é uma função pura testável que o cliente espelha.

## O que esta mudança entrega

- Botão de colapsar/expandir (▾/▸) em cada cabeçalho de coluna; estado persistido por `vscode.setState`.

## Fora de escopo

- Colapsar/expandir todas de uma vez; largura customizável — futuros.

## Restrições

- Client-side, CSP com nonce; sem rede. Compatibilidade Windows/Linux/WSL.
