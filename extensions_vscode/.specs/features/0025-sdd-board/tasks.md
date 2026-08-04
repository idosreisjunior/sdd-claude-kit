# Tarefas — Painel SDD (Kanban + Overview ao vivo)

Complexidade: **P** pequena (≤ meio dia) · **M** média (≈ 1 dia) · **G** grande
(deve ser dividida antes de começar).

> Plano montado a partir dos requisitos. A pendência de design — Q1–Q3 (webview com script, tempo
> real, colunas/interação) — é resolvida em **TASK-BOARD-001 (ADR-024)**. Incremento 1 somente
> leitura; arrastar-para-transicionar é incremento 2.

---

## Ordem de execução

```
TASK-BOARD-001 (ADR-024)
        │
        ▼
TASK-BOARD-002 (núcleo puro: boardModel — board + tarefas)
        │
        ▼
TASK-BOARD-003 (boardHtml: webview com script, CSP+nonce, render client-side)
        │
        ▼
TASK-BOARD-004 (boardPanel + wiring + comando/botão + E2E)
```

Caminho crítico: **TASK-BOARD-001 → 002 → 003 → 004** (linear).

---

## TASK-BOARD-001 — ADR-024: webview com script + tempo real + interação

**Requisitos:** REQ-BOARD-001, REQ-BOARD-003
**Dependências:** —
**Complexidade:** P
**Status:** done

### Descrição

Resolver e registrar em ADR: **(Q1)** webview com script (exceção ao ADR-005) + CSP/nonce + sem
injeção; **(Q2)** tempo real pelo watcher `.specs/*.yaml` + `postMessage`; **(Q3)** colunas por
`groupFor`, incremento 1 somente leitura (clique abre o dashboard), arrastar = incremento 2.

### Arquivos prováveis

- `.specs/features/0025-sdd-board/decisions/ADR-024-painel-com-script-e-atualizacao-ao-vivo.md`

### Testes esperados

- Nenhum — decisão/documentação.

### Critério de conclusão

- ADR-024 escrito, decidindo Q1–Q3.

### Evidências necessárias

- ADR-024 presente com Decisão e Alternativas.

---

## TASK-BOARD-002 — Núcleo puro: `boardModel`

**Requisitos:** REQ-BOARD-001, REQ-BOARD-002, NFR-BOARD-001
**Dependências:** TASK-BOARD-001
**Complexidade:** M
**Status:** done

### Descrição

`boardModel.ts` (puro): `buildChangesBoard(changes, progressById)` → colunas por `groupFor` + overview
(total, concluídas = VERIFIED+ARCHIVED, %); `parseTaskBoard(tasksMd)` → colunas pendente/em
progresso/concluída. Robusto a vazio/inválido.

### Arquivos prováveis

- `src/sdd/boardModel.ts`

### Testes esperados

- TEST-BOARD-001 — `buildChangesBoard` agrupa por status e resume o overview (SCN-BOARD-001)
- TEST-BOARD-002 — `parseTaskBoard` separa as tarefas por status (SCN-BOARD-002)

### Critério de conclusão

- TEST-BOARD-001/002 passam; `boardModel.ts` sem import de `vscode`/rede.

### Evidências necessárias

- Saída de `npm test` com TEST-BOARD-001/002 verdes.

---

## TASK-BOARD-003 — `boardHtml`: webview com script (CSP+nonce)

**Requisitos:** REQ-BOARD-001, NFR-BOARD-002
**Dependências:** TASK-BOARD-002
**Complexidade:** M
**Status:** done

### Descrição

`boardHtml.ts` (puro): `renderBoardHtml(board, nonce)` → HTML com CSP (`default-src 'none'`,
`style-src`/`script-src` nonce), estilos do kanban, e um `<script nonce>` que embute o board inicial,
renderiza colunas/cartões por `createElement`+`textContent`, trata cliques (`postMessage`) e
atualização por mensagem. O `<` do board embutido é neutralizado.

### Arquivos prováveis

- `src/sdd/boardHtml.ts`

### Testes esperados

- TEST-BOARD-003 — CSP com nonce em style e script; board embutido; `acquireVsCodeApi`; `<`
  neutralizado (sem injeção)

### Critério de conclusão

- TEST-BOARD-003 passa; sem `innerHTML` no cliente; `boardHtml.ts` sem import de `vscode`.

### Evidências necessárias

- Saída de `npm test` com TEST-BOARD-003 verde.

---

## TASK-BOARD-004 — `boardPanel` + wiring + comando/botão + E2E

**Requisitos:** REQ-BOARD-001, REQ-BOARD-002, REQ-BOARD-003, NFR-BOARD-003
**Dependências:** TASK-BOARD-003
**Complexidade:** M
**Status:** done

### Descrição

`boardPanel.ts` (borda): WebviewPanel único (`enableScripts`), lê `index.yaml` + os `status.yaml`
(progresso), monta e renderiza o board; `refresh()` reenvia por `postMessage` (ao vivo); trata
mensagens `open` (abre o dashboard via nó sintético) e `tasks` (lê `tasks.md`, `parseTaskBoard`,
reenvia). `extension.ts`: instancia, pluga `boardPanel.refresh()` no `refresh` (watcher) e registra
`sddClaudeKit.openBoard`. `package.json`: comando "SDD: Painel (Kanban)" + botão no `view/title` dos
painéis. E2E: abrir o painel sem lançar.

### Arquivos prováveis

- `src/sdd/boardPanel.ts`, `src/extension.ts`, `package.json`, `src/e2e/flows.test.ts`

### Testes esperados

- TEST-BOARD-004 — E2E: `sddClaudeKit.openBoard` abre o painel sem lançar (SCN-BOARD-003)

### Critério de conclusão

- E2E TEST-BOARD-004 verde no CI; comando registrado (paridade E2E); `compile`/`lint`/`test` limpos.

### Evidências necessárias

- Run do CI com o E2E do painel verde.

---

## Resumo

| Complexidade | Quantidade |
| --- | --- |
| P | 1 |
| M | 3 |
| G | 0 |

Total: 4 tarefas · 4 concluídas · 0 pendentes.

**Caminho crítico:** TASK-BOARD-001 → 002 → 003 → 004 (linear; concluído).

**Bloqueios ativos:** nenhum — Q1–Q3 resolvidas por ADR-024.

> Incremento 1 implementado em 2026-08-04. Verificação local: `compile`, `lint` e **146** testes
> unitários limpos (+7: TEST-BOARD-001..003 e robustez). Abrir o painel (TEST-BOARD-004) e a
> atualização ao vivo são integração de host — o E2E roda no CI (gate autoritativo). Arrastar =
> incremento 2.
