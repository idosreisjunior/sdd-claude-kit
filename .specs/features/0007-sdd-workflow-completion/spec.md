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

### Cenários da máquina de estados

Estes cinco atravessam mais de um requisito e por isso ficam agrupados. Cada um indica o requisito a que responde.

#### SCN-SWC-018 — Bloqueio registrado não muda o estado *(REQ-SWC-007)*

DADO uma mudança em `DRAFT` com três questões críticas em `blocked_by`
QUANDO qualquer skill for executada sobre ela
ENTÃO o estado deve permanecer `DRAFT`
E não deve haver transição para `BLOCKED`.

#### SCN-SWC-019 — Interrupção durante a implementação *(REQ-SWC-004)*

DADO uma mudança em `IN_PROGRESS`
QUANDO `implement` encontrar uma decisão arquitetural não prevista
ENTÃO o estado deve passar para `BLOCKED`
E o motivo deve nomear a decisão pendente.

#### SCN-SWC-020 — Aprovação vencida por alteração da spec *(REQ-SWC-003)*

DADO uma mudança em `APPROVED` cuja `spec.md` foi editada depois da aprovação
QUANDO `implement` for executada
ENTÃO o hash recalculado deve divergir de `approval.revision`
E a skill deve recusar avançar, reportando a aprovação como vencida
E **não** deve alterar o estado por conta própria.

#### SCN-SWC-021 — Cancelamento a partir de qualquer estado *(REQ-SWC-007)*

DADO uma mudança em qualquer estado exceto `ARCHIVED` ou `CANCELLED`
QUANDO for cancelada
ENTÃO o estado deve passar para `CANCELLED`
E o motivo deve ser registrado no histórico.

#### SCN-SWC-022 — `require_approval: false` dispensa a aprovação *(REQ-SWC-004)*

DADO um projeto com `workflow.require_approval: false`
E uma mudança em `PLANNED`
QUANDO `implement` for executada
ENTÃO ela deve prosseguir sem exigir o estado `APPROVED`
E a transição `PLANNED → IN_PROGRESS` deve permanecer válida no grafo, independentemente da configuração.

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

## Questões resolvidas

Resolvidas no refinamento de 2026-07-29. As três eram **críticas** e travavam a saída de `DRAFT`.

### Q1 — A máquina de estados é dado, não prosa ✅

[`ADR-010`](../../project/decisions/ADR-010-maquina-de-estados-como-dado.md). Fonte única em `plugins/sdd-kit/schemas/workflow.json`; skills, testes e o validador da Fase 4 derivam dela.

O que forçou a decisão: o grafo **já existe em três lugares** — `architecture.md` §3, `tasks/SKILL.md` e a constante `TRANSICOES` em `tests/specs-invariants.test.ts` — escritos à mão, sem nenhum derivar dos outros. O teste que deveria ser a rede de proteção valida contra a própria cópia.

`REQ-SWC-007` passa a ser testável.

> **Limite:** um arquivo de dados não faz uma skill obedecer. Torna a desobediência **detectável** — um `status.yaml` fora do grafo falha na validação. Aplicação mecânica chega com os hooks da Fase 4.

### Q2 — `by` é identidade humana; `revision` é hash do conteúdo ✅

[`ADR-011`](../../project/decisions/ADR-011-identidade-e-invalidacao-da-aprovacao.md).

`by` vem de `git config user.name <email>`, **mas só é gravado depois de um ato humano explícito na conversa**. A origem do valor não é a origem da aprovação: o git fornece o rótulo, a pessoa fornece o ato. Se o agente pudesse preencher esse campo sozinho, o Artigo 3 viraria encenação com rastro documental.

`revision` é o SHA-256 de `spec.md`, truncado em 12 caracteres. Qualquer edição posterior muda o hash, e a aprovação fica **vencida** — o RF-008 deixa de depender de alguém julgar se a alteração foi "importante".

> **Limite:** `git config` é autodeclarado, não autenticado. É trilha de auditoria, não prova de identidade. Suficiente para o que o Artigo 3 protege; insuficiente para não repúdio.

### Q5 — Execução vazia não é aprovação ✅

[`ADR-012`](../../project/decisions/ADR-012-execucao-vazia-nao-e-aprovacao.md). `verify` exige **evidência de execução**, não código de saída.

Três estados distintos no relatório: *não configurada* (não bloqueia, por Art. 10), *executada sem efeito* (**bloqueia quando `require_tests: true`**) e *aprovada*.

Este projeto caiu nesse buraco: `vitest run --passWithNoTests` sai com exit 0 sem executar nada, e foi preciso comentário em `config.yaml`, nota no `CONTRIBUTING.md` e critério em `TASK-PF-012` para impedir que aquele zero fosse lido como aprovação.

> **Limite:** contar testes executados não diz que eles verificam algo. Fecha "nada executou" disfarçado de aprovação; não fecha "executou e não testou".


### Q3, Q4 e Q11 — semântica do grafo ✅

[`ADR-013`](../../project/decisions/ADR-013-semantica-da-maquina-de-estados.md). As três eram a mesma decisão vista de ângulos diferentes.

**O campo `blocked_by` e o estado `BLOCKED` são coisas diferentes.** O campo registra questões que impedem avançar, em qualquer estado — é o normal em `DRAFT`. O estado significa que o trabalho **parou**, e só faz sentido durante a implementação.

O que revelou isso foram os artefatos deste repositório: `0001` passou por `DESIGNED` com bloqueios registrados, `0003` está em `DRAFT` bloqueado agora, e nenhuma transicionou para `BLOCKED`. Nenhuma estava errada — o grafo estava certo e faltava a distinção documentada.

**Regresso detecta, não muta.** Spec alterada depois de `APPROVED` tem hash divergente, a aprovação fica vencida, e `implement` recusa avançar. O framework **não** regride o estado sozinho: fazer isso seria reescrever o histórico da mudança sem que ninguém decidisse.

**Estrutura e política são separadas.** `PLANNED → IN_PROGRESS` existe sempre no grafo; `require_approval` decide se `implement` aceita. Um grafo que se reescreve conforme a configuração deixa de ser verificável — e verificar é a razão de ele existir.

### Q6 — `implement` aceita o identificador, propõe quando ausente ✅

Ambos, e o PRD já previa os dois: §9.7 diz "selecionar a próxima tarefa pendente", §11 mostra `/sdd-kit:implement 0001-user-authentication TASK-AUTH-002`.

Com identificador, é aquela tarefa. Sem identificador, `implement` propõe **a próxima tarefa pendente cujas dependências estejam todas concluídas** — e pede confirmação no modo `guided`.

A qualificação importa: "próxima pendente" sem checar dependências escolheria uma tarefa que não pode começar. Havendo mais de uma elegível, a skill lista e pergunta em vez de escolher por ordem de identificador, que não significa prioridade.

### Q7 — as skills escrevem; o schema garante a forma ✅

Na Fase 2 as skills escrevem `traceability.yaml` diretamente. Não existe script para chamar: o [`ADR-007`](../../project/decisions/ADR-007-scripts-do-plugin-em-javascript.md) os coloca na Fase 4.

O risco de cada skill escrever à sua maneira é real — é o mesmo do grafo triplicado que motivou o `ADR-010`. A contenção é `traceability.schema.json`, que o PRD §14 lista e que **ainda não existe**: `TASK-PF-004` entregou apenas `config` e `status`. Criá-lo é tarefa desta mudança.

Na Fase 4 o script assume a escrita e as skills passam a chamá-lo.

### Q12 — ordem de escrita que torna a falha detectável ✅

Não há atomicidade real sem transação, e o framework escreve em arquivos soltos. A decisão é **escolher a ordem em que uma falha parcial é detectável e reparável**:

```
1. artefatos da mudança   (spec.md, tasks.md, traceability.yaml)
2. status.yaml            (estado e histórico)
3. index.yaml             (por último, sempre)
```

Falhando no meio, `index.yaml` fica **atrasado** em relação ao disco — nunca apontando para algo que não existe. É a direção segura: uma mudança invisível no índice é recuperável; uma entrada no índice apontando para diretório inexistente quebra toda skill que o percorra.

E a divergência é **detectável hoje**: `TEST-PF-013` compara o índice com o disco e falha quando divergem. A reconciliação automática é o `sdd doctor` previsto no PRD §22.

### Q13 — relatório legível por máquina, e "não confirmado" bloqueia ✅

Extensão do [`ADR-012`](../../project/decisions/ADR-012-execucao-vazia-nao-e-aprovacao.md).

`verify` pede ao runner um relatório estruturado quando ele suporta — `vitest --reporter=json`, `jest --json`, `pytest --json-report`, `go test -json` — e conta os testes executados a partir dele.

Quando não consegue determinar a contagem, **não presume**. Reporta "não foi possível confirmar execução", que sob `require_tests: true` **bloqueia**, exatamente como zero testes.

É a mesma regra do `ADR-012` aplicada à incerteza: não confirmado não é aprovado.

### Q9 — cenários destravados ✅

Dependiam de Q2, Q3 e Q4, agora decididas. Os cenários correspondentes foram escritos em “Cenários da máquina de estados”, `SCN-SWC-018` a `SCN-SWC-022`.

---

## Questões pendentes

| # | Questão | Bloqueia | Prioridade |
| --- | --- | --- | --- |
| Q8 | `archive` move o diretório fisicamente para `.specs/archive/`, o que quebra qualquer caminho relativo que aponte para ele. Links de entrada e saída são reescritos, ou aceita-se a quebra? | REQ-SWC-006 | média |
| Q10 | Existem NFRs **específicos** desta mudança, além dos três herdados dos padrões do projeto? Por exemplo, limite de contexto carregado por skill ou comportamento em projeto sem git. A solicitação não declarou nenhum. | — | média |
| Q14 | **Nova, de `ADR-010`.** Como manter `architecture.md` §3 em sincronia com `workflow.json` sem duplicar a manutenção? Um teste comparando os dois resolve, mas parsear tabela Markdown é frágil. | REQ-SWC-007 | média |

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
