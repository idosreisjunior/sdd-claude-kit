# ADR-029 — Filtro e paginação do feed no cliente

- **Status:** Aceito
- **Data:** 2026-08-04
- **Origem:** design da feature 0031-feed-filter-pagination.
- **Decidido em:** TASK-FEEDF-001

---

## Contexto

O feed (0029) já está no cliente. Filtrar e paginar segue o padrão do filtro do quadro (0028,
ADR-026): lógica pura + espelho no cliente, barra persistente para não perder o foco da busca.

## Decisão

**Filtro client-side espelhando função pura.** `feedItemMatches`/`filterFeed` (em `boardModel.ts`,
puros, testados) casam id/título (busca) e status; o cliente espelha o predicado. Chips de status
derivados dos status presentes no feed (mais os selecionados ausentes, para poder limpar).

**Paginação por "Carregar mais".** O cliente mostra `feedShown` itens (20) da lista filtrada/ordenada;
um botão "Carregar mais (N)" incrementa `feedShown` em 20. Mudar busca/status/ordem **reinicia**
`feedShown` para 20.

**Barra persistente.** A barra do feed (busca + chips) e o topo (voltar + ordem) ficam fora da
`#feedarea` re-renderizada; a atualização ao vivo redesenha só a `#feedarea` (preserva o foco da
busca), e os chips de status são ressincronizados.

**Teto do feed.** `buildActivityFeed` passa a ser chamado com limite alto (500) — a paginação é no
cliente; o teto é só uma salvaguarda.

## Alternativas consideradas

| Alternativa | Por que não |
| --- | --- |
| **Páginas numeradas** | "Carregar mais" é o idioma natural de um feed; menos estado |
| **Filtrar/paginar na extensão** | Round-trip desnecessário; o feed já está no cliente |
| **Rebuild da barra a cada atualização** | Perderia o foco da busca ao salvar um `.specs` |

## Consequências

**Positivas**

- Feed navegável (filtro + paginação), consistente com o quadro; foco preservado ao vivo.

**Negativas**

- Duplicação do predicado (TS testado + JS do cliente), trivial. **Mitigação:** teste da versão
  canônica.
- Render não unit-testado. **Mitigação:** funções puras testadas; abrir o painel é E2E.

## Limite desta decisão

Decide **o filtro** (busca + status), **a paginação** ("Carregar mais") e **a barra persistente**.
**Não** adiciona filtro por período nem páginas numeradas.
