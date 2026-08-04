# ADR-024 — Painel SDD: webview com script (exceção ao ADR-005) e atualização ao vivo

- **Status:** Aceito
- **Data:** 2026-08-04
- **Origem:** questões **Q1–Q3** da spec de 0025-sdd-board (webview com/sem script, mecanismo do
  tempo real, colunas e interação).
- **Decidido em:** TASK-BOARD-001

---

## Contexto

O Painel SDD precisa de um kanban **ao vivo** (colunas, cartões que mudam de coluna, drill-down de
tarefas). O ADR-005 fixou que os webviews da extensão são **sem script** (dashboard, spec editor),
por segurança e simplicidade. Um kanban ao vivo sem script exigiria **recarregar o HTML inteiro** a
cada mudança de arquivo (flicker, perde a visão/scroll) — ruim para "cara de sistema".

## Decisão

**Q1 — Webview com script, como exceção ao ADR-005.** Só o Painel SDD habilita `enableScripts` (com
`retainContextWhenHidden`). A segurança é mantida por **CSP com nonce** (`default-src 'none'`;
`style-src`/`script-src` restritos ao nonce) e por inserir todo texto de artefato via `textContent`
(nunca `innerHTML`) no cliente — **sem injeção de HTML**. O `<` do board embutido é neutralizado
(`<`) para não fechar a tag. Os demais webviews **continuam sem script** (ADR-005 vale para eles).

**Q2 — Tempo real pelo watcher existente + postMessage.** O watcher de `.specs/*.yaml` (já usado por
`refresh`) passa a chamar `boardPanel.refresh()`, que **reenvia o board por `postMessage`** ao
webview; o cliente re-renderiza sem recarregar o HTML (sem flicker, preserva o drill-down aberto).

**Q3 — Colunas por `groupFor`; incremento 1 somente leitura.** As colunas do kanban de mudanças são
os grupos de status já usados no painel Features (`groupFor`/`GROUP_ORDER`) — consistência. Clicar
num cartão reusa `sddClaudeKit.openDashboard` com o nó sintético `{ kind: 'feature', change }`
(mesmo padrão do 0024). O drill-down de tarefas lê o `tasks.md` sob demanda (`postMessage`).
**Arrastar-para-transicionar** (escreve `status.yaml`) fica para o **incremento 2** — exige validar a
máquina de estados, acrescentar `history` e um motivo.

Núcleo puro: `boardModel.ts` (montagem do board + parsing de tarefas) e `boardHtml.ts` (o shell) são
testáveis; a borda (`boardPanel.ts`) faz o IO e o ciclo de vida.

## Alternativas consideradas

| Alternativa | Por que não |
| --- | --- |
| **Sem script, recarregando o HTML a cada mudança** | Flicker, perde scroll e o drill-down; longe de "cara de sistema" |
| **`enableCommandUris` como no 0024** (sem script) | Serve para botões, não para um kanban dinâmico com re-render parcial ao vivo |
| **Framework de UI (React/etc.) no webview** | Peso e build extra desnecessários; vanilla + `createElement` resolve |
| **Arrastar-para-transicionar já no incremento 1** | Escreve `status.yaml`: precisa de validação de transição, histórico e motivo — risco alto; melhor isolar no incremento 2 |

## Consequências

**Positivas**

- Kanban ao vivo e fluido, com overview e drill-down — resolve o "simples demais".
- Segurança preservada por CSP+nonce e `textContent`; a exceção ao ADR-005 é **localizada** a um painel.
- Núcleo de montagem/parsing puro e testado; reusa `groupFor` e o comando do dashboard.

**Negativas**

- Um webview com script amplia a superfície. **Mitigação:** CSP estrita, sem `innerHTML`, sem rede,
  allowlist de mensagens tratadas (`open`/`tasks`).
- O render client-side e a atualização ao vivo são integração de host — não cobertos por teste
  unitário. **Mitigação:** o modelo/HTML são testados; abrir o painel é coberto por E2E; o restante
  por revisão manual.

## Limite desta decisão

Decide **o painel com script** (CSP+nonce, sem injeção), **o tempo real** (watcher + postMessage) e
**a interação somente-leitura** do incremento 1. **Não** implementa arrastar-para-transicionar, **não**
altera os demais webviews e **não** adiciona a requirement board/split-diff da referência.
