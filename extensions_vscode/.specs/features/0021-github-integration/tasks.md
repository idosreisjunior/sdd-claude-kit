# Tarefas — Integração com GitHub (RF-019)

Complexidade: **P** pequena (≤ meio dia) · **M** média (≈ 1 dia) · **G** grande
(deve ser dividida antes de começar).

> Plano montado a partir dos requisitos, **sem design técnico prévio** (clarify/design são de
> Fase 2). As pendências de design — Q4 (detecção do `gh`) e Q5 (gatilho) — e a formalização do
> mecanismo (Q1, arquitetural) são resolvidas em **TASK-GH-001 (ADR-020)**. O incremento 1 (D-Q2)
> é "gerar descrição" + "criar issue/PR" via `gh` (D-Q1). Primeira ação **outward-facing** — só sob
> confirmação (Art. 9).

---

## Ordem de execução

```
TASK-GH-001 ✅ (ADR-020: mecanismo gh + detecção + gatilho)   TASK-GH-002 ✅ (núcleo puro: gerar descrição)
        │                                                          │
        └──────────────────────────┬───────────────────────────────┘
                                    ▼
        TASK-GH-003 ✅ (comando na borda: detectar gh, gerar corpo, criar issue/PR sob confirmação)
```

Caminho crítico: **TASK-GH-002 → TASK-GH-003** (o ADR é P e paralelo).
Paralelizáveis desde já: **TASK-GH-001** e **TASK-GH-002**.

---

## TASK-GH-001 — ADR-020: mecanismo `gh`, detecção e gatilho

**Requisitos:** REQ-GH-002, NFR-GH-002
**Dependências:** —
**Complexidade:** P
**Status:** done

### Descrição

Formalizar em ADR: **(Q1)** o mecanismo é o **`gh` CLI** (shell-out, como git 0007/Claude Code 0004;
sem rede própria, sem token/auth próprios, sem dependência) — com as alternativas (REST API, sessão
de auth do VS Code) e consequências; **(Q4)** a detecção do `gh` (instalado/autenticado) e do remoto
GitHub, reusando o padrão de detecção do 0004; **(Q5)** o gatilho — comando no item da feature.

### Arquivos prováveis

- `.specs/features/0021-github-integration/decisions/ADR-020-mecanismo-github-via-gh.md`

### Testes esperados

- Nenhum — decisão/documentação (ver `gaps`).

### Critério de conclusão

- ADR-020 escrito, decidindo Q1/Q4/Q5; questões Q4/Q5 marcadas como resolvidas.

---

## TASK-GH-002 — Núcleo puro: gerar a descrição (requisitos + validação + evidências)

**Requisitos:** REQ-GH-001, NFR-GH-003
**Dependências:** —
**Complexidade:** M
**Status:** done

### Descrição

`githubBody.ts` (novo), puro, sem a API do VS Code nem I/O: `buildGithubBody(inputs)` compõe o corpo
de issue/PR a partir de requisitos (spec), resumo da validação (0008, `buildValidationReport`) e
evidências (evidence.md, reuso de `buildEvidenceMarkdown`/`buildCommitSuggestion`) — D-Q3. Robusto a
artefatos parciais (marca o que falta, sem quebrar). Revisável.

### Arquivos prováveis

- `src/sdd/githubBody.ts`

### Testes esperados

- TEST-GH-001 — corpo inclui requisitos, resumo de validação e evidências
- TEST-GH-002 — artefatos parciais (sem evidence.md) → corpo com o que houver, marcado, sem lançar

### Critério de conclusão

- TEST-GH-001 e TEST-GH-002 passam; nenhum import de `vscode`/rede em `githubBody.ts`.

---

## TASK-GH-003 — Comando na borda: detectar `gh`, gerar corpo, criar issue/PR sob confirmação

**Requisitos:** REQ-GH-001, REQ-GH-002, NFR-GH-001, NFR-GH-002
**Dependências:** TASK-GH-001, TASK-GH-002
**Complexidade:** M
**Status:** done

### Descrição

Comando **"GitHub"** no item da feature (D-Q5): monta o corpo (`buildGithubBody`), oferece **criar
issue ou PR** (D-Q6). Detecta o `gh` (instalado/autenticado) e o remoto GitHub (ADR-020, Q4); se
faltar, informa a pré-condição e **não publica** (SCN-GH-004). Publica via `gh` **só sob confirmação
explícita** (NFR-GH-001, Art. 9) e devolve o link. Não altera o `status.yaml` (D-Q6). Sem rede
própria — só o `gh` (NFR-GH-002). Comando em `extension.ts` e `package.json`.

### Arquivos prováveis

- `src/extension.ts`
- `package.json`

### Testes esperados

- Nenhum automatizado — detecção/execução do `gh`, o diálogo e a criação são integração com o host;
  a geração do corpo vive no núcleo puro (TASK-GH-002). Revisão manual (ver `gaps`).

### Critério de conclusão

- No item da feature, "GitHub" gera o corpo e oferece criar issue/PR; sem `gh`/remoto, informa e não
  publica; publica só sob confirmação e devolve o link. `npm run compile`/`lint`/`test` limpos.

---

## Resumo

| Complexidade | Quantidade |
| --- | --- |
| P | 1 |
| M | 2 |
| G | 0 |

Total: 3 tarefas · 3 concluídas · 0 pendente.

**Caminho crítico:** TASK-GH-002 ✅ → TASK-GH-003 ✅

**Bloqueios ativos:** nenhum — Q4 e Q5 resolvidas por ADR-020 (TASK-GH-001).

**Paralelizáveis agora:** nenhum — todas as tarefas concluídas.
