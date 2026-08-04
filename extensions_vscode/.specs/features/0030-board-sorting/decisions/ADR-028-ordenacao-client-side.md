# ADR-028 — Ordenação client-side espelhando funções puras

- **Status:** Aceito
- **Data:** 2026-08-04
- **Origem:** design da feature 0030-board-sorting.
- **Decidido em:** TASK-SORT-001

---

## Contexto

O painel tem os cartões e o feed no cliente. Ordenar pode rodar no cliente (instantâneo) ou na
extensão (reenviando por evento). Segue o mesmo padrão do filtro (0028, ADR-026).

## Decisão

**Ordenação client-side, espelhando funções puras testadas.** `sortBoardCards(cards, key)` (id-asc/
id-desc/title/progress) e `orderFeed(items, order)` (desc/asc) vivem em `boardModel.ts`, são **puras,
não mutam a entrada e testadas**. O cliente espelha `sortBoardCards` em poucas linhas; para o feed,
apenas inverte a lista quando `asc`.

**Controles.** Um `<select>` na barra do quadro (aplicado após o filtro, dentro de cada coluna) e um
botão-alternador na visão Atividade. `progress` ordena por percentual concluído desc, cartões sem
tarefas por último, empate por id. `title` usa `localeCompare('pt-BR')`.

## Alternativas consideradas

| Alternativa | Por que não |
| --- | --- |
| **Ordenar na extensão** (reenviar por evento) | Round-trip desnecessário; o dado já está no cliente |
| **Colunas = estados para ordenar globalmente** | Fora de escopo; a ordenação é dentro das colunas |

## Consequências

**Positivas**

- Ordenação instantânea; regra testada; combina com o filtro (0028).

**Negativas**

- Pequena duplicação (predicado em TS testado + no JS do cliente). **Mitigação:** trivial e coberto
  por teste da versão canônica.
- O render não é unit-testado. **Mitigação:** as funções puras são testadas; abrir o painel é E2E.

## Limite desta decisão

Decide os **critérios** (id/título/progresso; feed desc/asc) e **onde** roda (cliente). **Não** ordena
por timestamp fino nem reordena as colunas.
