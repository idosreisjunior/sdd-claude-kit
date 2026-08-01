# Tarefas — Métricas locais

Complexidade: **P** pequena (≤ meio dia) · **M** média (≈ 1 dia) · **G** grande
(deve ser dividida antes de começar).

> **Incremento 1**: métricas por feature (RF-021 viável) e relatório (RF-022 feature) em
> webview, com persistência local por snapshot (D-Q2, ADR-013) e exportação MD/JSON (D-Q4).
> Agregações (projeto/período) e CSV/PDF são incrementos seguintes; 0009 fica IN_PROGRESS.

---

## Ordem de execução

```
TASK-METR-001 (ADR) ─┐
TASK-METR-002 (cálculo) ─┼─► TASK-METR-003 (render/export) ─► TASK-METR-004 (comando)
```

Caminho crítico: **TASK-METR-002 → TASK-METR-003 → TASK-METR-004**.

---

## TASK-METR-001 — ADR: métricas em webview e persistência local

**Requisitos:** REQ-METR-002, NFR-METR-001
**Dependências:** —
**Complexidade:** P
**Status:** done

### Descrição

Registrar em ADR (D-Q1/D-Q2): o relatório de métricas é um webview; um snapshot local por
feature é persistido no `workspaceState` (RNF-004) para o delta vs. a medição anterior.

### Arquivos prováveis

- `.specs/features/0009-metrics/decisions/ADR-013-metricas-webview-e-persistencia.md`

### Testes esperados

- Nenhum — decisão/documentação (`gaps`).

### Critério de conclusão

- ADR-013 escrito.

---

## TASK-METR-002 — Núcleo puro: cálculo e comparação de métricas

**Requisitos:** REQ-METR-001, NFR-METR-001, NFR-METR-002
**Dependências:** —
**Complexidade:** M
**Status:** done

### Descrição

`metrics.ts` — `computeMetrics` deriva o subconjunto viável (D-Q3) de `.specs/`+Git (tarefas,
requisitos, % validado via 0008, cenários, testes, arquivos, duração pelas datas do status,
tokens estimados); `compareSnapshots` calcula o delta. Robusto (NFR-METR-002). Sem `vscode`.

### Arquivos prováveis

- `src/sdd/metrics.ts`

### Testes esperados

- TEST-METR-001 — cálculo do subconjunto
- TEST-METR-002 — artefatos ausentes → parcial, sem lançar
- TEST-METR-003 — compareSnapshots e exportações

### Critério de conclusão

- Os testes passam; nenhum import de `vscode`.

---

## TASK-METR-003 — Núcleo puro: render (webview) e exportação (MD/JSON)

**Requisitos:** REQ-METR-002, NFR-METR-001
**Dependências:** TASK-METR-002
**Complexidade:** M
**Status:** done

### Descrição

`metricsHtml.ts` — HTML do webview (cartões + delta, CSP+nonce, texto escapado). Em `metrics.ts`,
`renderMetricsMarkdown` e `toMetricsJson` para a exportação (RF-022, D-Q4). Puros.

### Arquivos prováveis

- `src/sdd/metricsHtml.ts`
- `src/sdd/metrics.ts`

### Testes esperados

- TEST-METR-004 — CSP+nonce, delta, escape (webview)

### Critério de conclusão

- TEST-METR-004 passa; as funções são puras.

---

## TASK-METR-004 — Comando "Métricas da feature" (persistência e config)

**Requisitos:** REQ-METR-001, REQ-METR-002, REQ-METR-003, NFR-METR-003
**Dependências:** TASK-METR-002, TASK-METR-003
**Complexidade:** M
**Status:** done

### Descrição

Comando `sddClaudeKit.metricsFeature`: reúne status/traceability/git/contexto, calcula o
snapshot (EVID reuso: 0005/0007/0008), persiste no `workspaceState` (delta vs. anterior),
apresenta no webview e oferece exportar MD/JSON. Config `sddClaudeKit.metrics.enabled` (padrão
true) desativa tudo (RNF-004). Nada sai da máquina (NFR-METR-003).

### Arquivos prováveis

- `src/extension.ts`
- `package.json`

### Testes esperados

- Nenhum automatizado — webview/workspaceState é integração; a lógica vive nos núcleos puros.
  Revisão manual (`gaps`).

### Critério de conclusão

- Acionar "Métricas da feature" mostra o relatório com delta; exporta MD/JSON; nada é enviado;
  `npm run compile`/`lint`/`test` limpos.

---

## Resumo

| Complexidade | Quantidade |
| --- | --- |
| P | 1 |
| M | 3 |
| G | 0 |

Total: 4 tarefas · 4 concluídas · 0 pendentes.

**Caminho crítico:** TASK-METR-002 → TASK-METR-003 → TASK-METR-004 (concluído)

**Bloqueios ativos:** nenhum.

**Paralelizáveis agora:** nenhum — incremento 1 concluído.

> Incremento 1 (métricas por feature + relatório) implementado em 2026-08-01, fora da ordem
> formal do fluxo (sem approve/design — Fase 1). Verificação: compile, lint e 115 testes limpos,
> mais e2e do cálculo contra o repo real. 0009 fica **IN_PROGRESS**.
>
> Incrementos seguintes (RF-022): agregações (projeto/período/equipe/modelo) e formatos CSV/PDF.