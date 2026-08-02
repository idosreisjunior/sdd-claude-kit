# Tarefas — Assistente de criação de MCPs (RF-025)

Complexidade: **P** pequena (≤ meio dia) · **M** média (≈ 1 dia) · **G** grande
(deve ser dividida antes de começar).

> Plano montado a partir dos requisitos, **sem design técnico prévio** (clarify/design são de
> Fase 2). As decisões de escopo (D-Q1..D-Q6) já fixaram o mecanismo (padrão híbrido) e a saída
> (documento `mcp.md`). A formalização do mecanismo — novo action `mcp` no adapter do Claude Code,
> reuso de `runHybridStep` (research 0017/design 0014/clarify 0015) — é registrada em **ADR-021**
> (TASK-MCP-001). Entrega única (D-Q6): um documento com os nove aspectos.

---

## Ordem de execução

```
TASK-MCP-001 ✅ (ADR-021: action mcp + reuso do padrão híbrido)   TASK-MCP-002 ✅ (núcleo puro + template: 9 aspectos)
        │                                                             │
        └──────────────────────────────┬──────────────────────────────┘
                                        ▼
        TASK-MCP-003 ✅ (borda: comando "MCP" — scaffold do mcp.md + delegação ao Claude Code)
```

Caminho crítico: **TASK-MCP-002 → TASK-MCP-003** (o ADR é P e paralelo).
Paralelizáveis desde já: **TASK-MCP-001** e **TASK-MCP-002**.

---

## TASK-MCP-001 — ADR-021: mecanismo (action `mcp`) e reuso do padrão híbrido

**Requisitos:** REQ-MCP-001, REQ-MCP-002
**Dependências:** —
**Complexidade:** P
**Status:** done

### Descrição

Formalizar em ADR a decisão D-Q1: o assistente segue o **padrão híbrido** já usado em research/
design/clarify — scaffoldar um esqueleto (`mcp.md`) de um template sincronizado e oferecer delegar
ao Claude Code — reusando `runHybridStep`. A formalização inclui **adicionar o action `mcp`** ao
adapter do Claude Code (`claudePrompt.ts`, lista `ACTIONS`), como feito com `research` (ADR-017).
Registrar as alternativas descartadas (gerar servidor MCP funcional; formulário próprio em webview)
e as consequências (a lista de actions cresce → o teste que a fixa precisa acompanhar).

### Arquivos prováveis

- `.specs/features/0022-mcp-creation-assistant/decisions/ADR-021-*.md`

### Testes esperados

- Nenhum — decisão/documentação (ver `gaps`).

### Critério de conclusão

- ADR-021 escrito, decidindo o mecanismo (reuso híbrido) e o novo action `mcp`, com alternativas e
  consequências.

---

## TASK-MCP-002 — Núcleo puro + template: os nove aspectos do `mcp.md`

**Requisitos:** REQ-MCP-001, NFR-MCP-001
**Dependências:** —
**Complexidade:** M
**Status:** done

### Descrição

Criar o template `mcp.md` (pt-BR) com uma seção por aspecto dos **nove** do RF-025 (objetivo,
ferramentas, recursos, schemas, autenticação, permissões, testes, documentação, publicação), na
ordem do texto, com as linhas de guia; sincronizar para `extensions_vscode/templates/` (`npm run
sync-templates`). Fonte única dos aspectos num núcleo puro (novo módulo, ex.: `mcpAspects.ts`),
consumida pelo template/borda; o gerador do esqueleto reusa `buildSkeleton`/`stripGuides`
(`skeleton.ts`) e marca como pendente cada aspecto sem decisão. Sem `vscode`/I/O (NFR-MCP-001).

### Arquivos prováveis

- `plugins/sdd-kit/templates/pt-BR/feature/mcp.md`
- `extensions_vscode/templates/...` (sincronizado)
- `src/sdd/mcpAspects.ts`
- `src/test/mcpAspects.test.ts`

### Testes esperados

- TEST-MCP-001 — o esqueleto contém os nove aspectos do RF-025, na ordem do texto
- TEST-MCP-002 — aspectos sem decisão são marcados como pendentes; documento produzido sem lançar

### Critério de conclusão

- TEST-MCP-001 e TEST-MCP-002 passam; nenhum import de `vscode`/rede no núcleo; `check-templates` limpo.

---

## TASK-MCP-003 — Borda: comando "MCP" (scaffold do `mcp.md` + delegação ao Claude Code)

**Requisitos:** REQ-MCP-001, REQ-MCP-002
**Dependências:** TASK-MCP-001, TASK-MCP-002
**Complexidade:** M
**Status:** done

### Descrição

Comando **"MCP"** no item da feature (D-Q4): scaffolda o `mcp.md` na pasta da mudança via
`runHybridStep` (não sobrescreve um `mcp.md` existente — copia e oferece abrir, como os demais
passos híbridos) e oferece **delegar a elaboração ao Claude Code** com o novo action `mcp`
(`composePrompt('mcp', id)`) — prompt copiado e pronto, sem enviar; CLI ausente → copia + orienta
(REQ-MCP-002). Comando em `extension.ts` e `package.json` (menu no item da feature). Adicionar `mcp`
à lista `ACTIONS` de `claudePrompt.ts` (por ADR-021) e **atualizar o teste que fixa a lista**.

### Arquivos prováveis

- `src/extension.ts`
- `src/sdd/claudePrompt.ts`
- `src/test/claudePrompt.test.ts`
- `package.json`

### Testes esperados

- TEST-MCP-003 — `ACTIONS`/`composePrompt` incluem o action `mcp` (`/sdd-kit:mcp <id>`)

### Critério de conclusão

- No item da feature, "MCP" scaffolda o `mcp.md` e oferece delegar ao Claude Code (prompt pronto, sem
  enviar); sem a CLI, copia + orienta. TEST-MCP-003 passa. `npm run compile`/`lint`/`test` limpos.

---

## Resumo

| Complexidade | Quantidade |
| --- | --- |
| P | 1 |
| M | 2 |
| G | 0 |

Total: 3 tarefas · 3 concluídas · 0 pendente.

**Caminho crítico:** TASK-MCP-002 ✅ → TASK-MCP-003 ✅

**Bloqueios ativos:** nenhum — Q1/Q2 confirmadas; Q3..Q6 decorrem (Decisões de escopo na spec).

**Paralelizáveis agora:** nenhum — todas as tarefas concluídas.
