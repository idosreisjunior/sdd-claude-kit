# Feature: Completar o fluxo SDD — clarify, design, approve, implement, verify e archive

- **ID:** 0007-sdd-workflow-completion
- **Escopo dos identificadores:** SWC
- **Status:** DRAFT

> Cada requisito abaixo traz a linha **Origem**, apontando o trecho da
> solicitação de onde veio. Requisito sem trecho de origem é inferência, e nesta
> spec ele vira questão pendente ou hipótese marcada — nunca requisito
> silencioso.

---

## Objetivo

Fechar o fluxo SDD de ponta a ponta, para que uma mudança consiga sair de
`DRAFT` e chegar a `ARCHIVED` sem passos manuais, com cada transição de estado
validada e com a rastreabilidade mantida verdadeira até o fim.

## Contexto

O fluxo declarado em `CLAUDE.md` é `new → spec → clarify → design → tasks →
approve → implement → verify → archive`. Hoje o plugin entrega quatro skills:
`init`, `new`, `spec` e `tasks`. Uma mudança avança até `PLANNED` e para: não
existe caminho implementado para `CLARIFIED`, `DESIGNED`, `APPROVED`,
`IN_PROGRESS`, `VERIFIED` ou `ARCHIVED`.

Duas consequências disso são visíveis no próprio repositório. A primeira é que
`0001-plugin-foundation` está em `DESIGNED` sem que exista uma skill capaz de
tê-lo colocado ali. A segunda é que os dez estados já estão fixados no
`status.schema.json` e as transições válidas estão declaradas em
`.specs/project/architecture.md`, mas nada as verifica: qualquer estado pode ser
escrito em qualquer ordem, e o schema aceitaria.

A rastreabilidade tem o mesmo problema pela outra ponta. `traceability.yaml`
nasce em `/sdd-kit:tasks` ligando requisito → cenário → tarefa. As colunas
`arquivo` e `teste` só podem ser preenchidas durante a implementação — que é
exatamente a etapa que ainda não existe.

## Escopo

### Incluído

- As seis skills nomeadas na solicitação: `clarify`, `design`, `approve`,
  `implement`, `verify` e `archive`.
- A máquina de estados: o conjunto de transições válidas e sua verificação a
  cada promoção de estado.
- A manutenção da matriz de rastreabilidade ao longo dessas seis etapas.

### Não incluído

- **A CLI (`packages/cli/`)** — alocada à Fase 5 e não citada na solicitação.
- **A tradução para `en`** — entrega da Fase 6 (`CLAUDE.md`).
- **Skills não nomeadas na solicitação** — o pedido enumerou seis. Se a máquina
  de estados exigir código determinístico, ele entra como script interno, não
  como skill nova.
- **A correção dos bugs `0002`–`0006`** — abertos contra os mesmos artefatos que
  estas skills manipulam, mas cada um tem sua própria mudança.
- **Redefinir ou renomear os dez estados** — proibido por `standards.md` §2 e
  fixado no schema.

---

## Requisitos funcionais

### REQ-SWC-001 — Skill `clarify`

Deve existir uma skill `/sdd-kit:clarify` que resolve as questões pendentes
registradas em `spec.md` e promove a mudança de `DRAFT` para `CLARIFIED`,
registrando cada questão fechada em `resolved_questions`.

**Origem:** "as skills clarify, …" — nomeada na solicitação.

#### SCN-SWC-001 — Questões críticas resolvidas promovem a mudança

DADO uma mudança em `DRAFT` com questões pendentes registradas em `spec.md`
QUANDO `/sdd-kit:clarify` é executada e as questões críticas são respondidas
ENTÃO o status passa a `CLARIFIED`
E cada questão respondida aparece em `resolved_questions` com data e resumo

#### SCN-SWC-009 — Questão crítica sem resposta impede a promoção

DADO uma mudança em `DRAFT` com uma questão de prioridade crítica em `blocked_by`
QUANDO `/sdd-kit:clarify` é executada e essa questão continua sem resposta
ENTÃO o status permanece `DRAFT`
E a questão continua listada em `blocked_by`, com o identificador e a severidade reportados

### REQ-SWC-002 — Skill `design`

Deve existir uma skill `/sdd-kit:design` que produz o `design.md` da mudança —
a solução técnica, o **como** — e promove a mudança para `DESIGNED`.

**Origem:** "as skills … design …" — nomeada na solicitação.

#### SCN-SWC-002 — Design produzido promove a mudança

DADO uma mudança em `CLARIFIED`
QUANDO `/sdd-kit:design` é executada
ENTÃO `design.md` é criado no diretório da mudança
E o status passa a `DESIGNED`

#### SCN-SWC-010 — Design a partir de estado inválido é recusado

DADO uma mudança em `DRAFT`, com questões críticas ainda em aberto
QUANDO `/sdd-kit:design` é executada
ENTÃO a execução é recusada, informando o estado atual e o estado exigido
E `design.md` não é criado

### REQ-SWC-003 — Skill `approve`

Deve existir uma skill `/sdd-kit:approve` que registra a aprovação humana em
`status.yaml` no campo `approval` — com `date`, `by` e `revision` — e promove a
mudança para `APPROVED`.

**Origem:** "as skills … approve …" — nomeada na solicitação. O formato do campo
`approval` vem de `status.schema.json`, não de inferência.

#### SCN-SWC-003 — Aprovação registrada libera a implementação

DADO uma mudança em `PLANNED` com `approval: null`
QUANDO `/sdd-kit:approve` é executada e a aprovação humana é dada
ENTÃO `approval` passa a conter `date`, `by` e `revision`
E o status passa a `APPROVED`

#### SCN-SWC-011 — Aprovação negada mantém a mudança não aprovada

DADO uma mudança em `PLANNED` com `approval: null`
QUANDO `/sdd-kit:approve` é executada e a aprovação humana é negada
ENTÃO `approval` permanece `null`
E o status permanece `PLANNED`

### REQ-SWC-004 — Skill `implement`

Deve existir uma skill `/sdd-kit:implement` que executa as tarefas de `tasks.md`
respeitando a ordem de dependências, atualiza o status de cada tarefa e os
contadores em `status.yaml`, e mantém a mudança em `IN_PROGRESS`.

**Origem:** "as skills … implement …" — nomeada na solicitação. A ordem por
dependência vem de `tasks.md`, que `/sdd-kit:tasks` já produz ordenado.

#### SCN-SWC-004 — Tarefa concluída atualiza tarefa e contadores

DADO uma mudança em `APPROVED` com tarefas pendentes em `tasks.md`
QUANDO `/sdd-kit:implement` conclui uma tarefa
ENTÃO a tarefa aparece como concluída em `tasks.md`
E os contadores `tasks` em `status.yaml` refletem a mudança
E o status da mudança é `IN_PROGRESS`

#### SCN-SWC-012 — Implementação sem aprovação é recusada

DADO uma mudança em `PLANNED` com `approval: null` e `require_approval: true` em `.specs/config.yaml`
QUANDO `/sdd-kit:implement` é executada
ENTÃO a execução é recusada, informando que a aprovação é exigida pela configuração
E nenhum arquivo de código é alterado

#### SCN-SWC-013 — Tarefa com dependência pendente não é iniciada

DADO uma mudança em `IN_PROGRESS` e uma tarefa cuja dependência ainda não está concluída
QUANDO `/sdd-kit:implement` seleciona o que fazer em seguida
ENTÃO essa tarefa não é iniciada
E a dependência não concluída é reportada por identificador

### REQ-SWC-005 — Skill `verify`

Deve existir uma skill `/sdd-kit:verify` que executa os comandos de
`validation.commands`, confere os critérios de aceite de `spec.md` e promove a
mudança para `VERIFIED` somente quando todos passarem.

**Origem:** "as skills … verify …" — nomeada na solicitação. Os comandos vêm de
`validation.commands` em `.specs/config.yaml`.

#### SCN-SWC-005 — Validação com falha impede a promoção

DADO uma mudança em `IN_PROGRESS` com todas as tarefas concluídas
QUANDO `/sdd-kit:verify` é executada e um comando de validação falha
ENTÃO o status **não** passa a `VERIFIED`
E a falha é reportada com o comando e a saída obtidos

#### SCN-SWC-014 — Validação completa promove a mudança

DADO uma mudança em `IN_PROGRESS` com todas as tarefas concluídas
QUANDO `/sdd-kit:verify` é executada e lint, teste e build saem com êxito e todos os critérios de aceite estão satisfeitos
ENTÃO o status passa a `VERIFIED`
E o relatório registra o comando executado e o resultado de cada um

### REQ-SWC-006 — Skill `archive`

Deve existir uma skill `/sdd-kit:archive` que move a mudança para
`.specs/archive/`, atualiza `index.yaml` e promove o status para `ARCHIVED`.

**Origem:** "as skills … e archive" — nomeada na solicitação. O destino
`.specs/archive/` vem de `index.yaml`, que já reserva a chave `archive`.

#### SCN-SWC-006 — Mudança verificada é arquivada

DADO uma mudança em `VERIFIED`
QUANDO `/sdd-kit:archive` é executada
ENTÃO o diretório da mudança passa a viver sob `.specs/archive/`
E a entrada correspondente em `index.yaml` reflete o novo caminho e o status `ARCHIVED`

#### SCN-SWC-015 — Destino já ocupado não é sobrescrito

DADO uma mudança em `VERIFIED` cujo diretório de destino já existe em `.specs/archive/`
QUANDO `/sdd-kit:archive` é executada
ENTÃO o arquivamento é recusado e o conflito é reportado com o caminho
E nem o diretório de origem nem o de destino são alterados

### REQ-SWC-007 — Máquina de estados

Toda promoção de estado deve ser verificada contra o conjunto de transições
válidas antes de ser escrita. Uma transição inválida é recusada, e o
`status.yaml` permanece intacto.

**Origem:** "com máquina de estados" — citada na solicitação. Os dez estados
válidos vêm de `status.schema.json`.

#### SCN-SWC-007 — Transição inválida é recusada

DADO uma mudança em `DRAFT`
QUANDO uma skill tenta promovê-la diretamente para `APPROVED`
ENTÃO a transição é recusada com a origem, o destino e as transições válidas a partir de `DRAFT`
E nem `status` nem `history` são alterados

#### SCN-SWC-016 — Transição válida é registrada no histórico

DADO uma mudança em `CLARIFIED` e uma transição para `DESIGNED` pertencente ao grafo válido
QUANDO a promoção é executada
ENTÃO `status` passa a `DESIGNED` e `updated` recebe a data de hoje entre aspas
E uma entrada é **acrescentada** a `history` com `status`, `date` e `reason` não vazio, sem reescrever as entradas anteriores

### REQ-SWC-008 — Rastreabilidade mantida ao longo do fluxo

As skills que produzem artefatos devem manter `traceability.yaml` verdadeiro:
`implement` acrescenta os arquivos e testes de cada tarefa concluída, e `verify`
recusa a promoção quando existirem itens órfãos, respeitando
`workflow.require_traceability`.

**Origem:** "e rastreabilidade" — citada na solicitação. A cadeia requisito →
cenário → tarefa → arquivo → teste é a definição do glossário.

#### SCN-SWC-008 — Requisito sem cobertura impede a verificação

DADO uma mudança em `IN_PROGRESS` e `require_traceability: true`
QUANDO `/sdd-kit:verify` encontra um requisito sem tarefa ou uma tarefa sem teste
ENTÃO a promoção para `VERIFIED` é recusada
E os itens órfãos são listados por identificador

#### SCN-SWC-017 — Tarefa concluída preenche arquivo e teste na matriz

DADO uma tarefa em execução por `/sdd-kit:implement` que criou arquivos de código e de teste
QUANDO a tarefa é concluída
ENTÃO a linha correspondente em `traceability.yaml` passa a apontar os arquivos e os testes produzidos
E a cadeia requisito → cenário → tarefa → arquivo → teste fica completa para essa tarefa

---

## Requisitos não funcionais

Os NFRs abaixo **não vieram da solicitação** — ela não declarou nenhum. Vieram
dos padrões já vigentes no projeto, que é a outra origem legítima. NFRs
específicos desta mudança continuam em aberto (Q10).

### NFR-SWC-001 — Idioma e i18n

Todo texto que as seis skills apresentam ao usuário segue `project.language`
(`pt-BR`), e nenhuma string voltada ao usuário é escrita direto no código sem
passar pela camada de i18n.

**Origem:** `standards.md` §1.

### NFR-SWC-002 — Contexto mínimo carregado

Cada skill nova declara, no próprio `SKILL.md`, quais arquivos lê e sob qual
condição — como as quatro skills existentes já fazem — e não lê as specs de
outras mudanças.

**Origem:** `constitution.md` Art. 7 e o formato já adotado pelas skills
existentes.

### NFR-SWC-003 — Código determinístico verificável

Qualquer script determinístico introduzido por esta mudança é JavaScript com
JSDoc, sem etapa de compilação, e passa em `npm run build` (`tsc --noEmit`).

**Origem:** ADR-007 e `validation.commands.build` em `.specs/config.yaml`.

---

## Critérios de aceite

- [ ] As seis skills existem em `plugins/sdd-kit/skills/` e são invocáveis como `/sdd-kit:<nome>` (REQ-SWC-001 a REQ-SWC-006).
- [ ] Uma mudança percorre `DRAFT → CLARIFIED → DESIGNED → PLANNED → APPROVED → IN_PROGRESS → VERIFIED → ARCHIVED` sem edição manual de `status.yaml`.
- [ ] Cada skill recusa execução a partir de um estado de origem inválido, sem alterar arquivo algum (SCN-SWC-010, SCN-SWC-012).
- [ ] Toda promoção acrescenta uma entrada a `history` com `reason` não vazio, sem reescrever as anteriores, e `status` coincide com a última entrada (SCN-SWC-016).
- [ ] Uma transição fora do grafo válido é recusada sem alterar o arquivo (SCN-SWC-007).
- [ ] `status.yaml` continua válido contra `status.schema.json` após cada skill.
- [ ] `approve` grava `date`, `by` e `revision`; aprovação negada deixa `approval` em `null` (SCN-SWC-003, SCN-SWC-011).
- [ ] `implement` respeita a ordem de dependências e nunca inicia tarefa com dependência pendente (SCN-SWC-013).
- [ ] `traceability.yaml` tem arquivos e testes preenchidos ao fim de `implement`, e `verify` recusa itens órfãos (SCN-SWC-017, SCN-SWC-008).
- [ ] `verify` reporta a saída real dos comandos de validação, sem declarar sucesso para comando ausente ou sem testes.
- [ ] `archive` não sobrescreve destino existente (SCN-SWC-015).
- [ ] Os textos das seis skills estão em pt-BR e cada `SKILL.md` declara os arquivos que lê (NFR-SWC-001, NFR-SWC-002).
- [ ] `npm run lint`, `npm test` e `npm run build` saem com êxito ao fim da mudança (NFR-SWC-003).

---

## Questões pendentes

| # | Questão | Bloqueia | Prioridade |
| --- | --- | --- | --- |
| Q1 | O grafo de transições válidas vive em código (script determinístico verificável) ou apenas como instrução em prosa dentro de cada skill? A escolha define se REQ-SWC-007 é testável. | REQ-SWC-007 | crítica |
| Q2 | Em `approve`, o que preenche `by` e `revision`? O schema exige ambos não vazios, mas uma sessão do Claude Code não tem identidade humana confiável, e o PRD não define se `revision` é SHA, tag ou número. | REQ-SWC-003 | crítica |
| Q3 | Como `BLOCKED` e `CANCELLED` entram e saem do grafo? Nenhum dos dois foi citado na solicitação, mas ambos existem no schema e uma máquina de estados que os ignore fica incompleta. | REQ-SWC-007 | alta |
| Q4 | Quais transições de regresso são válidas? Por exemplo, uma spec alterada depois de `APPROVED` deveria invalidar a aprovação e voltar a mudança para um estado anterior? | REQ-SWC-007 | alta |
| Q5 | `verify` roda com `npm test --passWithNoTests`, que sai com exit 0 sem executar teste nenhum. Verify deve tratar "nenhum teste" como falha, dado `require_tests: true`? | REQ-SWC-005 | crítica |
| Q6 | `implement` recebe o identificador de uma tarefa, ou escolhe sozinha a próxima pendente? `CLAUDE.md` fixa "uma tarefa por vez", mas não diz quem escolhe. | REQ-SWC-004 | alta |
| Q7 | Quem escreve `traceability.yaml` durante a implementação — cada skill diretamente, ou um script compartilhado que elas chamam? | REQ-SWC-008 | alta |
| Q8 | `archive` move o diretório fisicamente para `.specs/archive/`, o que quebra qualquer caminho relativo que aponte para ele. Links de entrada e saída são reescritos, ou aceita-se a quebra? | REQ-SWC-006 | média |
| Q9 | Os cenários de caminho de falha foram escritos nesta passagem (SCN-SWC-009 a SCN-SWC-017). Continuam **não escritos** os cenários que dependem de Q2, Q3 e Q4 — regresso de estado, `BLOCKED` e `CANCELLED` — porque exigem decidir o comportamento antes de descrevê-lo. | REQ-SWC-007 | alta |
| Q10 | Existem NFRs **específicos** desta mudança, além dos três herdados dos padrões do projeto? Por exemplo, limite de contexto carregado por skill ou comportamento em projeto sem git. A solicitação não declarou nenhum. | — | média |
| Q11 | Quando `require_approval` é `false`, `approve` vira opcional e `implement` pode partir direto de `PLANNED`, ou o estado `APPROVED` continua obrigatório no grafo? | REQ-SWC-003, REQ-SWC-004 | alta |
| Q12 | Qual é a garantia de atomicidade? SCN-SWC-007 e SCN-SWC-015 exigem que nada seja alterado quando a operação é recusada, mas uma skill que falha no meio da escrita pode deixar `status.yaml` e `index.yaml` divergentes. | REQ-SWC-007 | alta |

## Hipóteses assumidas

> HIPÓTESE: cada skill promove exatamente o estado homônimo — `clarify` →
> `CLARIFIED`, `design` → `DESIGNED`, `approve` → `APPROVED`, `verify` →
> `VERIFIED`, `archive` → `ARCHIVED` — e `implement` mantém a mudança em
> `IN_PROGRESS` sem promovê-la ao concluir. A solicitação nomeou as skills e a
> máquina de estados, mas não escreveu o mapeamento entre elas.

> HIPÓTESE: as transições válidas são as já declaradas em
> `.specs/project/architecture.md` §3. Esta mudança as **implementa e verifica**;
> não as redefine. Se o documento estiver incompleto, completá-lo é parte do
> trabalho, não uma reescrita.

> HIPÓTESE: as seis skills seguem a mesma estrutura das quatro existentes — um
> `SKILL.md` com frontmatter em `plugins/sdd-kit/skills/<nome>/` — sem introduzir
> agentes ou hooks novos, que não foram citados na solicitação.

> HIPÓTESE: o modo `strict` continua não implementado nesta entrega. As skills
> novas operam como `guided`, e dizem isso quando perguntadas, em vez de simular
> um bloqueio que não existe.

> HIPÓTESE: a ordem do fluxo é a declarada em `CLAUDE.md` — `clarify` antes de
> `design`, e `tasks` antes de `approve`. A solicitação listou as seis skills em
> ordem diferente ("clarify, design, approve, implement, verify e archive"), sem
> `tasks` no meio, mas isso parece ser a enumeração do que falta, não uma
> proposta de reordenar o fluxo.
