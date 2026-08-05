# Tarefas — Filtro e paginação do feed

Complexidade: **P** pequena (≤ meio dia) · **M** média (≈ 1 dia) · **G** grande.

> Estende o feed (0029). Filtro client-side espelhando função pura; paginação por "Carregar mais"
> (ADR-029).

---

## TASK-FEEDF-001 — ADR-029: filtro e paginação do feed

**Requisitos:** REQ-FEEDF-001, REQ-FEEDF-002
**Dependências:** —
**Complexidade:** P
**Status:** done

### Descrição

Registrar: filtro no cliente espelhando `filterFeed`/`feedItemMatches`; paginação por "Carregar mais"
(feedShown, reinicia ao mudar filtro/ordem); barra do feed persistente; teto do feed 500.

### Arquivos prováveis

- `.specs/features/0031-feed-filter-pagination/decisions/ADR-029-filtro-e-paginacao-do-feed.md`

### Testes esperados

- Nenhum — decisão/documentação.

### Critério de conclusão

- ADR-029 escrito.

### Evidências necessárias

- ADR-029 presente com Decisão e Alternativas.

---

## TASK-FEEDF-002 — Núcleo puro: `filterFeed` / `feedItemMatches`

**Requisitos:** REQ-FEEDF-001, NFR-FEEDF-001
**Dependências:** TASK-FEEDF-001
**Complexidade:** P
**Status:** done

### Descrição

`boardModel.ts`: `FeedFilter`, `feedItemMatches` (id/título + status), `filterFeed`. Sem import de
`vscode`.

### Arquivos prováveis

- `src/sdd/boardModel.ts`

### Testes esperados

- TEST-FEEDFILTER-001 — filterFeed por busca e status; vazio = todos
- TEST-FEEDFILTER-002 — feedItemMatches combina busca e status

### Critério de conclusão

- TEST-FEEDFILTER-001/002 passam.

### Evidências necessárias

- Saída de `npm test` com os testes verdes.

---

## TASK-FEEDF-003 — Barra do feed + paginação (boardHtml) + teto (boardPanel)

**Requisitos:** REQ-FEEDF-001, REQ-FEEDF-002, NFR-FEEDF-002
**Dependências:** TASK-FEEDF-002
**Complexidade:** M
**Status:** done

### Descrição

`boardHtml.ts`: barra do feed (busca + chips de status), `#feedarea` re-renderizada com filtro/ordem/
paginação; "Carregar mais" incrementa `feedShown`; mudança de filtro/ordem reinicia; barra/foco
preservados ao vivo. `boardPanel.ts`: `buildActivityFeed(feedSources, 500)`.

### Arquivos prováveis

- `src/sdd/boardHtml.ts`, `src/sdd/boardPanel.ts`

### Testes esperados

- Nenhum automatizado próprio — render/interação no host; a lógica está em TASK-FEEDF-002. Abrir o
  painel é coberto por E2E (0025); revisão manual.

### Critério de conclusão

- `compile`/`lint`/`test` limpos; o feed filtra e pagina; foco preservado ao vivo.

### Evidências necessárias

- Revisão manual: filtrar/paginar o feed; salvar um `.specs` não perde o foco da busca.

---

## Resumo

| Complexidade | Quantidade |
| --- | --- |
| P | 2 |
| M | 1 |
| G | 0 |

Total: 3 tarefas · 3 concluídas · 0 pendentes.

> Implementado em 2026-08-04. `compile`, `lint` e **165** testes (+2: TEST-FEEDFILTER-001/002).
> Render/interação no host — revisão manual; abrir o painel coberto por E2E (0025).
