# Feature: Integração com GitHub (RF-019)

- **ID:** 0021-github-integration
- **Escopo dos identificadores:** GH
- **Estado:** ver `status.yaml` — a autoridade é ele

---

## Objetivo

Dar à extensão uma integração com o GitHub que **gere a descrição** de issue/PR a partir da feature
(requisitos + validação + evidências) e permita **criar issue ou PR** via `gh`, sob confirmação —
o recorte inicial das nove operações do RF-019.

## Contexto

O RF-019 lista nove operações. A extensão **nunca fez rede própria**: ela *shell-out* para o `git`
(0007, ADR-011) e detecta a CLI do Claude Code (0004, ADR-002). Por decisão (D-Q1), o mecanismo é o
**`gh` CLI** — sem rede própria, sem gerenciar token/auth (o `gh` cuida), sem dependência. O
incremento 1 (D-Q2) recorta para as duas operações mais valiosas e construíveis: **gerar a
descrição** e **criar issue/PR**. As demais (associar issue, criar branch, acompanhar revisão,
importar comentários, atualizar status) ficam para depois.

O núcleo "gerar a descrição" é **puro e testável**, reusando `buildValidationReport` (0008) e
`buildEvidenceMarkdown` (0008)/`buildCommitSuggestion` (0007). Publicar issue/PR é
**outward-facing** — só sob confirmação explícita (constituição Art. 9).

## Escopo

### Incluído

- **Gerar a descrição** (issue/PR) a partir da feature: requisitos (spec), resumo da validação
  (0008) e evidências (evidence.md) — D-Q3.
- **Criar issue ou PR** no GitHub via `gh` (D-Q1), sob confirmação explícita — D-Q6.

### Não incluído

- As **demais operações** do RF-019 (associar issue, criar branch, acompanhar revisão, importar
  comentários, atualizar status) — incrementos futuros (D-Q2).
- **Atualizar o `status.yaml`** ao criar (D-Q6): transição de estado é do fluxo de status.

---

## Decisões de escopo (2026-08-02)

As questões Q1, Q2, Q3 e Q6 foram respondidas pelo autor. Q4 (detecção da pré-condição) e Q5
(gatilho) são de design e ficam para o `design.md`. Q1, por ser arquitetural (rede/mecanismo), é
**formalizada em ADR** apesar de já decidida.

| # | Decisão | Efeito |
| --- | --- | --- |
| D-Q1 | Mecanismo: **`gh` CLI** (shell-out, como git 0007 e Claude Code 0004). Sem rede própria, sem token/auth próprios, sem dependência. Formalizar em ADR. | REQ-GH-002. |
| D-Q2 | Incremento 1: **gerar a descrição** + **criar issue/PR**. As demais operações do RF-019 ficam para depois. | REQ-GH-001; REQ-GH-002. |
| D-Q3 | Descrição = requisitos (spec) + resumo da validação (0008) + evidências (evidence.md), reusando `buildValidationReport`/`buildEvidenceMarkdown`. | REQ-GH-001. |
| D-Q6 | A criação oferece **issue OU PR** (à escolha), com a descrição gerada; **não** atualiza o `status.yaml`. | REQ-GH-002. |

---

## Requisitos funcionais

> Origem: os requisitos derivam do texto do RF-019 e das decisões D-Q1/D-Q2/D-Q3/D-Q6.

### REQ-GH-001 — Gerar a descrição de issue/PR a partir da feature

A extensão deve gerar a descrição (corpo) de uma issue/PR a partir da feature, incluindo
**requisitos** (spec), o **resumo da validação** (0008) e as **evidências** (evidence.md) — D-Q3.
Geração pura, revisável antes de publicar.

#### SCN-GH-001 — Descrição com requisitos e evidências

DADO uma feature com spec, validação e evidências
QUANDO a extensão gera a descrição de PR/issue
ENTÃO o corpo inclui os requisitos, o resumo da validação e as evidências, revisável.

#### SCN-GH-002 — Feature com artefatos parciais

DADO uma feature sem `evidence.md` (só spec)
QUANDO a extensão gera a descrição
ENTÃO produz o corpo com o que houver, marcando o que falta, sem quebrar.

### REQ-GH-002 — Criar issue ou PR no GitHub via `gh`

A extensão deve permitir criar uma **issue** ou um **Pull Request** no GitHub a partir da feature,
com a descrição gerada, usando o `gh` (D-Q1), **sob confirmação explícita** (nada é publicado sem o
"ok"). Não atualiza o `status.yaml` (D-Q6).

#### SCN-GH-003 — Criar sob confirmação

DADO uma descrição gerada e o `gh` disponível (instalado/autenticado, com remoto GitHub)
QUANDO o usuário escolhe criar issue ou PR e confirma
ENTÃO a extensão cria o item no GitHub via `gh` e devolve o link.

#### SCN-GH-004 — `gh` indisponível

DADO que o `gh` não está instalado/autenticado ou não há remoto GitHub
QUANDO o usuário aciona a criação
ENTÃO a extensão informa a pré-condição faltante e não publica nada.

---

## Requisitos não funcionais

### NFR-GH-001 — Humano no controle (outward-facing)

Nada é publicado no GitHub sem confirmação explícita do usuário (constituição Art. 9). A geração da
descrição é local; só a criação sai da máquina, e só com o "ok".

### NFR-GH-002 — Sem rede própria

A extensão não fala HTTP; a comunicação com o GitHub é pelo `gh` CLI (D-Q1). Compatível com
Windows/Linux/WSL (RNF-002).

### NFR-GH-003 — Núcleo puro e testável

A geração da descrição (requisitos + validação + evidências) é pura (sem a API do VS Code nem I/O),
testável fora do host (standards §6).

---

## Critérios de aceite

- [ ] A extensão gera a descrição de issue/PR com requisitos, validação e evidências, revisável
      (REQ-GH-001, SCN-GH-001); artefatos parciais não quebram (SCN-GH-002).
- [ ] Cria issue ou PR via `gh` só sob confirmação explícita (REQ-GH-002, SCN-GH-003, NFR-GH-001).
- [ ] `gh` indisponível → informa a pré-condição e não publica (SCN-GH-004).
- [ ] A geração da descrição é pura e coberta por testes (NFR-GH-003).

---

## Questões pendentes

Q1, Q2, Q3 e Q6 foram respondidas — ver **Decisões de escopo**. Permanecem duas questões, ambas
**de design** (o *como*), que não impedem a spec de sair de DRAFT:

| # | Questão | Bloqueia | Prioridade |
| --- | --- | --- | --- |
| Q4 | Detecção da pré-condição — como detectar `gh` instalado/autenticado e o remoto GitHub (reusar o padrão de detecção do 0004/Claude Code)? | design | média |
| Q5 | Gatilho na UI — comando no item da feature (como as demais ações)? | design | baixa |

## Hipóteses assumidas

> HIPÓTESE: A detecção do `gh` reusa o padrão do 0004 (detecção da CLI), e o gatilho é um comando no
> item da feature (como as demais ações) — a confirmar em Q4/Q5 no design.
