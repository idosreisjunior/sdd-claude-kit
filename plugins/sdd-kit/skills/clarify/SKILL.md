---
name: clarify
description: Resolve as ambiguidades de uma spec. Registra as respostas às questões pendentes, movendo-as para as questões resolvidas em spec.md e para resolved_questions em status.yaml, e promove a mudança de DRAFT para CLARIFIED quando nenhuma questão crítica continua em aberto. Não inventa respostas — uma questão sem resposta humana permanece em aberto. Use quando o usuário pedir /sdd-kit:clarify, quiser resolver as dúvidas de uma spec, ou destravar uma mudança presa em DRAFT.
when_to_use: Gatilhos — "/sdd-kit:clarify", "resolver as questões", "clarificar a spec", "tirar as dúvidas de X". Exige uma mudança com requisitos já escritos em spec.md.
argument-hint: "<id-da-mudança>"
disable-model-invocation: false
allowed-tools: Read Glob Grep
disallowed-tools: Edit NotebookEdit
---

# /sdd-kit:clarify — resolver ambiguidades

Transforma as questões pendentes de uma spec em decisões registradas, e promove a mudança para `CLARIFIED` quando não resta ambiguidade crítica.

`disable-model-invocation: false` é deliberado: `clarify` resolve questões a partir de respostas dadas na conversa e não age sobre decisão irreversível. Ver ADR-008.

## A regra que governa esta skill

**Não inventar respostas.** Uma questão só sai da lista de pendentes quando o usuário a responde — na conversa ou na própria spec. Preencher uma questão com o que parece razoável é o mesmo defeito que o Artigo 2 proíbe para requisitos: uma suposição com aparência de decisão. Se a resposta não veio, a questão permanece, e a mudança não sai de `DRAFT` enquanto houver questão crítica aberta.

## Modo de governança

Leia `workflow.mode` de `.specs/config.yaml` antes de agir.

| Modo | Comportamento desta skill |
| --- | --- |
| `advisory` | Informa as questões abertas e as respostas registradas; **nunca** bloqueia nem exige confirmação |
| `guided` *(padrão)* | Exige resposta explícita antes de resolver uma questão e confirmação antes de promover a `CLARIFIED` |
| `strict` | **Ainda não implementado na Fase 1.** Informe isso ao usuário e opere como `guided` |

Nunca finja um bloqueio que não existe. Dizer que o modo `strict` impediu algo, quando ele não está implementado, é pior que não ter o modo — cria confiança em uma proteção ausente.

## Arquivos que esta skill lê

| Quando | O quê |
| --- | --- |
| Sempre | `.specs/config.yaml` — idioma e modo |
| Sempre | `<dir-da-mudança>/spec.md` — as questões pendentes e os requisitos |
| Sempre | `<dir-da-mudança>/status.yaml` — estado atual, `blocked_by` e `resolved_questions` |
| Se existir | `.specs/project/glossary.md` — para usar os termos do domínio nas respostas |

**Não leia as specs de outras mudanças** (Art. 7). A clarificação é sobre esta spec e as respostas dadas para ela.

---

## Procedimento

### 1. Localizar a mudança e as questões

O argumento é o identificador (`0002-customer-registration`). Se `spec.md` não tiver nenhum requisito, pare e sugira `/sdd-kit:spec` primeiro — não há o que clarificar sem requisitos.

Liste as questões pendentes com a sua prioridade. Uma questão **crítica** (segurança, dados pessoais, dinheiro, contrato público, arquitetura) bloqueia a saída de `DRAFT` até ser respondida.

### 2. Registrar apenas o que foi respondido

Para cada questão que o usuário respondeu:

- Mova-a de "Questões pendentes" para uma seção "Questões resolvidas" em `spec.md`, com a resposta.
- Acrescente uma entrada em `resolved_questions` de `status.yaml`, com `question`, `date` (entre aspas), `resolved_by` e `summary` (`SCN-SWC-001`).
- Se a questão estava em `blocked_by`, remova-a de lá.

Questão não respondida **permanece** pendente. Não a resolva por dedução.

### 3. Avaliar a transição

Se **nenhuma** questão crítica continua em aberto, a mudança pode ir de `DRAFT` para `CLARIFIED`. Antes de escrever, verifique que a transição existe no grafo — a fonte é `${CLAUDE_PLUGIN_ROOT}/schemas/workflow.json` (`DRAFT → CLARIFIED` é válida).

Se ainda houver questão crítica sem resposta, **mantenha `DRAFT`** e reporte a questão por identificador e severidade (`SCN-SWC-009`). Não promova porque "as demais foram respondidas" — basta uma crítica aberta para bloquear.

**Refinar não é transicionar.** Uma segunda passagem que responde questões não críticas com a mudança já em `CLARIFIED` **não** gera uma nova entrada em `history`.

### 4. Escrever, na ordem certa

Ao promover: **acrescente** uma entrada a `history` com `status: CLARIFIED`, `date` e `reason` não vazio, sem reescrever as anteriores (`SCN-SWC-016`). O `status` do topo passa a coincidir com a última entrada.

Ordem de escrita: primeiro os artefatos (`spec.md`), depois `status.yaml`, e `.specs/index.yaml` por último. Uma falha no meio deixa o índice atrasado, nunca adiantado.

### 5. Reportar

```
✔ Clarificação — 0002-customer-registration

  Resolvidas   2   (Q1, Q3)
  Em aberto    1   [crítica] Q5 — quem pode excluir um cliente?

  Status: DRAFT — 1 questão crítica em aberto, não promovido.
```

Diga o número de questões ainda abertas **antes** do resumo. Uma mudança com uma questão crítica em aberto não está clarificada, e o relatório não pode dar a impressão contrária.

---

## Erros

```
✖ [clarify] Mudança sem requisitos
  Arquivo: .specs/features/0002-customer-registration/spec.md
  Correção: escreva os requisitos com /sdd-kit:spec antes de clarificar.
```
