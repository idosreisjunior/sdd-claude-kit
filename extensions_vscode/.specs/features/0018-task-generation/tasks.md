# Tarefas — Geração de tarefas (RF-010)

Complexidade: **P** pequena (≤ meio dia) · **M** média (≈ 1 dia) · **G** grande
(deve ser dividida antes de começar).

> Plano montado a partir dos requisitos, **sem design técnico prévio** (clarify/design são de
> Fase 2). As pendências de design — Q1 (superfície da análise) e Q3 (parser) — são resolvidas em
> **TASK-TGEN-001 (ADR-018)**. Diferente de 0014/0015/0017: a **geração já existe** (ação `tasks`
> do 0004 + skill `/sdd-kit:tasks`), então o incremento é a **análise** do `tasks.md`; a borda só
> reusa `launchClaudeAction('tasks')` para o atalho de geração.

---

## Ordem de execução

```
TASK-TGEN-001 (ADR-018: superfície da análise + parser) ✅
        │
        ▼
TASK-TGEN-002 (núcleo puro: análise do tasks.md — tarefas G + campos ausentes — com linha) ✅
        │
        ▼
TASK-TGEN-003 (comando "Tarefas" na borda: diagnósticos + sem tasks.md + atalho de geração) ✅
```

Caminho crítico: **TASK-TGEN-001 → TASK-TGEN-002 → TASK-TGEN-003** (linear; nada paralelizável).

---

## TASK-TGEN-001 — ADR-018: superfície da análise e parser do `tasks.md`

**Requisitos:** REQ-TGEN-001, NFR-TGEN-003
**Dependências:** —
**Complexidade:** P
**Status:** done

### Descrição

Resolver e registrar em ADR: **(Q1)** a superfície da análise — webview de relatório (padrão
0008/0009), canal de saída (0007), ou diagnósticos/Problems (0006); **(Q3)** o parser — reusar/
estender o `parseTasksPlan` (0007) ou criar um que capture a complexidade e os onze campos por
tarefa. Registrar a decisão e as alternativas.

### Arquivos prováveis

- `.specs/features/0018-task-generation/decisions/ADR-018-superficie-e-parser-da-analise.md`

### Testes esperados

- Nenhum — decisão/documentação (ver `gaps`).

### Critério de conclusão

- ADR-018 escrito, decidindo Q1 e Q3; questões Q1/Q3 marcadas como resolvidas. ✅

---

## TASK-TGEN-002 — Núcleo puro: análise do `tasks.md` (tarefas G + campos ausentes) e render

**Requisitos:** REQ-TGEN-001, NFR-TGEN-001, NFR-TGEN-003
**Dependências:** TASK-TGEN-001
**Complexidade:** M
**Status:** done

### Descrição

`taskAnalysis.ts` (novo), puro, sem a API do VS Code: parser próprio (ADR-018, Q3) que divide o
`tasks.md` em blocos por cabeçalho de tarefa e extrai complexidade e presença dos onze campos.
`analyzeTasks(tasksMd)` devolve os achados **com a linha** — `{ kind, taskId, line, message }`:
**tarefas de complexidade G** (D-Q2) e **tarefas sem algum dos onze campos** do RF-010 (id, título,
descrição, arquivos, dependências, requisitos, critérios, testes, complexidade, status, evidências).
Somente leitura (NFR-TGEN-001). A borda traduz os achados para diagnósticos (ADR-018, Q1). Robusto
a `tasks.md` ausente/malformado.

### Arquivos prováveis

- `src/sdd/taskAnalysis.ts`

### Testes esperados

- TEST-TGEN-001 — detecção de tarefas G, com a linha (uma G → sinalizada; nenhuma → sem achado)
- TEST-TGEN-002 — detecção de campo obrigatório ausente por tarefa; tudo completo → sem achado

### Critério de conclusão

- TEST-TGEN-001 e TEST-TGEN-002 passam; nenhum import de `vscode`/rede em `taskAnalysis.ts`.

---

## TASK-TGEN-003 — Comando "Tarefas" na borda: análise, sem tasks.md e atalho de geração

**Requisitos:** REQ-TGEN-001, REQ-TGEN-002, NFR-TGEN-002
**Dependências:** TASK-TGEN-002
**Complexidade:** M
**Status:** done

### Descrição

Comando **"Tarefas"** no item da feature (D-Q5): lê o `tasks.md`, roda `analyzeTasks` e **publica os
achados como diagnósticos** no `tasks.md` (ADR-018, Q1; molde do `publishDoctor`/0006), abrindo o
painel Problems quando houver. Sem `tasks.md`, informa que não há tarefas e **oferece gerar** com o
Claude Code (SCN-TGEN-004). Oferece gerar/refinar reusando `launchClaudeAction(root, id, 'tasks')`
— a ação `tasks` já existe no 0004 (REQ-TGEN-002). Somente leitura (NFR-TGEN-001); sem rede própria
(NFR-TGEN-002). Comando em `extension.ts` e `package.json`.

### Arquivos prováveis

- `src/extension.ts`
- `package.json`

### Testes esperados

- Nenhum automatizado — o gatilho, a apresentação e a leitura em disco são integração com o host;
  a análise vive no núcleo puro (TASK-TGEN-002). Revisão manual (ver `gaps`).

### Critério de conclusão

- No item da feature, "Tarefas" analisa e sinaliza tarefas G e campos ausentes; sem `tasks.md`,
  informa e oferece gerar; o atalho compõe `/sdd-kit:tasks`. `npm run compile`/`lint`/`test` limpos.

---

## Resumo

| Complexidade | Quantidade |
| --- | --- |
| P | 1 |
| M | 2 |
| G | 0 |

Total: 3 tarefas · 3 concluídas · 0 pendentes.

**Caminho crítico:** TASK-TGEN-001 ✅ → TASK-TGEN-002 ✅ → TASK-TGEN-003 ✅ (concluído)

**Bloqueios ativos:** nenhum — Q1 e Q3 resolvidas por ADR-018 (TASK-TGEN-001).

**Paralelizáveis agora:** nenhum — as três tarefas do plano estão concluídas.

> Plano implementado em 2026-08-02, fora da ordem formal do fluxo (sem approve/design — Fase 1),
> como nos anteriores. Verificação: `compile`, `lint` e **128 testes** limpos. A análise (tarefas
> G + campos ausentes, D-Q2b: 10 campos) publica diagnósticos no painel Problems (molde do
> `publishDoctor`/0006); a geração reusa a ação `tasks` já existente do 0004. **Não depende da
> Fase 2** e **não** introduziu padrão híbrido nem tocou o 0004. Gap registrado (D-Q2b): o campo
> "evidências necessárias" falta no template `_shared/tasks.md` — follow-up próprio.
