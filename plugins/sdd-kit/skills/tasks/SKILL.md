---
name: tasks
description: Decompõe uma especificação em tarefas pequenas e verificáveis, ordenadas por dependência e vinculadas a requisitos. Gera tasks.md e a matriz de rastreabilidade inicial, reporta requisitos sem cobertura e dependências inválidas, e promove a mudança para PLANNED. Use quando o usuário pedir /sdd-kit:tasks, quiser planejar a implementação de uma mudança já especificada, ou quebrar uma spec em passos.
when_to_use: Gatilhos — "/sdd-kit:tasks", "planejar a implementação", "quebrar em tarefas", "gerar o plano". Exige uma mudança com requisitos já escritos em spec.md.
argument-hint: "<id-da-mudança>"
disable-model-invocation: false
allowed-tools: Read Glob Grep
disallowed-tools: Edit NotebookEdit
---

# /sdd-kit:tasks — planejar a implementação

Transforma requisitos em um plano executável, tarefa por tarefa, e estabelece a rastreabilidade que todo o resto do fluxo vai manter.

`disable-model-invocation: false` é deliberado: `tasks` produz um plano revisável e não age sobre nenhuma decisão humana. Ver [ADR-008](../../../../.specs/project/decisions/ADR-008-autoinvocacao-de-skills.md).

## Modo de governança

Leia `workflow.mode` de `.specs/config.yaml` antes de agir.

| Modo | Comportamento desta skill |
| --- | --- |
| `advisory` | Informa requisitos descobertos e transições inválidas; **nunca** bloqueia nem exige confirmação |
| `guided` *(padrão)* | Exige aceite explícito para requisito descoberto e para transição de estado inválida |
| `strict` | **Ainda não implementado na Fase 1.** Informe isso ao usuário e opere como `guided` |

Nunca finja um bloqueio que não existe. Dizer que o modo `strict` impediu algo, quando ele não está implementado, é pior que não ter o modo — cria confiança em uma proteção ausente.

## Arquivos que esta skill lê

| Quando | O quê |
| --- | --- |
| Sempre | `${CLAUDE_PROJECT_DIR}/.specs/config.yaml` — idioma e modo |
| Sempre | `<dir-da-mudança>/spec.md` — requisitos, cenários, questões em aberto |
| Sempre | `<dir-da-mudança>/status.yaml` — estado atual, para avaliar a transição |
| Se existir | `<dir-da-mudança>/tasks.md` — plano atual, para preservar identificadores |
| Se existir | `<dir-da-mudança>/design.md` — decisões técnicas que orientam a decomposição |
| Se existir | `.specs/project/architecture.md` e `context.md` — estrutura do projeto, para prever arquivos |
| Se existir | `.specs/project/standards.md` — convenções de identificador |

**Não abra o código-fonte para refinar "arquivos prováveis".** Esse campo é uma previsão declarada, não um contrato. Abrir a árvore para torná-lo preciso custa contexto e produz falsa confiança: a implementação vai descobrir o que a leitura não mostraria. Listagem de diretórios basta.

---

## Procedimento

### 1. Localizar a mudança e verificar se há o que planejar

Se `spec.md` não tiver nenhum requisito `REQ-*` ou `NFR-*`, pare. Não há o que decompor. Sugira `/sdd-kit:spec <id>` primeiro.

Se houver **questões críticas em aberto**, informe antes de continuar. Planejar sobre uma regra de negócio indefinida produz tarefas que serão refeitas — o usuário pode escolher seguir, mas com esse custo declarado.

### 2. Inventariar identificadores existentes

Extraia de `tasks.md` os `TASK-*` e `TEST-*` já usados. **Nunca reutilize nem renumere** (`standards.md` §2). Numeração nova continua a partir do maior existente.

O escopo vem do slug da mudança: `0002-customer-registration` → `TASK-CUST-001`.

Tarefas que deixaram de fazer sentido são marcadas, não apagadas:

```
## TASK-CUST-004 — Importar clientes via CSV  `REMOVIDA`

> Removida em 2026-07-29: requisito movido para 0007-bulk-import.
```

### 3. Decompor

Uma tarefa é pequena quando tem **resultado verificável**. O teste operacional: se você não consegue escrever o critério de conclusão, a tarefa está grande demais ou mal definida — divida antes de escrever.

Cada tarefa declara os dez campos de RF-007:

| Campo | Regra |
| --- | --- |
| Identificador | `TASK-<ESCOPO>-NNN` |
| Título | O resultado, não a atividade |
| Descrição | O suficiente para alguém executar sem reler a spec inteira |
| Requisitos | Ao menos um `REQ-*` ou `NFR-*`. **Tarefa sem requisito é trabalho fora de escopo** |
| Dependências | Explícitas; vazio quando não houver |
| Arquivos prováveis | Previsão, não contrato |
| Testes esperados | Identificadores `TEST-*`. Se genuinamente não houver, escreva "Nenhum" e diga por quê |
| Critério de conclusão | Condições objetivas, verificáveis por outra pessoa |
| Status | `pending` |
| Complexidade | **P** ≤ meio dia · **M** ≈ 1 dia · **G** precisa ser dividida |

**Nenhuma tarefa `G` pode sobreviver ao plano.** Uma tarefa grande chegando na implementação é defeito do planejamento, não detalhe. Divida-a agora.

Ordene por dependência e produza o diagrama de ordem de execução. Marque o caminho crítico e o que é paralelizável.

### 4. Verificar a consistência do plano

Três verificações, todas obrigatórias antes de qualquer promoção de estado:

**Requisitos descobertos.** Todo `REQ-*` e `NFR-*` da spec precisa aparecer em ao menos uma tarefa. Liste os que ficaram de fora — nomeie cada um, não diga apenas "há requisitos descobertos".

**Tarefas órfãs.** Toda tarefa precisa apontar para ao menos um requisito. Uma tarefa sem requisito é trabalho que ninguém pediu.

**Dependências.** Cada dependência precisa referenciar uma tarefa que existe neste plano. Verifique também **ciclos**: se `A` depende de `B` e `B` depende de `A`, direta ou indiretamente, o plano não é executável em ordem nenhuma. Reporte o ciclo completo, não só um dos elos.

Reporte tudo que encontrar. Não corrija sozinho inventando uma tarefa para cobrir um requisito descoberto — a lacuna pode significar que o requisito é desnecessário, e essa é uma decisão do usuário.

### 5. Gerar a matriz de rastreabilidade

Crie `traceability.yaml` a partir de `${CLAUDE_PLUGIN_ROOT}/templates/<idioma>/_shared/traceability.yaml`.

Cada requisito recebe seus cenários, tarefas e testes esperados. **`implementation` fica vazio** — é preenchido durante `/sdd-kit:implement`, não agora. Preenchê-lo aqui seria afirmar que arquivos foram tocados quando nada foi implementado.

Requisitos que só podem ser verificados por revisão humana vão na seção `gaps`, com motivo e mitigação. Uma lacuna registrada é honesta; uma lacuna omitida vira cobertura aparente.

### 6. Avaliar a transição de estado

`SCN-PF-012` pede a promoção para `PLANNED`. Antes, compare o estado atual com a tabela de transições válidas de `.specs/project/architecture.md` §3.

| Estado atual | `→ PLANNED` | O que fazer |
| --- | --- | --- |
| `DESIGNED` | válida | Promover |
| `PLANNED` | — | Já está; apenas atualizar o plano |
| `DRAFT`, `CLARIFIED` | **inválida** | Ver abaixo |
| `APPROVED`, `IN_PROGRESS`, `VERIFIED` | **inválida** | Recuar de estado invalida trabalho já aprovado. Recuse e explique |
| `ARCHIVED`, `CANCELLED` | terminal | Recuse |

**Duas condições bloqueiam a promoção, independentemente do estado:** requisito descoberto e dependência inválida. Ambas exigem aceite explícito do usuário (`SCN-PF-013`) — no modo `advisory`, apenas informe.

#### Quando a transição é inválida

Na Fase 1 este é o caso normal: `clarify` e `design` chegam na Fase 2, então o fluxo `init → new → spec → tasks` alcança esta skill ainda em `DRAFT`.

A transição continua sendo **inválida**, e isso não é um detalhe burocrático. `CLARIFIED` significa ambiguidades críticas resolvidas; `DESIGNED` significa design técnico decidido. Pular os dois e declarar `PLANNED` afirma um preparo que não aconteceu — e `PLANNED` é o estado do qual `approve` parte.

Não relaxe a máquina de estados para acomodar uma limitação temporária. Aplique o comportamento já especificado em `SCN-PF-016`: avise e exija confirmação explícita.

```
⚠ Transição de estado inválida

  Atual: DRAFT        Pretendida: PLANNED
  Pulados: CLARIFIED (ambiguidades resolvidas), DESIGNED (design técnico)

  As skills clarify e design chegam na Fase 2. O plano abaixo foi montado a
  partir dos requisitos, sem design técnico — as tarefas podem mudar quando
  ele existir.

  Confirmar a promoção assim mesmo, ou manter em DRAFT?
```

Se o usuário confirmar, **registre o salto no motivo**, para que o histórico não pareça um fluxo normal:

```yaml
  - status: PLANNED
    date: "2026-07-29"
    reason: >-
      Plano gerado a partir dos requisitos. Transição DRAFT → PLANNED com
      CLARIFIED e DESIGNED pulados, confirmada pelo usuário: as skills
      correspondentes chegam na Fase 2. O plano não considera design técnico.
```

Se o usuário recusar, mantenha o estado e grave `tasks.md` mesmo assim. O plano tem valor independentemente do estado.

### 7. Atualizar os artefatos

| Arquivo | O quê |
| --- | --- |
| `<dir>/tasks.md` | O plano, a partir de `_shared/tasks.md` |
| `<dir>/traceability.yaml` | A matriz |
| `<dir>/status.yaml` | `updated`, contadores de `tasks`, e a entrada de `history` se houve promoção |
| `.specs/index.yaml` | `status` e `updated` da entrada correspondente |

Datas entre aspas. Contadores: `total = pending + in_progress + done`.

Remova as linhas `{{guia: …}}` e resolva `{{opcional: …}}` e `{{repetir: …}}`. **Nenhum `{{` pode sobrar.**

### 8. Reportar

```
✔ Plano gerado — 0002-customer-registration

  Tarefas       9    (4 P · 5 M · 0 G)
  Cobertura     4 de 4 requisitos com ao menos uma tarefa
  Rastreio      traceability.yaml criado — implementation vazio, como esperado

  Caminho crítico:  CUST-001 → CUST-003 → CUST-006 → CUST-009
  Paralelizáveis:   CUST-002, CUST-007

  Status: DRAFT → PLANNED   (transição inválida, confirmada pelo usuário)

  Próximo passo:
    /sdd-kit:approve 0002-customer-registration      — Fase 2
```

Se houve requisito descoberto, dependência inválida ou tarefa `G`, isso vem **antes** do resumo. Um plano com um requisito sem cobertura não está pronto, e o relatório não pode dar a impressão contrária.

---

## Erros

```
✖ [tasks] Requisitos sem tarefa associada
  Arquivo: .specs/features/0002-customer-registration/spec.md
  Descobertos: REQ-CUST-003, NFR-CUST-001
  Correção: crie tarefas que os cubram, ou remova os requisitos da spec se
            não forem mais necessários. Não promova a PLANNED antes disso.
```

```
✖ [tasks] Ciclo de dependências
  Arquivo: .specs/features/0002-customer-registration/tasks.md
  Ciclo: TASK-CUST-003 → TASK-CUST-005 → TASK-CUST-007 → TASK-CUST-003
  Correção: identifique qual das dependências é falsa e remova-a. Um ciclo
            torna o plano inexecutável em qualquer ordem.
```
