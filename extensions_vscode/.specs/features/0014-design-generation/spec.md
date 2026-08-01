# Feature: Geração do design técnico (RF-009)

- **ID:** 0014-design-generation
- **Escopo dos identificadores:** DSGN
- **Estado:** ver `status.yaml` — a autoridade é ele

---

## Objetivo

Dar à extensão a etapa de **design técnico** do fluxo SDD: a partir de uma spec aprovada, gerar
ou auxiliar a geração de um `design.md` estruturado com as seções que o RF-009 exige, como
rascunho revisável antes de ser adotado.

## Contexto

O fluxo SDD é `spec → clarify → design → tasks`. Hoje a extensão cobre a spec (0012, editor) e a
decomposição em tarefas ainda não tem feature própria (RF-010), mas **a etapa de design não está
materializada**: o RF-009 está sem cobertura no `index.yaml`. Ele exige um documento com visão
da solução, componentes afetados, fluxo de dados, contratos, APIs, banco de dados, segurança,
tratamento de erros, observabilidade, testes, migração, rollback, riscos e alternativas
consideradas.

A extensão **não** gera texto por conta própria (ADR-005, RNF-004: sem rede). Ela delega a
geração de conteúdo ao Claude Code via terminal — e o adapter do Claude Code (**0004**, RF-011)
já lista "gerar design" como uma ação de prompt. O quanto o RF-009 é uma camada fina sobre o
0004 versus um componente novo é decisão de **design** (Q1), não desta spec.

## Escopo

### Incluído

- **Etapa de design a partir da spec aprovada** (RF-009): acionar a geração/assistência do
  `design.md` de uma feature cuja spec já foi aprovada.
- **Estrutura do `design.md`** com as seções do RF-009.
- **Rascunho revisável**: o design produzido é editável e não substitui um `design.md` existente
  sem confirmação.

### Não incluído

- **Research (RF-007)** e **clarificação (RF-008)** — features próprias e distintas; fora para
  manter o escopo pequeno.
- **Geração de tarefas a partir do design (RF-010)** — etapa seguinte, feature separada.
- **Avaliação de qualidade/completude do design** além da estrutura — não previsto pelo RF-009
  nesta iteração.

---

## Decisões de escopo (2026-08-01)

As questões Q3–Q6 foram respondidas pelo autor. Q1 e Q2 são de natureza arquitetural/estrutural
e ficam para o `design.md` — não bloqueiam esta spec.

| # | Decisão | Efeito |
| --- | --- | --- |
| D-Q3 | O gatilho é um **botão no dashboard da feature** (0003), junto das demais ações do Claude Code. | REQ-DSGN-001. |
| D-Q4 | "Spec aprovada" = **`approval != null`** no `status.yaml` (aprovação formal via `/sdd-kit:approve`). | REQ-DSGN-001; SCN-DSGN-002. |
| D-Q5 | `design.md` existente: **confirmar antes de sobrescrever**; nunca apagar em silêncio (sem mesclar/versionar nesta iteração). | REQ-DSGN-003; SCN-DSGN-004. |
| D-Q6 | **Modo único**: gera um rascunho estrutural completo com as seções do RF-009, preenchidas onde é possível e com **lacunas marcadas** para o autor completar. Não há um segundo modo "assistido". | REQ-DSGN-002. |

---

## Requisitos funcionais

> Origem: os requisitos derivam do texto do RF-009 e das decisões D-Q3..D-Q6 acima.

### REQ-DSGN-001 — Geração/assistência do design a partir da spec aprovada

A extensão deve oferecer, no **dashboard da feature** (D-Q3), a ação de gerar/auxiliar o
`design.md` (RF-009). A ação só fica disponível quando a spec da feature está aprovada —
**`approval != null`** no `status.yaml` (D-Q4). Acionada, ela produz um rascunho de design em
modo único (D-Q6), delegando a geração de conteúdo ao Claude Code (sem rede própria; ver Q1 para
o mecanismo exato).

#### SCN-DSGN-001 — Feature com spec aprovada

DADO uma feature cujo `status.yaml` tem `approval` diferente de null
QUANDO o usuário aciona a geração do design no dashboard
ENTÃO a extensão produz (ou auxilia a produzir) um `design.md` com a estrutura do RF-009.

#### SCN-DSGN-002 — Feature sem spec aprovada

DADO uma feature cujo `status.yaml` tem `approval` igual a null
QUANDO o usuário abre o dashboard da feature
ENTÃO a ação de gerar o design fica indisponível
E a extensão informa que a etapa de design exige a spec aprovada.

### REQ-DSGN-002 — Estrutura do `design.md` com lacunas marcadas

O `design.md` gerado deve contemplar as seções do RF-009 — visão da solução, componentes
afetados, fluxo de dados, contratos, APIs, banco de dados, segurança, tratamento de erros,
observabilidade, testes, migração, rollback, riscos e alternativas consideradas — preenchidas
onde há informação e com as demais **marcadas explicitamente como lacuna** a completar (D-Q6),
nunca omitidas nem preenchidas com conteúdo inventado.

#### SCN-DSGN-003 — Documento com as seções exigidas

DADO uma geração de design acionada
QUANDO o `design.md` é produzido
ENTÃO ele contém todas as seções enumeradas pelo RF-009
E as seções sem informação aparecem marcadas como lacuna a preencher, não omitidas.

### REQ-DSGN-003 — Rascunho revisável, sem sobrescrever em silêncio

O design produzido é um rascunho revisável/editável antes de ser adotado. Quando já existe um
`design.md` na feature, a extensão **pede confirmação explícita antes de sobrescrever** e não
apaga o conteúdo atual em silêncio (D-Q5).

#### SCN-DSGN-004 — `design.md` já existe

DADO uma feature que já possui `design.md`
QUANDO o usuário aciona a geração do design
ENTÃO a extensão pede confirmação antes de substituir o arquivo
E, se o usuário não confirmar, o `design.md` atual permanece intacto.

---

## Requisitos não funcionais

### NFR-DSGN-001 — Núcleo puro e testável

A checagem da pré-condição (`approval != null`), a montagem da estrutura/prompt do design e a
marcação de lacunas devem ser puras (sem a API do VS Code), testáveis fora do host (standards §6).

### NFR-DSGN-002 — Sem rede própria

Nenhum I/O de rede na extensão; a geração de conteúdo por IA passa pelo Claude Code (ADR-005,
RNF-004).

### NFR-DSGN-003 — Compatibilidade

Funciona em Windows, Linux e WSL (RNF-002), com os mesmos caminhos de `.specs/` já usados pelas
demais features.

---

## Critérios de aceite

- [ ] O dashboard da feature oferece a ação de gerar o design apenas quando `approval != null`;
      caso contrário, indisponível e com a pré-condição explicada (REQ-DSGN-001, SCN-DSGN-002).
- [ ] O `design.md` gerado contém todas as seções do RF-009, com as vazias marcadas como lacuna
      (REQ-DSGN-002).
- [ ] Um `design.md` existente nunca é sobrescrito sem confirmação; recusada a confirmação, o
      arquivo permanece intacto (REQ-DSGN-003, SCN-DSGN-004).
- [ ] A pré-condição, a montagem da estrutura e a marcação de lacunas são puras e cobertas por
      testes; sem rede (NFR-DSGN-001, NFR-DSGN-002).

---

## Questões pendentes

Q3–Q6 foram respondidas — ver **Decisões de escopo**. Permanecem duas questões, ambas **de
design** (o *como*), que não impedem a spec de sair de DRAFT:

| # | Questão | Bloqueia | Prioridade |
| --- | --- | --- | --- |
| Q1 | A geração reusa o adapter do Claude Code (0004, ação "gerar design") ou introduz um componente novo? Decisão arquitetural → provável ADR. | design | alta |
| Q2 | O template do `design.md` (seções do RF-009) é um novo template em `templates/pt-BR/feature/design.md`, análogo aos demais? | design | média |

## Hipóteses assumidas

> HIPÓTESE: A geração de conteúdo delega ao Claude Code pela mesma integração de terminal do 0004
> (RF-011), coerente com ADR-005 (sem rede) — a confirmar em Q1 no design.

> HIPÓTESE: A estrutura do `design.md` será guiada por um template em pt-BR análogo ao de `spec.md`
> — a confirmar em Q2 no design.
