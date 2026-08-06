# SDD Cockpit — Redesenho da GUI com wizard guiado

> Planejamento e proposta de mockups **antes** da implementação. Os mockups vivem em
> `docs/ui-redesign/mockups/` (SVG) e podem ser vistos juntos abrindo `gallery.html`.
> Nada aqui foi implementado ainda — este documento é para análise e aprovação.

## 1. Diagnóstico da interface atual (v0.2.12)

O que existe hoje (mapeado no código):

| Superfície | Tipo | Observação |
| --- | --- | --- |
| Projeto | WebviewView (sem script) | Cartões de saúde, contexto, contagens e docs. Ações por `command:` URI. |
| Features | TreeView nativa | Lista por status; submenu grande de ações no clique-direito. |
| Painel (Board) | WebviewPanel (com script + nonce) | Kanban com drag, busca, filtros, feed, colapso e ordem de colunas. **É a única superfície interativa.** |
| Dashboard | WebviewPanel (sem script) | Resumo por mudança + bloco de ações em botões. |
| Editor de spec | Custom editor | Markdown + render SDD. |
| Histórico / Métricas / Validação | Webviews de leitura | Relatórios. |

**Limitações para o objetivo pedido:**
- **Não há wizard.** O fluxo `new → spec → clarify → design → tasks → approve → implement → verify → archive` é dirigido por comandos soltos, um menu de contexto lotado (16+ itens) e uma sequência de `showInputBox`/`showQuickPick` nativos no `newFeature`. O usuário precisa saber a ordem de cor.
- **Sem camada de identidade visual.** Tudo herda o tema cru do VS Code; funcional, mas sem hierarquia, sem "onde estou no fluxo", sem acento de marca.
- **Descoberta ruim.** As 28 ações estão espalhadas entre título de view, submenu e botões do dashboard.
- **Stack mínima.** HTML por template-string, sem framework/bundler. Um wizard interativo é terreno novo (só o Board usa script hoje).

## 2. Visão do redesenho — "SDD Cockpit"

Um **cockpit** que torna o método visível: a cada mudança, o usuário vê exatamente em
qual das 8 etapas está, o que falta para avançar, e aciona a IA (Claude Code) no ponto
certo. Três pilares:

1. **Wizard guiado por etapas** — uma tela por etapa do ciclo SDD, com um *stepper*
   sempre visível, portões de qualidade (não avança sem o pré-requisito) e ações de IA
   contextuais que abrem o skill certo (`/sdd-kit:spec`, `:clarify`, `:design`, `:tasks`,
   `:verify`).
2. **Camada de marca sobre o tema** — um acento violeta (marca) + coral (ações "com o
   Claude Code") aplicados por cima das variáveis `--vscode-*`, preservando claro/escuro.
3. **Cockpit lateral + Board** — a sidebar vira um resumo vivo ("mudança ativa", saúde,
   contexto, atividade) e o Board ganha cards mais ricos (anel de progresso, chips de
   ciclo de vida) como visão macro.

### As 8 etapas (espelham o CLAUDE.md)

`1 Solicitar · 2 Especificar · 3 Clarificar · 4 Desenhar · 5 Tarefas · 6 Aprovar ·
7 Implementar · 8 Verificar` → **Arquivar** (terminal).

## 3. Inventário de telas (mockups entregues)

| # | Arquivo | Tela |
| --- | --- | --- |
| 00 | `00-design-system.svg` | Folha de design system (paleta, tipografia, componentes, stepper, ícones) |
| 01 | `01-sidebar-cockpit.svg` | Sidebar "Projeto" redesenhada (cockpit: mudança ativa, saúde, contexto, atividade) |
| 02 | `02-welcome-onboarding.svg` | Boas-vindas / projeto não inicializado |
| 03 | `03-board-kanban.svg` | Board (Kanban) redesenhado com cards ricos |
| 04 | `04-wizard-home.svg` | Hub do wizard — jornada da mudança em 8 cards de etapa |
| 05 | `05-wizard-1-new.svg` | Etapa 1 · Solicitar (tipo + solicitação em linguagem natural) |
| 06 | `06-wizard-2-spec.svg` | Etapa 2 · Especificar (REQ/NFR, cenários Gherkin, critérios) — **shell de referência** |
| 07 | `07-wizard-3-clarify.svg` | Etapa 3 · Clarificar (resolver dúvidas, hipóteses, portão) |
| 08 | `08-wizard-4-design.svg` | Etapa 4 · Desenhar (design técnico + ADRs) |
| 09 | `09-wizard-5-tasks.svg` | Etapa 5 · Tarefas (decomposição + rastreabilidade) |
| 10 | `10-wizard-6-approve.svg` | Etapa 6 · Aprovar (portão de qualidade) |
| 11 | `11-wizard-7-implement.svg` | Etapa 7 · Implementar (tarefa a tarefa + escopo Git) |
| 12 | `12-wizard-8-verify.svg` | Etapa 8 · Verificar (critérios + comandos de validação) |
| 13 | `13-feature-dashboard.svg` | Dashboard da mudança redesenhado |

O contrato visual completo está em `STYLE-CONTRACT.md`.

## 4. Arquitetura do wizard (proposta técnica)

O wizard é interativo (formulários + transições), então precisa de **script + nonce** —
o mesmo padrão já aprovado para o Board (ADR-024). Reaproveita todo o núcleo puro
existente; nada de lógica nova de negócio na borda.

```
WizardPanel.ts        borda: cria o WebviewPanel, injeta estado, roteia postMessage → comandos
wizardHtml.ts         render do shell (topbar + stepper + 2 colunas + rodapé) + views por etapa
wizardModel.ts        PURO: estado da etapa, guardas (can-advance), projeção do status.yaml
stepGuards.ts         PURO: pré-requisitos de cada transição (espelha stateMachine.ts)
```

Princípios preservados:
- **Reaproveita os comandos** `sddClaudeKit.*` já existentes — o wizard é uma *casca de
  orquestração*, não reimplementa clarify/design/tasks/verify.
- **IA nunca dispara sozinha** — as ações de IA copiam o prompt `/sdd-kit:*` para o
  terminal do Claude Code (comportamento atual de `runHybridStep`).
- **CSP + nonce + escape** em todo texto de artefato (NFR-UI-002).
- **Núcleo puro testável** — guardas e projeções sem a API do VS Code, como o resto do kit.

### Decisão em aberto (precisa de ADR): stack do webview

O wizard tem muito mais UI que o Board. Duas opções:
- **A) Vanilla + template-string** (como hoje). Zero dependências novas, mas o wizard fica
  grande e repetitivo em um `.ts`.
- **B) Introduzir um bundler leve (esbuild) + micro-framework (Preact/Lit)** só para o
  webview. Melhora a manutenção das 8 views, ao custo de build novo e um ADR.

> Recomendação: **B** para o wizard (esbuild + Preact, ~3KB), mantendo os webviews de
> leitura em vanilla. Proposto como **ADR-043** no mockup de design. Decisão do usuário.

## 5. Fases de implementação (via método SDD)

Como o próprio projeto exige spec-antes-de-código, o redesenho deve entrar pelo fluxo:

1. **`/sdd-kit:new`** — criar a feature `00xx-wizard-cockpit` (feature).
2. **Fase 1 — Fundação visual:** design system aplicado (tokens → variáveis), sidebar
   cockpit e Board redesenhado. (Baixo risco, sem script novo além do Board.)
3. **Fase 2 — Shell do wizard:** `WizardPanel` + stepper + navegação + guardas + persistência
   das transições. Telas 04, 05, 06.
4. **Fase 3 — Etapas de conteúdo:** Clarificar, Desenhar, Tarefas (07, 08, 09) ligando aos
   comandos e skills existentes.
5. **Fase 4 — Portão e execução:** Aprovar, Implementar, Verificar (10, 11, 12) + escopo Git
   e evidências.
6. **Fase 5 — Dashboard e onboarding:** telas 02 e 13; polimento e acessibilidade.

Cada fase: testes do núcleo puro, lint/build, atualização de `traceability.yaml`.

## 6. Decisões que preciso de você antes de implementar

1. **Stack do webview** — Vanilla (A) ou esbuild+Preact (B, recomendado)?
2. **Escopo do "profissional agora"** — só o wizard, ou já entra o redesenho do Board e da
   sidebar na primeira feature?
3. **Tema dos mockups** — os SVG são dark-first. Quer que eu gere também as variações em
   tema claro antes de implementar?
4. **Formato** — os mockups estão em SVG (vetoriais, editáveis, renderizam como imagem).
   Precisa também de PNG exportado?

Depois da sua análise dos mockups e destas respostas, eu registro a feature com
`/sdd-kit:new` e sigo o fluxo SDD.
