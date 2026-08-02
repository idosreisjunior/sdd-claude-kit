---
name: implement
description: Implementa uma tarefa aprovada, uma de cada vez. Verifica a aprovação e a validade dela antes de tocar em qualquer arquivo, seleciona a tarefa cujas dependências estão concluídas, executa-a, atualiza tasks.md e a matriz de rastreabilidade, e leva a mudança para IN_PROGRESS. Interrompe em BLOCKED diante de uma decisão arquitetural não prevista. Use quando o usuário pedir /sdd-kit:implement uma mudança aprovada, ou disser para implementar a próxima tarefa.
when_to_use: Gatilhos — "/sdd-kit:implement", "implementar a próxima tarefa", "começar a codar X". Exige uma mudança aprovada (ou require_approval false) com um plano em tasks.md.
argument-hint: "<id-da-mudança> [id-da-tarefa]"
disable-model-invocation: true
allowed-tools: Read Glob Grep
disallowed-tools: Edit NotebookEdit
---

# /sdd-kit:implement — implementar uma tarefa

Executa **uma** tarefa aprovada e mantém verdadeiros o plano e a rastreabilidade. É a primeira skill do framework com efeito colateral irreversível — por isso os portões vêm **antes** de qualquer escrita.

## Por que esta skill NÃO é autoinvocável

`disable-model-invocation: true` porque `implement` altera código e depende de uma aprovação humana válida (Art. 3). Invocá-la sozinha seria implementar sem o ato que a autoriza. Ver ADR-008.

## Modo de governança

Leia `workflow.mode` de `.specs/config.yaml` antes de agir.

| Modo | Comportamento desta skill |
| --- | --- |
| `advisory` | Informa a tarefa selecionada e os portões; **nunca** bloqueia — mas respeita `require_approval` |
| `guided` *(padrão)* | Pede confirmação da tarefa selecionada antes de executar |
| `strict` | **Ainda não implementado na Fase 1.** Informe isso ao usuário e opere como `guided` |

Nunca finja um bloqueio que não existe. Dizer que o modo `strict` impediu algo, quando ele não está implementado, é pior que não ter o modo — cria confiança em uma proteção ausente.

## Arquivos que esta skill lê

| Quando | O quê |
| --- | --- |
| Sempre | `.specs/config.yaml` — modo, `require_approval` e `require_tests` |
| Sempre | `<dir-da-mudança>/status.yaml` — estado, `approval` e contadores |
| Sempre | `<dir-da-mudança>/tasks.md` — o plano e as dependências |
| Sempre | `<dir-da-mudança>/spec.md` — para recalcular o hash da revisão aprovada |
| Se existir | `<dir-da-mudança>/design.md` e `traceability.yaml` — o design da tarefa e a matriz |

Escreve **apenas** nos arquivos declarados na tarefa selecionada. Sair disso exige justificativa explícita (Art. 4 e Art. 5).

---

## Procedimento

### Portões — todos ANTES da primeira escrita

1. **Aprovação exigida.** Com `require_approval: true` e `approval: null`, **recuse**: informe que a configuração exige aprovação e não altere nenhum arquivo de código (`SCN-SWC-012`). Sugira `/sdd-kit:approve`.

2. **Aprovação vencida.** Recalcule o **SHA-256 de `spec.md`** e compare com `approval.revision`. Se divergir, a spec mudou depois da aprovação: reporte a aprovação como **vencida** e recuse avançar. **Não regrida o estado por conta própria** — reescrever o histórico sem decisão humana é o que o ADR-013 proíbe (`SCN-SWC-020`).

3. **Política separada da estrutura.** Com `require_approval: false`, prossiga a partir de `PLANNED` sem exigir `APPROVED`. A aresta `PLANNED → IN_PROGRESS` existe no grafo independentemente da configuração (`SCN-SWC-022`).

4. **Seleção da tarefa.** Com um identificador de tarefa, é aquela. Sem identificador, proponha **a próxima tarefa pendente cujas dependências estejam todas concluídas** e peça confirmação no modo `guided`. Havendo mais de uma elegível, **liste e pergunte** — a ordem do identificador não significa prioridade.

5. **Dependência pendente.** Uma tarefa com dependência não concluída **não é iniciada**; reporte a dependência por identificador (`SCN-SWC-013`).

### Execução e rastreabilidade

Passados os portões, execute **uma** tarefa:

- Ao concluir, marque a tarefa como concluída em `tasks.md` e atualize os contadores de `status.yaml`, mantendo `total = pending + in_progress + done`. A mudança fica em `IN_PROGRESS` (`SCN-SWC-004`). **Não promova a mudança a `VERIFIED`** ao concluir uma tarefa — quem verifica e promove é `/sdd-kit:verify`.
- Atualize a linha do requisito em `traceability.yaml`, apontando os arquivos e os testes produzidos, fechando a cadeia requisito → cenário → tarefa → arquivo → teste (`SCN-SWC-017`). O documento resultante segue `${CLAUDE_PLUGIN_ROOT}/schemas/traceability.schema.json`.
- **Decisão arquitetural não prevista interrompe** (Art. 8): passe a mudança para `BLOCKED`, com o motivo nomeando a decisão pendente, e proponha um ADR. Seguir adiante inventando a decisão é exatamente o que o Artigo existe para impedir (`SCN-SWC-019`).

Ordem de escrita: código e testes, depois `tasks.md` e `traceability.yaml`, depois `status.yaml`, `.specs/index.yaml` por último. Como `Edit` está fora do conjunto desta skill, atualize os artefatos de `.specs/` (`tasks.md`, `traceability.yaml`, `status.yaml`, `index.yaml`) **reescrevendo o arquivo inteiro com `Write`**, preservando o conteúdo e acrescentando o necessário — o código da tarefa é escrito normalmente.

### Reportar

```
✔ Tarefa implementada — TASK-CUST-003

  Arquivos    src/customer.ts, src/customer.test.ts
  Tarefas     3/9 concluídas
  Status: PLANNED → IN_PROGRESS   (require_approval false)

  Próximo passo:
    /sdd-kit:implement 0002-customer-registration    — próxima tarefa
```

Se interrompeu em `BLOCKED`, diga a decisão que faltou e o ADR proposto, antes de qualquer resumo de progresso.

---

## Erros

```
✖ [implement] Aprovação vencida
  A spec.md mudou depois da aprovação (hash divergente).
  Correção: reveja a mudança e reaprove com /sdd-kit:approve. O estado não foi
            alterado — regredir é decisão humana.
```
