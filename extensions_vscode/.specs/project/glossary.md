# Glossário — sdd-claude-kit-vscode

Vocabulário do projeto. Termos usados em specs e documentação devem seguir estas
definições.

---

## Termos do domínio

Derivados do PRD. Registrados por serem termos próprios do produto, que
significam algo específico aqui.

| Termo | Definição |
| --- | --- |
| **Feature** | Unidade de trabalho do usuário da extensão, com pasta em `.specs/features/` e o ciclo request→…→validation (PRD §8, §9) |
| **Context Guardian** | Módulo que estima e controla o contexto enviado ao modelo, com faixas de atenção/risco/bloqueio e teto configurável (RF-012) |
| **Context Pack** | Conjunto reutilizável de contexto (arquivos, trechos, regras, resumos) por assunto (RF-013) |
| **Project Doctor** | Módulo que analisa a saúde do projeto e lista problemas, ao estilo do painel Problems do VS Code (RF-002) |
| **Evidência** | Artefato objetivo que comprova a implementação: testes, lint, build, cobertura, capturas, logs, diff, commit (RF-016) |
| **Rastreabilidade** | Cadeia requisito → critério → tarefa → arquivo → linha → teste → commit → evidência → PR (RF-015) |
| **Validação da feature** | Comparação da implementação com requisitos/critérios, classificando cada requisito como atendido/parcial/não atendido/não testado/não aplicável (RF-017) |
| **Fora de escopo** | Alteração em arquivo/módulo não previsto pela tarefa, detectada por diff do Git (RF-014) |
| **Indicador de contexto** | Item da status bar `SDD Context: X% | usado / teto` (PRD §13.3) |

## Termos evitados

| Não usar | Usar | Por quê |
| --- | --- | --- |
| "task" (em doc pt-BR) | "tarefa" | Documentação em pt-BR (standards §5) |
| "chamar o Claude" | "executar ação no Claude Code" | A extensão não chama o modelo; abre a ação no Claude Code (PRD §5) |

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

> O PRD (§10) define rótulos de status em pt-BR para a UI. Os estados abaixo são
> os do método SDD, usados em `status.yaml`. O mapeamento SDD → grupo do painel
> está implementado em `specsIndex.groupFor()` (feature 0002): DRAFT/CLARIFIED/
> DESIGNED/PLANNED → Rascunho; APPROVED/IN_PROGRESS → Em desenvolvimento; BLOCKED
> → Bloqueadas; VERIFIED → Em validação; ARCHIVED → Concluídas; CANCELLED →
> Canceladas.

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
