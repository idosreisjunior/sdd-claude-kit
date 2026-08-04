# Solicitação original

- **ID:** 0029-board-activity-feed
- **Tipo:** feature
- **Criada em:** 2026-08-04
- **Origem:** /sdd-kit:new

---

## Texto da solicitação

> Adicionar feed de atividade no painel.

## Interpretação

Como na SDD Builder AI, um **feed de atividade** do projeto. A fonte natural no nosso modelo é o
`history:` de cada `status.yaml`: cada transição de estado tem `{status, date, reason}`. Agregando
as transições de **todas as mudanças**, temos um feed cronológico (mais recente primeiro) com id,
estado, data e motivo.

O Painel SDD (0025) já lê todos os `status.yaml` (para o progresso) — a mesma leitura alimenta o
feed, que é reenviado junto com o board (atualização ao vivo).

## O que esta mudança entrega

- Uma visão **"Atividade"** no painel: lista das transições agregadas, da mais recente para a mais
  antiga; clicar no id abre o dashboard.
- Feed **ao vivo** (reenviado com o board pelo watcher).

## Fora de escopo

- ADRs/commits no feed (o histórico por mudança já tem isso em 0016) — aqui é o feed de transições do
  projeto. Filtro/paginação do feed — futuros.

## Restrições

- Client-side, CSP com nonce; sem rede. Compatibilidade Windows/Linux/WSL.
