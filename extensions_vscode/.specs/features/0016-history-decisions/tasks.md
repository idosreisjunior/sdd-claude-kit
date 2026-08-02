# Tarefas — Histórico e decisões (RF-020)

Complexidade: **P** pequena (≤ meio dia) · **M** média (≈ 1 dia) · **G** grande
(deve ser dividida antes de começar).

> Plano montado a partir dos requisitos, **sem design técnico prévio** (clarify/design são de
> Fase 2). As duas pendências de design — Q2 (apresentação do histórico) e Q5 (mecanismo do "Novo
> ADR") — são resolvidas em **TASK-HIST-001 (ADR-016)**. Diferente do 0014/0015, este RF **não
> depende da Fase 2**: usa artefatos já existentes (status.yaml, decisions/, 0007/0008) e o
> template `adr/ADR-template.md`.

---

## Ordem de execução

```
TASK-HIST-001 (ADR-016: apresentação + mecanismo do ADR) ✅
        │
        ├────────────────────────────┐
        ▼                            ▼
TASK-HIST-002 ✅ (núcleo: agregação TASK-HIST-003 ✅ (núcleo: numeração
  do histórico + render)              e esqueleto do ADR)
        │                            │
        └──────────────┬─────────────┘
                       ▼
        TASK-HIST-004 ✅ (comandos "Histórico" e "Novo ADR" na borda)
```

Caminho crítico: **TASK-HIST-001 → TASK-HIST-002 → TASK-HIST-004**.
Paralelizáveis após o ADR: **TASK-HIST-002** e **TASK-HIST-003**.

---

## TASK-HIST-001 — ADR-016: apresentação do histórico e mecanismo do "Novo ADR"

**Requisitos:** REQ-HIST-001, REQ-HIST-002
**Dependências:** —
**Complexidade:** P
**Status:** done

### Descrição

Resolver as duas decisões de design e registrá-las em ADR: **(Q2)** a apresentação do histórico é
um webview de timeline (padrão do 0008/0009), um canal de saída, ou item na árvore; **(Q5)** o
"Novo ADR" aloca o número varrendo os `decisions/` de todas as mudanças (reconciliação, como
`collectExistingIds` faz para ids) e deriva o `<slug>` do título (regra determinística, como
`sanitizeSlug`).

### Arquivos prováveis

- `.specs/features/0016-history-decisions/decisions/ADR-016-historico-e-novo-adr.md`

### Testes esperados

- Nenhum — decisão/documentação (ver `gaps`).

### Critério de conclusão

- ADR-016 escrito, decidindo Q2 e Q5; questões Q2/Q5 marcadas como resolvidas. ✅

---

## TASK-HIST-002 — Núcleo puro: agregação do histórico e render

**Requisitos:** REQ-HIST-001, NFR-HIST-001, NFR-HIST-002, NFR-HIST-003
**Dependências:** TASK-HIST-001
**Complexidade:** M
**Status:** done

### Descrição

`historyModel.ts` (novo), puro, sem a API do VS Code: `aggregateHistory(sources)` agrega o
subconjunto persistido (D-Q1) — mudanças de status e aprovações (`status.yaml`), ADRs
(`decisions/`), tarefas concluídas, commits (0007) e validação (0008) — num timeline
**cronológico**, marcando as categorias sem fonte como indisponíveis (D-Q3). Somente leitura
(NFR-HIST-001). Conforme o ADR-016 (Q2), o render (`historyHtml.ts`, webview com CSP+nonce, texto
escapado) apresenta o timeline. Robusto a artefatos ausentes.

### Arquivos prováveis

- `src/sdd/historyModel.ts`
- `src/sdd/historyHtml.ts`

### Testes esperados

- TEST-HIST-001 — `aggregateHistory`: timeline cronológico do subconjunto, com indisponíveis marcados
- TEST-HIST-002 — artefatos ausentes/mínimos → timeline parcial, sem lançar; render escapa e usa nonce

### Critério de conclusão

- TEST-HIST-001 e TEST-HIST-002 passam; nenhum import de `vscode`/rede em `historyModel.ts`.

---

## TASK-HIST-003 — Núcleo puro: numeração e esqueleto do ADR

**Requisitos:** REQ-HIST-002, NFR-HIST-003
**Dependências:** TASK-HIST-001
**Complexidade:** M
**Status:** done

### Descrição

`adrCreator.ts` (novo), puro: `nextAdrNumber(existing)` devolve o próximo número livre a partir do
conjunto de ADRs existentes (a borda coleta os números varrendo os `decisions/`); `adrSlug(title)`
deriva o slug determinístico do título; `buildAdr(template, {number, title, date, ...})` resolve o
template `adr/ADR-template.md` — substitui os marcadores conhecidos, remove as orientações e deixa
as seções de conteúdo como lacunas. Não inventa conteúdo.

### Arquivos prováveis

- `src/sdd/adrCreator.ts`

### Testes esperados

- TEST-HIST-003 — `nextAdrNumber` (próximo livre, sem reutilizar) e `adrSlug` (determinístico)
- TEST-HIST-004 — `buildAdr`: cabeçalho resolvido, seções como lacuna, sem `{{` residual

### Critério de conclusão

- TEST-HIST-003 e TEST-HIST-004 passam; nenhum import de `vscode`/rede em `adrCreator.ts`.

---

## TASK-HIST-004 — Comandos "Histórico" e "Novo ADR" na borda

**Requisitos:** REQ-HIST-001, REQ-HIST-002, NFR-HIST-001
**Dependências:** TASK-HIST-002, TASK-HIST-003
**Complexidade:** M
**Status:** done

### Descrição

No item da feature (D-Q4): comando **"Histórico"** reúne as fontes (status/traceability/git/ADRs/
validação), chama `aggregateHistory` e apresenta no webview (`historyHtml`). Comando **"Novo ADR"**
pede o título, varre os `decisions/` do projeto para os números existentes, aloca via
`nextAdrNumber`, deriva o slug (`adrSlug`), monta com `buildAdr` e grava `decisions/ADR-NNN-<slug>.md`
— **sem sobrescrever** um arquivo existente (SCN-HIST-004). Comandos em `extension.ts` e
`package.json`. A visão não altera nada; só o "Novo ADR" escreve (NFR-HIST-001).

### Arquivos prováveis

- `src/extension.ts`
- `package.json`

### Testes esperados

- Nenhum automatizado — os comandos, o webview e a escrita/varredura em disco são integração com o
  host do VS Code; a lógica vive nos núcleos puros (TASK-HIST-002/003). Revisão manual (ver `gaps`).

### Critério de conclusão

- "Histórico" mostra o timeline agregado, marcando indisponíveis; "Novo ADR" cria o arquivo com o
  próximo número reconciliado e não sobrescreve. `npm run compile`/`lint`/`test` limpos.

---

## Resumo

| Complexidade | Quantidade |
| --- | --- |
| P | 1 |
| M | 3 |
| G | 0 |

Total: 4 tarefas · 4 concluídas · 0 pendentes.

**Caminho crítico:** TASK-HIST-001 ✅ → TASK-HIST-002 ✅ → TASK-HIST-004 ✅ (concluído)

**Bloqueios ativos:** nenhum — Q2 e Q5 resolvidas por ADR-016 (TASK-HIST-001).

**Paralelizáveis agora:** nenhum — as quatro tarefas do plano estão concluídas.

> Plano implementado em 2026-08-01, fora da ordem formal do fluxo (sem approve/design — Fase 1),
> como no 0009/0014/0015. Verificação: `compile`, `lint` e **124 testes** limpos. Comandos
> "Histórico" (webview timeline) e "Novo ADR" (varre os decisions/ do projeto, numeração global,
> sem sobrescrever) no item da feature. **Não depende da Fase 2**: usa artefatos existentes e o
> template `adr/ADR-template.md`. Reuso: `esc` (metricsHtml), `sanitizeSlug` (featureCreator),
> `collectChangeDirs`/`readCommits`/`buildValidationReport` (0007/0008), padrão de webview (0008/0009).
