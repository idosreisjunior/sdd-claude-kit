# SDD Cockpit — Plano de implementação

> Plano técnico para transformar os mockups (`docs/ui-redesign/mockups/`) em código, sem
> quebrar o que já existe. Segue o próprio método SDD: **entra pelo `/sdd-kit:new`** e é
> entregue em fases pequenas e verificáveis. Reaproveita o núcleo puro e os comandos
> existentes — o wizard é uma **casca de orquestração**, não uma reimplementação.

## 1. Princípios (invioláveis)

1. **Reuso, não reescrita.** O wizard chama os comandos `sddClaudeKit.*` e os skills
   `/sdd-kit:*` que já existem. Nada de duplicar clarify/design/tasks/verify.
2. **`status.yaml` é a fonte da verdade.** Toda transição de etapa passa por
   `stateMachine.ts` + `statusWriter.ts`. O webview projeta o estado; não o inventa.
3. **IA nunca dispara sozinha.** As ações de IA copiam o prompt para o terminal do Claude
   Code (o comportamento atual de `runHybridStep`).
4. **CSP + nonce + escape.** O wizard é interativo (script), como o Board (ADR-024). Todo
   texto de artefato entra por `textContent`/escape (NFR-UI-002).
5. **Núcleo puro testável.** Estado do wizard e guardas de etapa ficam em módulos sem a
   API do VS Code, com testes `node --test` (como `boardModel`).
6. **Uma etapa por vez, sem regressão.** Cada fase termina com lint + testes + build e não
   remove superfícies existentes até a substituta estar pronta.

## 2. Decisão de stack do webview

O wizard tem 8 telas ricas e interativas — muito além do que uma template-string comporta
com clareza. **Recomendação (a ratificar como ADR):**

- **Wizard:** `esbuild` (bundle de um único `wizard.js`) + **Preact + htm** (~4 KB, sem JSX
  build extra). Um passo `esbuild` entra no `compile`/`vscode:prepublish`.
- **Painéis de leitura** (Projeto, Dashboard, Histórico, Métricas, Validação): permanecem
  em vanilla/template-string — não justificam o custo.
- **Board:** mantém o script inline atual; ganha só cards mais ricos.

ADRs a criar nesta feature:
- **ADR-0xx — Wizard como WebviewPanel interativo** (estende ADR-024): justifica script +
  nonce + protocolo de mensagens para uma superfície de formulário.
- **ADR-0xx — Bundler esbuild + Preact para o webview do wizard**: escopo, tamanho, e por
  que os demais painéis ficam de fora.
- **ADR-0xx — Camada de marca (violeta/coral) sobre o tema**: tokens `--sdd-*` derivados de
  `--vscode-*`, garantindo claro/escuro.

> Alternativa (fallback registrado): manter **vanilla + template-string** para o wizard.
> Menos dependências, porém `wizardHtml.ts` fica grande e repetitivo. Se preferir, o plano
> abaixo continua válido — só troca a Fase 1 (sem bundler) e o `src/webview/`.

## 3. Arquitetura de módulos

### Novos

| Arquivo | Papel | Puro? |
| --- | --- | --- |
| `src/sdd/wizardModel.ts` | Deriva o estado das 8 etapas (concluída/atual/bloqueada) e o progresso a partir dos artefatos da mudança | ✅ |
| `src/sdd/wizardStepGuards.ts` | Pré-requisitos de cada transição (pode avançar? por quê não?) — espelha `stateMachine.ts` | ✅ |
| `src/sdd/wizardHtml.ts` | Casca (topbar + stepper + 2 colunas + rodapé) e a view de cada etapa; CSP + nonce | — |
| `src/sdd/wizardPanel.ts` | Host do `WebviewPanel`: carrega artefatos, roteia `postMessage` para comandos, reidrata em mudanças de disco | — |
| `src/sdd/hybridStep.ts` | Extrai `runHybridStep` de `extension.ts` para um serviço reusável (spec/clarify/design/tasks/verify) | — |
| `src/sdd/themeTokens.ts` | Gera o CSS dos tokens `--sdd-*` mapeados para `--vscode-*` (design system) | ✅ |
| `src/webview/wizard/*` | Fonte Preact das 8 views (só na opção esbuild) | — |

### Reaproveitados (sem reescrever)

| Já existe | Usado pelo wizard em |
| --- | --- |
| `featureCreator.ts` | Etapa 1 · Solicitar (cria request/spec/status + índice) |
| `stateMachine.ts` + `statusWriter.ts` | Toda transição de etapa (advance/approve/verify) |
| `dashboardModel.ts` | Contagens (requisitos/cenários/critérios/tarefas/testes/arquivos) |
| `claudePrompt.ts` + `claudeCode.ts` | Ações de IA (abrir terminal com o prompt do skill) |
| `taskAnalysis.ts` / `tasksPlan.ts` | Etapa 5 · Tarefas |
| `validationReport.ts` + `traceabilityNav.ts` | Etapa 8 · Verificar |
| `scopeCheck.ts` + `gitParse.ts` | Etapa 7 · Implementar (guarda de escopo) |
| `evidenceDoc.ts` / `metrics.ts` | Verificar / métricas |
| `contextGuardian.ts` | Indicador de contexto na sidebar |
| `specsIndex.ts` | Lista de mudanças (hub, board, sidebar) |
| `FEATURE_ACTION_GROUPS` (`dashboardHtml.ts`) | Taxonomia de ações reutilizada no dashboard novo |

## 4. Estado e protocolo de mensagens

**Estado (puro, `wizardModel.ts`):**
```
WizardStage = 'request'|'spec'|'clarify'|'design'|'tasks'|'approve'|'implement'|'verify'
StageState  = { stage, status: 'done'|'current'|'locked'|'blocked', summary, blockers[] }
WizardState = { id, title, type, currentStage, stages: StageState[], progressPct }
```
`deriveWizardState(change, artifacts)` lê o que já existe em disco (spec.md, decisions/,
tasks.md, status.yaml, traceability.yaml) e classifica cada etapa. Sem efeitos colaterais.

**Protocolo webview → extensão** (`wizardPanel.ts` roteia para comandos existentes):
| Mensagem | Ação |
| --- | --- |
| `{type:'create', changeType, title, scope, request}` | `featureCreator` → cria e abre a etapa 2 |
| `{type:'advance', id, to}` | `wizardStepGuards.canAdvance` → `stateMachine` → `statusWriter` |
| `{type:'ai', id, action}` | `hybridStep(action)` abre o terminal com `/sdd-kit:<action> <id>` |
| `{type:'open'|'editSpec'|'openDoc', ...}` | delega aos comandos atuais |
| `{type:'runValidation', id}` | `validationReport` e devolve o resultado |
**Extensão → webview:** `{type:'state', wizard}` e `{type:'artifacts', ...}` a cada
reidratação (na abertura e no `FileSystemWatcher` de `.specs/**`).

## 5. Guardas por etapa (portões de qualidade)

`wizardStepGuards.ts` — cada avanço só é liberado com o pré-requisito satisfeito; o botão
fica desabilitado com o motivo (como no mockup 07):

| Transição | Guarda |
| --- | --- |
| Especificar → Clarificar | ≥ 1 `REQ-*` na spec |
| Clarificar → Desenhar | nenhuma dúvida **crítica** em aberto |
| Desenhar → Tarefas | design.md presente + ≥ 1 ADR registrado |
| Tarefas → Aprovar | todo requisito coberto por tarefa; 0 dependências inválidas |
| Aprovar → Implementar | portão de revisão marcado (APPROVED) |
| Implementar → Verificar | ≥ 1 tarefa concluída (não bloqueia o resto) |
| Verificar → (VERIFIED) | todo critério avaliado com evidência; nenhum requisito sem tarefa nem tarefa sem teste |

Todas espelham as regras já descritas no CLAUDE.md e em `stateMachine.ts`.

## 6. Fases de entrega

Cada fase é incremental, testável e não regride superfícies existentes.

### Fase 0 — Especificar a própria feature (SDD)
`/sdd-kit:new` → feature `00xx-wizard-cockpit`. Escrever spec (REQ/NFR/cenários) a partir
deste plano e dos mockups; clarify; design com os 3 ADRs acima; tasks. **Sem código ainda.**

### Fase 1 — Fundação visual (baixo risco)
- `themeTokens.ts`: tokens `--sdd-*` (violeta/coral + status) sobre `--vscode-*`.
- Componente **stepper** e a **casca do wizard** (`wizardHtml.ts`) — telas 06 (shell) e 04
  (hub) em modo somente-leitura, abertas por um comando novo `sddClaudeKit.openWizard`.
- (opção B) configurar `esbuild` + `src/webview/`.
- Testes: render do shell; snapshot do stepper por etapa. **Telas: 04, 06.**

### Fase 2 — Criar e navegar
- Etapa 1 · Solicitar (tela 05) usando `featureCreator` — substitui os QuickPicks do
  `newFeature` por um formulário (mantendo o comando antigo como fallback).
- `wizardModel` + `wizardStepGuards`; persistência das transições via `statusWriter`;
  reidratação por `FileSystemWatcher`.
- Testes: `wizardModel`/`wizardStepGuards` (node --test); e2e de abrir + avançar.
  **Telas: 05, 04.**

### Fase 3 — Etapas de conteúdo com IA
- Extrair `hybridStep.ts`; ligar as ações de IA das etapas 2–5.
- Views: Especificar (06), Clarificar (07, com o portão de dúvidas), Desenhar (08, ADRs),
  Tarefas (09, cobertura/rastreabilidade) — exibindo dados de `dashboardModel`,
  `taskAnalysis`, `decisions/`. **Telas: 06, 07, 08, 09.**

### Fase 4 — Portão e execução
- Aprovar (10): transição para APPROVED com o checklist.
- Implementar (11): lista de tarefas + `scopeCheck` (guarda de escopo Git) + botão "Abrir no
  Claude Code" por tarefa.
- Verificar (12): `validationReport` (três estados), critérios com evidência, promoção para
  VERIFIED; opção Arquivar. **Telas: 10, 11, 12.**

### Fase 5 — Demais superfícies
- Sidebar cockpit (01): redesenho de `projectOverviewHtml` com "mudança ativa" + mini-stepper
  + contexto + atividade.
- Board (03): cards com anel de progresso e chips de status (evolui `boardHtml`).
- Dashboard (13) e Boas-vindas (02). **Telas: 01, 02, 03, 13.**

### Fase 6 — Polimento
- Acessibilidade (aria/teclado no stepper e nos formulários), **tema claro**, foco/contraste.
- Suíte de testes completa, docs `docs/pt-BR/`, entrada no ROADMAP, bump de versão e
  `vsce package`.

## 7. Testes

- **Puro (`node --test`):** `wizardModel` (classificação de etapas, progresso),
  `wizardStepGuards` (cada guarda, incluindo os motivos de bloqueio), `themeTokens`.
- **e2e (`vscode-test`):** abrir o wizard; criar mudança; avançar respeitando guardas;
  ação de IA abre o terminal sem enviar; transição grava `status.yaml`.
- **Regressão:** os testes atuais de `boardModel`/dashboard continuam verdes.

## 8. Rastreabilidade e migração

- `traceability.yaml` atualizado a cada tarefa (requisito → cenário → tarefa → arquivo →
  teste), como manda o CLAUDE.md.
- **Compatibilidade:** os comandos e painéis atuais continuam funcionando durante toda a
  migração. O `newFeature` por QuickPick só é aposentado quando a Etapa 1 do wizard estiver
  verificada. Nada de arquivos de código do usuário é tocado.

## 9. Riscos e mitigação

| Risco | Mitigação |
| --- | --- |
| Bundler muda o build/CI | `esbuild` como passo em `compile` e `vscode:prepublish`; escopo só do wizard |
| Sincronização de estado (edição externa do `.specs`) | `FileSystemWatcher` reidrata o webview; `status.yaml` é a verdade |
| Escopo do wizard inchar | Guarda de princípio: orquestra, não reimplementa; revisão por ADR |
| CSP/segurança do webview interativo | Reusa o padrão do Board (nonce, `textContent`, sem rede) |
| Divergência entre guardas e `stateMachine` | Guardas derivam das mesmas regras; testes cruzados |

## 10. Estimativa (ordem de grandeza)

| Fase | Esforço |
| --- | --- |
| 0 Especificar | ~0,5 dia |
| 1 Fundação visual | ~1,5 dia |
| 2 Criar e navegar | ~2 dias |
| 3 Etapas de conteúdo | ~2,5 dias |
| 4 Portão e execução | ~2,5 dias |
| 5 Demais superfícies | ~2 dias |
| 6 Polimento | ~1,5 dia |
| **Total** | **~12,5 dias** de desenvolvimento focado |

## 11. Próximo passo

Com seu aval, começo pela **Fase 0**: `/sdd-kit:new` para registrar a feature
`wizard-cockpit`, escrever a spec a partir deste plano e dos mockups, e abrir os 3 ADRs de
arquitetura. A partir daí, uma tarefa por vez, cada uma com testes e rastreabilidade.
