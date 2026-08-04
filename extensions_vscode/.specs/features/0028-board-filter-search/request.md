# Solicitação original

- **ID:** 0028-board-filter-search
- **Tipo:** feature
- **Criada em:** 2026-08-04
- **Origem:** /sdd-kit:new

---

## Texto da solicitação

> Adicionar filtros e busca no Painel SDD.

## Interpretação

Com o painel crescendo (mudanças 0001–0027), encontrar uma mudança fica difícil. Esta mudança
acrescenta ao Painel SDD (0025) uma **barra de ferramentas** com:

- **Busca textual** que filtra os cartões por **id ou título** (case-insensitive), ao vivo.
- **Filtros por tipo** (feature/bug/refactor/change) via chips selecionáveis; nenhum selecionado =
  todos.

O board já tem todos os dados no cliente, então o filtro é **client-side** (responsivo, sem
round-trip por tecla). A lógica fica numa **função pura testável** que o cliente espelha.

## O que esta mudança entrega

- Busca + chips de tipo no topo do painel; overview mostra "N exibidas" quando há filtro.
- A barra e o foco da busca **persistem** nas atualizações ao vivo.

## Fora de escopo

- Filtro por status/coluna (as colunas já são os status), datas, ordenação — incrementos futuros.

## Restrições

- Client-side, mantendo a CSP com nonce; sem rede. Compatibilidade Windows/Linux/WSL.
