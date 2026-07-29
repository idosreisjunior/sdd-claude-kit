# Solicitação original

- **ID:** 0007-sdd-workflow-completion
- **Tipo:** feature
- **Criada em:** 2026-07-29
- **Origem:** `/sdd-kit:new` em sessão não interativa com idosreisjunior

---

## Texto da solicitação

> completar o fluxo SDD: as skills clarify, design, approve, implement, verify e archive, com máquina de estados e rastreabilidade

## Interpretação

O fluxo declarado em `CLAUDE.md` vai de `new` até `archive`. Hoje existem quatro
skills: `init`, `new`, `spec` e `tasks`. Uma mudança consegue chegar a `PLANNED`
e para ali — não há caminho para `APPROVED`, `IN_PROGRESS`, `VERIFIED` ou
`ARCHIVED`. A solicitação pede as seis skills que faltam, mais os dois
mecanismos que as atravessam: a máquina de estados que decide quais transições
são válidas, e a rastreabilidade que precisa continuar verdadeira depois de
`tasks`.

Duas inferências foram necessárias e estão registradas como hipóteses na spec:
que cada skill promove exatamente o estado homônimo, e que as transições válidas
já estão declaradas em `.specs/project/architecture.md` — esta mudança as
implementa em vez de redefini-las.

## O que esta mudança entrega

As seis skills nomeadas (`clarify`, `design`, `approve`, `implement`, `verify`,
`archive`), a máquina de estados que valida as transições entre os dez estados
existentes, e a manutenção da matriz de rastreabilidade ao longo dessas etapas.

## O que esta mudança deliberadamente não entrega

- **A CLI (`packages/cli/`)** — está alocada à Fase 5 e não foi citada no pedido.
- **A tradução para `en`** — entrega da Fase 6, conforme `CLAUDE.md`.
- **Skills não nomeadas no pedido** (por exemplo `status` ou `validate`) — o
  pedido enumerou seis; acrescentar uma sétima seria expandir escopo por conta
  própria. Se a máquina de estados exigir um script de validação, ele entra como
  componente interno, não como skill nova.
- **Novos agentes e hooks** — não citados; ver a hipótese correspondente na spec.

## Restrições conhecidas

- Identificadores nunca são reutilizados nem renumerados (`standards.md` §2), o
  que vale para os estados já publicados: esta mudança não pode renomear
  `CLARIFIED`, `DESIGNED` e os demais.
- Os dez estados válidos já estão fixados em
  `plugins/sdd-kit/schemas/status.schema.json` com `additionalProperties: false`.
- `.specs/config.yaml` declara `workflow.require_approval: true`,
  `require_tests: true` e `require_traceability: true` — as skills de aprovação
  e verificação precisam respeitar essas chaves.
- O modo `strict` ainda não está implementado (Fase 1); as skills novas não podem
  fingir bloqueios que ele exerceria.
- Existem cinco bugs em aberto (`0002`–`0006`) sobre os artefatos que estas
  skills vão manipular. Nenhum é resolvido aqui.
