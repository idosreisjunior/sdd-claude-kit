# Tarefas — {{CHANGE_TITLE}}

{{guia: a numeração reflete a ordem de CRIAÇÃO, não a de execução. A ordem de
execução vem das dependências — por isso o diagrama abaixo existe.

Uma tarefa precisa ter resultado verificável. Se você não consegue escrever o
critério de conclusão, a tarefa está grande ou mal definida: divida antes de
começar. Ver constitution.md, Art. 4.}}

Complexidade: **P** pequena (≤ meio dia) · **M** média (≈ 1 dia) · **G** grande
(deve ser dividida antes de começar).

---

## Ordem de execução

```
{{DEPENDENCY_GRAPH}}
```

{{guia: um diagrama em texto mostrando o que bloqueia o quê. Marque as tarefas
concluídas com ✅ conforme avança — é o mapa que responde "o que dá para fazer
agora" sem reler tudo.}}

---

## {{TASK_ID}} — {{TASK_TITLE}}

**Requisitos:** {{TASK_REQUIREMENTS}}
**Dependências:** {{TASK_DEPENDENCIES}}
**Complexidade:** {{TASK_COMPLEXITY}}
**Status:** pending

### Descrição

{{TASK_DESCRIPTION}}

### Arquivos prováveis

- {{TASK_FILE}}

{{guia: previsão, não contrato. Serve para dimensionar o impacto e detectar
cedo que a tarefa toca mais coisa do que parecia.}}

### Testes esperados

- {{TASK_TEST}}

{{guia: identificadores TEST-*, não descrições. Eles ligam a tarefa à matriz de
rastreabilidade.

Se a tarefa genuinamente não produz teste — investigação, decisão, documentação
— escreva "Nenhum" e diga por quê. Deixar em branco parece esquecimento.}}

### Critério de conclusão

- {{TASK_COMPLETION_CRITERION}}

{{repetir: condições objetivas e verificáveis. "Funciona" não é critério;
"o endpoint retorna 401 sem token e o teste TEST-AUTH-002 passa" é.}}

### Evidências necessárias

- {{TASK_EVIDENCE}}

{{guia: as evidências que a conclusão da tarefa precisa produzir — saída de teste,
diff, captura de tela, log, link. É o que /sdd-kit:verify confere (RF-010). Se a
tarefa genuinamente não produz evidência, escreva "Nenhuma" e diga por quê.}}

---

{{repetir: um bloco por tarefa, separados por `---`}}

---

## Resumo

| Complexidade | Quantidade |
| --- | --- |
| P | {{COUNT_SMALL}} |
| M | {{COUNT_MEDIUM}} |
| G | {{COUNT_LARGE}} |

Total: {{TASK_TOTAL}} tarefas · {{TASK_DONE}} concluídas · {{TASK_PENDING}} pendentes.

**Caminho crítico:** {{CRITICAL_PATH}}

**Bloqueios ativos:** {{ACTIVE_BLOCKERS}}

**Paralelizáveis agora:** {{PARALLELIZABLE}}

{{guia: se houver alguma tarefa G, ela precisa ser dividida antes que a
implementação comece. Uma tarefa grande sobrevivendo até aqui é um defeito do
planejamento, não um detalhe.}}
