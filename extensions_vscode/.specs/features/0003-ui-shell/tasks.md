# Tarefas — Interface: dashboard da feature (incremento RF-005)

Complexidade: **P** pequena (≤ meio dia) · **M** média (≈ 1 dia) · **G** grande
(deve ser dividida antes de começar).

> Estado (2026-07-31): plano do **primeiro incremento** (dashboard read-only,
> RF-005). Q1/Q2/Q3 resolvidas por ADR-005; a mudança está em PLANNED. O editor
> visual (RF-006) é incremento seguinte e não está neste plano.

---

## Ordem de execução

```
TASK-UI-001 ✅ (ADR-005: base do dashboard = webview)   [Q1/Q2/Q3 resolvidas]
      │
      ├── TASK-UI-002 (modelo puro: lê status/traceability/spec)  ── TEST-UI-001
      │         │
      │         └── TASK-UI-003 (render HTML seguro: CSP+nonce)   ── TEST-UI-002
      │                   │
      │                   └── TASK-UI-004 (webview panel + comando)
      │                             │
      │                             └── TASK-UI-005 (ação no painel Features)
      │
      └── TASK-UI-006 (verificação no host, F5)  ── depende de 004, 005
                                                    │
TASK-UI-007 (gate: build + lint + test)  ◄─────────┘  depende de todo o código
```

---

## TASK-UI-001 — ADR: base de renderização do dashboard  `✅ done`

**Requisitos:** REQ-UI-001
**Dependências:** nenhuma
**Complexidade:** P
**Status:** done

Resolve Q1 (e, de tabela, Q2/Q3). Ver `decisions/ADR-005-base-do-dashboard.md`:
**webview panel** para o dashboard read-only; contagens de fontes estruturadas;
sem botões de ação neste incremento.

### Critério de conclusão

- ✅ ADR-005 registrado (Aceito), com alternativas e consequências.
- ✅ Q1/Q2/Q3 movidas para `resolved_questions` em `status.yaml`.

---

## TASK-UI-002 — Modelo do dashboard (`dashboardModel.ts`)

**Requisitos:** REQ-UI-002, REQ-UI-003, NFR-UI-001
**Dependências:** TASK-UI-001
**Complexidade:** M
**Status:** pending

### Descrição

Função pura (sem API do VS Code) que recebe o conteúdo dos artefatos de uma mudança
(`status.yaml`, `traceability.yaml`, `spec.md` e a entrada do `index.yaml`) e monta
um `DashboardModel` tipado: cabeçalho (id/tipo/título), status, progresso
`done/total`, contagens (requisitos, cenários, testes, arquivos, critérios de
aceite), bloqueios, histórico, objetivo, e campos pendentes (tokens/tempo, commits,
evidências) marcados como indisponíveis. Robusto: fonte ausente ou YAML/Markdown
inválido resulta em campo indisponível, nunca em exceção (NFR-UI-001).

### Arquivos prováveis

- `src/sdd/dashboardModel.ts`

### Testes esperados

- TEST-UI-001 — modelo correto a partir dos artefatos; artefato ausente/ inválido
  não lança e marca o campo como indisponível.

### Critério de conclusão

- Contagens vêm das fontes estruturadas (ADR-005/Q2): tarefas de `status.yaml`;
  requisitos/cenários/testes/arquivos de `traceability.yaml`; critérios pela
  contagem de checkbox e objetivo da seção `## Objetivo` do `spec.md`.
- `buildDashboardModel()` nunca lança (SCN-UI-003).

---

## TASK-UI-003 — Renderização HTML segura (`dashboardHtml.ts`)

**Requisitos:** REQ-UI-002, REQ-UI-003, NFR-UI-002
**Dependências:** TASK-UI-002
**Complexidade:** M
**Status:** pending

### Descrição

Função pura que gera o HTML do webview a partir do `DashboardModel`: aplica
Content-Security-Policy com `nonce`, escapa todo texto vindo dos artefatos (sem
`innerHTML` de dado não escapado), usa variáveis de tema `--vscode-*`, e marca os
campos indisponíveis. Não acessa a rede nem embute recurso remoto (NFR-UI-002).

### Arquivos prováveis

- `src/sdd/dashboardHtml.ts`

### Testes esperados

- TEST-UI-002 — o HTML contém a meta CSP com o `nonce`; texto com `<`/`&`/aspas é
  escapado; campos pendentes aparecem marcados.

### Critério de conclusão

- O HTML gerado tem `<meta http-equiv="Content-Security-Policy">` com `nonce` e
  `default-src 'none'`; nenhum texto de artefato entra sem escape.

---

## TASK-UI-004 — Webview panel e comando `openDashboard`

**Requisitos:** REQ-UI-001, NFR-UI-003
**Dependências:** TASK-UI-003
**Complexidade:** M
**Status:** pending

### Descrição

`featureDashboard.ts` cria/reutiliza um `WebviewPanel` por mudança (mapa por `id`),
lê os artefatos via `workspace.fs`, monta o modelo e injeta o HTML; `webview.options`
com `localResourceRoots` restrito e `enableScripts` só se necessário. Comando
`sddClaudeKit.openDashboard` registrado em `extension.ts` e no manifest.

### Arquivos prováveis

- `src/sdd/featureDashboard.ts`, `src/extension.ts`, `package.json` (comando)

### Testes esperados

- Nenhum automatizado (integração com o host); verificação por F5 (TASK-UI-006).

### Critério de conclusão

- Acionar o comando abre um painel com o dashboard da mudança; reabrir a mesma
  feature reutiliza o painel (SCN-UI-001).

---

## TASK-UI-005 — Ação "Abrir dashboard" no painel Features

**Requisitos:** REQ-UI-001
**Dependências:** TASK-UI-004
**Complexidade:** P
**Status:** pending

### Descrição

Item de feature ganha a ação "Abrir dashboard" (menu de contexto/inline via
`package.json` `menus`), que chama `sddClaudeKit.openDashboard` com a mudança
selecionada. O clique simples (abrir a spec) é preservado.

### Arquivos prováveis

- `src/views/featuresTreeProvider.ts`, `package.json` (menus)

### Testes esperados

- Nenhum automatizado (integração com o host); verificação por F5 (TASK-UI-006).

### Critério de conclusão

- A ação aparece na feature e abre o dashboard correto (SCN-UI-001).

---

## TASK-UI-006 — Verificação no host (F5)

**Requisitos:** REQ-UI-001, REQ-UI-002, REQ-UI-003
**Dependências:** TASK-UI-004, TASK-UI-005
**Complexidade:** P
**Status:** pending

### Descrição

Verificar no Extension Development Host: abrir o dashboard de uma feature mostra
cabeçalho/status/progresso/contagens corretos; campos de features futuras aparecem
como pendentes; uma mudança sem `traceability.yaml` não quebra o dashboard.
Registrar evidência.

### Critério de conclusão

- SCN-UI-001, SCN-UI-002 e SCN-UI-003 confirmados no host, em `evidence.md`.

---

## TASK-UI-007 — Gate: build, lint e testes

**Requisitos:** NFR-UI-001, NFR-UI-002
**Dependências:** TASK-UI-002, -003, -004, -005
**Complexidade:** P
**Status:** pending

### Descrição

Rodar `npm run compile`, `npm run lint` e `npm test`, registrando as saídas como
evidência. Inclui TEST-UI-001 e TEST-UI-002.

### Critério de conclusão

- `compile` e `lint` terminam com código 0; a suíte passa (novos testes inclusos).

---

## Resumo

| Complexidade | Quantidade |
| --- | --- |
| P | 4 |
| M | 3 |
| G | 0 |

Total: 7 tarefas · 1 concluída (001) · 6 pendentes (002–007).

**Caminho crítico:** UI-001 ✅ → UI-002 → UI-003 → UI-004 → UI-005 → UI-006.

**Bloqueios ativos:** nenhum. Q1/Q2/Q3 → ADR-005.

**Escopo fora deste incremento:** editor visual (RF-006), tokens/tempo (0005),
commits (0007), evidências/validação como dados vivos (0008), ações do §13.2.
