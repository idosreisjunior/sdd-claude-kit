# Tarefas — Wizard Cockpit — GUI guiada de specs

Complexidade: **P** pequena (≤ meio dia) · **M** média (≈ 1 dia) · **G** grande
(deve ser dividida antes de começar).

---

## Ordem de execução

```
Fundação (paralelo):
  TASK-WIZ-001 (themeTokens) [OK] ─┐
  TASK-WIZ-002 (esbuild+scaffold) [OK] ─┤
  TASK-WIZ-003 (wizardModel) [OK] ─────┼─► TASK-WIZ-005 (shell+stepper) ─► TASK-WIZ-006 (panel host)
  TASK-WIZ-003 ─► TASK-WIZ-004 (guards) [OK]                                     │
                                                                            ├─► TASK-WIZ-008 (Solicitar)
                                                                            ├─► TASK-WIZ-009 (hub)
                                                                            ├─► TASK-WIZ-010 (hybridStep/IA)
  TASK-WIZ-006 + TASK-WIZ-004 ─► TASK-WIZ-007 (transições)
  TASK-WIZ-007 + TASK-WIZ-010 ─► TASK-WIZ-011 (views de conteúdo)
                                     ├─► TASK-WIZ-012 (Aprovar)
                                     ├─► TASK-WIZ-013 (Implementar)
                                     └─► TASK-WIZ-014 (Verificar+arquivar)
  TASK-WIZ-005 + TASK-WIZ-011 ─► TASK-WIZ-015 (acessibilidade + contraste)

Caminho crítico: 003 → 005 → 006 → 007 → 011 → 014
```

---

## TASK-WIZ-001 — Tokens de tema --sdd-* derivados de --vscode-*

**Requisitos:** NFR-WIZ-002
**Dependências:** —
**Complexidade:** P
**Status:** done

### Descrição

Criar `themeTokens.ts` (puro) que emite o CSS dos tokens `--sdd-*` (surface, border, text,
accent, ai, cores de status do ciclo de vida) cada um derivado de uma variável `--vscode-*`,
conforme o mapeamento de `docs/ui-redesign/STYLE-CONTRACT.md` e o ADR-035.

### Arquivos prováveis

- `src/sdd/themeTokens.ts`
- `src/test/themeTokens.test.ts`

### Testes esperados

- TEST-WIZ-001

### Critério de conclusão

- Cada token `--sdd-*` referencia uma `--vscode-*` (sem cor fixa de conteúdo) e TEST-WIZ-001 passa.

### Evidências necessárias

- Saída do teste TEST-WIZ-001.

---

## TASK-WIZ-002 — Pipeline esbuild + scaffold Preact do webview

**Requisitos:** NFR-WIZ-001
**Dependências:** —
**Complexidade:** M
**Status:** done

### Descrição

Introduzir o passo `esbuild` que empacota o cliente do wizard (`src/webview/wizard/*`) em um
único `wizard.js`, encadeado no `compile`/`vscode:prepublish`; adicionar `preact` + `htm`.
Scaffold mínimo de um componente Preact renderizado no painel com CSP + nonce (ADR-034).

### Arquivos prováveis

- `esbuild.mjs`, `package.json` (scripts, dependências)
- `src/webview/wizard/index.tsx`

### Testes esperados

- Nenhum (configuração de build; verificada pelo `compile` e pelos e2e das tarefas seguintes).

### Critério de conclusão

- `npm run compile` gera `wizard.js`; o painel de scaffold carrega sem violar a CSP.

### Evidências necessárias

- Log do build gerando o bundle.

---

## TASK-WIZ-003 — wizardModel: derivar o estado das 8 etapas

**Requisitos:** REQ-WIZ-001, NFR-WIZ-003
**Dependências:** —
**Complexidade:** M
**Status:** done

### Descrição

`wizardModel.ts` (puro): `deriveWizardState(change, artifacts)` classifica cada etapa
(concluída/atual/bloqueada) e calcula o progresso a partir dos artefatos em disco, sem a API
do VS Code. Robusto a artefato ausente/ilegível (SCN-WIZ-007).

### Arquivos prováveis

- `src/sdd/wizardModel.ts`
- `src/test/wizardModel.test.ts`

### Testes esperados

- TEST-WIZ-002, TEST-WIZ-003

### Critério de conclusão

- Estado correto para uma mudança em DESIGNED; artefato ausente vira etapa pendente sem erro; TEST-WIZ-002/003 passam.

### Evidências necessárias

- Saída dos testes.

---

## TASK-WIZ-004 — wizardStepGuards: portões de transição

**Requisitos:** REQ-WIZ-002, NFR-WIZ-003
**Dependências:** TASK-WIZ-003
**Complexidade:** M
**Status:** done

### Descrição

`wizardStepGuards.ts` (puro): `canAdvance(state, to)` devolve `{ok, reasons}` aplicando os
pré-requisitos de cada etapa (≥1 REQ para Clarificar; sem dúvida crítica para Desenhar; etc.),
espelhando `stateMachine.ts`.

### Arquivos prováveis

- `src/sdd/wizardStepGuards.ts`
- `src/test/wizardStepGuards.test.ts`

### Testes esperados

- TEST-WIZ-004, TEST-WIZ-005

### Critério de conclusão

- Avanço sem requisito e avanço com dúvida crítica são bloqueados com motivo; TEST-WIZ-004/005 passam.

### Evidências necessárias

- Saída dos testes.

---

## TASK-WIZ-005 — Shell do wizard + stepper (Preact, CSP+nonce)

**Requisitos:** REQ-WIZ-001, NFR-WIZ-001, NFR-WIZ-004
**Dependências:** TASK-WIZ-001, TASK-WIZ-002, TASK-WIZ-003
**Complexidade:** M
**Status:** in_progress

### Descrição

Renderizar a casca (topbar + stepper das 8 etapas + duas colunas + rodapé) a partir de
`WizardState`, aplicando os tokens `--sdd-*`. CSP `default-src 'none'` com nonce; texto de
artefato por `textContent`/escape; stepper com `aria-*` e navegável por teclado.

### Arquivos prováveis

- `src/webview/wizard/Shell.tsx`, `Stepper.tsx`
- `src/sdd/wizardHtml.ts` (documento + CSP)

### Testes esperados

- TEST-WIZ-006

### Critério de conclusão

- O stepper reflete concluída/atual/futura; o webview passa em CSP/nonce; TEST-WIZ-006 (e2e) passa.

### Evidências necessárias

- Captura do stepper; saída do e2e.

---

## TASK-WIZ-006 — Host do painel + comando openWizard + reidratação

**Requisitos:** REQ-WIZ-004, SCN-WIZ-008
**Dependências:** TASK-WIZ-005
**Complexidade:** M
**Status:** in_progress

### Descrição

`wizardPanel.ts`: cria o `WebviewPanel`, injeta o estado, roteia `postMessage`, e registra o
comando `sddClaudeKit.openWizard`. `FileSystemWatcher('.specs/**')` reidrata o webview em
edições externas do `status.yaml`.

### Arquivos prováveis

- `src/sdd/wizardPanel.ts`, `src/extension.ts`, `package.json`

### Testes esperados

- TEST-WIZ-007
- TEST-WIZ-017 (unidade: montagem de artefatos)

### Critério de conclusão

- `openWizard` abre o painel; uma edição externa do `status.yaml` atualiza o stepper; TEST-WIZ-007 passa (SCN-WIZ-008).

### Evidências necessárias

- Saída do e2e de reidratação.

---

## TASK-WIZ-007 — Transições de etapa (advance) com guardas

**Requisitos:** REQ-WIZ-002, REQ-WIZ-004
**Dependências:** TASK-WIZ-006, TASK-WIZ-004
**Complexidade:** M
**Status:** pending

### Descrição

Mensagem `{advance}`: valida por `canAdvance`, aplica a transição por `stateMachine` +
`statusWriter` (histórico com motivo), e reprojeta o estado. Botão de avanço desabilitado com
motivo quando bloqueado.

### Arquivos prováveis

- `src/sdd/wizardPanel.ts`, `src/webview/wizard/Footer.tsx`

### Testes esperados

- TEST-WIZ-008

### Critério de conclusão

- Avançar grava a transição no `status.yaml`; avanço bloqueado não grava; TEST-WIZ-008 passa (SCN-WIZ-005).

### Evidências necessárias

- Diff do `status.yaml`; saída do e2e.

---

## TASK-WIZ-008 — Etapa Solicitar: criar a mudança

**Requisitos:** REQ-WIZ-005
**Dependências:** TASK-WIZ-006
**Complexidade:** M
**Status:** pending

### Descrição

Formulário da etapa 1 (tipo, título, escopo, solicitação) que cria a mudança reutilizando
`featureCreator` e abre o wizard na etapa Especificar. Conflito de identificador é reportado
sem sobrescrever (SCN-WIZ-009).

### Arquivos prováveis

- `src/webview/wizard/StepRequest.tsx`, `src/sdd/wizardPanel.ts`

### Testes esperados

- TEST-WIZ-009

### Critério de conclusão

- Criar produz os mesmos artefatos que `/sdd-kit:new`; id em conflito não sobrescreve; TEST-WIZ-009 passa (SCN-WIZ-006/009).

### Evidências necessárias

- Árvore de arquivos criada; saída do e2e.

---

## TASK-WIZ-009 — Hub: listar, retomar e estado vazio

**Requisitos:** REQ-WIZ-006
**Dependências:** TASK-WIZ-006
**Complexidade:** M
**Status:** pending

### Descrição

Hub que lista as mudanças (via `specsIndex`) e retoma cada uma na etapa atual; estado de
boas-vindas quando não há nenhuma mudança (SCN-WIZ-010/011).

### Arquivos prováveis

- `src/webview/wizard/Hub.tsx`, `src/sdd/wizardModel.ts`

### Testes esperados

- TEST-WIZ-010

### Critério de conclusão

- O hub lista e retoma na etapa correta; projeto vazio mostra boas-vindas; TEST-WIZ-010 passa.

### Evidências necessárias

- Saída do e2e.

---

## TASK-WIZ-010 — hybridStep reusável + ações de IA

**Requisitos:** REQ-WIZ-003
**Dependências:** TASK-WIZ-006
**Complexidade:** M
**Status:** pending

### Descrição

Extrair `runHybridStep` de `extension.ts` para `hybridStep.ts` reusável. Mensagem `{ai}` abre
o Claude Code com `/sdd-kit:<action> <id>` sem enviar; sem o Claude Code no PATH, copia o
prompt e instrui a instalação/configuração (SCN-WIZ-012, adapter 0004).

### Arquivos prováveis

- `src/sdd/hybridStep.ts`, `src/extension.ts`, `src/sdd/wizardPanel.ts`

### Testes esperados

- TEST-WIZ-011

### Critério de conclusão

- A ação abre o terminal com o prompt correto e não envia; sem Claude Code, copia o prompt; TEST-WIZ-011 passa (SCN-WIZ-004/012).

### Evidências necessárias

- Saída do e2e; conteúdo do prompt.

---

## TASK-WIZ-011 — Views de conteúdo: Especificar/Clarificar/Desenhar/Tarefas

**Requisitos:** REQ-WIZ-001, REQ-WIZ-002
**Dependências:** TASK-WIZ-007, TASK-WIZ-010
**Complexidade:** M
**Status:** pending

### Descrição

Views das etapas 2–5 exibindo os dados dos artefatos (contagens via `dashboardModel`, tarefas
via `taskAnalysis`, ADRs de `decisions/`) e os portões de cada etapa, com as ações de IA.

### Arquivos prováveis

- `src/webview/wizard/StepSpec.tsx`, `StepClarify.tsx`, `StepDesign.tsx`, `StepTasks.tsx`

### Testes esperados

- TEST-WIZ-012

### Critério de conclusão

- Cada view mostra o conteúdo derivado e respeita o portão; o portão de Clarificar bloqueia com dúvida crítica; TEST-WIZ-012 passa.

### Evidências necessárias

- Capturas das 4 views; saída do e2e.

---

## TASK-WIZ-012 — Etapa Aprovar: portão de qualidade

**Requisitos:** REQ-WIZ-002, REQ-WIZ-004
**Dependências:** TASK-WIZ-007, TASK-WIZ-011
**Complexidade:** M
**Status:** pending

### Descrição

View da etapa Aprovar com o checklist do portão e a transição para APPROVED via
`stateMachine`/`statusWriter`, registrando a aprovação no histórico.

### Arquivos prováveis

- `src/webview/wizard/StepApprove.tsx`, `src/sdd/wizardPanel.ts`

### Testes esperados

- TEST-WIZ-013

### Critério de conclusão

- Aprovar promove para APPROVED com registro; TEST-WIZ-013 passa.

### Evidências necessárias

- Diff do `status.yaml`; saída do e2e.

---

## TASK-WIZ-013 — Etapa Implementar: tarefas + guarda de escopo

**Requisitos:** REQ-WIZ-003, REQ-WIZ-006
**Dependências:** TASK-WIZ-010, TASK-WIZ-011
**Complexidade:** M
**Status:** pending

### Descrição

View da etapa Implementar: lista de tarefas com progresso, botão "Abrir no Claude Code" por
tarefa (via `hybridStep`) e a guarda de escopo Git (`scopeCheck`) mostrando arquivos/linhas e
alertando sobre arquivos sensíveis.

### Arquivos prováveis

- `src/webview/wizard/StepImplement.tsx`, `src/sdd/scopeCheck.ts` (reuso)

### Testes esperados

- TEST-WIZ-014

### Critério de conclusão

- A view lista tarefas e apresenta o escopo (arquivos/linhas/sensíveis); a ação abre o Claude Code; TEST-WIZ-014 passa.

### Evidências necessárias

- Saída do e2e; captura do escopo.

---

## TASK-WIZ-014 — Etapa Verificar + arquivar

**Requisitos:** REQ-WIZ-004, REQ-WIZ-006
**Dependências:** TASK-WIZ-007, TASK-WIZ-011
**Complexidade:** M
**Status:** pending

### Descrição

View da etapa Verificar exibindo os critérios de aceite e os comandos de validação nos três
estados (via `validationReport`), promoção para VERIFIED e a ação de arquivar (ARCHIVED) —
sem excluir/renomear (Q6).

### Arquivos prováveis

- `src/webview/wizard/StepVerify.tsx`, `src/sdd/validationReport.ts` (reuso)

### Testes esperados

- TEST-WIZ-015

### Critério de conclusão

- A view mostra critérios + validação (3 estados); promover leva a VERIFIED; arquivar leva a ARCHIVED; TEST-WIZ-015 passa.

### Evidências necessárias

- Diff do `status.yaml`; saída do e2e.

---

## TASK-WIZ-015 — Acessibilidade e contraste (claro/escuro)

**Requisitos:** NFR-WIZ-002, NFR-WIZ-004
**Dependências:** TASK-WIZ-005, TASK-WIZ-011
**Complexidade:** M
**Status:** pending

### Descrição

Garantir rótulos `aria-*` e operação por teclado no stepper e nos formulários, e conferir o
contraste da camada de marca em tema claro e escuro; ajustar tokens onde necessário.

### Arquivos prováveis

- `src/webview/wizard/*`, `src/sdd/themeTokens.ts`

### Testes esperados

- TEST-WIZ-016

### Critério de conclusão

- Stepper e formulários operáveis por teclado com rótulos; contraste aceitável nos dois temas; TEST-WIZ-016 (smoke a11y) passa.

### Evidências necessárias

- Saída do e2e de a11y; capturas nos dois temas.

---

## Resumo

| Complexidade | Quantidade |
| --- | --- |
| P | 1 |
| M | 14 |
| G | 0 |

x · 15 pendentes.

**Caminho crítico:** TASK-WIZ-003 → TASK-WIZ-005 → TASK-WIZ-006 → TASK-WIZ-007 → TASK-WIZ-011 → TASK-WIZ-014

**Bloqueios ativos:** Nenhum.

**Paralelizáveis agora:** TASK-WIZ-001, TASK-WIZ-002, TASK-WIZ-003 (fundação, sem dependências).
