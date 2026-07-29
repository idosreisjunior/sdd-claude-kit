# ADR-013 — Semântica da máquina de estados: bloqueio, regresso e política

- **Status:** Aceito
- **Data:** 2026-07-29
- **Origem:** questões Q3, Q4 e Q11 de `0007-sdd-workflow-completion`
- **Decidido em:** refinamento da `0007`

## Contexto

Três questões apontavam para o mesmo grafo, e respondê-las separadamente produziria regras que se contradizem.

O grafo de `architecture.md` §3 permite `BLOCKED` **apenas a partir de `IN_PROGRESS`**. Mas os artefatos deste repositório mostram outra coisa:

| Mudança | Estado | Bloqueios registrados |
| --- | --- | --- |
| `0001-plugin-foundation` | `DESIGNED` | Passou a maior parte da vida com `blocked_by` preenchido |
| `0003-spec-expande-escopo` | `DRAFT` | 1 bloqueio ativo agora |
| `0007-sdd-workflow-completion` | `CLARIFIED` | 3 questões críticas, até serem resolvidas |

Nenhuma delas transicionou para `BLOCKED`, e nenhuma estava errada. Isso revela que o campo `blocked_by` e o estado `BLOCKED` são **conceitos diferentes** que o grafo tratava como um só.

## Decisão

### 1. `blocked_by` é registro; `BLOCKED` é interrupção

| | Significa | Quando |
| --- | --- | --- |
| Campo `blocked_by` | Existem questões abertas que impedem **avançar** | Qualquer estado. É o normal em `DRAFT` |
| Estado `BLOCKED` | O trabalho **parou**, esperando algo externo | Só durante implementação |

Uma mudança em `DRAFT` com três questões críticas não está `BLOCKED` — está sendo elaborada, e é exatamente para isso que `DRAFT` existe. `BLOCKED` é para quando havia trabalho em curso e ele parou.

**Consequência:** `BLOCKED` continua alcançável apenas de `IN_PROGRESS`. O grafo estava certo; o que faltava era a distinção documentada.

### 2. `CANCELLED` a partir de qualquer estado não terminal

Já era assim na prática. Fica explícito: qualquer estado exceto `ARCHIVED` e `CANCELLED` pode ir para `CANCELLED`, que é terminal. Cancelar não exige passar por estado nenhum — uma mudança pode ser descontinuada em `DRAFT` como em `APPROVED`.

### 3. Regresso detecta, não muta

Uma spec alterada depois de `APPROVED` tem o hash divergente do `approval.revision` ([ADR-011](./ADR-011-identidade-e-invalidacao-da-aprovacao.md)). A aprovação está **vencida**.

O framework **não** regride o estado automaticamente. Ele detecta, reporta, e recusa avançar: `implement` exige aprovação válida e para quando o hash não bate.

Regredir sozinho seria o framework reescrevendo o histórico da mudança sem que ninguém decidisse. A transição de volta existe no grafo — `APPROVED → PLANNED` — e é um ato humano.

### 4. Estrutura e política são coisas separadas

`workflow.json` descreve o que é **estruturalmente possível**. `config.yaml` decide o que é **permitido**.

`PLANNED → IN_PROGRESS` existe no grafo, sempre. Com `require_approval: true`, `implement` recusa e exige passar por `APPROVED`. Com `false`, aceita.

O grafo não muda conforme a configuração. Um arquivo de dados que se reescreve por política deixa de ser verificável — e a verificação é a razão de ele existir ([ADR-010](./ADR-010-maquina-de-estados-como-dado.md)).

## Alternativas consideradas

| Alternativa | Por que não |
| --- | --- |
| **`BLOCKED` a partir de qualquer estado** | Confunde "tem pergunta aberta" com "parou". Toda mudança em `DRAFT` viraria `BLOCKED`, e o estado perderia significado |
| **Remover `blocked_by` e usar só o estado** | Perde a informação de *o que* bloqueia, que é o que permite fechar a questão |
| **Regredir o estado automaticamente ao detectar spec alterada** | O framework mutaria histórico sem decisão humana. E um typo na spec regrediria uma mudança aprovada |
| **Grafo variável conforme `require_approval`** | Torna `workflow.json` dependente de configuração e a validação deixa de ser determinística |

## Consequências

**Positivas**

- O grafo atual sobrevive intacto: a correção era de documentação, não de estrutura.
- `implement` ganha um contrato claro: aprovação válida é pré-condição, e "válida" tem definição mecânica.
- `workflow.json` fica estático e testável.

**Negativas**

- Um usuário pode ficar em `DRAFT` indefinidamente com bloqueios acumulados, sem que nenhum estado sinalize isso. **Mitigação:** `/sdd-kit:status` reporta bloqueios por mudança, independentemente do estado.
- A distinção entre campo e estado é sutil e vai ser confundida. **Mitigação:** vai para o `glossary.md` do template, não só para este ADR.

## Limite desta decisão

Detectar aprovação vencida depende de `implement` **consultar** o hash. Nada impede alguém de editar `status.yaml` à mão e escrever o hash novo.

O grafo e o hash protegem contra erro e desatenção, não contra quem decide burlar. Aplicação real depende dos hooks do modo `strict`, na Fase 4 — e mesmo eles são desativáveis por quem tem acesso ao repositório.
