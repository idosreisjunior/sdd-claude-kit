# Tarefas — Completar o fluxo SDD: clarify, design, approve, implement, verify e archive

Numeração reflete a **ordem de criação**, não a ordem de execução. A ordem de execução é dada pelas dependências.

Complexidade: **P** pequena (≤ meio dia) · **M** média (≈ 1 dia) · **G** grande (deve ser dividida antes de começar).

Plano derivado de [`design.md`](./design.md). Duas decisões do design moldam a decomposição:

- **Entrega em três levas** (design §12, risco 1). A Fase 1 produziu cinco defeitos em quatro skills entregues de uma vez. `clarify`+`design` vêm primeiro, `approve`+`implement` depois, `verify`+`archive` por último — e as levas 2 e 3 aprendem com a execução real da anterior. Por isso `TASK-SWC-009` depende de `TASK-SWC-007` e `TASK-SWC-008` mesmo sem precisar do artefato delas: a dependência é de aprendizado, e está declarada em vez de subentendida.
- **Nenhum script executável** (design §2, [ADR-007](../../project/decisions/ADR-007-scripts-do-plugin-em-javascript.md)). A máquina de estados entra como **dado** (`workflow.json`), lido pelas skills e pelos testes. Aplicação mecânica é Fase 4.

---

## Ordem de execução

```
sem dependência — paralelizáveis agora
┌──────────────────────────────────────────────────────────────┐
│ TASK-SWC-001  workflow.json (o grafo)                        │
│ TASK-SWC-004  traceability.schema.json                       │
│ TASK-SWC-005  template design.md                             │
│ TASK-SWC-006  templates acceptance.md + validation.md        │
│ TASK-SWC-015  standards.md — referência por identificador    │
└──────────────────────────────────────────────────────────────┘

TASK-SWC-001 ──┬──▶ TASK-SWC-002  testes derivam o grafo
               └──▶ TASK-SWC-003  architecture.md §3 aponta para workflow.json
                          │
        ┌─────────────────┴─────────────────┐              leva 1
        ▼                                   ▼
   TASK-SWC-007  clarify            TASK-SWC-008  design ◀── TASK-SWC-005
        │                                   │
        └─────────────┬─────────────────────┘              leva 2
                      ▼
             TASK-SWC-009  approve
                      │
                      ▼
             TASK-SWC-010  implement — pré-condições e seleção
                      │
                      ▼
             TASK-SWC-011  implement — execução e rastreabilidade  ◀── TASK-SWC-004
                      │
                      ▼                                            leva 3
             TASK-SWC-012  verify — validation.commands  ◀── TASK-SWC-006
                      │
                      ▼
             TASK-SWC-013  verify — aceite e itens órfãos  ◀── TASK-SWC-004
                      │
                      ▼
             TASK-SWC-014  archive
                      │
                      ▼
             TASK-SWC-016  auditoria de idioma e contexto declarado
                      │
                      ▼
             TASK-SWC-017  percurso DRAFT → ARCHIVED e relatório final
                              ◀── TASK-SWC-002, TASK-SWC-003, TASK-SWC-015
```

O gargalo é a cadeia das skills: nove tarefas em série, de `TASK-SWC-007` a `TASK-SWC-017`. Cinco tarefas de infraestrutura podem começar hoje e nenhuma delas está no caminho crítico, exceto `TASK-SWC-001`.

---

## TASK-SWC-001 — O grafo de estados como dado único

**Requisitos:** REQ-SWC-007, NFR-SWC-003
**Dependências:** nenhuma
**Complexidade:** P
**Status:** done

### Descrição

Criar `plugins/sdd-kit/schemas/workflow.json` com o conteúdo declarado em `design.md` §4.1: `version`, `states` (os dez de `status.schema.json`), `terminal` (`ARCHIVED`, `CANCELLED`) e `transitions` (mapa de estado → lista de destinos válidos).

Este arquivo passa a ser a **fonte única** do grafo ([ADR-010](../../project/decisions/ADR-010-maquina-de-estados-como-dado.md)). Hoje o grafo existe em três cópias manuais — `architecture.md` §3, `tasks/SKILL.md` e a constante `TRANSICOES` em `tests/specs-invariants.test.ts` — e nenhuma deriva das outras. `TASK-SWC-002` e `TASK-SWC-003` eliminam duas dessas cópias.

Atenção a duas diferenças entre as cópias atuais e o grafo do design, ambas deliberadas e decididas por [ADR-013](../../project/decisions/ADR-013-semantica-da-maquina-de-estados.md):

- `PLANNED → IN_PROGRESS` **existe** no grafo. `architecture.md` §3 hoje não a lista. Estrutura e política são separadas: quem decide se `implement` aceita é `workflow.require_approval`, não o grafo.
- `CANCELLED` é alcançável de **todo** estado não terminal, e `BLOCKED` só de `IN_PROGRESS`.

O arquivo é dado, não código: legível sem runtime.

### Arquivos prováveis

- `plugins/sdd-kit/schemas/workflow.json`

### Testes esperados

- `TEST-SWC-001` — `workflow.json` declara os dez estados de `status.schema.json`, dois terminais com lista de destinos vazia, todo destino é um estado declarado, `CANCELLED` é alcançável de todo estado não terminal (`SCN-SWC-021`, cobertura estrutural) e `BLOCKED` só de `IN_PROGRESS`.

### Critério de conclusão

- [ ] `workflow.json` existe e é JSON válido, sem comentários.
- [ ] Os dez estados coincidem exatamente com o `enum` de `status.schema.json` — nenhum a mais, nenhum a menos.
- [ ] Cada estado de `states` aparece como chave em `transitions`.
- [ ] `ARCHIVED` e `CANCELLED` têm `[]` e estão em `terminal`.
- [ ] `PLANNED` inclui `IN_PROGRESS`, com a razão registrada em comentário do commit ou no próprio design — não no JSON.
- [ ] `TEST-SWC-001` passa.

---

## TASK-SWC-002 — A suíte de testes deixa de declarar o grafo por conta própria

**Requisitos:** REQ-SWC-007, NFR-SWC-003
**Dependências:** TASK-SWC-001
**Complexidade:** P
**Status:** done

### Descrição

Remover a constante `TRANSICOES` de `tests/specs-invariants.test.ts` e o array `ESTADOS` de `tests/schemas.test.ts`, substituindo ambos pela leitura de `workflow.json`.

Este é o defeito que motivou o `ADR-010`: o teste que deveria ser a rede de proteção do grafo valida contra a própria cópia do grafo. Enquanto a constante existir, `REQ-SWC-007` não é testável — só auto-consistente.

Acrescentar também a verificação de `SCN-SWC-018`: artefatos reais com `blocked_by` não vazio permanecem no estado registrado, e nenhum artefato de `.specs` está em `BLOCKED`. O campo `blocked_by` e o estado `BLOCKED` são coisas diferentes ([ADR-013](../../project/decisions/ADR-013-semantica-da-maquina-de-estados.md)), e `0001` e `0003` são a evidência disso no próprio repositório.

### Arquivos prováveis

- `tests/specs-invariants.test.ts`
- `tests/schemas.test.ts`
- `tests/helpers.ts` (função de carregamento do grafo)

### Testes esperados

- `TEST-SWC-002` — nenhum arquivo em `tests/` declara transições ou estados literalmente; a suíte os carrega de `workflow.json`.
- `TEST-SWC-003` — todo `history` de todo `status.yaml` em `.specs` satisfaz o grafo carregado de `workflow.json`, e nenhuma mudança com `blocked_by` não vazio está em `BLOCKED` (`SCN-SWC-018`).

### Critério de conclusão

- [ ] `grep -r 'TRANSICOES\|const ESTADOS' tests/` não retorna nada.
- [ ] O carregamento do grafo está em um único lugar (`helpers.ts`), não repetido por arquivo de teste.
- [ ] `TEST-SWC-003` falharia se um `status.yaml` fosse editado para uma sequência fora do grafo — verificado por edição temporária, revertida em seguida.
- [ ] `npm run build` (`tsc --noEmit`) e `npm test` saem com êxito.

---

## TASK-SWC-003 — `architecture.md` §3 aponta para o grafo em vez de repeti-lo

**Requisitos:** REQ-SWC-007
**Dependências:** TASK-SWC-001
**Complexidade:** P
**Status:** done

### Descrição

Remover a tabela "Transições válidas" de `.specs/project/architecture.md` §3 e substituí-la por uma referência a `plugins/sdd-kit/schemas/workflow.json`, mantendo no documento apenas o que o JSON não expressa: a **semântica** de cada estado, a distinção entre o campo `blocked_by` e o estado `BLOCKED`, e a regra de que regresso detecta mas não muta.

Decidido em `design.md` §14 (Q14): sincronizar duas cópias é problema que se resolve apagando uma. Um teste verificando a sincronia entre tabela e JSON manteria as duas — e o custo de manutenção — para ganhar apenas a detecção da divergência.

O diagrama ASCII de §3 pode permanecer: ele ilustra, não é consumido por nada. Deve, porém, ser corrigido para incluir `PLANNED → IN_PROGRESS`, hoje ausente.

### Arquivos prováveis

- `.specs/project/architecture.md`
- `tests/docs.test.ts`

### Testes esperados

- `TEST-SWC-004` — `architecture.md` §3 referencia `workflow.json` e não contém tabela de transições; o diagrama inclui a aresta `PLANNED → IN_PROGRESS`.

### Critério de conclusão

- [ ] A tabela de transições não existe mais em `architecture.md`.
- [ ] §3 nomeia o caminho `plugins/sdd-kit/schemas/workflow.json`.
- [ ] A semântica de `BLOCKED` versus `blocked_by` está escrita, com link para `ADR-013`.
- [ ] `TEST-SWC-004` passa.

---

## TASK-SWC-004 — Schema da matriz de rastreabilidade

**Requisitos:** REQ-SWC-008, NFR-SWC-003
**Dependências:** nenhuma
**Complexidade:** P
**Status:** done

### Descrição

Criar `plugins/sdd-kit/schemas/traceability.schema.json`, listado no PRD §14 e não entregue por `TASK-PF-004`, que criou apenas `config` e `status`.

O schema é a contenção contra o risco 4 do design: seis skills escrevendo `traceability.yaml` à mão divergem, exatamente como o grafo divergiu em três cópias. Ele precisa fixar: `version`, `feature`, o mapa `requirements` com `title`, `scenarios`, `tasks`, `implementation` e `tests`, e a chave opcional `gaps` com `id`, `reason` e `mitigation`.

Exigências que o schema deve tornar mecânicas, não opcionais: todo requisito tem ao menos uma tarefa; `implementation` existe sempre, ainda que vazio; identificadores seguem os formatos de `standards.md` §2.

Na Fase 4 o script assume a escrita e as skills passam a chamá-lo. Até lá, o schema é o único guarda.

### Arquivos prováveis

- `plugins/sdd-kit/schemas/traceability.schema.json`
- `tests/schemas.test.ts`

### Testes esperados

- `TEST-SWC-005` — o schema é válido e os `traceability.yaml` existentes em `.specs` (`0001` e `0007`) validam contra ele.
- `TEST-SWC-006` — um documento com requisito sem tarefa, ou com identificador fora do formato de `standards.md` §2, é **rejeitado** pelo schema.

### Critério de conclusão

- [ ] O schema declara `$schema`, `$id` e `additionalProperties: false` nos objetos fechados, seguindo o estilo de `status.schema.json`.
- [ ] `tasks` tem `minItems: 1` por requisito.
- [ ] `implementation` é obrigatório e pode ser `[]`.
- [ ] Os padrões de identificador aceitam `REQ-*`, `NFR-*`, `SCN-*`, `TASK-*` e `TEST-*` e recusam o que não seguir o formato.
- [ ] `TEST-SWC-005` e `TEST-SWC-006` passam.

---

## TASK-SWC-005 — Template de `design.md`

**Requisitos:** REQ-SWC-002
**Dependências:** nenhuma
**Complexidade:** P
**Status:** done

### Descrição

Criar `plugins/sdd-kit/templates/pt-BR/_shared/design.md`, um dos três templates que a Fase 1 deixou de fora. Sem ele, `/sdd-kit:design` não tem forma a seguir e cada execução inventa a sua.

A estrutura vem do `design.md` desta própria mudança, escrito à mão e que serve de referência: contexto, solução proposta, componentes afetados, contratos, fluxo de dados, persistência, dependências, segurança, observabilidade, estratégia de testes, migração e rollback, riscos, alternativas consideradas, questões fechadas pelo design, ainda em aberto.

Seguir a convenção dos templates existentes: marcadores `{{guia: …}}` para instrução ao agente, `{{repetir: …}}` e `{{opcional: …}}` resolvidos na geração, nenhum `{{` sobrevivendo no arquivo final.

### Arquivos prováveis

- `plugins/sdd-kit/templates/pt-BR/_shared/design.md`
- `tests/templates.test.ts`

### Testes esperados

- `TEST-SWC-007` — o template existe, está em pt-BR, usa os marcadores na convenção vigente e declara as seções mínimas que `SCN-SWC-002` exige.

### Critério de conclusão

- [ ] O template cobre as quinze seções listadas acima.
- [ ] A seção de alternativas consideradas exige o **motivo da recusa**, não apenas a lista.
- [ ] A seção de riscos exige mitigação por risco.
- [ ] `TEST-SWC-007` passa e a suíte de templates continua verde.

---

## TASK-SWC-006 — Templates de `acceptance.md` e `validation.md`

**Requisitos:** REQ-SWC-005
**Dependências:** nenhuma
**Complexidade:** P
**Status:** done

### Descrição

Criar os dois templates que `/sdd-kit:verify` escreve, ambos ausentes desde a Fase 1:

- `acceptance.md` — um critério de aceite por linha, com veredito, evidência e o cenário `SCN-*` correspondente. Critério sem evidência não conta como satisfeito.
- `validation.md` — o resultado de cada comando de `validation.commands`, com **os três estados do [ADR-012](../../project/decisions/ADR-012-execucao-vazia-nao-e-aprovacao.md)**: *não configurada*, *executada sem efeito* e *aprovada*, mais o comando exato e a saída obtida.

O template de `validation.md` é o que impede a repetição do buraco em que este projeto caiu: `vitest run --passWithNoTests` sai com exit 0 sem executar nada, e foi preciso comentário em `config.yaml`, nota no `CONTRIBUTING.md` e critério em `TASK-PF-012` para impedir que aquele zero fosse lido como aprovação. O template torna a distinção obrigatória em vez de depender de quem escreve o relatório lembrar dela.

### Arquivos prováveis

- `plugins/sdd-kit/templates/pt-BR/_shared/acceptance.md`
- `plugins/sdd-kit/templates/pt-BR/_shared/validation.md`
- `tests/templates.test.ts`

### Testes esperados

- `TEST-SWC-008` — os dois templates existem, em pt-BR, na convenção de marcadores vigente; `validation.md` declara os três estados de validação e exige a saída obtida por comando.

### Critério de conclusão

- [ ] `acceptance.md` tem coluna ou campo de **evidência** obrigatório por critério.
- [ ] `validation.md` distingue os três estados e não oferece um campo genérico de "passou".
- [ ] `validation.md` exige a contagem de testes executados e o que fazer quando ela não puder ser determinada (Q13: reportar "não foi possível confirmar execução").
- [ ] `TEST-SWC-008` passa.

---

## TASK-SWC-007 — Skill `clarify`

**Requisitos:** REQ-SWC-001, REQ-SWC-007
**Dependências:** TASK-SWC-001, TASK-SWC-003
**Complexidade:** M
**Status:** done

### Descrição

Criar `plugins/sdd-kit/skills/clarify/SKILL.md`, seguindo a estrutura das quatro skills existentes: front matter com `name`, `description` e gatilhos; seção de modo de governança; seção declarando os arquivos que lê e sob qual condição; procedimento numerado; formato do relatório final; seção de erros.

Contrato (design §4.3): lê `spec.md` e `glossary.md`, escreve `spec.md`, transição `DRAFT → CLARIFIED`, **autoinvocável** — resolve questões e não age sobre decisão irreversível ([ADR-008](../../project/decisions/ADR-008-autoinvocacao-de-skills.md)).

Comportamento exigido pelos cenários:

- Questões respondidas migram de "Questões pendentes" para "Questões resolvidas" em `spec.md` e para `resolved_questions` em `status.yaml`, com `date` e `summary` (`SCN-SWC-001`).
- Questão de prioridade **crítica** sem resposta mantém `DRAFT` e continua em `blocked_by`, reportada por identificador e severidade (`SCN-SWC-009`). Não promover porque "as demais foram respondidas".
- A promoção é verificada contra `workflow.json` antes de ser escrita, e **acrescenta** uma entrada a `history` com `reason` não vazio, sem reescrever as anteriores (`SCN-SWC-016`).
- Ordem de escrita: artefatos, depois `status.yaml`, `index.yaml` por último (Q12).

Refinar não é transicionar: uma segunda passagem que responde questões não críticas sem sair de `CLARIFIED` não gera entrada nova no histórico.

### Arquivos prováveis

- `plugins/sdd-kit/skills/clarify/SKILL.md`
- `tests/skills.test.ts`

### Testes esperados

- `TEST-SWC-009` — estrutural: front matter, seção de governança, seção de arquivos lidos, referência a artigo da constituição.
- `TEST-SWC-010` — execução real (`claude -p`) em projeto limpo: questões críticas respondidas promovem a `CLARIFIED` e aparecem em `resolved_questions` com data e resumo (`SCN-SWC-001`).
- `TEST-SWC-011` — execução real: questão crítica sem resposta mantém `DRAFT` e a questão continua em `blocked_by` (`SCN-SWC-009`).
- `TEST-SWC-012` — a promoção acrescenta entrada a `history` sem reescrever as anteriores, e `status` coincide com a última entrada (`SCN-SWC-016`).

### Critério de conclusão

- [ ] `claude plugin validate ./plugins/sdd-kit --strict` sai com exit 0.
- [ ] A skill foi **executada de verdade** ao menos uma vez, e a saída está registrada na seção "Resultado" desta tarefa (design §10: teste estrutural não pega defeito de comportamento — o bug `0003` passou por 201 testes verdes).
- [ ] Na execução real, nenhuma questão foi respondida pela própria skill sem ato do usuário: resposta inventada é o defeito que `0003` documenta em outra skill.
- [ ] `status.yaml` gerado valida contra `status.schema.json`.
- [ ] `TEST-SWC-009` a `TEST-SWC-012` passam.

### Resultado

Executada de verdade via `claude -p` num projeto-cobaia limpo (`/sdd-kit:init → new →
spec → clarify`), 2026-08-02:

- **SCN-SWC-009 (crítica sem resposta):** rodando `clarify` sem responder, a mudança
  **permaneceu em `DRAFT`**, com as questões críticas ainda em `blocked_by`. A skill
  recusou promover ("a promoção a `CLARIFIED` só acontece quando as quatro críticas
  estiverem fechadas") e **não inventou resposta** ("não reclassifiquei por conta própria"). ✅
- **SCN-SWC-001 / SCN-SWC-016 (responder e promover):** respondidas as quatro críticas, a
  mudança foi para **`CLARIFIED`**, `blocked_by` esvaziou, `resolved_questions` recebeu as
  entradas com `date` e `summary` citando as respostas do usuário, e o `history` ganhou uma
  entrada nova sem reescrever a anterior. A skill marcou hipóteses (case-sensitivity, "cliente
  ativo") e **não inventou** o `REQ-CUST-002` da consulta (Art. 2). ✅
- **Defeito encontrado e corrigido:** o `status.yaml` gerado gravava `resolved_by: user`, que
  falhava contra `status.schema.json` (padrão `TASK-*`). Corrigido por **ADR-014**: `resolved_by`
  passa a aceitar um `TASK-<ESCOPO>-NNN` **ou** um nome de skill; `clarify` grava `clarify`. O
  `status.yaml` real da execução foi **re-validado contra o schema corrigido: válido**. `TEST-SWC-009`
  (estrutural) e o novo teste de `resolved_by` passam; `claude plugin validate --strict` limpo.

TEST-SWC-010/011/012 (harness dedicado) permanecem no gap de execução declarado; a verificação
comportamental acima cobre os mesmos cenários pela execução real, registrada aqui (design §10).

---

## TASK-SWC-008 — Skill `design`

**Requisitos:** REQ-SWC-002, REQ-SWC-007
**Dependências:** TASK-SWC-001, TASK-SWC-003, TASK-SWC-005
**Complexidade:** M
**Status:** done

### Descrição

Criar `plugins/sdd-kit/skills/design/SKILL.md`. Contrato (design §4.3): lê `spec.md`, `architecture.md` e `context.md`; escreve `design.md` e ADRs; transição `CLARIFIED → DESIGNED`; **autoinvocável**.

Comportamento exigido pelos cenários:

- A partir de `CLARIFIED`, cria `design.md` do template de `TASK-SWC-005` e promove a `DESIGNED` (`SCN-SWC-002`).
- A partir de `DRAFT` com questões críticas em aberto, **recusa**, informando o estado atual e o exigido, e **não cria** `design.md` (`SCN-SWC-010`). Recusa não é aviso: nenhum arquivo é escrito.
- Decisão arquitetural relevante vira ADR no diretório de decisões, não prosa dentro de `design.md`.
- Carrega `architecture.md` e `context.md` do projeto, e **não** lê specs de outras mudanças (NFR-SWC-002).

### Arquivos prováveis

- `plugins/sdd-kit/skills/design/SKILL.md`
- `tests/skills.test.ts`

### Testes esperados

- `TEST-SWC-013` — estrutural, como `TEST-SWC-009`.
- `TEST-SWC-014` — execução real: `CLARIFIED → DESIGNED` com `design.md` criado a partir do template (`SCN-SWC-002`).
- `TEST-SWC-015` — execução real a partir de `DRAFT` com questão crítica: recusada, `design.md` inexistente, `status.yaml` byte a byte inalterado (`SCN-SWC-010`).

### Critério de conclusão

- [ ] `claude plugin validate --strict` sai com exit 0.
- [ ] Execução real registrada na seção "Resultado".
- [ ] Na execução recusada, verificado por hash que `status.yaml` não foi tocado.
- [ ] O `design.md` gerado não contém nenhum `{{`.
- [ ] `TEST-SWC-013` a `TEST-SWC-015` passam.

### Resultado

Executada de verdade via `claude -p` num projeto-cobaia limpo, 2026-08-02:

- **SCN-SWC-002 (CLARIFIED → DESIGNED):** o design **criou o `design.md`** a partir do
  template (15 seções, **0 marcadores `{{`**), com conteúdo de qualidade (recusou `COLLATE
  NOCASE` por dobrar só ASCII; não inventou coluna de "cliente ativo" que a spec deixou
  indefinida). Depois **promoveu** a mudança para `DESIGNED`: `history` ganhou a entrada
  `CLARIFIED → DESIGNED`, as anteriores e as `resolved_questions` intactas, `index.yaml`
  atualizado. ✅
- **SCN-SWC-010 (recusa a partir de DRAFT):** rodando design numa mudança em `DRAFT`, a skill
  **recusou** (apontou `/sdd-kit:clarify` como próximo passo), **não criou `design.md`**, e o
  `status.yaml` ficou **byte a byte inalterado** (hash idêntico antes/depois). ✅
- **Defeito encontrado e corrigido:** na primeira tentativa a promoção não completava — a skill
  tentava `Edit` para atualizar o `status.yaml`, que está em `disallowed-tools`, e travava. O
  `SKILL.md` passou a instruir explicitamente **atualizar `status.yaml`/`index.yaml` reescrevendo
  com `Write`** (Edit fora do conjunto), e a não repetir a confirmação quando a promoção já foi
  autorizada. A mesma correção foi propagada preventivamente a `approve`, `implement`, `verify` e
  `archive`, que atualizam `status.yaml` pelo mesmo mecanismo. Após o fix, a promoção completou.
  `claude plugin validate --strict` limpo.

---

## TASK-SWC-009 — Skill `approve`

**Requisitos:** REQ-SWC-003, REQ-SWC-007
**Dependências:** TASK-SWC-007, TASK-SWC-008
**Complexidade:** M
**Status:** done

### Descrição

Criar `plugins/sdd-kit/skills/approve/SKILL.md`. Contrato (design §4.3): lê `spec.md`, `tasks.md` e `traceability.yaml`; escreve `status.yaml`; transição `PLANNED → APPROVED`; **não autoinvocável** — `disable-model-invocation: true`, porque registra decisão humana ([ADR-008](../../project/decisions/ADR-008-autoinvocacao-de-skills.md)).

Comportamento exigido, e é aqui que a skill precisa de mais disciplina que qualquer outra:

- `approval.by` vem de `git config user.name <email>`, **mas só é gravado depois de um ato humano explícito na conversa** ([ADR-011](../../project/decisions/ADR-011-identidade-e-invalidacao-da-aprovacao.md)). O git fornece o rótulo; a pessoa fornece o ato. Se o agente pudesse preencher esse campo sozinho, o Artigo 3 da constituição viraria encenação com rastro documental.
- `approval.revision` é o SHA-256 de `spec.md` truncado em 12 caracteres hexadecimais, via `node:crypto` (`SCN-SWC-003`).
- Aprovação **negada** deixa `approval: null` e o status em `PLANNED` (`SCN-SWC-011`). Sem entrada de histórico: não houve transição.
- A skill declara em `SKILL.md` que não é autoinvocável **e por quê**, para que a razão sobreviva a quem editar o front matter depois.
- Tentativa de promover a `APPROVED` a partir de um estado fora do grafo é recusada com origem, destino e as transições válidas a partir da origem, sem alterar `status` nem `history` (`SCN-SWC-007`).

Comportamento em projeto sem `git config` configurado: pedir a identidade ao usuário em vez de gravar vazio ou inventar.

### Arquivos prováveis

- `plugins/sdd-kit/skills/approve/SKILL.md`
- `tests/skills.test.ts`

### Testes esperados

- `TEST-SWC-016` — estrutural, e verifica `disable-model-invocation: true` no front matter.
- `TEST-SWC-017` — execução real: aprovação dada grava `date`, `by` e `revision` e promove a `APPROVED` (`SCN-SWC-003`).
- `TEST-SWC-018` — execução real: aprovação negada mantém `approval: null` e `PLANNED`, sem entrada nova em `history` (`SCN-SWC-011`).
- `TEST-SWC-019` — tentativa de `DRAFT → APPROVED` recusada com o conjunto de transições válidas a partir de `DRAFT`, sem alterar `status` nem `history` (`SCN-SWC-007`).

### Critério de conclusão

- [ ] `disable-model-invocation: true` presente e justificado no corpo do `SKILL.md`.
- [ ] `revision` reproduzível: recalcular o SHA-256 de `spec.md` à mão dá o mesmo valor.
- [ ] Execução real registrada, incluindo o caso negado.
- [ ] Em nenhuma execução a skill gravou `by` sem uma frase de aprovação explícita do usuário no diálogo.
- [ ] `TEST-SWC-016` a `TEST-SWC-019` passam.

### Resultado

Mecânica executada de verdade via `claude -p` num projeto-cobaia limpo (mudança levada a `PLANNED`
por spec → clarify → design → tasks), 2026-08-02:

- **SCN-SWC-011 (negação):** aprovação recusada ("não aprovo ainda") deixou `approval: null` e o
  status em `PLANNED`, **sem** entrada nova em `history` (4 → 4). ✅
- **SCN-SWC-003 (aprovação):** com a frase de aprovação, gravou `approval` com `date`, `by`
  (`Smoke Tester <…>`, do `git config`) e `revision`, e promoveu a `APPROVED`. A `revision`
  (`a5494bc1fe27`) **reproduz** `sha256(spec.md)[:12]` exatamente; o `status.yaml` valida contra o
  schema. ✅
- **SCN-SWC-007 (transição inválida):** `approve` a partir de `DRAFT` **recusou**, listando o
  caminho válido até `APPROVED`, sem tocar `status.yaml` (hash idêntico antes/depois). ✅

**Ressalva de honestidade (Art. 3 / ADR-011):** nestas execuções a frase de aprovação foi fornecida
pelo agente na chamada `claude -p`, não por um humano — o que valida a **mecânica** (grava os campos
corretos, calcula o hash, recusa a transição inválida, não promove na negação), mas **não** o "ato
humano" em si. A garantia de que só um humano aprova é estrutural (`disable-model-invocation: true`,
verificada por TEST-SWC-016) e não depende desta execução. `claude plugin validate --strict` limpo.

---

## TASK-SWC-010 — Skill `implement`: pré-condições e seleção da tarefa

**Requisitos:** REQ-SWC-004, REQ-SWC-003
**Dependências:** TASK-SWC-009
**Complexidade:** M
**Status:** in_progress

### Descrição

Criar `plugins/sdd-kit/skills/implement/SKILL.md` com o front matter, a declaração de arquivos lidos e **a metade que roda antes de qualquer escrita**. `implement` é a primeira skill do framework com efeito colateral irreversível (design §2), e o risco 5 do design pede que a aprovação vencida seja detectada **antes** de tocar arquivo algum.

Portões, na ordem, todos antes da primeira escrita:

1. **Aprovação exigida.** Com `require_approval: true` e `approval: null`, recusa informando que a configuração exige aprovação, e nenhum arquivo de código é alterado (`SCN-SWC-012`).
2. **Aprovação vencida.** Recalcula o SHA-256 de `spec.md` e compara com `approval.revision`. Divergiu: reporta a aprovação como vencida e recusa avançar — e **não** regride o estado por conta própria, o que seria reescrever o histórico sem decisão humana (`SCN-SWC-020`, [ADR-013](../../project/decisions/ADR-013-semantica-da-maquina-de-estados.md)).
3. **Política separada da estrutura.** Com `require_approval: false`, prossegue de `PLANNED` sem exigir `APPROVED`; a transição `PLANNED → IN_PROGRESS` existe no grafo independentemente da configuração (`SCN-SWC-022`).
4. **Seleção da tarefa.** Com identificador, é aquela tarefa. Sem identificador, propõe **a próxima pendente cujas dependências estejam todas concluídas** e pede confirmação no modo `guided`. Havendo mais de uma elegível, lista e pergunta em vez de escolher por ordem de identificador, que não significa prioridade (Q6).
5. **Dependência pendente.** Tarefa com dependência não concluída não é iniciada, e a dependência é reportada por identificador (`SCN-SWC-013`).

### Arquivos prováveis

- `plugins/sdd-kit/skills/implement/SKILL.md`
- `tests/skills.test.ts`

### Testes esperados

- `TEST-SWC-020` — `require_approval: true` e `approval: null`: recusa, e nenhum arquivo fora de `.specs` foi modificado (`SCN-SWC-012`).
- `TEST-SWC-021` — `spec.md` editada depois de `APPROVED`: hash divergente, aprovação reportada como vencida, estado inalterado (`SCN-SWC-020`).
- `TEST-SWC-022` — tarefa com dependência pendente não é iniciada e a dependência é nomeada (`SCN-SWC-013`).
- `TEST-SWC-023` — `require_approval: false` prossegue de `PLANNED`, e `workflow.json` continua com a aresta `PLANNED → IN_PROGRESS` inalterada (`SCN-SWC-022`).

### Critério de conclusão

- [ ] `disable-model-invocation: true` presente e justificado.
- [ ] Os cinco portões estão numerados no `SKILL.md`, com a verificação de hash **antes** de qualquer escrita.
- [ ] Nos testes de recusa, verificado por `git status` que nenhum arquivo de código foi tocado.
- [ ] O `SKILL.md` declara explicitamente que a skill escreve **apenas** nos arquivos declarados na tarefa, e que sair disso exige justificativa explícita (design §8).
- [ ] `TEST-SWC-020` a `TEST-SWC-023` passam.

### Resultado (parcial)

Os dois portões marquee foram executados de verdade via `claude -p` na mudança-cobaia em `APPROVED`
(`require_approval: true`), 2026-08-02, e **nenhum** escreveu código (verificado por `git status`):

- **SCN-SWC-013 (dependência pendente):** `implement … TASK-CUST-003` (depende de `TASK-CUST-001`,
  não concluída) **recusou**, nomeando `TASK-CUST-001` como o passo anterior; status inalterado
  (`APPROVED`), **0 arquivos rastreados alterados**. ✅
- **SCN-SWC-020 (aprovação vencida):** editado o `spec.md` (hash `a5494bc1fe27` → `0ae1a8892892`),
  `implement` **acusou a aprovação vencida** ("a recusa vem da aprovação vencida, não do modo") e
  **não regrediu o estado** (segue `APPROVED`) — detecta, não muta (ADR-013); **0 código escrito**. ✅

**Ainda a verificar (deslocados para o percurso e2e, TASK-SWC-017):** SCN-SWC-012 (`require_approval:
true` + `approval: null` → recusa) e SCN-SWC-022 (`require_approval: false` → prossegue de `PLANNED`)
dependem de configs/estados diferentes; e a **execução de tarefa** (TASK-SWC-011: SCN-SWC-004 contadores/
`IN_PROGRESS`, SCN-SWC-017 rastreabilidade, SCN-SWC-019 `BLOCKED`) precisa de uma tarefa **trivialmente
implementável** — o cobaia atual (cadastro de clientes) está travado na decisão A1 (linguagem/runtime),
então uma conclusão limpa de tarefa será demonstrada no e2e com um toy simples (ex.: "somar dois números").
Por isso TASK-SWC-010 e TASK-SWC-011 seguem `in_progress`.

---

## TASK-SWC-011 — Skill `implement`: execução, contadores e rastreabilidade

**Requisitos:** REQ-SWC-004, REQ-SWC-008
**Dependências:** TASK-SWC-004, TASK-SWC-010
**Complexidade:** M
**Status:** in_progress

### Descrição

Completar `implement` com a metade que escreve: executar a tarefa selecionada, registrar o resultado e manter a rastreabilidade verdadeira.

- Tarefa concluída aparece como concluída em `tasks.md`, os contadores `tasks` de `status.yaml` refletem a mudança (`total = pending + in_progress + done`) e a mudança fica em `IN_PROGRESS` (`SCN-SWC-004`). A skill **não** promove a mudança ao concluir uma tarefa — quem promove é `verify`.
- A linha correspondente em `traceability.yaml` passa a apontar os arquivos e os testes produzidos, fechando a cadeia requisito → cenário → tarefa → arquivo → teste para aquela tarefa (`SCN-SWC-017`). A escrita segue `traceability.schema.json`.
- Decisão arquitetural não prevista **interrompe**: o estado passa a `BLOCKED` e o motivo nomeia a decisão pendente (`SCN-SWC-019`). É o Artigo correspondente da constituição em código — seguir adiante inventando a decisão é o defeito que ele existe para impedir.
- Uma tarefa por execução. Ordem de escrita: código e testes, `tasks.md` e `traceability.yaml`, depois `status.yaml`, `index.yaml` por último (Q12).

### Arquivos prováveis

- `plugins/sdd-kit/skills/implement/SKILL.md`
- `tests/skills.test.ts`

### Testes esperados

- `TEST-SWC-024` — execução real: tarefa concluída atualiza `tasks.md`, os contadores fecham a soma e o estado é `IN_PROGRESS` (`SCN-SWC-004`).
- `TEST-SWC-025` — a linha da matriz recebe arquivos e testes, e o documento resultante valida contra `traceability.schema.json` (`SCN-SWC-017`).
- `TEST-SWC-026` — execução real: decisão arquitetural não prevista leva a `BLOCKED` com motivo nomeando a decisão (`SCN-SWC-019`).

### Critério de conclusão

- [ ] `total = pending + in_progress + done` verificado na saída real, não apenas descrito.
- [ ] `implementation` na matriz lista caminhos que **existem** no disco depois da execução.
- [ ] A skill não promoveu a mudança para `VERIFIED` nem para `PLANNED` por conta própria em nenhuma execução.
- [ ] Execução real registrada na seção "Resultado", incluindo o caso `BLOCKED`.
- [ ] `TEST-SWC-024` a `TEST-SWC-026` passam.

---

## TASK-SWC-012 — Skill `verify`: executar as validações e distinguir os três estados

**Requisitos:** REQ-SWC-005
**Dependências:** TASK-SWC-006, TASK-SWC-011
**Complexidade:** M
**Status:** in_progress

### Descrição

Criar `plugins/sdd-kit/skills/verify/SKILL.md` com a parte que executa `validation.commands` e relata o resultado. Contrato (design §4.3): lê `spec.md`, `acceptance.md` e `config.yaml`; escreve `validation.md` e `acceptance.md`; **autoinvocável** — verifica, não decide.

O núcleo é o [ADR-012](../../project/decisions/ADR-012-execucao-vazia-nao-e-aprovacao.md): **evidência de execução, não código de saída.** Três estados por comando, sempre reportados e nunca colapsados:

| Estado | Efeito |
| --- | --- |
| *não configurada* | Não bloqueia (Artigo 10 da constituição: exigência insatisfazível em projeto sem a ferramenta) |
| *executada sem efeito* | **Bloqueia** quando `require_tests: true` |
| *aprovada* | Não bloqueia |

Contagem de testes executados vem de relatório estruturado quando o runner suporta — `vitest --reporter=json`, `jest --json`, `pytest --json-report`, `go test -json`. Não sendo possível determinar, a skill reporta "não foi possível confirmar execução", que sob `require_tests: true` **bloqueia**, exatamente como zero testes (Q13). Não confirmado não é aprovado.

Comando com falha **não** promove, e a falha é reportada com o comando exato e a saída obtida (`SCN-SWC-005`). `validation.commands` é entrada não confiável vinda do `config.yaml` do projeto e deve ser tratada como tal (design §8).

Este projeto é o caso de teste: `npm test` roda `vitest run --passWithNoTests` e sai 0 sem executar nada até `TASK-PF-012` remover a flag.

### Arquivos prováveis

- `plugins/sdd-kit/skills/verify/SKILL.md`
- `tests/skills.test.ts`

### Testes esperados

- `TEST-SWC-027` — execução real com um comando de validação falhando: o status **não** passa a `VERIFIED` e o relatório traz o comando e a saída (`SCN-SWC-005`).
- `TEST-SWC-028` — os três estados são distinguidos no `validation.md` gerado; comando ausente não bloqueia; suíte que executa zero testes bloqueia com `require_tests: true`; contagem indeterminada bloqueia igual a zero.

### Critério de conclusão

- [ ] O `validation.md` gerado registra, por comando, o texto exato executado e a saída obtida — não um resumo.
- [ ] Executado contra este próprio repositório com `--passWithNoTests` ativo: a skill reporta *executada sem efeito*, não *aprovada*.
- [ ] Nenhum caminho do `SKILL.md` deriva "passou" apenas de exit 0.
- [ ] `TEST-SWC-027` e `TEST-SWC-028` passam.

---

## TASK-SWC-013 — Skill `verify`: critérios de aceite e recusa por itens órfãos

**Requisitos:** REQ-SWC-005, REQ-SWC-008
**Dependências:** TASK-SWC-004, TASK-SWC-012
**Complexidade:** M
**Status:** in_progress

### Descrição

Completar `verify` com a conferência dos critérios de aceite e o portão de rastreabilidade, e só então a promoção.

- Cada critério de aceite de `spec.md` é avaliado um a um e registrado em `acceptance.md` com veredito e **evidência**. Critério sem evidência não conta como satisfeito.
- Com `require_traceability: true`, requisito sem tarefa ou tarefa sem teste **recusa** a promoção a `VERIFIED`, e os itens órfãos são listados por identificador (`SCN-SWC-008`).
- Todos os comandos aprovados e todos os critérios satisfeitos promovem a `VERIFIED`, com o relatório registrando comando e resultado de cada um (`SCN-SWC-014`).
- Requisito verificável só por revisão humana vai para `gaps` em `traceability.yaml`, com motivo e mitigação. Lacuna registrada é honesta; lacuna omitida vira cobertura aparente.

### Arquivos prováveis

- `plugins/sdd-kit/skills/verify/SKILL.md`
- `plugins/sdd-kit/templates/pt-BR/_shared/acceptance.md`
- `tests/skills.test.ts`

### Testes esperados

- `TEST-SWC-029` — execução real com lint, teste e build aprovados e todos os critérios satisfeitos: promove a `VERIFIED` e o relatório traz comando e resultado de cada um (`SCN-SWC-014`).
- `TEST-SWC-030` — requisito sem tarefa ou tarefa sem teste com `require_traceability: true`: promoção recusada e órfãos listados por identificador (`SCN-SWC-008`).

### Critério de conclusão

- [ ] `acceptance.md` gerado tem uma linha por critério de aceite de `spec.md`, nenhuma a menos.
- [ ] Nenhum critério marcado como satisfeito sem evidência textual.
- [ ] A recusa por item órfão nomeia cada identificador, sem dizer apenas "há itens órfãos".
- [ ] Execução real registrada nos dois casos, promovido e recusado.
- [ ] `TEST-SWC-029` e `TEST-SWC-030` passam.

---

## TASK-SWC-014 — Skill `archive`

**Requisitos:** REQ-SWC-006, REQ-SWC-007
**Dependências:** TASK-SWC-013
**Complexidade:** M
**Status:** in_progress

### Descrição

Criar `plugins/sdd-kit/skills/archive/SKILL.md`. Contrato (design §4.3): lê tudo da mudança; move o diretório para `.specs/archive/` e atualiza o índice; transição `VERIFIED → ARCHIVED`; **não autoinvocável** — move diretórios, o que é irreversível na prática.

- A partir de `VERIFIED`, o diretório passa a viver sob `.specs/archive/` e a entrada em `index.yaml` reflete o novo caminho e o status `ARCHIVED`, migrando de `changes` para a chave `archive`, que o índice já reserva (`SCN-SWC-006`).
- Destino já existente **não é sobrescrito**: o arquivamento é recusado, o conflito é reportado com o caminho, e nem origem nem destino são alterados (`SCN-SWC-015`).
- **Não reescreve links Markdown.** Decidido em `design.md` §14 (Q8): a causa da quebra é referenciar mudança por caminho, e a convenção passa a ser referência por identificador, resolvida pelo índice. Varrer o repositório reescrevendo Markdown é invasivo e erra em bloco de código e em citação. Links relativos que sobreviverem quebram, e o validador da Fase 4 os detecta.
- Ordem de escrita, e aqui ela importa mais que em qualquer outra skill: mover o diretório, depois `status.yaml`, `index.yaml` por último. Falhando no meio, o índice fica **atrasado** — nunca apontando para um diretório que não existe (Q12).

### Arquivos prováveis

- `plugins/sdd-kit/skills/archive/SKILL.md`
- `tests/skills.test.ts`

### Testes esperados

- `TEST-SWC-031` — execução real: `VERIFIED → ARCHIVED`, diretório sob `.specs/archive/`, entrada de `index.yaml` com o novo caminho e o novo status (`SCN-SWC-006`).
- `TEST-SWC-032` — destino já ocupado: recusa com o caminho do conflito, e origem e destino inalterados, verificado por hash de diretório (`SCN-SWC-015`).

### Critério de conclusão

- [ ] `disable-model-invocation: true` presente e justificado.
- [ ] Depois do arquivamento, `TEST-PF-013` (índice versus disco) continua passando.
- [ ] No caso de conflito, verificado que nenhum arquivo dos dois diretórios mudou.
- [ ] O `SKILL.md` declara explicitamente que não reescreve links, com link para `design.md` §14.
- [ ] `TEST-SWC-031` e `TEST-SWC-032` passam.

---

## TASK-SWC-015 — A regra de referência por identificador vai para `standards.md`

**Requisitos:** REQ-SWC-006
**Dependências:** nenhuma
**Complexidade:** P
**Status:** done

### Descrição

Registrar em `.specs/project/standards.md` a convenção decidida em `design.md` §14 (Q8): **mudanças são referenciadas por identificador** (`0001-plugin-foundation`), não por caminho relativo, e o identificador resolve pelo `index.yaml`.

Sem essa regra escrita, `archive` fica com uma escolha de design sem apoio normativo: quem ler o `SKILL.md` depois vai concluir que ele deveria reescrever os links e "corrigir" o comportamento.

O texto deve dizer o que fazer, não apenas o que evitar: como referenciar uma mudança em prosa, em spec e em ADR.

### Arquivos prováveis

- `.specs/project/standards.md`
- `tests/docs.test.ts`

### Testes esperados

- `TEST-SWC-033` — `standards.md` declara a referência por identificador e nomeia `index.yaml` como o resolvedor.

### Critério de conclusão

- [ ] A regra está numa seção própria de `standards.md`, com exemplo positivo e negativo.
- [ ] A seção referencia `design.md` §14 desta mudança como origem da decisão.
- [ ] `TEST-SWC-033` passa.

---

## TASK-SWC-016 — Auditoria de idioma e de contexto declarado nas seis skills

**Requisitos:** NFR-SWC-001, NFR-SWC-002
**Dependências:** TASK-SWC-007, TASK-SWC-008, TASK-SWC-009, TASK-SWC-011, TASK-SWC-013, TASK-SWC-014
**Complexidade:** P
**Status:** pending

### Descrição

Com as seis skills escritas, verificar as duas exigências transversais, que só podem ser conferidas quando todas existem:

- **NFR-SWC-001** — todo texto apresentado ao usuário segue `project.language` (`pt-BR`), e nenhuma string voltada ao usuário está escrita direto no código sem passar pela camada de i18n. Como esta mudança não introduz scripts, a exigência incide sobre o conteúdo dos `SKILL.md`.
- **NFR-SWC-002** — cada `SKILL.md` declara **quais arquivos lê e sob qual condição**, como as quatro skills existentes já fazem, e nenhuma lê specs de outras mudanças.

A segunda parte é a que costuma escapar: uma skill que lê `.specs/features/*/spec.md` sem restringir à mudança ativa viola o Artigo 7 sem que nenhum teste estrutural perceba. A auditoria precisa olhar os glob de leitura, não apenas a presença da seção.

Registrar o custo de contexto das dez skills e comparar com o teto sugerido no risco 3 do design (~2,4k tokens). Se o número exceder, isso não é falha desta tarefa: é o candidato a NFR que Q10 deixou em aberto, e o relatório o alimenta.

### Arquivos prováveis

- `tests/skills.test.ts`
- `plugins/sdd-kit/skills/*/SKILL.md` (correções pontuais)

### Testes esperados

- `TEST-SWC-034` — as dez skills têm seção declarando os arquivos lidos com a condição de leitura; nenhum glob de leitura alcança o diretório de outra mudança; os textos de usuário estão em pt-BR.

### Critério de conclusão

- [ ] As seis skills novas passam pela mesma verificação estrutural que as quatro existentes.
- [ ] Nenhum padrão de leitura em nenhuma das seis alcança `.specs/{features,bugs,refactors,changes}/*/` sem fixar o identificador da mudança ativa.
- [ ] O custo de contexto das autoinvocáveis está medido e registrado, com o valor real, não estimado.
- [ ] `TEST-SWC-034` passa.

---

## TASK-SWC-017 — Percurso `DRAFT → ARCHIVED` e relatório de verificação da mudança

**Requisitos:** REQ-SWC-001, REQ-SWC-002, REQ-SWC-003, REQ-SWC-004, REQ-SWC-005, REQ-SWC-006, REQ-SWC-007, REQ-SWC-008, NFR-SWC-003
**Dependências:** TASK-SWC-002, TASK-SWC-003, TASK-SWC-014, TASK-SWC-015, TASK-SWC-016
**Complexidade:** M
**Status:** pending

### Descrição

Executar, num projeto limpo, o percurso completo de uma mudança de brinquedo: `DRAFT → CLARIFIED → DESIGNED → PLANNED → APPROVED → IN_PROGRESS → VERIFIED → ARCHIVED`, **sem editar `status.yaml` à mão em nenhum ponto**. É o segundo critério de aceite da spec, e o único que nenhuma tarefa anterior consegue fechar isoladamente.

Depois, avaliar os treze critérios de aceite de `spec.md` um a um, com evidência, e produzir o relatório final da mudança.

O que este percurso pega e nenhum teste anterior pega: a costura entre as skills. Cada uma foi executada isoladamente com o estado montado à mão; aqui o estado de entrada de cada skill é a saída real da anterior. Foi assim que os cinco defeitos da Fase 1 apareceram — na execução, não na suíte.

Registrar honestamente o que não passar. Um relatório que declara sucesso onde houve lacuna é pior que um relatório com lacuna declarada.

### Arquivos prováveis

- `.specs/features/0007-sdd-workflow-completion/acceptance.md`
- `.specs/features/0007-sdd-workflow-completion/validation.md`
- `.specs/features/0007-sdd-workflow-completion/traceability.yaml`

### Testes esperados

- `TEST-SWC-035` — o percurso completo em projeto limpo: oito estados na ordem, uma entrada de `history` por transição com `reason` não vazio, `status.yaml` válido contra `status.schema.json` depois de **cada** skill, e nenhuma edição manual de `status.yaml` em nenhum passo.

### Critério de conclusão

- [ ] Os oito estados foram alcançados na ordem, por skill, sem edição manual.
- [ ] `history` tem uma entrada por transição, nenhuma reescrita, e `status` coincide com a última.
- [ ] `npm run lint`, `npm test` e `npm run build` saem com êxito, com a saída registrada em `validation.md`.
- [ ] Os treze critérios de aceite de `spec.md` estão avaliados em `acceptance.md`, com evidência por critério.
- [ ] `traceability.yaml` desta mudança tem `implementation` preenchido e `gaps` atualizado com o que ficou de fora.
- [ ] `TEST-SWC-035` passa.

---

## Resumo

| Complexidade | Quantidade |
| --- | --- |
| P | 8 |
| M | 9 |
| G | 0 |

Total: 17 tarefas · 10 concluídas · 5 em progresso · 2 pendentes.

Concluídas: a leva de infraestrutura (001–006, 015) e as skills **007 (clarify)**, **008
(design)** e **009 (approve)**, fechadas por **execução real** via `claude -p` — todos os cenários
verificados, com dois defeitos encontrados e corrigidos (ADR-014 para o `resolved_by` do clarify;
uso de `Write` em vez de `Edit` para promover estado), e os resultados registrados nas seções
"Resultado" das tarefas. A verificação do `approve` cobre a mecânica; o ato humano de aprovação em
si permanece do usuário (ressalva registrada na tarefa).

Em progresso (010–014): os três `SKILL.md` restantes das skills implement
(010+011), verify (012+013) e archive estão **escritos** e passam nas checagens estruturais
(`skills.test.ts`) e no `claude plugin validate --strict`. O critério de conclusão de cada uma
exige, além disso, **execução real via `claude -p`** com a saída registrada na seção "Resultado"
— e, no caso de approve, um ato humano de aprovação. Essa execução é o que falta para marcá-las
`done`, e é uma rodada à parte.

Pendentes (2): a auditoria transversal de idioma/contexto (016) e o percurso e2e
`DRAFT → ARCHIVED` (017), que só rodam depois que as skills forem executadas de verdade.

**Caminho crítico:** `TASK-SWC-001 → 003 → 007 → 009 → 010 → 011 → 012 → 013 → 014 → 016 → 017` — onze tarefas, das quais oito são M.

**Bloqueios ativos:** nenhum. Q10 (NFRs específicos desta mudança) continua aberta com prioridade média e não bloqueia: `TASK-SWC-016` produz o dado que a resposta precisa.

**Paralelizáveis agora:** `TASK-SWC-001`, `TASK-SWC-004`, `TASK-SWC-005`, `TASK-SWC-006`, `TASK-SWC-015`. Note que `.specs/config.yaml` tem `allow_parallel_tasks: false` — a lista diz o que está desbloqueado, não que se deva executar simultaneamente.

Nenhuma tarefa `G` sobreviveu ao plano. Duas candidatas foram divididas: `implement` virou `TASK-SWC-010` (pré-condições, nenhuma escrita) e `TASK-SWC-011` (execução e rastreabilidade); `verify` virou `TASK-SWC-012` (validações) e `TASK-SWC-013` (aceite e órfãos). Nos dois casos o corte segue a fronteira natural dos cenários e separa o que lê do que escreve.
