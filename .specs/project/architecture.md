# Arquitetura — SDD Claude Kit

Versão: 1.0 · Fonte: `PRD.md` §13, §14, §21, §22, §23.

---

## 1. Visão geral

O SDD Claude Kit é uma **camada de governança** entre a intenção do usuário e a implementação feita pelo Claude Code. Não é um serviço, não tem runtime próprio e não mantém estado fora do repositório do usuário.

```
┌─────────────────────────────────────────────┐
│                Claude Code                  │
└───────────────────┬─────────────────────────┘
                    │ carrega
┌───────────────────▼─────────────────────────┐
│              Plugin sdd-kit                 │
│  ┌────────┐ ┌────────┐ ┌───────┐ ┌────────┐ │
│  │ Skills │ │ Agents │ │ Hooks │ │Templates│ │
│  └───┬────┘ └───┬────┘ └───┬───┘ └────┬───┘ │
│      └──────────┴──────────┴──────────┘     │
│                   │ usam                    │
│              ┌────▼─────┐                   │
│              │ Scripts  │ (determinísticos) │
│              └────┬─────┘                   │
└───────────────────┼─────────────────────────┘
                    │ lê / escreve
        ┌───────────▼────────────┐
        │   .specs/ (Md + YAML)  │  ← fonte da verdade, versionada no Git
        └───────────┬────────────┘
                    │ orienta
        ┌───────────▼────────────┐
        │  Código do projeto     │
        └────────────────────────┘
```

## 2. Componentes e responsabilidades

| Componente | Responsabilidade | Não faz |
| --- | --- | --- |
| **Skills** | Orientam fluxos. Definem a sequência de passos de cada etapa do SDD e quando invocar agentes. | Não executam validação determinística. |
| **Agentes** | Tarefas cognitivas especializadas com contexto e permissões restritas. | Não decidem o fluxo; são chamados por skills. |
| **Templates** | Padronizam a forma dos documentos gerados. | Não contêm lógica. |
| **Scripts** | Validação determinística, atualização de índices, geração de relatórios. | Não geram conteúdo por IA. |
| **Hooks** | Disparam scripts em eventos do Claude Code (`PreToolUse`, `PostToolUse`). | Não contêm regra de negócio própria; delegam a scripts. |
| **CLI** (Fase 5) | Mesmos scripts, expostos para uso local e CI. | Não é requisito para usar o framework. |

### Regra de dependência

```
Hooks ──┐
Skills ─┼──▶ Scripts ──▶ .specs
Agents ─┘
CLI ────────▶ Scripts ──▶ .specs
```

Dependências fluem **para dentro**, na direção de `.specs`. Scripts não conhecem skills, agentes nem hooks. Isso mantém a lógica determinística testável de forma isolada e reutilizável pela CLI.

## 3. Máquina de estados

Estados definidos em `PRD.md` §10 / RF-004. O estado vive em `<change>/status.yaml`.

```
                 ┌──────────────────────────────────┐
                 ▼                                  │
   ┌───────┐  ┌───────────┐  ┌──────────┐  ┌────────┴┐
   │ DRAFT │─▶│ CLARIFIED │─▶│ DESIGNED │─▶│ PLANNED │
   └───┬───┘  └─────┬─────┘  └────┬─────┘  └────┬────┘
       │            │             │             │
       │            │             │             ▼
       │            │             │        ┌──────────┐
       │            │             │        │ APPROVED │
       │            │             │        └────┬─────┘
       │            │             │             ▼
       │            │             │      ┌─────────────┐    ┌─────────┐
       │            │             │      │ IN_PROGRESS │◀──▶│ BLOCKED │
       │            │             │      └──────┬──────┘    └─────────┘
       │            │             │             ▼
       │            │             │        ┌──────────┐
       │            │             │        │ VERIFIED │
       │            │             │        └────┬─────┘
       │            │             │             ▼
       │            │             │        ┌──────────┐
       │            │             │        │ ARCHIVED │
       │            │             │        └──────────┘
       └────────────┴─────────────┴──────────────────────▶ CANCELLED
```

### Transições válidas

| De | Para |
| --- | --- |
| `DRAFT` | `CLARIFIED`, `CANCELLED` |
| `CLARIFIED` | `DESIGNED`, `DRAFT`, `CANCELLED` |
| `DESIGNED` | `PLANNED`, `CLARIFIED`, `CANCELLED` |
| `PLANNED` | `APPROVED`, `DESIGNED`, `CANCELLED` |
| `APPROVED` | `IN_PROGRESS`, `PLANNED` *(reabertura invalida a aprovação)*, `CANCELLED` |
| `IN_PROGRESS` | `BLOCKED`, `VERIFIED`, `CANCELLED` |
| `BLOCKED` | `IN_PROGRESS`, `PLANNED`, `CANCELLED` |
| `VERIFIED` | `ARCHIVED`, `IN_PROGRESS` *(regressão)* |
| `ARCHIVED` | — (terminal) |
| `CANCELLED` | — (terminal) |

Regras:

- Toda transição registra `date` e `reason` em `status.yaml`.
- Transição inválida gera **aviso** nos modos `advisory`/`guided` e é **bloqueada** no modo `strict`.
- Retroceder de `APPROVED` para `PLANNED` invalida o registro de aprovação.

## 4. Modos de governança

| Modo | Skills | Hooks | Bloqueio |
| --- | --- | --- | --- |
| `advisory` | Recomendam o fluxo | Desativados | Nenhum |
| `guided` *(padrão)* | Conduzem o fluxo e pedem aprovação | Somente `PostToolUse` de validação (opcional) | Nenhum — apenas avisos |
| `strict` | Conduzem o fluxo | `PreToolUse` + `PostToolUse` | Edição de código sem spec aprovada é bloqueada |

O modo é lido de `.specs/config.yaml` (`workflow.mode`). Skills e hooks consultam a mesma fonte — não há estado duplicado.

## 5. Layout de `.specs`

```
.specs/
├── config.yaml            # configuração do framework
├── index.yaml             # índice de todas as mudanças
├── project/               # conhecimento estável do projeto
│   ├── vision.md          #   por que o projeto existe
│   ├── constitution.md    #   regras invioláveis
│   ├── context.md         #   tecnologias e comandos detectados
│   ├── architecture.md    #   este documento
│   ├── glossary.md        #   vocabulário
│   ├── standards.md       #   convenções
│   └── decisions/         #   ADRs de escopo do projeto
├── features/  bugs/  refactors/  changes/
│   └── <NNNN-slug>/
│       ├── request.md         # solicitação original, textual
│       ├── spec.md            # requisitos, cenários, critérios de aceite
│       ├── design.md          # design técnico
│       ├── tasks.md           # plano de implementação
│       ├── acceptance.md      # verificação dos critérios de aceite
│       ├── status.yaml        # estado + histórico + aprovação
│       ├── validation.md      # relatório da última verificação
│       ├── traceability.yaml  # requisito → cenário → tarefa → arquivo → teste
│       └── decisions/         # ADRs de escopo da mudança
└── archive/               # mudanças arquivadas, com a mesma estrutura
```

**Decisão:** ADRs de escopo do projeto ficam em `.specs/project/decisions/`. O PRD §13 mostra `decisions/` apenas dentro de features; ADRs como "distribuir como plugin" não pertencem a nenhuma feature. Ver `ADR-006`.

## 6. Layout do plugin

```
plugins/sdd-kit/
├── .claude-plugin/plugin.json   # manifesto
├── skills/<nome>/SKILL.md       # 13 skills (PRD §11)
├── agents/<nome>.md             # 7 agentes (PRD §12)
├── hooks/hooks.json             # opt-in
├── scripts/*.js                 # validação determinística
├── templates/                   # config, project, feature, bug, refactor, adr
└── schemas/*.schema.json        # config, status, traceability
```

O repositório é um **marketplace de plugins** do Claude Code: `.claude-plugin/marketplace.json` na raiz aponta para `plugins/sdd-kit`.

## 7. Fluxo de dados de uma mudança

```
/sdd-kit:new "…"
   │  cria NNNN-slug/, grava request.md, status.yaml=DRAFT, atualiza index.yaml
   ▼
/sdd-kit:spec        → Requirements Analyst  → spec.md
/sdd-kit:clarify     → Requirements Analyst  → spec.md + questões; status=CLARIFIED
/sdd-kit:design      → Solution Architect    → design.md + ADRs; status=DESIGNED
/sdd-kit:tasks       → Task Planner          → tasks.md + traceability.yaml; status=PLANNED
/sdd-kit:approve     → (humano)              → status.yaml.approval; status=APPROVED
/sdd-kit:implement   → Implementation Agent  → código + testes; atualiza tasks + traceability
                                               status=IN_PROGRESS (ou BLOCKED)
/sdd-kit:verify      → Test Engineer         → validation.md + acceptance.md; status=VERIFIED
/sdd-kit:review      → Spec Auditor          → relatório de divergências (não muda estado)
/sdd-kit:archive     →                       → move para archive/; status=ARCHIVED
```

`/sdd-kit:status` e `/sdd-kit:discover` são transversais e não alteram estado de mudanças.

## 8. Estratégia de contexto

O maior risco operacional é o Claude carregar contexto demais (PRD §29, risco 4). Contramedidas arquiteturais:

1. `CLAUDE.md` curto — aponta para documentos, não os inclui.
2. Cada `SKILL.md` declara **explicitamente** quais arquivos ler na sua etapa.
3. Agentes rodam em contexto próprio e retornam apenas o artefato produzido.
4. `implement` carrega: a tarefa atual, os requisitos que ela referencia, o trecho relevante do design e os arquivos prováveis. Nada mais.
5. `index.yaml` permite responder "o que existe" sem abrir nenhuma spec.

## 9. Limites explícitos

- Scripts só escrevem dentro de `.specs/` e só leem caminhos declarados em `paths`.
- Nenhum componente faz requisição de rede.
- Nenhum componente grava fora do repositório do usuário.
- Hooks nunca contêm lógica inline; apenas invocam scripts versionados.

## 10. Questões arquiteturais em aberto

| # | Questão | Impacto | Quando decidir |
| --- | --- | --- | --- |
| ~~A1~~ | ~~Scripts em JS puro ou TypeScript compilado dentro do plugin?~~ | — | **Resolvida** em `TASK-PF-011` — [ADR-007](./decisions/ADR-007-scripts-do-plugin-em-javascript.md): JS com JSDoc no plugin, TypeScript na CLI |
| A2 | Como skills invocam scripts de forma portável em Windows sem shell POSIX? | RNF-001 | Fase 4 |
| A3 | O `index.yaml` deve ser gerado ou editado? Conflitos de merge em equipe. | Colaboração | Fase 4 |
| A4 | Numeração sequencial (`0001`) gera conflito entre branches paralelos. | Colaboração | Fase 2 |

Cada questão vira um ADR quando for decidida.
