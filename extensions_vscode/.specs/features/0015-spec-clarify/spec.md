# Feature: Clarificação da especificação (RF-008)

- **ID:** 0015-spec-clarify
- **Escopo dos identificadores:** CLAR
- **Estado:** ver `status.yaml` — a autoridade é ele

---

## Objetivo

Dar à extensão a etapa de **clarificação** do fluxo SDD: analisar a spec de uma mudança, levantar
as lacunas que o RF-008 enumera e registrá-las em `clarifications.md` para revisão humana — antes
do design.

## Contexto

O fluxo SDD é `spec → clarify → design → tasks`. A spec (0012) e o design (0014) já estão
materializados, mas a **clarificação não** — o RF-008 está sem cobertura no `index.yaml`. Ele pede
que a extensão analise a spec e identifique nove categorias de lacuna (ambiguidades, critérios de
aceite ausentes, conflitos, regras incompletas, casos extremos, dependências não definidas,
decisões técnicas prematuras, riscos de segurança, impactos em dados), registrando o resultado em
`clarifications.md`.

Duas âncoras já existentes moldam a solução: (1) o adapter 0004 (RF-011) já tem a ação `clarify`
(`/sdd-kit:clarify <id>`), hoje uma ação de prompt cuja skill de plugin é de **Fase 2**; (2) o
0014 estabeleceu o **padrão híbrido** (extensão scaffolda um arquivo por template + reusa a ação
do 0004 para o conteúdo por IA). Como a análise de clarificação é intrinsecamente trabalho de
linguagem natural, o quanto isto é uma camada fina sobre o 0004 é decisão de **design** (Q1), não
desta spec.

## Escopo

### Incluído

- **Etapa de clarificação da spec** (RF-008): acionar a análise das nove categorias sobre a spec
  de uma mudança.
- **Registro em `clarifications.md`** na pasta da mudança.

### Não incluído

- **Design (RF-009, 0014)** e **research (RF-007)** — etapas próprias.
- **Resolver as ambiguidades automaticamente** — clarificar é levantar e registrar; decidir é do
  humano (constituição, Art. 2/9).
- **Promover `DRAFT → CLARIFIED`** — transição de estado é do fluxo de status (D-Q4).

---

## Decisões de escopo (2026-08-01)

As questões Q3–Q5 foram respondidas pelo autor. Q1 e Q2 são de natureza arquitetural/estrutural
e ficam para o `design.md` — não bloqueiam esta spec.

| # | Decisão | Efeito |
| --- | --- | --- |
| D-Q3 | O gatilho é o comando **"Clarificar"** no item da feature (painel Features), como as demais ações. | REQ-CLAR-001. |
| D-Q4 | Pré-condição: a spec tem **requisitos** (`REQ-*` presentes). A ação **não promove** `DRAFT → CLARIFIED` — a transição de estado permanece com o fluxo de status; clarificar levanta lacunas, não as resolve. | REQ-CLAR-001; SCN-CLAR-002. |
| D-Q5 | `clarifications.md`: as **nove categorias do RF-008 como seções fixas**, cada uma com os achados e um espaço para a **resolução/resposta** (RF-008 registra "as respostas"). | REQ-CLAR-002. |

---

## Requisitos funcionais

> Origem: os requisitos derivam do texto do RF-008 e das decisões D-Q3..D-Q5 acima.

### REQ-CLAR-001 — Análise de clarificação da spec

A extensão deve oferecer, no **item da feature** (D-Q3), a ação de analisar a spec e identificar as
nove categorias do RF-008: requisitos ambíguos, critérios de aceite ausentes, conflitos, regras
incompletas, casos extremos, dependências não definidas, decisões técnicas prematuras, riscos de
segurança e impactos em dados. A ação só é oferecida quando a spec tem requisitos (`REQ-*`
presentes, D-Q4). A análise levanta e registra — **não decide** pela pessoa e **não promove** o
estado da mudança.

#### SCN-CLAR-001 — Spec com requisitos

DADO uma mudança cuja `spec.md` tem requisitos (`REQ-*`)
QUANDO o usuário aciona a clarificação no item da feature
ENTÃO a extensão produz (ou auxilia a produzir) uma análise cobrindo as nove categorias do RF-008.

#### SCN-CLAR-002 — Sem requisitos para analisar

DADO uma mudança sem `spec.md` ou sem requisitos (`REQ-*`)
QUANDO o usuário aciona a clarificação
ENTÃO a ação informa que não há requisitos para clarificar e não produz análise
E o estado da mudança permanece inalterado.

### REQ-CLAR-002 — Registro em `clarifications.md`

O resultado deve ser registrado em `clarifications.md` na pasta da mudança, com as **nove
categorias do RF-008 como seções fixas**, cada uma listando os achados e um espaço para a
resolução/resposta (D-Q5). Um `clarifications.md` existente não deve ser sobrescrito sem
confirmação explícita (herda o padrão do 0014/0008).

#### SCN-CLAR-003 — Documento com as nove categorias

DADO uma clarificação acionada
QUANDO o `clarifications.md` é produzido
ENTÃO ele contém as nove categorias do RF-008 como seções, com espaço para achados e resolução.

#### SCN-CLAR-004 — `clarifications.md` já existe

DADO uma mudança que já possui `clarifications.md`
QUANDO o usuário aciona a clarificação
ENTÃO a extensão pede confirmação antes de sobrescrever
E, se o usuário não confirmar, o `clarifications.md` atual permanece intacto.

---

## Requisitos não funcionais

### NFR-CLAR-001 — Sem rede própria

Nenhum I/O de rede na extensão; a análise por IA passa pelo Claude Code (RNF-004), no padrão do
0014 (ADR-014).

### NFR-CLAR-002 — Compatibilidade

Funciona em Windows, Linux e WSL (RNF-002), com os mesmos caminhos de `.specs/` das demais features.

### NFR-CLAR-003 — Núcleo puro e testável

A checagem da pré-condição (spec tem `REQ-*`) e a montagem da estrutura do `clarifications.md`
devem ser puras (sem a API do VS Code), testáveis fora do host (standards §6).

---

## Critérios de aceite

- [ ] A ação "Clarificar" aparece no item da feature e só produz análise quando a spec tem
      requisitos; sem requisitos, explica e não produz (REQ-CLAR-001, SCN-CLAR-002).
- [ ] A análise cobre as nove categorias do RF-008 (REQ-CLAR-001).
- [ ] O resultado é registrado em `clarifications.md` com as nove categorias como seções; um
      existente não é sobrescrito sem confirmação (REQ-CLAR-002, SCN-CLAR-003/004).
- [ ] A ação não promove o estado da mudança (D-Q4, SCN-CLAR-002).
- [ ] Nada é enviado para fora pela extensão (NFR-CLAR-001); a pré-condição e a montagem são
      puras e cobertas por testes (NFR-CLAR-003).

---

## Questões pendentes

Q3–Q5 foram respondidas — ver **Decisões de escopo**. Permanecem duas questões, ambas **de
design** (o *como*), que não impedem a spec de sair de DRAFT:

| # | Questão | Bloqueia | Prioridade |
| --- | --- | --- | --- |
| Q1 | A análise delega ao Claude Code (ação `clarify` do 0004, `/sdd-kit:clarify`) ou a extensão faz análise heurística própria? Decisão arquitetural → provável ADR. | design | alta |
| Q2 | A extensão scaffolda o `clarifications.md` por template (padrão 0014), ou o arquivo é escrito só pelo Claude Code? | design | média |

## Hipóteses assumidas

> HIPÓTESE: A análise delega ao Claude Code pela ação `clarify` do 0004 (RF-011), coerente com
> "sem rede" e com o padrão do 0014 — a confirmar em Q1 no design.

> HIPÓTESE: A extensão scaffolda um `clarifications.md` a partir de um template, análogo ao
> `design.md` do 0014 — a confirmar em Q2.
