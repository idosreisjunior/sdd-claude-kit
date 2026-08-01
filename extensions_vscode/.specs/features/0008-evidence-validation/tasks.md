# Tarefas — Evidências e validação da feature

Complexidade: **P** pequena (≤ meio dia) · **M** média (≈ 1 dia) · **G** grande
(deve ser dividida antes de começar).

> **Incremento 1** (D-Q1): relatório de validação (RF-017 / REQ-EVID-001). A coleta de
> evidências (REQ-EVID-002) e a trava de conclusão (REQ-EVID-003) são incrementos seguintes;
> 0008 permanece IN_PROGRESS. TASK-EVID-001 registra a superfície (webview) em ADR.

---

## Ordem de execução

```
TASK-EVID-001 (ADR webview) ─┐
TASK-EVID-002 (classificação) ─┼─► TASK-EVID-003 (render) ─► TASK-EVID-004 (comando)
```

Caminho crítico: **TASK-EVID-002 → TASK-EVID-003 → TASK-EVID-004**.
Paralelizáveis no início: **TASK-EVID-001, TASK-EVID-002**.

---

## TASK-EVID-001 — ADR: relatório de validação como webview

**Requisitos:** REQ-EVID-001, NFR-EVID-001
**Dependências:** —
**Complexidade:** P
**Status:** done

### Descrição

Registrar em ADR a decisão D-Q2: o relatório de validação é um `WebviewPanel` (tabela por
requisito, categorias), com CSP+nonce, à semelhança do dashboard. Núcleo puro; borda hospeda.

### Arquivos prováveis

- `.specs/features/0008-evidence-validation/decisions/ADR-012-relatorio-validacao-webview.md`

### Testes esperados

- Nenhum — decisão/documentação (`gaps`).

### Critério de conclusão

- ADR-012 escrito (decisão, alternativas canal/Diagnostics, consequências).

---

## TASK-EVID-002 — Núcleo puro: classificação de validação

**Requisitos:** REQ-EVID-001, NFR-EVID-001, NFR-EVID-002
**Dependências:** —
**Complexidade:** M
**Status:** done

### Descrição

Módulo puro que lê o `traceability.yaml` e classifica cada requisito pela cobertura declarada
(heurística D-Q3): não aplicável (gap), não atendido (sem impl), não testado (impl sem teste),
parcial (impl+teste sem tarefa), atendido (tarefa+teste+impl). Inclui os requisitos só em `gaps`.
Resumo por categoria. Robusto (NFR-EVID-002). Sem `vscode`.

### Arquivos prováveis

- `src/sdd/validationReport.ts`

### Testes esperados

- TEST-EVID-001 — a heurística em cada categoria
- TEST-EVID-002 — build a partir do YAML, resumo, override por gap, robustez

### Critério de conclusão

- Os dois testes passam; nenhum import de `vscode`.

---

## TASK-EVID-003 — Render puro do relatório (webview HTML)

**Requisitos:** REQ-EVID-001, NFR-EVID-001
**Dependências:** TASK-EVID-002
**Complexidade:** M
**Status:** done

### Descrição

Função pura que gera o HTML do webview a partir do relatório: resumo em chips e tabela por
requisito com o veredito colorido e as marcas de cobertura. CSP com nonce, texto escapado
(à semelhança de `dashboardHtml.ts`). Estado vazio renderiza aviso.

### Arquivos prováveis

- `src/sdd/validationHtml.ts`

### Testes esperados

- TEST-EVID-003 — CSP+nonce, escape, vereditos e estado vazio

### Critério de conclusão

- TEST-EVID-003 passa; a função é pura.

---

## TASK-EVID-004 — Comando "Validar mudança"

**Requisitos:** REQ-EVID-001, NFR-EVID-004
**Dependências:** TASK-EVID-002, TASK-EVID-003
**Complexidade:** P
**Status:** done

### Descrição

Comando `sddClaudeKit.validateChange` (ação numa feature): lê o `traceability.yaml`, monta o
relatório (EVID-002), renderiza (EVID-003) num `WebviewPanel`. Somente leitura — nada é
executado nem escrito (NFR-EVID-004).

### Arquivos prováveis

- `src/extension.ts`
- `package.json`

### Testes esperados

- Nenhum automatizado — webview/IO é integração; a lógica vive nos núcleos puros. Revisão
  manual (`gaps`).

### Critério de conclusão

- Acionar "Validar mudança" abre o relatório com as classificações corretas; nenhuma escrita;
  `npm run compile`/`lint`/`test` limpos.

---

## Resumo

| Complexidade | Quantidade |
| --- | --- |
| P | 2 |
| M | 2 |
| G | 0 |

Total: 4 tarefas · 4 concluídas · 0 pendentes.

**Caminho crítico:** TASK-EVID-002 → TASK-EVID-003 → TASK-EVID-004 (concluído)

**Bloqueios ativos:** nenhum.

**Paralelizáveis agora:** nenhum — incremento 1 concluído.

> Incremento 1 (relatório de validação, RF-017) implementado em 2026-08-01, fora da ordem formal
> do fluxo (sem approve/design — Fase 1). Verificação: compile, lint e 105 testes limpos. 0008
> fica **IN_PROGRESS**.
>
> Incrementos seguintes: REQ-EVID-002 (coleta de evidências, RF-016) e REQ-EVID-003 (trava de
> conclusão sem evidência).