# Glossário — customer-api

Vocabulário do projeto. Termos usados em specs e documentação devem seguir estas
definições.


---

## Termos do domínio

| Termo | Definição |
| --- | --- |
| Cliente | > QUESTÃO: pessoa física, empresa, ou os dois? A distinção muda o modelo de dados e as regras de cadastro. |



## Termos evitados

| Não usar | Usar | Por quê |
| --- | --- | --- |
| *(nenhum registrado)* | — | — |


---

## Termos do método

Vocabulário do SDD. Vem pronto; ajuste apenas se o seu processo divergir.

| Termo | Definição |
| --- | --- |
| **SDD** | Spec-Driven Development. A especificação precede e orienta a implementação, e permanece versionada junto ao código |
| **Mudança** | Qualquer unidade de trabalho especificada: feature, bug, refatoração ou mudança arquitetural. Termo genérico |
| **Spec** | O `spec.md` de uma mudança: requisitos, cenários e critérios de aceite. Descreve **o quê** e **por quê** |
| **Design** | O `design.md`: solução técnica. Descreve **como** |
| **Requisito** (`REQ-*`, `NFR-*`) | Afirmação verificável sobre o que o sistema deve fazer ou garantir |
| **Cenário** (`SCN-*`) | Caso concreto de aceite, em Gherkin (DADO / QUANDO / ENTÃO) |
| **Critério de aceite** | Condição objetiva que precisa ser verdadeira para a mudança ser aceita |
| **Tarefa** (`TASK-*`) | Unidade de implementação pequena, com resultado verificável e critério de conclusão explícito |
| **ADR** | Architecture Decision Record: contexto, decisão, alternativas e consequências |
| **Rastreabilidade** | A cadeia requisito → cenário → tarefa → arquivo → teste, mantida em `traceability.yaml` |
| **Item órfão** | Elemento sem o vínculo esperado: requisito sem tarefa, tarefa sem requisito, arquivo sem rastreio |
| **Hipótese** | Suposição assumida na ausência de informação, marcada com `> HIPÓTESE:` e sujeita a confirmação humana |
| **Questão pendente** | Ambiguidade identificada e ainda não resolvida, registrada na spec |

## Estados

| Estado | Significado |
| --- | --- |
| `DRAFT` | Rascunho criado; requisitos ainda incompletos |
| `CLARIFIED` | Ambiguidades críticas resolvidas; requisitos mínimos definidos |
| `DESIGNED` | Design técnico concluído |
| `PLANNED` | Tarefas decompostas e relacionadas a requisitos |
| `APPROVED` | Aprovação humana registrada; implementação liberada |
| `IN_PROGRESS` | Implementação em andamento |
| `BLOCKED` | Impedida por decisão pendente ou dependência externa |
| `VERIFIED` | Validação e critérios de aceite aprovados |
| `ARCHIVED` | Concluída e movida para `.specs/archive/` |
| `CANCELLED` | Descontinuada sem implementação |
