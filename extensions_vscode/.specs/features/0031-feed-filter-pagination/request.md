# Solicitação original

- **ID:** 0031-feed-filter-pagination
- **Tipo:** feature
- **Criada em:** 2026-08-04
- **Origem:** /sdd-kit:new

---

## Texto da solicitação

> Adicionar paginação e filtro do feed.

## Interpretação

O feed de atividade (0029) lista todas as transições. Com o histórico crescendo, acrescentar:

- **Filtro do feed** — busca por id/título e chips de **status** (a transição); vazio = todos.
- **Paginação** — mostrar um número por vez (20) com um botão **"Carregar mais"**.

Como o filtro do quadro (0028), a lógica de filtro é pura e testável; a paginação é client-side.

## O que esta mudança entrega

- Barra do feed (busca + chips de status) e "Carregar mais"; a barra e o foco da busca persistem nas
  atualizações ao vivo.

## Fora de escopo

- Filtro por período/data; página numerada — futuros.

## Restrições

- Client-side, CSP com nonce; sem rede. Compatibilidade Windows/Linux/WSL.
