# Sua primeira feature

Tutorial do fluxo da Fase 1: de um projeto sem `.specs/` até um plano de tarefas.

Leva cerca de dez minutos. Pré-requisito: [instalação](./instalacao.md) concluída.

> **Sobre os exemplos deste guia.** Os artefatos mostrados são os arquivos reais
> de [`examples/node-api`](../../examples/node-api/) — você pode abri-los e
> conferir. Os blocos de saída de console descrevem o que cada skill reporta
> conforme sua instrução; o texto exato varia, porque quem redige a resposta é
> o Claude, não um programa.

---

## O projeto de partida

Uma API Node.js mínima, sem dependências:

```
customer-api/
├── package.json      scripts: start, test
├── src/server.js
├── src/routes/health.js
└── tests/health.test.js
```

Note o que **não** existe: nenhum linter, nenhuma persistência, nenhuma
autenticação. Isso vai importar.

---

## 1. Inicializar

```
/sdd-kit:init
```

A skill lê os manifestos da raiz, a estrutura de diretórios e o `.gitignore` —
**não** abre o código-fonte. Depois apresenta o diagnóstico e **espera sua
revisão** antes de escrever qualquer coisa:

```
Diagnóstico — customer-api

  Linguagem            JavaScript (ESM)   (detectado: "type": "module")
  Gerenciador          npm                (hipótese: sem lockfile)
  Código-fonte         src
  Testes               tests
  Build                não detectado
  Teste                npm test           (package.json, scripts.test)
  Lint                 não detectado

Modo: guided   Idioma: pt-BR

Serão criados 9 arquivos em .specs/. Nenhum arquivo existente será alterado.
Confirma, ou quer corrigir algo antes?
```

### O detalhe que importa

`lint` ficou **não detectado**, e o `config.yaml` registra:

```yaml
commands:
  lint: null
  test: npm test
  build: null
```

O projeto não tem linter, e a skill **não inventou** `npm run lint` por ser um
projeto Node. Um comando presumido faria a verificação reportar sucesso sobre
nada.

`null` significa *não executado* — nunca *aprovado*.

### O que foi criado

```
.specs/
├── config.yaml
├── index.yaml
└── project/
    ├── context.md        ← o diagnóstico acima, por escrito
    ├── architecture.md   ← lida do código
    ├── constitution.md   ← dez artigos, prontos
    ├── standards.md      ← convenções observadas
    ├── glossary.md       ← vocabulário do método
    └── vision.md         ← quase só perguntas
```

Abra o [`vision.md`](../../examples/node-api/.specs/project/vision.md). Ele está
quase vazio, com questões em aberto no lugar do texto:

```markdown
## Por que este projeto existe

> QUESTÃO: que problema esta API resolve, e para quem? O código não responde
> isso, e preencher com "expor dados de clientes via HTTP" seria descrever a
> solução, não o problema.
```

Isso é deliberado. A descoberta lê código; código não diz *por quê*. Um
documento de visão preenchido com generalidades parece pronto e ninguém revisa.

---

## 2. Criar a mudança

```
/sdd-kit:new feature "criar cadastro de clientes"
```

Antes de criar qualquer diretório, a skill confirma o identificador — porque ele
é **permanente**:

```
Descrição:  "criar cadastro de clientes"
Slug:       customer-registration
Escopo:     CUST        →  REQ-CUST-001, TASK-CUST-001, …

Confirma?
```

O slug é em inglês mesmo com solicitação em português: nomes de diretório seguem
a regra de código. E dele deriva o escopo de todos os identificadores da
mudança. Identificadores nunca são renumerados — por isso a confirmação vem
antes, não depois.

Criados: `request.md`, `spec.md` inicial e `status.yaml` em `DRAFT`, mais a
entrada em `index.yaml`.

O [`request.md`](../../examples/node-api/.specs/features/0001-customer-registration/request.md)
guarda o pedido **literal**, sem melhorias — é o registro fiel do que foi pedido,
para comparar quando algo der errado.

---

## 3. Elaborar os requisitos

```
/sdd-kit:spec 0001-customer-registration
```

**Aqui está o ponto do framework inteiro.** A solicitação tinha cinco palavras.
Veja o que a skill produziu:

| | |
| --- | --- |
| Requisitos funcionais | **1** |
| Cenários | **2** |
| Requisitos não funcionais | **0** |
| Questões em aberto | **6** — três críticas |

As questões ([spec.md](../../examples/node-api/.specs/features/0001-customer-registration/spec.md)):

| # | Questão | Prioridade |
| --- | --- | --- |
| Q1 | Onde os clientes são armazenados? O projeto não tem persistência | **Crítica** |
| Q2 | Quem pode cadastrar? Não há autenticação | **Crítica** |
| Q3 | Quais campos compõem um cliente, e quais são obrigatórios? | **Crítica** |
| Q4 | Cliente é pessoa física, empresa, ou os dois? | Alta |
| Q5 | Existe regra de unicidade — e-mail, CPF, CNPJ? | Alta |
| Q6 | A resposta de erro deve indicar qual campo falhou? | Média |

E a seção de requisitos não funcionais diz, textualmente:

> A solicitação não trouxe exigência de desempenho, segurança ou
> compatibilidade, e o projeto não tem padrão que imponha alguma. Preencher esta
> seção por simetria com a de requisitos funcionais seria inventar escopo.

### Por que isso é o resultado certo

Um assistente sem esse processo produziria seis requisitos plausíveis: e-mail
obrigatório, CPF único, resposta 201, senha com oito caracteres. Todos
razoáveis. **Nenhum pedido.**

Você só descobriria na revisão de código — quando já houvesse implementação em
cima de regras que ninguém decidiu.

Uma spec com um requisito real e seis perguntas é o resultado honesto de uma
solicitação de uma linha.

---

## 4. Planejar

```
/sdd-kit:tasks 0001-customer-registration
```

A skill avisa antes de planejar sobre regras indefinidas, e gera o plano mesmo
assim se você confirmar — o plano tem valor, e suas duas primeiras tarefas são
justamente as que destravam o resto:

| Tarefa | O que é |
| --- | --- |
| `TASK-CUST-001` | **Decisão:** onde armazenar clientes (ADR) |
| `TASK-CUST-002` | **Decisão:** quem pode cadastrar (ADR) |
| `TASK-CUST-003` | Modelo de cliente, com validação |
| `TASK-CUST-004` | A rota de cadastro |
| `TASK-CUST-005` | Atualizar a documentação |

As duas primeiras não escrevem código. A feature força escolhas arquiteturais
que o projeto ainda não fez, e o plano expõe isso em vez de contorná-lo.

### O estado não avança

A mudança **continua em `DRAFT`**, com o plano pronto. Dois motivos, ambos
registrados em [`tasks.md`](../../examples/node-api/.specs/features/0001-customer-registration/tasks.md):

1. Três questões críticas sem resposta.
2. `DRAFT → PLANNED` é transição **inválida** — pula `CLARIFIED` e `DESIGNED`.

O framework avisa e pede confirmação explícita em vez de promover em silêncio.
Se você confirmar, o salto fica registrado no motivo da transição, para o
histórico não parecer um fluxo normal.

---

## O que você tem agora

```
.specs/features/0001-customer-registration/
├── request.md          o pedido, literal
├── spec.md             1 requisito, 2 cenários, 6 questões
├── tasks.md            5 tarefas, 2 delas decisões
├── status.yaml         DRAFT, 3 bloqueios críticos
└── traceability.yaml   requisito → cenário → tarefa → teste
```

Tudo em Markdown e YAML, versionado no Git, legível sem o plugin.

## Como continuar

Responda Q1, Q2 e Q3 — as três críticas. Depois rode `/sdd-kit:spec` de novo:
ele **preserva** os identificadores existentes e continua a numeração a partir
do maior, para que nada que apontava para `REQ-CUST-001` quebre.

As skills que fecham o ciclo — `clarify`, `design`, `approve`, `implement`,
`verify`, `archive` — chegam na Fase 2. Ver o [ROADMAP](../../ROADMAP.md).

---

## Adotando aos poucos

Comece em `advisory`:

```
/sdd-kit:init --mode advisory
```

Nesse modo o framework informa e **nunca** bloqueia. Quando o processo já fizer
sentido para a equipe, mude `workflow.mode` em `.specs/config.yaml` para
`guided`.

O modo `strict` — o único que bloqueia de fato — depende de hooks e chega na
Fase 4.
