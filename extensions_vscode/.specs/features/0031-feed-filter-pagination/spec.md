# Feature: Filtro e paginação do feed

- **ID:** 0031-feed-filter-pagination
- **Escopo dos identificadores:** FEEDF
- **Estado:** ver `status.yaml` — a autoridade é ele

---

## Objetivo

Tornar o feed de atividade (0029) navegável com **filtro** (busca id/título + status) e **paginação**
("Carregar mais").

## Contexto

O feed lista todas as transições (teto alto). Filtrar e paginar ajuda quando o histórico cresce.
Como o filtro do quadro (0028), a lógica é pura e testável; a paginação é client-side (contador de
itens visíveis).

## Escopo

### Incluído

- **Filtro do feed**: busca por id/título (case-insensitive) e chips de **status**; vazio = todos.
- **Paginação**: mostra 20 por vez; botão "Carregar mais" incrementa; reinicia ao mudar filtro/ordem.
- Barra e foco da busca preservados nas atualizações ao vivo.

### Não incluído

- Filtro por período; páginas numeradas. Futuros.

---

## Requisitos funcionais

### REQ-FEEDF-001 — Filtro do feed

O feed deve filtrar por **id/título** (busca) e por **status** (chips); nenhum status = todos.

#### SCN-FEEDF-001 — Filtrar o feed

DADO o feed com várias transições
QUANDO o usuário digita na busca e/ou seleciona status
ENTÃO só as transições correspondentes permanecem; sem correspondência, avisa.

### REQ-FEEDF-002 — Paginação do feed

O feed deve mostrar um número limitado por vez, com **"Carregar mais"** para exibir mais.

#### SCN-FEEDF-002 — Carregar mais

DADO um feed (filtrado) com mais itens que a página
QUANDO o feed é exibido
ENTÃO mostra os primeiros N e um botão "Carregar mais"; ao clicar, exibe mais N. Mudar filtro/ordem
reinicia a paginação.

---

## Requisitos não funcionais

### NFR-FEEDF-001 — Lógica pura e testável

`feedItemMatches`/`filterFeed` são puros, sem a API do VS Code, testados; o cliente os espelha.

### NFR-FEEDF-002 — Client-side e seguro

Filtro e paginação rodam no cliente; a barra e o foco da busca persistem nas atualizações ao vivo;
CSP com nonce mantida.

---

## Critérios de aceite

- [ ] A busca e os chips de status filtram o feed; vazio = todos (REQ-FEEDF-001, SCN-FEEDF-001).
- [ ] O feed pagina com "Carregar mais"; mudar filtro/ordem reinicia (REQ-FEEDF-002, SCN-FEEDF-002).
- [ ] `filterFeed`/`feedItemMatches` puros e testados (NFR-FEEDF-001); client-side, foco preservado ao
      vivo (NFR-FEEDF-002).

---

## Questões pendentes

Nenhuma.

## Hipóteses assumidas

> HIPÓTESE: Barra do feed (busca + chips de status) fora da área re-renderizada; paginação por
> "Carregar mais" (contador visível) — detalhado no ADR-029.
