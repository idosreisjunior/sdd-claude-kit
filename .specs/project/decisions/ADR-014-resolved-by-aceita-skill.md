# ADR-014 — `resolved_by` aceita tarefa ou nome de skill

- **Status:** Aceito
- **Data:** 2026-08-02
- **Origem:** defeito encontrado na execução real de `/sdd-kit:clarify` (validação de
  TASK-SWC-007, mudança `0007-sdd-workflow-completion`): o `status.yaml` gerado não valida
  contra `status.schema.json`.

---

## Contexto

O campo `resolved_questions[].resolved_by` de `status.yaml` foi definido, no schema, como um
**identificador de tarefa** (`^TASK-<ESCOPO>-NNN$`). Isso fazia sentido enquanto quem preenchia
`resolved_questions` era `tasks`/`implement`, apontando a tarefa que fechou a questão — como o
próprio `0007` faz (`resolved_by: TASK-PF-016`).

Mas a skill `clarify` resolve uma questão a partir de uma **resposta humana registrada na
conversa** — não há tarefa. Na execução real, `clarify` gravou `resolved_by: user`, e o
`status.yaml` passou a **falhar** na validação por schema (sete entradas rejeitadas pelo padrão
`TASK-*`). O schema não previu essa segunda fonte de resolução.

Deixar como estava tornaria `clarify` incapaz de produzir um `status.yaml` válido — e o critério
de conclusão da tarefa exige exatamente essa validade. Preencher `resolved_by` com um `TASK-*`
inventado seria mentir sobre a origem da resolução (Art. 2/5).

## Decisão

Ampliar `resolved_by` para aceitar **uma de duas formas**, ambas identificadores, nunca texto livre:

1. `^TASK-<ESCOPO>-NNN$` — quando a resolução veio da implementação (uma tarefa a fechou).
2. `^[a-z][a-z0-9-]{1,29}$` — o **nome de uma skill** (ex.: `clarify`), quando a resolução veio de
   uma resposta humana registrada por aquela skill.

A skill `clarify` passa a gravar `resolved_by: clarify`. Um nome de pessoa (`Ana Souza`) continua
**inválido** — o campo é um identificador de origem, não um autor.

## Alternativas consideradas

| Alternativa | Por que não |
| --- | --- |
| **`resolved_by` aponta a própria questão (Q1, Q2…)** | Exige a mesma ampliação do schema (hoje é `TASK-*`) e é menos expressivo: diz *o quê* foi resolvido, não *o que* resolveu |
| **Tornar `resolved_by` opcional** | Perde o rastro de quem/o que resolveu — enfraquece o Art. 5 (uma decisão sem rastro é indistinguível de uma suposição) |
| **`clarify` cria uma tarefa fictícia para referenciar** | Inventa um artefato que não existe só para satisfazer um padrão — invenção pela porta dos fundos |

## Consequências

**Positivas**
- `clarify` produz um `status.yaml` válido, com a origem real da resolução registrada.
- O campo continua sendo um identificador verificável, não texto livre; um nome de pessoa não valida.
- Compatível com o que já existe: `resolved_by: TASK-PF-016` (0007) continua válido.

**Negativas**
- O segundo padrão (`^[a-z][a-z0-9-]{1,29}$`) aceita qualquer slug em minúsculas, não só nomes de
  skills reais. **Mitigação:** é uma restrição de forma, não de conjunto; a coerência (o nome ser de
  uma skill que existe) é revisão, como já ocorre com outros identificadores. Fechar o conjunto
  exigiria o schema conhecer a lista de skills, acoplamento que ADR-006/009 evitam.

## Limite desta decisão

Decide **a forma** de `resolved_by`. Não muda quem escreve `resolved_questions` nem quando, e não
altera `blocked_by.resolves_with`, que continua sendo um `TASK-*` (um bloqueio é fechado por uma
tarefa, não por uma conversa).
