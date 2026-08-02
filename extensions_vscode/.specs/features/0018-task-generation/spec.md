# Feature: Geração de tarefas (RF-010)

- **ID:** 0018-task-generation
- **Escopo dos identificadores:** TGEN
- **Estado:** ver `status.yaml` — a autoridade é ele

---

## Objetivo

Dar à extensão a etapa de **tarefas** do fluxo SDD: delegar a geração ao Claude Code (skill já
existente) e **analisar o `tasks.md`** resultante — alertando sobre tarefas excessivamente grandes
e sobre tarefas sem os campos obrigatórios do RF-010.

## Contexto

O RF-010 quer decompor o design em tarefas pequenas, cada uma com onze campos (identificador,
título, descrição, arquivos prováveis, dependências, requisitos relacionados, critérios de
conclusão, testes esperados, complexidade, status, evidências necessárias), e **impedir ou alertar
sobre tarefas excessivamente grandes**.

Diferença central em relação às etapas híbridas (0014 design, 0015 clarify, 0017 research): a
**geração já existe** — a skill `/sdd-kit:tasks` está implementada (não é Fase 2) e a ação `tasks`
já está no adapter 0004. Logo, o incremento novo do RF-010 na extensão é a **análise** do
`tasks.md`, no molde dos analisadores (Project Doctor 0006, validação 0008) e não do padrão
híbrido de esqueleto — que não cabe, porque o `tasks.md` tem **N tarefas variáveis**, não seções
fixas. Já existe `parseTasksPlan` (0007) parseando o `tasks.md`; reusar/estender é decisão de design.

O "impedir OU alertar" do RF-010: a extensão não controla o que o Claude Code escreve, então
**alerta** — sinaliza tarefas grandes/incompletas; a decisão de refazer é do humano/do fluxo.

## Escopo

### Incluído

- **Análise do `tasks.md`**: alerta sobre tarefas grandes (complexidade G) e sobre tarefas sem
  algum dos onze campos obrigatórios do RF-010 (D-Q2).
- **Atalho de geração** reusando a ação `tasks` do 0004 (`/sdd-kit:tasks`).

### Não incluído

- **Reimplementar a geração** — a skill `/sdd-kit:tasks` já faz; a extensão delega.
- **Bloquear o agente** — "impedir" vira alertar (a extensão não controla o agente).

---

## Decisões de escopo (2026-08-02)

As questões Q2, Q4 e Q5 foram respondidas pelo autor. Q1 (superfície da análise) e Q3 (parser) são
de design e ficam para o `design.md`.

| # | Decisão | Efeito |
| --- | --- | --- |
| D-Q2 | A análise sinaliza **tarefas de complexidade G** e **tarefas sem algum campo obrigatório**. Não sinaliza tarefas órfãs (isso é do `/sdd-kit:tasks`). | REQ-TGEN-001. |
| D-Q2b | Descoberto na implementação: o template `tasks.md` do framework tem **10** dos 11 campos do RF-010 — falta **"evidências necessárias"**. A análise checa os **10 campos que o formato define**; "evidências necessárias" fica de fora e é registrada como **gap framework→template** (um change próprio no `_shared/tasks.md`), para não gerar falso-positivo em toda tarefa existente. | REQ-TGEN-001; gap. |
| D-Q4 | Sem `tasks.md`: a extensão **informa** que não há tarefas e **oferece gerar** com o Claude Code (`/sdd-kit:tasks`). | REQ-TGEN-001; REQ-TGEN-002. |
| D-Q5 | Gatilho: comando **"Tarefas"** no item da feature (analisar + oferecer gerar). | REQ-TGEN-001; REQ-TGEN-002. |

---

## Requisitos funcionais

> Origem: os requisitos derivam do texto do RF-010 e das decisões D-Q2/D-Q4/D-Q5.

### REQ-TGEN-001 — Análise do `tasks.md`

A extensão deve, por um comando no item da feature (D-Q5), analisar o `tasks.md` de uma mudança e
sinalizar: **(a)** tarefas de complexidade **G** (excessivamente grandes, RF-010); **(b)** tarefas
sem algum dos onze campos obrigatórios do RF-010 (D-Q2). A análise é somente leitura.

#### SCN-TGEN-001 — Tarefa grande presente

DADO um `tasks.md` com ao menos uma tarefa de complexidade G
QUANDO o usuário aciona "Tarefas"
ENTÃO a extensão sinaliza a(s) tarefa(s) G como excessivamente grande(s).

#### SCN-TGEN-002 — Tarefa com campo obrigatório ausente

DADO um `tasks.md` com uma tarefa sem algum dos onze campos do RF-010
QUANDO o usuário aciona "Tarefas"
ENTÃO a extensão sinaliza a tarefa e o(s) campo(s) ausente(s).

#### SCN-TGEN-003 — Todas as tarefas pequenas e completas

DADO um `tasks.md` sem tarefas G e com todas as tarefas completas
QUANDO o usuário aciona "Tarefas"
ENTÃO a extensão informa que não há alertas.

#### SCN-TGEN-004 — Sem `tasks.md`

DADO uma mudança sem `tasks.md`
QUANDO o usuário aciona "Tarefas"
ENTÃO a extensão informa que não há tarefas para analisar
E oferece gerar com o Claude Code (`/sdd-kit:tasks`).

### REQ-TGEN-002 — Geração/refino via Claude Code

A extensão deve oferecer gerar ou refinar as tarefas com o Claude Code, reusando a ação `tasks` do
adapter 0004 (`/sdd-kit:tasks`), sem reimplementar a decomposição.

#### SCN-TGEN-005 — Delegar a geração

DADO uma mudança
QUANDO o usuário pede para gerar/refinar as tarefas
ENTÃO a extensão compõe e prepara `/sdd-kit:tasks <id>` no Claude Code (como as demais ações do 0004).

---

## Requisitos não funcionais

### NFR-TGEN-001 — Somente leitura

A análise não altera o `tasks.md` nem qualquer artefato (herda o padrão dos analisadores 0006/0008).

### NFR-TGEN-002 — Sem rede

Nenhum I/O de rede na extensão; a geração por IA passa pelo Claude Code (RNF-004).

### NFR-TGEN-003 — Núcleo puro e testável

O parsing do `tasks.md` e a classificação (tarefa grande / campos ausentes) são puros (sem a API
do VS Code), testáveis fora do host (standards §6).

---

## Critérios de aceite

- [ ] A análise sinaliza tarefas de complexidade G e tarefas com campo obrigatório ausente
      (REQ-TGEN-001, SCN-TGEN-001/002).
- [ ] Sem tarefas G e com tudo completo, informa que não há alertas (SCN-TGEN-003).
- [ ] Sem `tasks.md`, informa e oferece gerar com o Claude Code (SCN-TGEN-004, REQ-TGEN-002).
- [ ] A extensão oferece gerar/refinar via `/sdd-kit:tasks` (REQ-TGEN-002, SCN-TGEN-005).
- [ ] A análise é somente leitura; o núcleo de parsing/classificação é puro e coberto por testes
      (NFR-TGEN-001, NFR-TGEN-003).

---

## Questões pendentes

Q2, Q4 e Q5 foram respondidas — ver **Decisões de escopo**. Permanecem duas questões, ambas **de
design** (o *como*), que não impedem a spec de sair de DRAFT:

| # | Questão | Bloqueia | Prioridade |
| --- | --- | --- | --- |
| Q1 | Superfície da análise — webview de relatório (0008/0009), canal de saída (0007), ou diagnósticos/Problems (0006)? Decisão de design → provável ADR. | design | média |
| Q3 | Reusar o `parseTasksPlan` (0007) ou estendê-lo/criar um parser que capture a complexidade e os onze campos por tarefa? | design | média |

## Hipóteses assumidas

> HIPÓTESE: A superfície reusa o padrão de webview de relatório do 0008/0009 — a confirmar em Q1
> no design.

> HIPÓTESE: O parser estende/reusa o `parseTasksPlan` (0007) para capturar complexidade e campos —
> a confirmar em Q3 no design.
