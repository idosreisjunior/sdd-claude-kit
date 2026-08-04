# Solicitação original

- **ID:** 0030-board-sorting
- **Tipo:** feature
- **Criada em:** 2026-08-04
- **Origem:** /sdd-kit:new

---

## Texto da solicitação

> Adicionar ordenação do quadro e do feed.

## Interpretação

Acrescentar controles de **ordenação** ao Painel SDD (0025):

- **Quadro** — ordenar os cartões dentro das colunas por **id** (crescente/decrescente), **título**
  ou **progresso** das tarefas.
- **Feed** — alternar entre **mais recentes** (padrão) e **mais antigos** primeiro.

Como o filtro (0028), a lógica fica em **funções puras testáveis** que o cliente espelha; a ordenação
roda client-side.

## O que esta mudança entrega

- Um seletor de ordenação na barra do quadro e um alternador de ordem no feed.

## Fora de escopo

- Ordenar por data de atualização (o índice não expõe timestamps finos), ordenação por coluna — futuros.

## Restrições

- Client-side, CSP com nonce; sem rede. Compatibilidade Windows/Linux/WSL.
