# Feature: Wizard Cockpit — GUI guiada de specs

- **ID:** 0035-wizard-cockpit
- **Escopo dos identificadores:** WIZ
- **Estado:** ver `status.yaml` — a autoridade é ele

> Spec clarificada. Requisitos fundamentados no texto da solicitação
> (`request.md`) e nos componentes já existentes que o wizard **reaproveita** — nunca
> em invenção. As questões levantadas foram resolvidas pelo usuário via
> `/sdd-kit:clarify`. O **como** (arquitetura, stack) fica no `design.md`.

---

## Objetivo

Oferecer um assistente visual ("cockpit") que **cria e conduz** uma mudança do primeiro
requisito à implementação e verificação, tornando o método SDD visível e guiado, sem
reimplementar os comandos e skills que já existem.

## Contexto

Hoje a extensão não tem wizard: o fluxo `new → spec → clarify → design → tasks →
approve → implement → verify → archive` é dirigido por comandos soltos, um menu de
contexto com 16+ itens e uma sequência de QuickPicks nativos no `newFeature`. Só o
Board é interativo. Tudo herda o tema cru do VS Code — funcional, mas sem hierarquia
nem noção de "onde estou no fluxo". O usuário precisa conhecer a ordem das etapas de
cor. Os mockups e o plano de implementação já foram produzidos e aprovados
(`docs/ui-redesign/`); esta feature os formaliza como mudança rastreável.

## Escopo

### Incluído

- Wizard com as 8 etapas do ciclo SDD e um *stepper* sempre visível (telas 04–12).
- **Criar** uma mudança pela etapa Solicitar e **gerenciar/retomar** mudanças existentes,
  incluindo **arquivar** (estado terminal do fluxo).
- Portões de qualidade por etapa (não avança sem o pré-requisito).
- Ações de IA que abrem o Claude Code com o skill correspondente, sem enviar.
- Persistência das transições em `status.yaml` via `stateMachine` + `statusWriter`.
- Camada de design system (tokens `--sdd-*` sobre `--vscode-*`), com suporte a tema claro
  e escuro desde o início (Q2).

### Não incluído

- Redesenho do Board, da sidebar, do dashboard e da tela de boas-vindas — entregues em
  **iteração seguinte** ao wizard (Q3). Esta feature foca o wizard completo.
- Reimplementação de clarify/design/tasks/verify — o wizard **orquestra** os
  comandos/skills existentes (evita divergência de regras e duplicação).
- Alteração do formato de `.specs/` ou do `status.yaml` (fonte da verdade preservada).
- Aposentadoria do `newFeature` por QuickPick — mantido em paralelo como fallback até
  a etapa Solicitar do wizard estar verificada (Q4).
- Excluir e renomear mudanças pelo wizard — fora do escopo (Q6): identificadores são
  permanentes e renomear quebraria a rastreabilidade.

---

## Requisitos funcionais

### REQ-WIZ-001 — Stepper das 8 etapas com estado atual

O wizard exibe as 8 etapas do ciclo SDD com a etapa atual destacada e as concluídas,
atuais e bloqueadas visualmente distintas, derivadas dos artefatos da mudança.

#### SCN-WIZ-001 — Abrir o wizard de uma mudança em design

DADO uma mudança em status DESIGNED
QUANDO o usuário abre o wizard dela
ENTÃO o stepper mostra Solicitar/Especificar/Clarificar/Desenhar como concluídas ou atual
E as etapas Tarefas–Verificar aparecem como futuras/bloqueadas

#### SCN-WIZ-007 — Artefato ausente ou ilegível não quebra o stepper

DADO uma mudança cujo `tasks.md` está ausente ou ilegível
QUANDO o usuário abre o wizard dela
ENTÃO a etapa correspondente é apresentada como pendente/incompleta
E o wizard carrega sem erro, refletindo apenas o que existe em disco

### REQ-WIZ-002 — Portões de qualidade por etapa

Cada avanço de etapa só é liberado quando o pré-requisito da etapa anterior está
satisfeito; caso contrário o botão de avanço fica desabilitado com o motivo visível.

#### SCN-WIZ-002 — Avançar sem requisitos é bloqueado

DADO uma mudança na etapa Especificar sem nenhum `REQ-*`
QUANDO o usuário tenta avançar para Clarificar
ENTÃO o botão de avanço fica desabilitado
E uma mensagem explica que é preciso ao menos um requisito

#### SCN-WIZ-003 — Dúvida crítica em aberto bloqueia o design

DADO uma mudança na etapa Clarificar com uma dúvida de severidade crítica em aberto
QUANDO o usuário tenta avançar para Desenhar
ENTÃO o avanço é bloqueado com a lista das dúvidas críticas pendentes

### REQ-WIZ-003 — Ações de IA abrem o Claude Code sem enviar

As ações de IA de cada etapa abrem o terminal do Claude Code com o prompt
`/sdd-kit:<ação> <id>` correspondente, sem submetê-lo automaticamente. Reaproveita o
adapter do Claude Code (feature 0004) e o `runHybridStep` já existentes.

#### SCN-WIZ-004 — Especificar com IA

DADO uma mudança aberta na etapa Especificar
QUANDO o usuário aciona "Especificar com IA"
ENTÃO o terminal do Claude Code abre com o prompt `/sdd-kit:spec 0035-wizard-cockpit`
E o prompt não é enviado até uma ação humana

#### SCN-WIZ-012 — Claude Code não detectado no PATH

DADO que o executável do Claude Code não é detectado no PATH
QUANDO o usuário aciona uma ação de IA
ENTÃO o wizard copia o prompt para a área de transferência
E apresenta como instalar ou configurar o caminho do Claude Code (reusa o adapter 0004)

### REQ-WIZ-004 — Transições persistem em status.yaml

Toda transição de etapa é gravada em `status.yaml` através de `stateMachine` +
`statusWriter`, acrescentando ao histórico com motivo; o webview reprojeta o estado
a partir do disco (não mantém uma verdade paralela).

#### SCN-WIZ-005 — Avançar registra a transição

DADO uma mudança na etapa Desenhar apta a avançar
QUANDO o usuário confirma o avanço para Tarefas
ENTÃO `status.yaml` recebe uma entrada de histórico com a nova etapa e um motivo
E o stepper reflete a etapa Tarefas como atual

#### SCN-WIZ-008 — Edição externa do status.yaml é refletida

DADO o wizard aberto em uma mudança
QUANDO o `status.yaml` dela é alterado por fora (ex.: outro comando ou edição manual)
ENTÃO o wizard reprojeta o estado a partir do disco
E o stepper passa a refletir o novo status sem exigir reabertura

### REQ-WIZ-005 — Criar a mudança pela etapa Solicitar

A etapa Solicitar cria a mudança (tipo, título, escopo e solicitação em linguagem
natural) reutilizando `featureCreator`, e abre o wizard já na etapa Especificar.

#### SCN-WIZ-006 — Criar uma feature pelo wizard

DADO o formulário da etapa Solicitar preenchido com tipo feature e um título
QUANDO o usuário confirma a criação
ENTÃO são criados `request.md`, `spec.md` (DRAFT) e `status.yaml`, e a mudança
entra no índice
E o wizard avança para a etapa Especificar

#### SCN-WIZ-009 — Identificador em conflito não é sobrescrito

DADO que o diretório `<NNNN>-<slug>` proposto já existe em disco
QUANDO o usuário confirma a criação
ENTÃO o wizard reporta o conflito e não sobrescreve nada
E orienta a reconciliar o índice (mesma regra do `/sdd-kit:new`)

### REQ-WIZ-006 — Gerenciar e retomar mudanças existentes

O hub do wizard lista as mudanças existentes e permite retomar cada uma na sua etapa
atual, projetada a partir do `status.yaml`, e arquivar uma mudança concluída (Q6). A
solicitação pede "gerenciar e criar". Excluir e renomear estão fora do escopo.

#### SCN-WIZ-010 — Retomar de onde parou

DADO uma mudança em andamento (ex.: etapa Desenhar)
QUANDO o usuário abre o hub do wizard e escolhe retomá-la
ENTÃO o wizard abre diretamente na etapa atual dela
E oferece a ação "continuar" apontando para o próximo passo

#### SCN-WIZ-011 — Projeto sem nenhuma mudança

DADO um projeto inicializado sem nenhuma mudança registrada
QUANDO o usuário abre o hub do wizard
ENTÃO é apresentado o estado de boas-vindas com a ação de criar a primeira mudança

---

## Requisitos não funcionais

### NFR-WIZ-001 — Segurança do webview

O webview do wizard aplica CSP com nonce, não acessa a rede e insere todo texto de
artefato de forma escapada (via `textContent`/escape), como o Board (ADR-024).

### NFR-WIZ-002 — Aderência ao tema

As cores da interface derivam de variáveis `--vscode-*`; a camada de marca
(violeta/coral) é aplicada como acento sem quebrar a leitura em tema claro ou escuro.

### NFR-WIZ-003 — Núcleo puro testável

O estado do wizard e as guardas de etapa vivem em módulos sem a API do VS Code
(`wizardModel`, `wizardStepGuards`), cobertos por testes `node --test`.

### NFR-WIZ-004 — Acessibilidade

Os controles interativos (stepper, botões de etapa, formulários) expõem rótulos
acessíveis e estado (`aria-*`) e são operáveis por teclado, mantendo a convenção já
adotada no Board.

---

## Critérios de aceite

- [ ] O stepper reflete corretamente concluída/atual/bloqueada para cada etapa (REQ-WIZ-001).
- [ ] Abrir uma mudança com artefato ausente não quebra o wizard (SCN-WIZ-007).
- [ ] Nenhum avanço ocorre com o pré-requisito da etapa violado (REQ-WIZ-002).
- [ ] Ações de IA abrem o prompt correto no terminal e nunca enviam sozinhas (REQ-WIZ-003).
- [ ] Sem o Claude Code no PATH, a ação de IA copia o prompt e instrui a instalação (SCN-WIZ-012).
- [ ] Toda transição aparece no histórico de `status.yaml` com motivo (REQ-WIZ-004).
- [ ] Uma edição externa do `status.yaml` é refletida no wizard aberto (SCN-WIZ-008).
- [ ] Criar pela etapa Solicitar produz os mesmos artefatos que o `/sdd-kit:new` (REQ-WIZ-005).
- [ ] Um identificador em conflito é reportado e nunca sobrescrito (SCN-WIZ-009).
- [ ] O hub lista, retoma e arquiva mudanças (REQ-WIZ-006).
- [ ] O webview passa em CSP/nonce e escapa o texto de artefato (NFR-WIZ-001).
- [ ] A interface é legível em tema claro e escuro (NFR-WIZ-002).
- [ ] `wizardModel` e `wizardStepGuards` têm testes de unidade (NFR-WIZ-003).
- [ ] Stepper e formulários são operáveis por teclado com rótulos acessíveis (NFR-WIZ-004).

---

## Questões pendentes

Nenhuma em aberto. Todas as questões levantadas foram resolvidas — ver abaixo.

## Questões resolvidas

| # | Questão | Resolução | Data |
| --- | --- | --- | --- |
| Q1 | Stack do webview do wizard | esbuild + Preact (só o wizard; painéis de leitura em vanilla) — a ratificar em ADR | 2026-08-05 |
| Q2 | Quando tratar o tema claro | Desde já: as cores derivam de `--vscode-*`; validar contraste no polimento | 2026-08-05 |
| Q3 | Escopo da 1ª entrega | O wizard completo primeiro; Board e sidebar redesenhados em iteração seguinte | 2026-08-05 |
| Q4 | Aposentar o `newFeature` por QuickPick? | Mantido em paralelo como fallback até a etapa Solicitar ser verificada | 2026-08-05 |
| Q5 | Claude Code não detectado no PATH | Copiar o prompt e instruir instalação/configuração (reusa o adapter da feature 0004) | 2026-08-05 |
| Q6 | O que "gerenciar" inclui | Criar, retomar, avançar etapas e arquivar; excluir/renomear ficam fora | 2026-08-05 |

## Hipóteses assumidas

> HIPÓTESE: o wizard reaproveita integralmente os comandos `sddClaudeKit.*` e o
> `runHybridStep` já existentes, sem novos comandos de negócio.

> HIPÓTESE: introduzir `esbuild` + Preact apenas para o webview do wizard não
> impacta o empacotamento dos demais painéis (que seguem em vanilla).

> HIPÓTESE: o wizard reidrata o estado observando alterações em `.specs/**` (o meio
> técnico é decisão do design), mantendo `status.yaml` como fonte da verdade.
