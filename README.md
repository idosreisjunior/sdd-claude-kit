# SDD Claude Kit

> Framework open source de **Spec-Driven Development** para [Claude Code](https://claude.com/claude-code).

[![CI](https://github.com/idosreisjunior/sdd-claude-kit/actions/workflows/ci.yml/badge.svg)](https://github.com/idosreisjunior/sdd-claude-kit/actions/workflows/ci.yml)
[![License: Apache 2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](./LICENSE)
[![Status](https://img.shields.io/badge/status-fase%201%20%C2%B7%20plugin%20m%C3%ADnimo-yellow.svg)](./ROADMAP.md)

**Status atual: Fase 2 em andamento.** O plugin é instalável, com as skills `init`, `new`, `spec` e `tasks` prontas (Fase 1) e mais seis — `clarify`, `design`, `approve`, `implement`, `verify`, `archive` — já escritas e **em validação por execução real** (Fase 2). Acompanhe o [ROADMAP](./ROADMAP.md).

---

## O problema

Claude Code escreve muito código, muito rápido. Em projetos complexos isso vira um problema quando tudo acontece só na conversa:

- Requisitos espalhados por várias sessões.
- Implementação começando antes de a regra de negócio estar clara.
- Decisões importantes perdidas entre sessões.
- Nenhuma rastreabilidade entre requisito, código e teste.
- Dificuldade para retomar um projeto grande semanas depois.

## A proposta

O SDD Claude Kit coloca uma camada de governança entre a sua intenção e a implementação do Claude. Especificações, decisões, tarefas e critérios de aceite viram **artefatos versionados no Git**, dentro de `.specs/`, ao lado do código.

```
Solicitação → Descoberta → Especificação → Clarificação → Design
    → Tarefas → Aprovação humana → Implementação → Verificação
        → Rastreabilidade → Arquivamento
```

## Fluxo de uso (alvo da v1)

```bash
/sdd-kit:init
/sdd-kit:new feature "criar cadastro de clientes"
/sdd-kit:clarify 0001-customer-registration
/sdd-kit:design   0001-customer-registration
/sdd-kit:tasks    0001-customer-registration
/sdd-kit:approve  0001-customer-registration
/sdd-kit:implement 0001-customer-registration
/sdd-kit:verify   0001-customer-registration
/sdd-kit:archive  0001-customer-registration
```

Resultado: specs versionadas, código implementado, testes relacionados, decisões documentadas (ADRs), matriz de rastreabilidade e relatório de validação.

## Modos de governança

| Modo | O que faz |
| --- | --- |
| `advisory` | Recomenda o processo. Nada é bloqueado. |
| `guided` *(padrão)* | Orienta o fluxo, pede aprovação antes de implementar, alerta inconsistências. |
| `strict` | Hooks bloqueiam operações fora do fluxo. Implementação exige spec aprovada. |

Adoção é gradual: comece em `advisory` e aumente o controle quando fizer sentido.

## Princípios

- **Especificar antes de implementar.**
- **Aprovação humana** nos checkpoints que importam.
- **Specs como fonte da verdade** — não o histórico da conversa.
- **Contexto sob demanda** — nada de carregar o repositório inteiro.
- **Funciona em projeto novo e em projeto legado.**
- **Segurança por padrão** — hooks que bloqueiam ou executam comandos são opcionais.

## Estrutura gerada em `.specs`

```
.specs/
├── config.yaml            # configuração do framework
├── index.yaml             # índice de todas as mudanças
├── project/               # visão, constituição, contexto, arquitetura, glossário, padrões
├── features/0001-.../     # request, spec, design, tasks, acceptance, status, traceability, ADRs
├── bugs/  refactors/  changes/
└── archive/
```

Tudo em Markdown e YAML: legível e editável **sem** o plugin.

## Instalação

O repositório é um marketplace de plugins do Claude Code. Dentro de uma sessão do Claude Code:

```
/plugin marketplace add idosreisjunior/sdd-claude-kit
/plugin install sdd-kit@sdd-claude-kit
```

Ou pelo terminal:

```bash
claude plugin marketplace add idosreisjunior/sdd-claude-kit
claude plugin install sdd-kit@sdd-claude-kit
```

Para testar a partir de um clone local, use um caminho iniciado por `./`:

```bash
git clone https://github.com/idosreisjunior/sdd-claude-kit.git
claude plugin marketplace add ./sdd-claude-kit
claude plugin install sdd-kit@sdd-claude-kit
```

Confirme com `claude plugin details sdd-kit` — devem aparecer dez skills.

> **Estado atual:** `init`, `new`, `spec` e `tasks` estão prontas; `clarify`, `design`, `approve`, `implement`, `verify` e `archive` já foram escritas e estão em validação por execução real (Fase 2). Veja o [ROADMAP](./ROADMAP.md).

### Desinstalar

```bash
claude plugin uninstall sdd-kit@sdd-claude-kit
claude plugin marketplace remove sdd-claude-kit
```

O diretório `.specs/` do seu projeto permanece: é Markdown e YAML, legível e editável sem o plugin.

## Documentação

**Comece aqui:**

- [Instalação](./docs/pt-BR/instalacao.md) — instalar, verificar, desinstalar, e o que o plugin faz na sua máquina
- [Sua primeira feature](./docs/pt-BR/primeira-feature.md) — tutorial de dez minutos, do zero até um plano de tarefas
- [Exemplo completo](./examples/node-api/) — API Node.js com o fluxo já executado e os artefatos versionados

**Referência:**

- [PRD](./PRD.md) — requisitos completos do produto
- [ROADMAP](./ROADMAP.md) — fases e entregas
- [CONTRIBUTING](./CONTRIBUTING.md) — como contribuir
- [SECURITY](./SECURITY.md) — política de segurança

> `docs/en/` está vazio: a tradução é entrega da Fase 6.

## Não objetivos

Não é uma IDE, não substitui o Claude Code, não é SaaS, não substitui Jira/Linear/GitHub Projects, não hospeda seu código, não coleta telemetria.

## Licença

[Apache 2.0](./LICENSE)
