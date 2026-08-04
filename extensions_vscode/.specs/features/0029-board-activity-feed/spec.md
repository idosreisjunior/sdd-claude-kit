# Feature: Feed de atividade no Painel SDD

- **ID:** 0029-board-activity-feed
- **Escopo dos identificadores:** FEED
- **Estado:** ver `status.yaml` — a autoridade é ele

---

## Objetivo

Dar ao Painel SDD (0025) uma visão **"Atividade"**: as transições de estado de todas as mudanças,
cronologicamente (mais recente primeiro), ao vivo.

## Contexto

Cada `status.yaml` tem um `history:` com `{status, date, reason}` por transição. Agregando o de todas
as mudanças, temos o feed do projeto. O painel já lê todos os `status.yaml` para o progresso — a
mesma leitura monta o feed, reenviado com o board (watcher → tempo real).

## Escopo

### Incluído

- Visão **"Atividade"** (botão na barra) com a lista das transições agregadas, mais recente primeiro,
  cada item com id, estado, data e motivo; clicar no id abre o dashboard.
- Feed reenviado com o board (ao vivo).

### Não incluído

- ADRs/commits no feed (histórico por mudança é 0016); filtro/paginação do feed.

---

## Decisões de escopo (2026-08-04)

| # | Decisão | Efeito |
| --- | --- | --- |
| D-Q1 | Feed derivado do `history:` de todos os `status.yaml`, montado na mesma leitura do board (`buildBoardAndFeed`) e postado junto. | REQ-FEED-001. |
| D-Q2 | Ordenação por `date` ("YYYY-MM-DD" ordena cronologicamente); limite padrão (50). | REQ-FEED-001. |
| D-Q3 | Visão separada (como o drill-down de tarefas); clique no id reusa `openDashboard`. | REQ-FEED-002. |

---

## Requisitos funcionais

### REQ-FEED-001 — Feed de atividade agregado e ao vivo

O painel deve exibir uma visão "Atividade" com as transições de estado de todas as mudanças (do
`history:`), da mais recente para a mais antiga, atualizando quando os `.specs` mudam.

#### SCN-FEED-001 — Feed agregado, mais recente primeiro

DADO `.specs` com mudanças que têm histórico
QUANDO a visão "Atividade" é aberta
ENTÃO ela lista as transições de todas as mudanças, ordenadas da mais recente para a mais antiga, cada
uma com id, estado, data e motivo.

### REQ-FEED-002 — Navegação a partir do feed

Clicar no id de um item do feed deve abrir o dashboard daquela mudança.

#### SCN-FEED-002 — Abrir a mudança do item

DADO um item do feed
QUANDO o usuário clica no id
ENTÃO o dashboard da mudança correspondente é aberto.

---

## Requisitos não funcionais

### NFR-FEED-001 — Núcleo puro e robusto

A montagem do feed (`buildActivityFeed`, parsing de `history:`) é pura, sem a API do VS Code,
testável, e robusta a YAML inválido/ausente (nunca lança).

### NFR-FEED-002 — Ao vivo e seguro

O feed é reenviado com o board (watcher); o render é client-side com CSP+nonce e `textContent` (sem
injeção).

---

## Critérios de aceite

- [ ] A visão "Atividade" lista as transições agregadas, mais recente primeiro, com id/estado/data/
      motivo, e atualiza ao vivo (REQ-FEED-001, SCN-FEED-001).
- [ ] Clicar no id abre o dashboard da mudança (REQ-FEED-002, SCN-FEED-002).
- [ ] `buildActivityFeed` é puro, testado e robusto (NFR-FEED-001); render seguro ao vivo
      (NFR-FEED-002).

---

## Questões pendentes

Nenhuma.

## Hipóteses assumidas

> HIPÓTESE: O feed é montado junto do board (mesma leitura dos status.yaml) e postado no mesmo evento
> — detalhado no ADR-027.
