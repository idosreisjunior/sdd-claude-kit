# Tarefas — Claude Code Adapter (incremento RF-011)

Complexidade: **P** pequena (≤ meio dia) · **M** média (≈ 1 dia) · **G** grande
(deve ser dividida antes de começar).

---

## Ordem de execução

```
TASK-CC-001 ✅ (ADR-007: captura fora do incremento)   [A2/Q1 resolvida]
      │
      ├── TASK-CC-002 (claudePrompt.ts, puro)  ── TEST-CC-001, TEST-CC-002
      │            │
      │            └── TASK-CC-003 (borda: openInClaudeCode + menu)   [host]
      │                       │
      │                       └── TASK-CC-005 (verificação no host, F5) ── depende de 003
      │
      └── TASK-CC-004 (gate: build + lint + test)  ◄── depende de 002 e 003
```

---

## TASK-CC-001 — ADR: captura de resultado fora do incremento  `✅ done`

**Requisitos:** —
**Dependências:** nenhuma
**Complexidade:** P
**Status:** done

Resolve a questão A2 (`architecture.md`) / Q1 da spec. Ver
`decisions/ADR-007-captura-de-resultado-do-terminal.md`: o adapter é *fire-and-forget* +
humano no controle; a captura de resultado (stdout/diff/testes) fica para a feature 0008.

### Critério de conclusão

- ✅ ADR-007 registrado (Aceito), com alternativas e consequências.
- ✅ A2 marcada como resolvida na âncora de arquitetura desta feature (ver `architecture.md`).

---

## TASK-CC-002 — Núcleo puro do prompt (`claudePrompt.ts`)

**Requisitos:** REQ-CC-001, NFR-CC-002, NFR-CC-003
**Dependências:** TASK-CC-001
**Complexidade:** M
**Status:** done

### Descrição

Módulo puro (sem API do VS Code): `ACTIONS` (conjunto fechado de ações do fluxo SDD, com
rótulo e objetivo em pt-BR), `actionDef(id)`, `composePrompt(action, changeId)` →
`/sdd-kit:<action> <id>`, `quoteCliPath(path)` (cita caminho com espaço/aspas, escapando `"`)
e `buildLaunchCommand(cliPath)`.

### Arquivos prováveis

- `src/sdd/claudePrompt.ts`
- `src/test/claudePrompt.test.ts`

### Testes esperados

- TEST-CC-001 — `composePrompt` produz `/sdd-kit:spec 0004-…` (SCN-CC-001); `actionDef` de id
  desconhecido é `undefined` e `ACTIONS` é o conjunto fechado (SCN-CC-004).
- TEST-CC-002 — `quoteCliPath` cita caminho com espaço e escapa aspas; caminho simples fica
  sem aspas; `buildLaunchCommand` usa o caminho citado (NFR-CC-002).

### Critério de conclusão

- Funções puras, sem `import 'vscode'`; nunca lançam.
- TEST-CC-001 e TEST-CC-002 passam.

### Resultado (2026-07-31)

`claudePrompt.ts` (puro): `ACTIONS` (6 ações), `actionDef`, `composePrompt`, `quoteCliPath`,
`buildLaunchCommand`. Coberto por **TEST-CC-001** (compose + conjunto fechado) e
**TEST-CC-002** (citação/launch). `npm test` 53/53 (+4 casos novos).

---

## TASK-CC-003 — Borda: `openInClaudeCode` real e menu

**Requisitos:** REQ-CC-002, REQ-CC-003, NFR-CC-001
**Dependências:** TASK-CC-002
**Complexidade:** M
**Status:** pending (código pronto; falta a verificação no host — TASK-CC-005)

### Descrição

Substituir o *stub* de `sddClaudeKit.openInClaudeCode` em `extension.ts`: resolver a mudança
do nó (`featureChangeOf`), perguntar a ação (QuickPick de `ACTIONS`), compor o prompt, copiá-lo
(`vscode.env.clipboard.writeText`) e abrir a mudança no Claude Code — detectar a CLI
(`detectClaudeCode` com env do host), abrir/reutilizar um terminal na raiz do workspace,
iniciar a CLI (`buildLaunchCommand`) e digitar o prompt **sem enviar** (`sendText(prompt, false)`).
Ausente a CLI: manter o prompt copiado e orientar. Adicionar a ação ao menu de contexto da
feature em `package.json`.

### Arquivos prováveis

- `src/extension.ts`, `package.json` (menu `view/item/context`)

### Testes esperados

- Nenhum automatizado (integração com terminal/clipboard/detecção); verificação por F5
  (TASK-CC-005).

### Critério de conclusão

- O comando compõe, copia e abre; a ação SDD nunca é enviada automaticamente (NFR-CC-001).
- A ação aparece no menu de contexto da feature ao lado de dashboard/editar spec.

### Resultado parcial (2026-07-31)

Implementado: `openInClaudeCode(node)` — QuickPick de `ACTIONS`, copia o prompt, detecta a CLI
(env do host + `sddClaudeKit.claudeCode.path`), abre/reutiliza o terminal `SDD · Claude Code` na
raiz, inicia a CLI e digita o prompt sem enviar; degrada com orientação quando ausente. Menu
`openInClaudeCode` em `view/item/context`. compile/lint exit 0. **Falta para `done` final:**
verificar no host — TASK-CC-005.

---

## TASK-CC-004 — Gate: build, lint e testes  `✅ done`

**Requisitos:** NFR-CC-003
**Dependências:** TASK-CC-002, TASK-CC-003
**Complexidade:** P
**Status:** done

### Descrição

Rodar `npm run compile`, `npm run lint` e `npm test`, registrando as saídas. Inclui
TEST-CC-001 e TEST-CC-002.

### Critério de conclusão

- ✅ `compile` e `lint` terminam com código 0; a suíte passa (53/53, +4 novos).

### Resultado (2026-07-31)

compile exit 0 · lint exit 0 · `npm test` 53/53 (TEST-CC-001 e TEST-CC-002, 4 casos).

---

## TASK-CC-005 — Verificação no host (F5)

**Requisitos:** REQ-CC-002, REQ-CC-003, NFR-CC-001
**Dependências:** TASK-CC-003
**Complexidade:** P
**Status:** pending

### Descrição

Verificar no Extension Development Host: numa feature do painel, acionar "Abrir no Claude Code";
escolher uma ação; conferir que o prompt foi copiado; que o terminal abre e inicia a CLI (quando
detectada) com o prompt digitado **sem** ser enviado; e a degradação quando a CLI não é detectada
(config `sddClaudeKit.claudeCode.path` vazia e sem `claude` no PATH). Registrar evidência.

### Critério de conclusão

- SCN-CC-002, SCN-CC-003 e SCN-CC-005 confirmados no host, em `evidence.md`.
- Confirmado que a ação SDD não é enviada automaticamente (NFR-CC-001).

---

## Resumo

| Complexidade | Quantidade |
| --- | --- |
| P | 3 |
| M | 2 |
| G | 0 |

Total: 5 tarefas · 3 concluídas (001, 002, 004) · 2 pendentes (003 código pronto, 005
verificação no host).

**Caminho crítico:** CC-001 ✅ → CC-002 ✅ → CC-003 🔧 (código pronto) → CC-005 (F5).

**Bloqueios ativos:** nenhum. A2/Q1 → ADR-007. Resta a verificação no host (F5): TASK-CC-005.

**Fora deste incremento:** tamanho estimado de contexto e seleção de arquivos (0005), captura
de resultado (0008), context packs (RF-013), demais ações do RF-011 (research, review,
evidências).
