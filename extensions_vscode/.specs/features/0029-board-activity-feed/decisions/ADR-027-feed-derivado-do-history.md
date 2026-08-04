# ADR-027 — Feed derivado do history, montado junto do board

- **Status:** Aceito
- **Data:** 2026-08-04
- **Origem:** design da feature 0029-board-activity-feed.
- **Decidido em:** TASK-FEED-001

---

## Contexto

O feed de atividade precisa mostrar as transições de estado do projeto. A fonte é o `history:` de
cada `status.yaml` (cada transição = `{status, date, reason}`). O painel já lê todos os `status.yaml`
para o progresso das tarefas — não faz sentido ler tudo de novo.

## Decisão

**Feed derivado do `history:` de todos os `status.yaml`, montado na mesma leitura do board.** A borda
(`boardPanel.buildBoardAndFeed`) lê cada `status.yaml` uma vez e produz **board + feed**; ambos são
postados no mesmo evento (`{type:'board', board, feed}`). Assim o feed é **ao vivo** (o watcher já
dispara o reenvio) sem custo extra de IO.

**Núcleo puro.** `buildActivityFeed(sources, limit)` (em `boardModel.ts`) agrega as transições e
ordena por `date` desc — datas "YYYY-MM-DD" ordenam lexicograficamente = cronologicamente. Parsing de
`history:` robusto (js-yaml; inválido/ausente → vazio, nunca lança). Limite padrão 50.

**Visão separada.** Um botão "Atividade" na barra alterna para a visão do feed (como o drill-down de
tarefas); "◂ Quadro" volta. Clicar no id de um item reusa `sddClaudeKit.openDashboard` (nó sintético,
como no 0024/0025).

## Alternativas consideradas

| Alternativa | Por que não |
| --- | --- |
| **Ler os status.yaml de novo só para o feed** | Duplica IO; a leitura do board já os tem em mãos |
| **Incluir ADRs/commits no feed** | O histórico por mudança (0016) já cobre isso; aqui é o feed de transições do projeto |
| **Feed sob demanda (não ao vivo)** | Postar junto do board custa quase nada e dá o feed em tempo real de graça |

## Consequências

**Positivas**

- Feed em tempo real, reusando a leitura do board; núcleo puro e testado.
- Navegação reaproveita o comando do dashboard.

**Negativas**

- Sem timestamp fino (só data): transições do mesmo dia empatam. **Mitigação:** ordem estável por
  fonte (ordem do índice); aceitável para um feed.
- O render do feed é DOM no host, não unit-testado. **Mitigação:** `buildActivityFeed` testado; abrir
  o painel é E2E; render por revisão.

## Limite desta decisão

Decide **a fonte** (history de todos os status.yaml), **onde é montado** (junto do board) e **a
visão**. **Não** adiciona ADRs/commits, filtro nem paginação do feed.
