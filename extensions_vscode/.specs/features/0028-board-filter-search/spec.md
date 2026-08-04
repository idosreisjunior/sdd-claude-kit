# Feature: Busca e filtros no Painel SDD

- **ID:** 0028-board-filter-search
- **Escopo dos identificadores:** FILTER
- **Estado:** ver `status.yaml` — a autoridade é ele

---

## Objetivo

Facilitar encontrar mudanças no Painel SDD (0025) com uma **busca textual** (id/título) e **filtros
por tipo**, ao vivo, sem recarregar nem perder o foco da busca nas atualizações.

## Contexto

O board tem todos os cartões no cliente; filtrar por texto/tipo é client-side (responsivo). A lógica
de match é extraída numa função pura testável (`cardMatchesFilter`/`filterChangesBoard`) que o
cliente espelha — mantém a disciplina de teste do repo mesmo com o filtro rodando no webview.

## Escopo

### Incluído

- Barra com **busca** (id/título, case-insensitive) e **chips de tipo** (multi-seleção; vazio =
  todos), ao vivo; overview mostra "N exibidas" quando filtrado.
- Barra e foco da busca **preservados** nas atualizações ao vivo do board.

### Não incluído

- Filtro por status/coluna, datas, ordenação — futuros.

---

## Requisitos funcionais

### REQ-FILTER-001 — Busca textual

O painel deve filtrar os cartões por **id ou título** (case-insensitive), atualizando ao vivo.

#### SCN-FILTER-001 — Buscar por id/título

DADO o painel com várias mudanças
QUANDO o usuário digita um termo na busca
ENTÃO só os cartões cujo id OU título contêm o termo permanecem; sem correspondência, o painel avisa.

### REQ-FILTER-002 — Filtro por tipo

O painel deve permitir filtrar por **tipo** (feature/bug/refactor/change) via chips; nenhum
selecionado significa **todos**.

#### SCN-FILTER-002 — Filtrar por tipo

DADO o painel com mudanças de tipos diferentes
QUANDO o usuário seleciona um ou mais tipos
ENTÃO só os cartões desses tipos permanecem; sem seleção, todos aparecem.

### REQ-FILTER-003 — Combinável e ao vivo, sem perder o foco

Busca e tipo **combinam**; o overview mostra a contagem exibida; a barra e o foco da busca
**persistem** quando o board atualiza ao vivo.

#### SCN-FILTER-003 — Filtro persiste na atualização ao vivo

DADO um filtro ativo e a busca em foco
QUANDO os `.specs` mudam e o board é reenviado
ENTÃO o filtro continua aplicado, a barra permanece e o foco da busca não é perdido.

---

## Requisitos não funcionais

### NFR-FILTER-001 — Lógica pura e testável

O match (`cardMatchesFilter`) e a aplicação (`filterChangesBoard`) são puros, sem a API do VS Code,
testados fora do host. O cliente do webview espelha a mesma lógica.

### NFR-FILTER-002 — Client-side e seguro

O filtro roda no cliente (sem round-trip por tecla), mantendo a CSP com nonce e o render por
`textContent` (sem injeção).

---

## Critérios de aceite

- [ ] A busca filtra por id/título ao vivo; sem match, avisa (REQ-FILTER-001, SCN-FILTER-001).
- [ ] Os chips filtram por tipo; vazio = todos (REQ-FILTER-002, SCN-FILTER-002).
- [ ] Busca + tipo combinam; o overview mostra "N exibidas"; a barra/foco persistem na atualização ao
      vivo (REQ-FILTER-003, SCN-FILTER-003).
- [ ] A lógica de filtro é pura e testada (NFR-FILTER-001); client-side, CSP preservada
      (NFR-FILTER-002).

---

## Questões pendentes

Nenhuma.

## Hipóteses assumidas

> HIPÓTESE: A barra vive fora da área re-renderizada do board (para preservar o foco); o cliente
> espelha `cardMatchesFilter` — detalhado no ADR-026.
