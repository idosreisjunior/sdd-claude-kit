# ADR-026 — Filtro client-side espelhando uma função pura; barra persistente

- **Status:** Aceito
- **Data:** 2026-08-04
- **Origem:** design da feature 0028-board-filter-search.
- **Decidido em:** TASK-FILTER-001

---

## Contexto

O Painel SDD (0025) já tem todos os cartões no cliente. Filtrar por texto/tipo pode rodar (a) no
cliente (responsivo, sem round-trip por tecla) ou (b) na extensão (reenviando o board filtrado por
mensagem a cada tecla — laggy). Além disso, a busca precisa **não perder o foco** quando o board
atualiza ao vivo (o watcher reenvia o board a cada mudança em `.specs`).

## Decisão

**Filtro client-side, espelhando uma função pura testada.** A lógica canônica vive em
`boardModel.ts` (`cardMatchesFilter`, `filterChangesBoard`) e é **testada** (busca por id/título,
tipo, colunas vazias omitidas, contagem `shown`). O cliente do webview **espelha** o mesmo predicado
em ~3 linhas de JS (substring + pertinência de tipo) — mantém a responsividade e a disciplina de
teste (a regra tem teste; o mirror é trivial).

**Barra persistente, área do board re-renderizada.** O `#app` tem uma barra (`#toolbar`, com a busca
e os chips) e uma `#boardarea`. A atualização ao vivo re-renderiza **só a `#boardarea`**, deixando a
barra (e o foco/valor da busca) intactos. O estado do filtro (`state.filter`) sobrevive às
atualizações.

**Overview mostra "exibidas".** `filterChangesBoard` preserva `total`/`done`/`donePct` do board
completo e acrescenta `shown` (após filtro); o cliente mostra "N exibidas" quando `shown != total`.

## Alternativas consideradas

| Alternativa | Por que não |
| --- | --- |
| **Filtrar na extensão** (reenviar o board por tecla) | Round-trip por tecla é laggy; o dado já está no cliente |
| **Re-renderizar tudo (barra + board) na atualização ao vivo** | A busca perderia foco/valor a cada mudança em `.specs` |
| **Só função pura, cliente sem lógica** | O cliente precisa filtrar em JS de qualquer forma; a função pura é o contrato testado que ele espelha |

## Consequências

**Positivas**

- Filtro instantâneo; a busca não perde foco nas atualizações ao vivo; regra testada.

**Negativas**

- Pequena duplicação: o predicado existe em TS (testado) e no JS do cliente. **Mitigação:** é trivial
  e há teste da versão canônica; divergência seria visível.
- O render do cliente não é unit-testado (DOM). **Mitigação:** a lógica pura é testada; abrir o painel
  é coberto por E2E; a interação por revisão manual.

## Limite desta decisão

Decide **onde o filtro roda** (cliente, espelhando função pura) e **como a barra persiste**. **Não**
adiciona filtro por status/data nem ordenação.
