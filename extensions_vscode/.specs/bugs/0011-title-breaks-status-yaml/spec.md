# Bug: título com aspas quebra o `status.yaml` gerado pelo formulário

- **ID:** 0011-title-breaks-status-yaml
- **Escopo dos identificadores:** TITLE
- **Estado:** ver `status.yaml` — a autoridade é ele
- **Severidade:** **alta**

---

## Comportamento observado

O template `_shared/status.yaml` declara o título entre aspas duplas:

```yaml
title: "{{CHANGE_TITLE}}"
```

A criação de mudança (FEAT-006) substitui `{{CHANGE_TITLE}}` pelo título **cru**
digitado no formulário. Um título com aspa dupla produz YAML inválido:

```
title: "Suporte a "aspas" no titulo"
→ YAMLException: bad indentation of a mapping entry
```

O `status.yaml` gerado deixa de carregar — o painel não lê o progresso da feature
e a CLI recusa o arquivo. Perda total do artefato de estado da mudança recém-criada.

## Comportamento esperado

O título aceita qualquer texto, inclusive aspas: o `status.yaml` gerado parseia e o
título é preservado.

## Regra violada

**NFR-FOUND-003** — a estrutura `.specs` criada pela extensão deve ser lida pela CLI
sem erro. Um `status.yaml` que não parseia viola isso. Também contradiz
**NFR-FEAT-001** (leitura robusta): o progresso da própria feature criada não carrega.

## Reprodução

1. Projeto inicializado; acionar **SDD: Nova feature**.
2. Informar um título que contenha `"` (ex.: `Suporte a "aspas"`).
3. Concluir a criação e abrir/parsers o `status.yaml` gerado.

**Frequência:** determinística sempre que o título contiver `"` (ou `\`).
**Ambiente:** qualquer.
**Primeira ocorrência conhecida:** TASK-FEAT-006, quando o fluxo de criação foi escrito.

## Impacto

Alto. O campo `title` é texto livre digitado pelo usuário, e citar algo entre aspas é
redação natural. O `index.yaml` já era seguro (usa `yamlInline`), então o defeito
atingia só o `status.yaml` — de forma inconsistente e silenciosa até alguém ler o
arquivo.

---

## Causa raiz

Confirmada. `substituteChange` faz substituição textual determinística, sem escape,
e o template embutido envolve o título em aspas duplas (`title: "{{CHANGE_TITLE}}"`).
Diferente da skill `/sdd-kit:new` (um LLM, que escapa ao redigir), a extensão insere
o valor cru. É a **mesma classe** do bug 0006 do plugin (`reason` entre aspas) — e
exatamente o que a Q1 daquele bug antecipou: outros campos de texto livre entre aspas
nos templates. Nenhum teste cobria um título com aspas.

## Escopo da correção

### Incluído

- Escapar o título para o contexto de escalar YAML entre aspas ao gerar o
  `status.yaml` (`yamlDquote`), mantendo o texto cru em `spec.md`/`request.md`
  (markdown).
- Teste de regressão com aspas e barra invertida no título.

### Não incluído

- Trocar o template para escalar de bloco `>-` (resolveria a classe na fonte, mas o
  template embutido precisa ser byte-idêntico ao do plugin — o gate `check-templates`
  falharia). A correção da classe nos templates é escopo do bug 0006 do plugin (Q1).
- Escapar os demais campos de texto livre dos templates (REQUIREMENT_TITLE, GAP_*,
  PROJECT_NAME) — a extensão não os substitui hoje; registrado como questão.

---

## Cenários de regressão

### SCN-TITLE-001 — Título com aspas produz `status.yaml` válido

DADO um título que contenha aspas duplas
QUANDO o `status.yaml` for gerado pela criação de mudança
ENTÃO o arquivo deve parsear
E o título deve estar preservado.

---

## Critérios de aceite

- [x] Existe um teste que **falha antes da correção e passa depois** (SCN-TITLE-001).
- [x] O cenário de regressão passa.
- [x] Nenhum teste existente foi alterado para acomodar a correção.
- [x] O `status.yaml` gerado a partir do template real carrega com título entre aspas.

---

## Correção aplicada

Aplicada em 2026-07-31.

| Arquivo | Mudança |
| --- | --- |
| `src/sdd/featureCreator.ts` | Novo `yamlDquote(value)` — escapa `\` e `"` |
| `src/extension.ts` | Título escapado com `yamlDquote` ao escrever `status.yaml` |
| `src/test/featureCreator.test.ts` | SCN-TITLE-001 (aspas e barra) |

---

## Questões pendentes

| # | Questão | Bloqueia | Prioridade |
| --- | --- | --- | --- |
| Q1 | Quando a extensão passar a substituir outros campos de texto livre entre aspas (REQUIREMENT_TITLE, GAP_*, PROJECT_NAME em config.yaml), aplicar o mesmo escape ou migrar para escalar de bloco na fonte (liga na Q1 do bug 0006 do plugin). | — | média |

## Hipóteses assumidas

Nenhuma. A causa foi confirmada reproduzindo o defeito com o template real antes e
depois da correção.
