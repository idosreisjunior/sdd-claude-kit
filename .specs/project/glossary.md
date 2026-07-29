# Glossário

Vocabulário do projeto. Termos usados em specs, skills e documentação devem seguir estas definições.

---

## Conceitos do método

| Termo | Definição |
| --- | --- |
| **SDD** (Spec-Driven Development) | Método em que a especificação precede e orienta a implementação, permanecendo versionada junto ao código. |
| **Mudança** (*change*) | Qualquer unidade de trabalho especificada: feature, bug, refatoração ou mudança arquitetural. É o termo genérico. |
| **Feature** | Mudança que adiciona capacidade nova ao produto. Vive em `.specs/features/`. |
| **Spec** | O documento `spec.md` de uma mudança: requisitos, cenários e critérios de aceite. Descreve **o quê** e **por quê**. |
| **Design** | O documento `design.md`: solução técnica. Descreve **como**. |
| **Requisito** (`REQ-*`, `NFR-*`) | Afirmação verificável sobre o que o sistema deve fazer ou garantir. |
| **Cenário** (`SCN-*`) | Caso concreto de aceite, escrito em Gherkin (DADO / QUANDO / ENTÃO). |
| **Critério de aceite** | Condição objetiva que precisa ser verdadeira para a mudança ser aceita. |
| **Tarefa** (`TASK-*`) | Unidade de implementação pequena, com resultado verificável e critério de conclusão explícito. |
| **ADR** (*Architecture Decision Record*) | Registro de uma decisão arquitetural: contexto, decisão, alternativas e consequências. |
| **Rastreabilidade** | Cadeia requisito → cenário → tarefa → arquivo → teste, mantida em `traceability.yaml`. |
| **Item órfão** | Elemento sem o vínculo esperado: requisito sem tarefa, tarefa sem requisito, arquivo sem rastreio. |
| **Hipótese** | Suposição assumida pelo Claude na ausência de informação, marcada com `> HIPÓTESE:` e sujeita a confirmação humana. |
| **Questão pendente** | Ambiguidade identificada e ainda não resolvida, registrada na spec. |

## Estados

| Estado | Significado |
| --- | --- |
| `DRAFT` | Rascunho criado; requisitos ainda incompletos. |
| `CLARIFIED` | Ambiguidades críticas resolvidas; requisitos mínimos definidos. |
| `DESIGNED` | Design técnico concluído. |
| `PLANNED` | Tarefas decompostas e relacionadas a requisitos. |
| `APPROVED` | Aprovação humana registrada; implementação liberada. |
| `IN_PROGRESS` | Implementação em andamento. |
| `BLOCKED` | Impedida por decisão pendente ou dependência externa. |
| `VERIFIED` | Validação e critérios de aceite aprovados. |
| `ARCHIVED` | Concluída e movida para `.specs/archive/`. |
| `CANCELLED` | Descontinuada sem implementação. |

## Componentes do framework

| Termo | Definição |
| --- | --- |
| **Plugin** | O pacote instalável no Claude Code, em `plugins/sdd-kit/`. |
| **Marketplace** | `.claude-plugin/marketplace.json` na raiz; permite instalar o plugin a partir do repositório. |
| **Skill** | Instrução que orienta o Claude a executar uma etapa do fluxo. Invocada como `/sdd-kit:<nome>`. |
| **Agente** | Subagente com contexto e permissões restritas, responsável por uma tarefa cognitiva especializada. |
| **Hook** | Gatilho executado pelo Claude Code em eventos (`PreToolUse`, `PostToolUse`). Opt-in. |
| **Script** | Código determinístico de validação, indexação e relatório. Não usa IA. |
| **Template** | Modelo de documento usado para padronizar artefatos gerados. |
| **Schema** | JSON Schema que define a forma válida de um arquivo YAML do framework. |
| **Modo de governança** | `advisory`, `guided` ou `strict` — nível de controle exercido pelo framework. |

## Termos evitados

| Não usar | Usar |
| --- | --- |
| "história", "user story" | requisito + cenário |
| "ticket", "card" | tarefa ou mudança |
| "documentação" (para specs) | especificação |
| "aprovar o código" | verificar (`verify`) |
| "plano" (ambíguo) | design (técnico) ou tarefas (implementação) |
