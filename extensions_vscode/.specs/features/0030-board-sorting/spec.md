# Feature: Ordenação do quadro e do feed

- **ID:** 0030-board-sorting
- **Escopo dos identificadores:** SORT
- **Estado:** ver `status.yaml` — a autoridade é ele

---

## Objetivo

Permitir **ordenar** os cartões do quadro (por id/título/progresso) e alternar a ordem do feed
(mais recentes/mais antigos), no Painel SDD (0025).

## Contexto

Os cartões aparecem na ordem do índice; o feed vem do mais recente para o mais antigo. Com o projeto
crescendo, controlar a ordem ajuda. Como o filtro (0028), a lógica de ordenação é pura e testável, e
o cliente a espelha; roda client-side.

## Escopo

### Incluído

- **Quadro**: seletor de ordenação — id ↑, id ↓, título A–Z, progresso — aplicado aos cartões dentro
  das colunas (após o filtro).
- **Feed**: alternador de ordem (mais recentes ⇄ mais antigos).

### Não incluído

- Ordenar por data de atualização; ordenar as colunas. Futuros.

---

## Requisitos funcionais

### REQ-SORT-001 — Ordenação do quadro

O painel deve ordenar os cartões dentro das colunas por **id** (crescente/decrescente), **título** ou
**progresso** (percentual concluído desc; sem tarefas por último).

#### SCN-SORT-001 — Reordenar os cartões

DADO o quadro com cartões
QUANDO o usuário escolhe um critério de ordenação
ENTÃO os cartões de cada coluna são reordenados por esse critério.

### REQ-SORT-002 — Ordenação do feed

O feed deve permitir alternar entre **mais recentes** (padrão) e **mais antigos** primeiro.

#### SCN-SORT-002 — Alternar a ordem do feed

DADO o feed de atividade
QUANDO o usuário alterna a ordem
ENTÃO a lista passa de mais recentes para mais antigos (e vice-versa).

---

## Requisitos não funcionais

### NFR-SORT-001 — Lógica pura e testável

`sortBoardCards` e `orderFeed` são puros, sem a API do VS Code, não mutam a entrada, e são testados.
O cliente do webview espelha a mesma lógica.

### NFR-SORT-002 — Client-side e seguro

A ordenação roda no cliente (sem round-trip), mantendo a CSP com nonce.

---

## Critérios de aceite

- [ ] O quadro ordena por id (asc/desc), título e progresso (REQ-SORT-001, SCN-SORT-001).
- [ ] O feed alterna entre mais recentes e mais antigos (REQ-SORT-002, SCN-SORT-002).
- [ ] `sortBoardCards`/`orderFeed` puros, testados, sem mutar a entrada (NFR-SORT-001); client-side,
      CSP preservada (NFR-SORT-002).

---

## Questões pendentes

Nenhuma.

## Hipóteses assumidas

> HIPÓTESE: Um `<select>` para o quadro e um botão-alternador para o feed; o cliente espelha
> `sortBoardCards`/`orderFeed` — detalhado no ADR-028.
