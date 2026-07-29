# Exemplo — API Node.js

Projeto de referência do **SDD Claude Kit**. Uma API mínima, sem dependências,
com o fluxo da Fase 1 já executado e os artefatos versionados.

O ponto deste exemplo não é a API. É **o que o framework produz** — e,
principalmente, o que ele produz quando a solicitação é vaga.

---

## O projeto

```
src/server.js        servidor HTTP, despacha para as rotas
src/routes/health.js rota /health
tests/health.test.js testes com o runner nativo do Node
```

```bash
npm test     # node --test
npm start    # http://localhost:3000/health
```

Sem dependências: só a biblioteca padrão do Node 20+.

## O que foi executado

```
/sdd-kit:init
/sdd-kit:new feature "criar cadastro de clientes"
/sdd-kit:spec  0001-customer-registration
/sdd-kit:tasks 0001-customer-registration
```

## O que foi gerado

```
.specs/
├── config.yaml                          modo guided, comandos detectados
├── index.yaml                           uma mudança, next_id 2
├── project/
│   ├── context.md                       ← diagnóstico da descoberta
│   ├── architecture.md                  ← lido do código, com 3 questões
│   ├── constitution.md                  ← 10 artigos, prontos
│   ├── standards.md                     ← convenções observadas + questões
│   ├── glossary.md                      ← termos do método prontos
│   └── vision.md                        ← quase só questões, de propósito
└── features/0001-customer-registration/
    ├── request.md                       a solicitação literal
    ├── spec.md                          2 cenários, 6 questões
    ├── tasks.md                         5 tarefas, 2 delas são decisões
    ├── status.yaml                      DRAFT, 3 bloqueios críticos
    └── traceability.yaml                implementation vazio
```

---

## As três coisas que este exemplo demonstra

### 1. Lacuna não vira palpite

A solicitação foi **cinco palavras**: *"criar cadastro de clientes"*.

O resultado é uma spec com **2 requisitos e 6 questões em aberto** — três delas
críticas. Não há requisito sobre campos, unicidade ou permissões, porque nada
disso foi dito.

Um assistente sem esse processo produziria seis requisitos plausíveis: e-mail
obrigatório, CPF único, resposta 201. Todos razoáveis, nenhum pedido. O erro só
apareceria na revisão de código, quando já houvesse implementação.

Ver `spec.md`, seção "Questões pendentes".

### 2. "Não detectado" é diferente de "aprovado"

`config.yaml` registra:

```yaml
commands:
  lint: null      # este projeto não tem linter
  test: npm test  # detectado em package.json
  build: null
```

A descoberta **não** inventou `npm run lint` por ser um projeto Node. Um comando
presumido faria a verificação reportar sucesso sobre nada.

Ver `context.md`, seção "Comandos".

### 3. O estado não avança por conveniência

A mudança continua em `DRAFT`, mesmo com o plano de tarefas pronto. Dois motivos,
ambos registrados em `tasks.md`:

- Três questões **críticas** seguem sem resposta.
- `DRAFT → PLANNED` é transição **inválida**: pula `CLARIFIED` e `DESIGNED`.

O plano foi gravado assim mesmo — ele tem valor independentemente do estado, e
suas duas primeiras tarefas são justamente as que destravam o resto.

---

## Como continuar

As duas primeiras tarefas são **decisões**, não código:

| Tarefa | Decide |
| --- | --- |
| `TASK-CUST-001` | Onde os clientes são armazenados (ADR) |
| `TASK-CUST-002` | Quem pode cadastrar (ADR) |

Respondidas essas, `/sdd-kit:spec` volta para incorporar as decisões, e o plano
é regerado sobre requisitos reais.

> As skills `clarify`, `design`, `approve`, `implement`, `verify` e `archive`
> chegam na Fase 2 — ver o [ROADMAP](../../ROADMAP.md).
