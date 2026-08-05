# Design técnico: Wizard Cockpit — GUI guiada de specs

- **ID:** 0035-wizard-cockpit
- **Escopo dos identificadores:** WIZ
- **Estado:** ver `status.yaml` — a autoridade é ele

---

## 1. Contexto

A extensão não tem um assistente de fluxo: o ciclo SDD é dirigido por comandos soltos e
por uma sequência de QuickPicks (`newFeature`). Só o Board é interativo. Esta mudança
introduz um `WebviewPanel` que conduz uma mudança pelas 8 etapas do ciclo, reaproveitando
o Workflow Engine, o Claude Code Adapter e os escritores de `.specs/` que já existem
(`architecture.md` §2). O núcleo não conhece a API do VS Code onde puder evitar
(`architecture.md` §2, regra de dependência).

## 2. Solução proposta

Um `WebviewPanel` interativo (**ADR-033**), com cliente empacotado por esbuild + Preact
(**ADR-034**) e uma camada de tokens `--sdd-*` derivada do tema (**ADR-035**). A borda
roteia mensagens do webview para os comandos `sddClaudeKit.*` já registrados; o estado das
etapas é derivado por um núcleo puro a partir dos artefatos em disco, com `status.yaml`
como fonte da verdade. O wizard **orquestra**, não reimplementa clarify/design/tasks/verify.

## 3. Componentes afetados

**Novos**

| Arquivo | Papel | Puro? |
| --- | --- | --- |
| `src/sdd/wizardModel.ts` | Deriva `WizardState` (8 etapas: concluída/atual/bloqueada) e o progresso a partir dos artefatos | ✅ |
| `src/sdd/wizardStepGuards.ts` | Pré-requisitos de cada transição; espelha `stateMachine.ts` | ✅ |
| `src/sdd/wizardPanel.ts` | Host do `WebviewPanel`: carrega artefatos, roteia `postMessage`, reidrata em mudanças de disco | — |
| `src/sdd/hybridStep.ts` | Extrai `runHybridStep` de `extension.ts` para serviço reusável (spec/clarify/design/tasks/verify) | — |
| `src/sdd/themeTokens.ts` | Emite o CSS dos tokens `--sdd-*` mapeados para `--vscode-*` (ADR-035) | ✅ |
| `src/webview/wizard/*` | Cliente Preact das 8 views + o stepper (empacotado por esbuild) | — |

**Reaproveitados** (sem reescrever): `featureCreator` (etapa Solicitar), `stateMachine` +
`statusWriter` (transições), `dashboardModel` (contagens), `claudePrompt`/`claudeCode`
(ações de IA), `taskAnalysis`/`tasksPlan` (Tarefas), `validationReport`/`traceabilityNav`
(Verificar), `scopeCheck`/`gitParse` (Implementar), `specsIndex` (hub). A regra de módulo
é preservada: `views → core → arquivos` (`architecture.md` §2).

**Alterados**: `extension.ts` (registra o comando `sddClaudeKit.openWizard` e extrai
`runHybridStep`); `package.json` (novo comando + scripts de build do esbuild).

## 4. Contratos e interfaces

**Comando novo:** `sddClaudeKit.openWizard` — abre o hub ou uma mudança específica.

**Tipos do núcleo puro:**
```
WizardStage = 'request'|'spec'|'clarify'|'design'|'tasks'|'approve'|'implement'|'verify'
StageState  = { stage, status:'done'|'current'|'locked'|'blocked', summary, blockers[] }
WizardState = { id, title, type, currentStage, stages:StageState[], progressPct }
deriveWizardState(change, artifacts): WizardState              // puro
canAdvance(state, to): { ok:boolean, reasons:string[] }        // puro (wizardStepGuards)
```

**Protocolo de mensagens (webview → extensão):**

| Mensagem | Ação na borda |
| --- | --- |
| `{type:'create', changeType, title, scope, request}` | `featureCreator` → abre etapa Especificar (REQ-WIZ-005) |
| `{type:'advance', id, to}` | `canAdvance` → `stateMachine` → `statusWriter` (REQ-WIZ-004) |
| `{type:'ai', id, action}` | `hybridStep(action)` abre o terminal com `/sdd-kit:<action> <id>` (REQ-WIZ-003) |
| `{type:'archive', id}` | transição para ARCHIVED (REQ-WIZ-006, Q6) |
| `{type:'open'|'editSpec'|'openDoc', …}` | delega aos comandos atuais |

**Extensão → webview:** `{type:'state', wizard}` e `{type:'artifacts', …}` na abertura e a
cada reidratação.

## 5. Fluxo de dados

```
usuário → webview (Preact)                       ┌───────────────┐
   │  postMessage({advance|ai|create|archive})   │ .specs/ (disco)│ ← fonte da verdade
   ▼                                             └──────┬────────┘
wizardPanel.ts (borda) ──lê──► deriveWizardState (puro) ▲
   │  roteia p/ comando                                 │ grava
   ▼                                                    │
sddClaudeKit.* (featureCreator | statusWriter | hybridStep | scopeCheck | validationReport)
   │                                                    │
   └── FileSystemWatcher('.specs/**') ──reidrata──► postMessage({state}) ──► webview
```

## 6. Persistência

Nada de banco. As transições e o histórico são gravados em `status.yaml` via
`statusWriter` (formato do schema `status.schema.json` — o contrato com a CLI,
`architecture.md` §4). O estado efêmero de UI (aba/rascunho de formulário) usa
`vscode.setState` do webview, como o Board. `status.yaml` é a fonte da verdade; o webview
nunca guarda estado de fluxo em paralelo (ADR-033).

## 7. Dependências

- **Build:** `esbuild` (dev) — passo novo no `compile`/`vscode:prepublish` (ADR-034).
- **Runtime do webview:** `preact` + `htm` (~4 KB), empacotados no `.vsix` (ADR-034).
- **Reuso:** `js-yaml` (já presente, ADR-003) via os módulos de leitura existentes.
- **Internas:** Workflow Engine, Claude Code Adapter (0004), Git Adapter (0007),
  Validation Engine (0008).

## 8. Segurança

Entrada não confiável = todo texto de artefato. CSP `default-src 'none'` com `script-src`
e `style-src` restritos ao **nonce** por render; sem rede; inserção por `textContent`/escape,
nunca `innerHTML` (NFR-WIZ-001, ADR-033, espelha ADR-024). As ações de IA abrem o terminal
com o prompt e **não enviam** (RNF-003, `architecture.md` §6). Arquivos sensíveis seguem
bloqueados pelo contexto; nenhuma escrita fora de `.specs/`.

## 9. Observabilidade

Cada transição registra no histórico de `status.yaml` com `reason` não vazio (RNF-005,
`architecture.md` §7) e alimenta o feed de atividade do Board. Erros de borda (falha de
escrita, conflito de id) produzem mensagem acionável; a ação de IA sem o Claude Code no
PATH informa como instalar/configurar (SCN-WIZ-012).

## 10. Estratégia de testes

- **Unidade (`node --test`):** `wizardModel` (classificação de etapas e progresso),
  `wizardStepGuards` (cada guarda e seus motivos de bloqueio), `themeTokens`.
- **e2e (`vscode-test`):** abrir o wizard; criar mudança (REQ-WIZ-005); avançar respeitando
  guardas (REQ-WIZ-002); ação de IA abre o terminal sem enviar (REQ-WIZ-003); transição
  grava `status.yaml` (REQ-WIZ-004); reidratação por edição externa (SCN-WIZ-008).
- **Fora de cobertura automática:** aparência da camada de marca em cada tema → verificação
  por revisão (vira `gaps` na rastreabilidade, não cobertura aparente — standards §7).
- **Regressão:** as suítes de `boardModel`/dashboard continuam verdes.

## 11. Migração e rollback

Aditiva: nenhum painel ou comando atual é removido. O `newFeature` por QuickPick
permanece em paralelo como fallback até a etapa Solicitar do wizard estar verificada (Q4).
Rollback = não registrar o comando `openWizard` e reverter o passo do esbuild; os módulos
puros ficam inertes. Nenhuma migração de dados em `.specs/`.

## 12. Riscos

- Risco: segunda superfície com script amplia o vetor de XSS. — Mitigação: nonce,
  `textContent`, sem `innerHTML`, sem rede (ADR-033).
- Risco: o bundler muda o build e o `.vsix`. — Mitigação: `esbuild` isolado ao wizard, um
  único `compile` encadeado, documentado (ADR-034).
- Risco: dessincronização com edições externas do disco. — Mitigação: `FileSystemWatcher`
  reidrata; `status.yaml` é a verdade (SCN-WIZ-008).
- Risco: divergência entre `wizardStepGuards` e `stateMachine`. — Mitigação: guardas
  derivam das mesmas regras; teste cruzado.
- Risco: escopo inchar (o wizard "virar" o clarify/design). — Mitigação: princípio de
  orquestração; a regra vive nos módulos existentes.

## 13. Alternativas consideradas

- Alternativa: manter script-free + `command:` URIs. — Por que não: não comporta
  formulários com estado nem navegação de etapas (ADR-033).
- Alternativa: vanilla + template-string para as 8 views. — Por que não: `wizardHtml.ts`
  ingerível; manutenção ruim (ADR-034).
- Alternativa: React em vez de Preact. — Por que não: runtime maior, ganho marginal no
  webview (ADR-034).
- Alternativa: paleta dark fixa. — Por que não: quebra o tema claro e a personalização
  (ADR-035).
- Alternativa: um novo comando por etapa. — Por que não: multiplicaria comandos e
  divergiria dos skills; o wizard reusa `runHybridStep` e os comandos atuais.

## 14. Questões fechadas pelo design

- Q1 — Stack do webview: **esbuild + Preact**, formalizado em **ADR-034**.
- Q2 — Tema claro: tokens `--sdd-*` derivados de `--vscode-*` desde o início (**ADR-035**).
- Q3 — Escopo da 1ª entrega: **o wizard**; Board/sidebar em iteração seguinte (§3, §11).
- Q4 — QuickPick mantido em paralelo (§11).
- Q5 — Claude Code ausente: copiar prompt + instruir, via `hybridStep`/adapter 0004 (§9).
- Q6 — "Gerenciar" inclui arquivar; sem excluir/renomear (protocolo §4, REQ-WIZ-006).
- Natureza da superfície e segurança: **ADR-033**.

## 15. Questões ainda em aberto

Nenhuma questão crítica em aberto. A questão arquitetural A1 (`architecture.md` §10 —
bundler para o restante da extensão) permanece aberta **fora** do escopo desta feature:
o ADR-034 a resolve apenas para o webview do wizard.
