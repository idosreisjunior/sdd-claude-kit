# Feature: Research assistido (RF-007)

- **ID:** 0017-research
- **Escopo dos identificadores:** RES
- **Estado:** ver `status.yaml` — a autoridade é ele

---

## Objetivo

Dar à extensão uma etapa de **research** no início do fluxo SDD — antes da spec —, que reúne
material sobre as oito frentes do RF-007 e o registra para revisão humana antes de ser incorporado
à especificação.

## Contexto

O RF-007 quer uma etapa de research **antes da especificação**, analisando: estrutura do projeto,
arquivos relacionados, dependências, padrões existentes, documentação local, riscos, soluções já
implementadas e APIs/integrações relevantes. O material coletado deve ser **revisável antes de
incorporá-lo à spec** — a incorporação é decisão humana.

As etapas de análise já materializadas (0014 design, 0015 clarify) fixaram o **modelo híbrido**: a
extensão scaffolda um arquivo por template + reusa uma ação do adapter 0004 para o conteúdo por IA.
Duas diferenças moldam o research: (1) a ação `research` **não existe** no conjunto fechado do 0004
(`spec/clarify/design/tasks/implement/verify`) — habilitá-la exige acrescentá-la (Q1); (2) o
research roda **antes da spec**, então a pré-condição não exige requisitos nem aprovação (D-Q4).

## Escopo

### Incluído

- **Etapa de research** de uma mudança, cobrindo as oito frentes do RF-007.
- **Registro em `research.md`**, revisável antes de incorporar à spec.

### Não incluído

- **Incorporação automática à spec** — revisar "antes de incorporar" é do humano (Art. 2/9); a
  incorporação é manual, via `/sdd-kit:spec` (D-Q5).
- **Design (0014), clarify (0015)** — etapas próprias.

---

## Decisões de escopo (2026-08-01)

As questões Q3–Q6 foram respondidas pelo autor. Q1 (acrescentar a ação `research` ao 0004) e Q2
(template do `research.md`) são de design e ficam para o `design.md`.

| # | Decisão | Efeito |
| --- | --- | --- |
| D-Q3 | Gatilho: comando **"Research"** no item da feature (painel Features), como as demais ações. | REQ-RES-001. |
| D-Q4 | Pré-condição: **basta a mudança existir** — sem exigir `REQ-*` nem aprovação (research é a etapa mais cedo do fluxo). | REQ-RES-001. |
| D-Q5 | **Incorporação manual**: `research.md` é o artefato revisável; o humano incorpora escrevendo/refinando a spec via `/sdd-kit:spec`. Sem incorporação automática nem apoio extra. | REQ-RES-002. |
| D-Q6 | `research.md`: as **oito frentes do RF-007 como seções fixas** com lacunas. | REQ-RES-002. |

---

## Requisitos funcionais

> Origem: os requisitos derivam do texto do RF-007 e das decisões D-Q3..D-Q6.

### REQ-RES-001 — Etapa de research da mudança

A extensão deve oferecer, por um comando no item da feature (D-Q3), iniciar uma etapa de research
que reúna material sobre as oito frentes do RF-007: estrutura do projeto, arquivos relacionados,
dependências, padrões existentes, documentação local, riscos, soluções já implementadas e
APIs/integrações relevantes. A ação fica disponível assim que a mudança existe (D-Q4), antes da spec.

#### SCN-RES-001 — Iniciar o research

DADO uma mudança existente
QUANDO o usuário aciona "Research" no item da feature
ENTÃO a extensão produz (ou auxilia a produzir) material cobrindo as oito frentes do RF-007.

### REQ-RES-002 — Registro revisável em `research.md`

O material deve ser registrado em `research.md` na pasta da mudança, com as **oito frentes do
RF-007 como seções fixas** (D-Q6), como artefato **revisável antes de ser incorporado à spec**. A
incorporação é manual (D-Q5). Um `research.md` existente não deve ser sobrescrito sem confirmação.

#### SCN-RES-002 — Documento com as oito frentes

DADO um research acionado
QUANDO o `research.md` é produzido
ENTÃO ele contém as oito frentes do RF-007 como seções, com espaço para os achados.

#### SCN-RES-003 — `research.md` já existe

DADO uma mudança que já possui `research.md`
QUANDO o usuário aciona o research
ENTÃO a extensão pede confirmação antes de sobrescrever
E, se o usuário não confirmar, o `research.md` atual permanece intacto.

---

## Requisitos não funcionais

### NFR-RES-001 — Sem rede própria

Nenhum I/O de rede na extensão; a análise por IA passa pelo Claude Code (RNF-004), padrão do 0014.

### NFR-RES-002 — Compatibilidade

Funciona em Windows, Linux e WSL (RNF-002), com os mesmos caminhos de `.specs/` das demais features.

### NFR-RES-003 — Núcleo puro e testável

A montagem da estrutura do `research.md` (as oito frentes) é pura (sem a API do VS Code), testável
fora do host (standards §6).

---

## Critérios de aceite

- [ ] A ação "Research" no item da feature inicia o research cobrindo as oito frentes do RF-007,
      disponível assim que a mudança existe (REQ-RES-001).
- [ ] O material é registrado em `research.md` com as oito frentes como seções; um existente não é
      sobrescrito sem confirmação (REQ-RES-002, SCN-RES-002/003).
- [ ] Nada é enviado para fora pela extensão; a análise por IA passa pelo Claude Code (NFR-RES-001).
- [ ] A montagem da estrutura é pura e coberta por testes (NFR-RES-003).

---

## Questões pendentes

Q3–Q6 foram respondidas — ver **Decisões de escopo**. Permanecem duas questões, ambas **de design**
(o *como*), que não impedem a spec de sair de DRAFT:

| # | Questão | Bloqueia | Prioridade |
| --- | --- | --- | --- |
| Q1 | A análise delega ao Claude Code **acrescentando a ação `research`** ao conjunto do adapter 0004 (que hoje não a tem), ou por outro mecanismo? Decisão arquitetural → provável ADR. | design | alta |
| Q2 | A estrutura do `research.md` (oito frentes) vem de um novo template `templates/pt-BR/feature/research.md`, análogo ao design/clarifications? | design | média |

## Hipóteses assumidas

> HIPÓTESE: A análise delega ao Claude Code acrescentando a ação `research` ao 0004 (coerente com
> "sem rede" e o padrão do 0014/0015) — a confirmar em Q1 no design.

> HIPÓTESE: A extensão scaffolda um `research.md` a partir de um template com as oito frentes,
> análogo ao design.md/clarifications.md — a confirmar em Q2.
