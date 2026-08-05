# Wizard Cockpit (0035) — Handoff para o host

Estado da branch `feat/0035-wizard-cockpit` (PR #71). A **fundação** e o **laço central**
do wizard estão implementados e testados por unidade; as etapas de UI e os testes **e2e**
precisam do host do VS Code para validar e iterar. Este documento diz como rodar, o que
verificar à mão, e o que falta.

## Estado das tarefas

| Tarefa | Estado | Entrega |
| --- | --- | --- |
| WIZ-001 | ✅ done | `themeTokens.ts` — tokens `--sdd-*` + marca |
| WIZ-002 | ✅ done | `esbuild.mjs` + Preact — bundle `out/webview/wizard.js` |
| WIZ-003 | ✅ done | `wizardModel.ts` — `deriveWizardState` (8 etapas) |
| WIZ-004 | ✅ done | `wizardStepGuards.ts` — `canAdvance` + `advanceTargetStatus` |
| WIZ-005 | 🟡 in_progress | `wizardHtml.ts` (CSP/nonce) + `Shell`/`Stepper` Preact — falta e2e de render |
| WIZ-006 | 🟡 in_progress | `wizardPanel.ts` (host) + `wizardArtifacts.ts` + comando `openWizard` — falta e2e |
| WIZ-007 | 🟡 in_progress | `Footer.tsx` + handler `{advance}` → `applyTransition` — falta e2e |
| WIZ-008 | 🟡 in_progress | `changePlanner.ts` (alocação/conflito) — falta o formulário + escrita no host |
| WIZ-010 | 🟡 in_progress | `hybridStep.ts` (extraído) + `wizardActions.ts` + `{ai}` + `AiAction.tsx` — falta e2e |
| WIZ-009, 011..015 | ⚪ pending | hub · views · aprovar · implementar · verificar · a11y |

Fonte da verdade: `.specs/features/0035-wizard-cockpit/` (`status.yaml`, `tasks.md`,
`traceability.yaml`). Validação atual: `npm run compile` ✓ · `npm test` (208) ✓ · `npm run lint` ✓.

> **Os e2e não rodam em WSL sem as libs do Electron.** `npm run test:e2e` baixa o VS Code
> e morre em `libnspr4.so: cannot open shared object file`. Quem os executa é a **CI**
> (`xvfb-run -a npm run test:e2e`, `.github/workflows/ci.yml`) — abra o PR e leia o
> resultado de lá. Localmente, valide pelo F5 (Extension Development Host) com o roteiro
> abaixo.

## Como rodar no host

```
cd extensions_vscode
npm install
npm run compile          # tsc (borda) + esbuild (webview → out/webview/wizard.js)
```
Abra a pasta no VS Code e tecle **F5** (Extension Development Host). Depois:
- Command Palette → **“SDD: Assistente (wizard)”** → escolha uma mudança.

## O que verificar à mão (mapeia aos e2e pendentes)

1. **Render do stepper (TEST-WIZ-006).** O assistente abre com as 8 etapas; a etapa atual
   e as concluídas/bloqueadas refletem o `status.yaml` real da mudança. O tema (claro/escuro)
   deve ser respeitado; o acento violeta/coral aparece nos nós e no botão.
2. **Avanço com portão (TEST-WIZ-008).** Numa mudança com o pré-requisito faltando (ex.: sem
   requisitos), o botão “Avançar” fica **desabilitado** e mostra o motivo. Numa mudança apta,
   clicar pede um **motivo** e grava a transição em `status.yaml` (confira o `history`).
3. **Reidratação (TEST-WIZ-007).** Com o assistente aberto, edite o `status.yaml` da mudança
   por fora (ou rode outro comando SDD): o stepper deve refletir o novo estado sem reabrir.
4. **Ação de IA (TEST-WIZ-011).** Numa etapa com IA (Especificar, Clarificar, Desenhar,
   Tarefas, Implementar, Verificar) o botão **"✦ &lt;Etapa&gt; com IA"** aparece na área de
   conteúdo. Clicar deve: copiar `/sdd-kit:<ação> <id>` e deixá-lo **digitado e não
   enviado** no terminal “SDD · Claude Code” (SCN-WIZ-004). Sem a CLI no PATH (limpe
   `sddClaudeKit.claudeCode.path` e teste numa máquina sem `claude`), deve copiar o prompt
   e avisar como instalar/configurar (SCN-WIZ-012). Solicitar e Aprovar **não** mostram o
   botão — são formulário e portão humano.

Se algo destoar, o ponto de entrada é `src/sdd/wizardPanel.ts` (borda) e `src/webview/wizard/*`
(cliente Preact). A regra pura (modelo, guardas, alvo de transição) está testada em
`src/test/wizard*.test.ts` — comece por lá para entender o comportamento esperado.

## Decisão a validar com feedback

`advanceTargetStatus` (em `wizardStepGuards.ts`) mapeia cada etapa ao status do ciclo que o
“avançar” grava (clarify→CLARIFIED, …, implement→IN_PROGRESS, verify→VERIFIED). As etapas
Solicitar/Especificar não disparam transição (o trabalho delas mantém DRAFT; ao ganhar
requisitos, a etapa derivada anda sozinha). Confirme que essa coreografia bate com o fluxo
desejado ao usar o wizard — é o ponto mais sujeito a ajuste.

## O que falta (WIZ-009..015) e onde encostar

- **WIZ-008 (completar):** formulário `StepRequest.tsx` (tipo/título/slug/solicitação) + um
  handler `{create}` no `wizardPanel` que usa `planAllocation` (`changePlanner.ts`, já testado)
  + escreve os arquivos por template (reusar `substituteChange`/`insertChangeEntry` do
  `featureCreator`, ou extrair a escrita do `newFeature` num serviço compartilhado).
- **WIZ-009 hub:** modo “lista + retomar” + estado vazio (boas-vindas). Provável mode-switch
  no payload do webview (`view: 'hub' | 'change' | 'create'`).
- **WIZ-010 (fechar):** só falta executar o e2e `src/e2e/wizardAi.test.ts` num host capaz.
  A extração e a fiação estão feitas — `hybridStep.ts` é agora o caminho único do menu de
  contexto E do wizard.
- **WIZ-011 views de conteúdo:** Especificar/Clarificar/Desenhar/Tarefas exibindo dados de
  `dashboardModel`/`taskAnalysis`/`decisions`. O `<AiAction stage=… />` já existe e pode ser
  embutido em cada view no lugar do placeholder atual do `Shell.tsx`.
- **WIZ-012/013/014:** Aprovar (→APPROVED), Implementar (escopo via `scopeCheck`), Verificar
  (`validationReport`, →VERIFIED, arquivar).
- **WIZ-015:** acessibilidade (aria/teclado) + contraste nos dois temas.

## Mockups de referência

`docs/ui-redesign/gallery.html` (14 telas), `STYLE-CONTRACT.md`, `PLAN.md`,
`IMPLEMENTATION-PLAN.md`.
