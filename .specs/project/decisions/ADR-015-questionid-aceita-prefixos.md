# ADR-015 — `questionId` aceita prefixos por documento (Q, A, D)

- **Status:** Aceito
- **Data:** 2026-08-02
- **Origem:** defeito encontrado no percurso e2e (TASK-SWC-017, mudança
  `0007-sdd-workflow-completion`): o `status.yaml` gerado por `design`/`implement` não valida
  contra `status.schema.json`.

---

## Contexto

O identificador de questão em `status.yaml` — usado por `blocked_by[].question` e
`resolved_questions[].question` — foi definido no schema como `^Q[0-9]+$`, assumindo que toda
questão nasce numerada `Q1, Q2, …`. É o formato que a **spec** usa.

Mas o framework numera questões por documento, com **prefixos distintos**:

- `Q*` — questões da **spec** (`spec.md`), resolvidas por `clarify`.
- `A*` — questões da **arquitetura** (`architecture.md`), convenção já usada na Fase 1.
- `D*` — questões do **design** (`design.md` §15), abertas por `design`.

Na execução real, `design` fechou `A2`/`A3` (via ADRs) e `implement` fechou `D2`, e ambos
registraram essas resoluções em `resolved_questions` com o **identificador original** (`A2`, `D2`).
O schema, que só aceitava `Q*`, **rejeitou** o `status.yaml` — sete entradas inválidas no toy do e2e.

Preencher `resolved_questions` com o id original é o comportamento correto: apagar o prefixo (chamar
`A2` de `Q7`) quebraria o rastro até `architecture.md`, e inventar um `Q` novo seria renumerar um
identificador — proibido (standards §2, Art. 5). O que estava estreito era o schema.

## Decisão

Ampliar `questionId` de `^Q[0-9]+$` para **`^[A-Z]+[0-9]+$`**: um prefixo de letras maiúsculas
seguido de número. Passa a aceitar `Q1`, `A2`, `D3` e mantém o campo como identificador
verificável — texto livre (`questão 2`, `pergunta-A`) continua inválido. A mudança vale tanto para
`resolved_questions[].question` quanto para `blocked_by[].question`, que compartilham o `$def`.

## Alternativas consideradas

| Alternativa | Por que não |
| --- | --- |
| **Corrigir as skills** (não gravar `A*`/`D*` em `resolved_questions`; deixá-las só nos ADRs/docs) | Perde o rastro num só lugar e depende de disciplina comportamental de cada skill, mais frágil que uma regra de forma no schema. A decisão em si já vai para o ADR, mas o registro de *que a questão foi fechada* tem valor no `status.yaml` |
| **Padronizar tudo em `Q*`** (architecture.md e design.md renumeram como `Q*`) | Descarta a distinção A=arquitetura / D=design e mexe numa convenção já usada na `architecture.md` da Fase 1; renumerar identificadores é proibido |

## Consequências

**Positivas**
- `design`/`implement` produzem `status.yaml` válido, com o rastro da questão preservado.
- Compatível: `Q1, Q2, …` (spec e `blocked_by` existentes) continuam válidos.
- O campo segue sendo um identificador, não texto livre.

**Negativas**
- O padrão aceita qualquer prefixo de letras (`XYZ9`), não só `Q/A/D`. **Mitigação:** é restrição de
  forma, não de conjunto; fechar em `(Q|A|D)` acoplaria o schema à lista de documentos e um novo
  documento com questões próprias exigiria mexer no schema. A coerência do prefixo é revisão, como
  com os demais identificadores.

## Limite desta decisão

Decide **a forma** de `questionId`. Não muda quem escreve `resolved_questions`/`blocked_by`, nem a
regra de que uma resolução com decisão arquitetural também gera um ADR.
