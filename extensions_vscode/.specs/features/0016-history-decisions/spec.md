# Feature: Histórico e decisões (RF-020)

- **ID:** 0016-history-decisions
- **Escopo dos identificadores:** HIST
- **Estado:** ver `status.yaml` — a autoridade é ele

---

## Objetivo

Dar visibilidade ao **histórico de atividades** de uma mudança, agregando as fontes já existentes,
e permitir **registrar decisões importantes como ADRs**.

## Contexto

O RF-020 quer um histórico de dez tipos de atividade e a possibilidade de registrar decisões como
ADRs. Boa parte já existe em artefatos versionados: `status.yaml` guarda o `history` de mudanças de
status (com data e motivo) e o `approval`; `decisions/` guarda os ADRs; `tasks.md`/`status.yaml`
têm as tarefas concluídas; o 0007 dá os commits e o diff; o 0008 dá a validação. A extensão
**agrega e apresenta** esse subconjunto — somente leitura.

Já as **execuções do Claude Code**, o **contexto utilizado** ao longo do tempo, os **erros** e as
**ações manuais** não são persistidos hoje; exibi-los exigiria instrumentação nova. Por decisão de
escopo (D-Q1/D-Q3), ficam **fora** deste incremento, marcados como indisponíveis — o mesmo
tratamento que o 0009 deu às métricas não obteníveis.

A criação de ADRs é concreta e construível hoje: existe o template `adr/ADR-template.md`, e a
alocação de número reconcilia com os ADRs já existentes (numeração global, standards §2).

## Escopo

### Incluído

- **Visão do histórico** de uma mudança, agregando as fontes existentes (status/aprovações, ADRs,
  tarefas concluídas, commits do 0007, validação do 0008) — somente leitura.
- **Registrar uma decisão como ADR** na pasta `decisions/` da mudança.

### Não incluído

- **Eventos não persistidos** (execuções do Claude Code, contexto ao longo do tempo, erros, ações
  manuais) — sem fonte, marcados como indisponíveis (D-Q1/D-Q3).
- **Telemetria** (RNF-004) e **edição do histórico** (append-only, constituição Art. 5).

---

## Decisões de escopo (2026-08-01)

As questões Q1, Q3 e Q4 foram respondidas pelo autor. Q2 (apresentação) e o mecanismo de
numeração do ADR (parte de Q5) são de design e ficam para o `design.md`.

| # | Decisão | Efeito |
| --- | --- | --- |
| D-Q1 | O histórico agrega **só o já persistido**: mudanças de status e aprovações (`status.yaml`), ADRs (`decisions/`), tarefas concluídas, commits (0007) e validação (0008). Não instrumenta eventos novos. | REQ-HIST-001. |
| D-Q3 | **Contexto/métricas ao longo do tempo ficam fora** deste incremento — marcados como indisponíveis (o snapshot do 0009 é efêmero, no `workspaceState`, natureza diferente de histórico). | REQ-HIST-001. |
| D-Q4 | Gatilhos: comandos **"Histórico"** e **"Novo ADR"** no item da feature (painel Features), como as demais ações. | REQ-HIST-001; REQ-HIST-002. |

---

## Requisitos funcionais

> Origem: os requisitos derivam do texto do RF-020 e das decisões D-Q1/D-Q3/D-Q4.

### REQ-HIST-001 — Visão do histórico da mudança

A extensão deve apresentar, por um comando no item da feature (D-Q4), o histórico de atividades de
uma mudança em ordem cronológica, agregando **apenas as fontes já persistidas** (D-Q1): mudanças
de status e aprovações (`status.yaml`), ADRs (`decisions/`), tarefas concluídas, commits (0007) e
validação (0008). Atividades sem fonte persistida (execuções do Claude Code, contexto ao longo do
tempo, erros, ações manuais) são marcadas como indisponíveis, nunca inventadas.

#### SCN-HIST-001 — Histórico de uma mudança com artefatos

DADO uma mudança com `status.yaml` (history), ADRs e tarefas
QUANDO o usuário aciona "Histórico" no item da feature
ENTÃO a extensão apresenta os eventos disponíveis em ordem cronológica
E marca como indisponíveis as categorias sem fonte persistida.

#### SCN-HIST-002 — Mudança sem artefatos de histórico

DADO uma mudança recém-criada, sem transições além de DRAFT
QUANDO o usuário aciona "Histórico"
ENTÃO a extensão apresenta o que houver (a criação) sem quebrar.

### REQ-HIST-002 — Registrar uma decisão como ADR

A extensão deve permitir, por um comando no item da feature (D-Q4), registrar uma decisão como ADR
na pasta `decisions/` da mudança, a partir do template de ADR, com o número **reconciliado com os
ADRs já existentes** (numeração global, nunca reutilizada). Não sobrescreve um ADR existente.

#### SCN-HIST-003 — Novo ADR

DADO uma mudança
QUANDO o usuário aciona "Novo ADR" e informa o título
ENTÃO a extensão cria `decisions/ADR-NNN-<slug>.md` a partir do template, com o próximo número
livre reconciliado no projeto.

#### SCN-HIST-004 — Colisão de arquivo de ADR

DADO que o arquivo de ADR alvo já existe
QUANDO o usuário aciona "Novo ADR"
ENTÃO a extensão não sobrescreve o ADR existente e reporta o conflito.

---

## Requisitos não funcionais

### NFR-HIST-001 — Somente leitura (exceto criar ADR)

A visão do histórico não altera nenhum artefato; a única escrita é a criação de um novo ADR
(REQ-HIST-002). Nada é executado (herda NFR-EVID-004/0008).

### NFR-HIST-002 — Sem rede

Nenhum I/O de rede (RNF-004).

### NFR-HIST-003 — Núcleo puro e testável

A agregação do histórico e a alocação do número de ADR são puras (sem a API do VS Code),
testáveis fora do host (standards §6).

---

## Critérios de aceite

- [ ] A extensão apresenta o histórico da mudança a partir das fontes persistidas, em ordem
      cronológica, marcando o indisponível (REQ-HIST-001).
- [ ] "Novo ADR" cria `decisions/ADR-NNN-<slug>.md` do template, com número reconciliado no
      projeto e sem sobrescrever (REQ-HIST-002, SCN-HIST-003/004).
- [ ] A visão não altera artefatos; só a criação de ADR escreve (NFR-HIST-001).
- [ ] A agregação e a alocação de número são puras e cobertas por testes (NFR-HIST-003).

---

## Questões pendentes

Q1, Q3 e Q4 foram respondidas — ver **Decisões de escopo**. Permanecem duas questões **de design**
(o *como*), que não impedem a spec de sair de DRAFT:

| # | Questão | Bloqueia | Prioridade |
| --- | --- | --- | --- |
| Q2 | Apresentação do histórico: webview de timeline (como 0008/0009), canal de saída, ou item na árvore? Decisão de design → provável ADR. | design | média |
| Q5 | Mecanismo do "Novo ADR": como varrer todos os `decisions/` do projeto para achar o próximo número, e como derivar o `<slug>` do título. | design | média |

## Hipóteses assumidas

> HIPÓTESE: A apresentação do histórico reusa o padrão de webview do 0008/0009 — a confirmar em Q2
> no design.

> HIPÓTESE: A numeração do ADR é alocada varrendo os `decisions/` de todas as mudanças (como o
> `collectExistingIds` faz para ids de mudança) — a confirmar em Q5 no design.
