# Tarefas — Superfície de ações da feature (dashboard + submenu)

Complexidade: **P** pequena (≤ meio dia) · **M** média (≈ 1 dia) · **G** grande
(deve ser dividida antes de começar).

> Plano montado a partir dos requisitos. A pendência de design — Q3 (submenu, botões, agrupamento) —
> é resolvida em **TASK-DASH-001 (ADR-023)**. Sem comandos novos; reusa os existentes. Não depende
> da Fase 2.

---

## Ordem de execução

```
TASK-DASH-001 (ADR-023: command: URIs + nó sintético + submenu)
        │
        ▼
TASK-DASH-002 (dashboard: seção Ações por command: URI + enableCommandUris)
        │
        ▼
TASK-DASH-003 (menu de contexto: submenu "SDD: Ações" agrupado)
```

Caminho crítico: **TASK-DASH-001 → 002 → 003** (linear).

---

## TASK-DASH-001 — ADR-023: mecanismo dos botões e do submenu

**Requisitos:** REQ-DASH-001, REQ-DASH-002
**Dependências:** —
**Complexidade:** P
**Status:** done

### Descrição

Resolver e registrar em ADR: **(Q3)** os botões do dashboard como `command:` URIs com nó sintético
`{ kind: 'feature', change }` (reusa `featureChangeOf`, sem tocar handlers) + `enableCommandUris` por
allowlist; e o menu de contexto como submenu `sddClaudeKit.featureActions` via contribuição
`submenus`.

### Arquivos prováveis

- `.specs/features/0024-feature-action-surface/decisions/ADR-023-superficie-de-acoes-dashboard-e-submenu.md`

### Testes esperados

- Nenhum — decisão/documentação.

### Critério de conclusão

- ADR-023 escrito, decidindo Q3; questão Q3 marcada como resolvida.

### Evidências necessárias

- ADR-023 presente com Decisão e Alternativas; `resolved_questions` referenciando Q3.

---

## TASK-DASH-002 — Dashboard: seção "Ações" por command: URI

**Requisitos:** REQ-DASH-001, NFR-DASH-001, NFR-DASH-003
**Dependências:** TASK-DASH-001
**Complexidade:** M
**Status:** done

### Descrição

Em `dashboardHtml.ts` (núcleo puro): `FEATURE_ACTION_GROUPS` (ações agrupadas), `FEATURE_ACTION_COMMANDS`
(allowlist), `actionHref(command, change)` (monta o `command:` URI com o nó sintético) e o
`actionsBlock` renderizado como botões. `renderDashboardHtml` ganha um 3º parâmetro opcional `change`
(compatível). Em `featureDashboard.ts` (borda): `enableCommandUris: [...FEATURE_ACTION_COMMANDS]` e
passar `change` ao render. Webview segue sem scripts, CSP com nonce.

### Arquivos prováveis

- `src/sdd/dashboardHtml.ts`
- `src/sdd/featureDashboard.ts`

### Testes esperados

- TEST-DASH-001 — com `change`, o HTML tem a seção "Ações" com um botão `command:` por comando, e o
  id da mudança no argumento (SCN-DASH-001)
- TEST-DASH-002 — sem `change`, a seção "Ações" é omitida (compatibilidade)
- TEST-DASH-003 — `actionHref` embute o nó sintético `{ kind: 'feature', change }`

### Critério de conclusão

- TEST-DASH-001..003 passam; `dashboardHtml.ts` sem import de `vscode`/rede; webview sem scripts,
  `enableCommandUris` por allowlist; `compile`/`lint`/`test` limpos.

### Evidências necessárias

- Saída de `npm test` com TEST-DASH-001..003 verdes; inspeção do webview (sem `<script>`).

---

## TASK-DASH-003 — Menu de contexto: submenu "SDD: Ações"

**Requisitos:** REQ-DASH-002, NFR-DASH-002
**Dependências:** TASK-DASH-002
**Complexidade:** P
**Status:** done

### Descrição

No `package.json`: contribuição `submenus` (`sddClaudeKit.featureActions`, "SDD: Ações"); o
`view/item/context` referencia o submenu; os 16 comandos migram para `menus["sddClaudeKit.featureActions"]`
com grupos (`fluxo`, `historia`, `validacao`, `git`, `claude`). Ações inline preservadas. Nenhum
comando novo.

### Arquivos prováveis

- `package.json`

### Testes esperados

- Nenhum automatizado próprio — a renderização do submenu é integração com o host; a estrutura é
  verificável por inspeção do manifesto (submenu referenciado; 16 comandos, todos declarados). A
  paridade de comandos segue coberta por TEST-E2E-002 (0023).

### Critério de conclusão

- Manifesto válido: submenu referenciado no `view/item/context`, 16 comandos no submenu, nenhum
  órfão; `contributes.commands` inalterado.

### Evidências necessárias

- Inspeção do `package.json` (submenu + 16 itens declarados); E2E de paridade de comandos verde.

---

## Resumo

| Complexidade | Quantidade |
| --- | --- |
| P | 2 |
| M | 1 |
| G | 0 |

Total: 3 tarefas · 3 concluídas · 0 pendentes.

**Caminho crítico:** TASK-DASH-001 → 002 → 003 (linear; concluído).

**Bloqueios ativos:** nenhum — Q3 resolvida por ADR-023 (TASK-DASH-001).

> Plano implementado em 2026-08-03. Verificação: `compile`, `lint` e **139** testes unitários limpos
> (+3: TEST-DASH-001..003); manifesto do submenu validado (referência + 16 comandos, sem órfão). A
> renderização do submenu e o clique nos `command:` URIs são integração com o host (revisão manual).
