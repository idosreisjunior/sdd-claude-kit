# Feature: Evidências e validação da feature

- **ID:** 0008-evidence-validation
- **Escopo dos identificadores:** EVID
- **Estado:** ver `status.yaml` — a autoridade é ele

---

## Objetivo

Permitir validar uma mudança — classificar cada requisito quanto ao atendimento — e coletar/
organizar as evidências da implementação, sem executar nada nem concluir sem evidência à revelia.

## Contexto

O fluxo SDD só fecha quando a implementação é confrontada com o que foi especificado: cada
requisito tem tarefas, testes e arquivos ligados na matriz de rastreabilidade (0007), e o
Artigo 13 da constituição exige evidência antes de concluir. Hoje a extensão monta e navega a
rastreabilidade, mas não a **avalia** nem reúne evidências. Esta feature é o "Evidence +
Validation Engine" (arquitetura §2): lê a matriz e o estado da mudança e produz um veredito por
requisito (RF-017), e organiza as evidências disponíveis (RF-016).

## Escopo

### Incluído

- **Relatório de validação** (RF-017): classificação de cada requisito (atendido / parcial /
  não atendido / não testado / não aplicável), com pendências e divergências.
- **Coleta de evidências** (RF-016): reunir e organizar as evidências disponíveis num
  `evidence.md` (testes, lint, build, cobertura, commits, diff, checklist, validação manual).
- **Trava de conclusão sem evidência** (RF-016): concluir sem evidência exige confirmação
  explícita.

### Não incluído

- Execução automática dos comandos de validação (lint/test/build) sem ação/revisão explícita —
  são entrada não confiável (arquitetura §6).
- Integração com GitHub/PR (RF-019) e métricas (feature 0009).

---

## Decisões de escopo (2026-07-31)

As questões Q1–Q5 foram respondidas pelo autor; a de natureza arquitetural vira ADR no design.

| # | Decisão | Efeito |
| --- | --- | --- |
| D-Q1 | **Primeiro incremento**: relatório de validação (RF-017 / REQ-EVID-001). Coleta de evidências (RF-016) e trava de conclusão vêm depois; 0008 fica IN_PROGRESS. | tasks. |
| D-Q2 | O relatório de validação é um **webview** (tabela por requisito, categorias). **Requer ADR** (segue o padrão do dashboard/painel Projeto). | REQ-EVID-001; NFR-EVID-001. |
| D-Q3 | **Heurística** aprovada: `não aplicável` = requisito em `gaps`; `não atendido` = sem implementação; `não testado` = implementação sem teste; `parcial` = implementação + teste sem tarefa ligada; `atendido` = tarefa + teste + implementação. | REQ-EVID-001. |
| D-Q4 | A coleta de evidências (RF-016) **só reúne o que já existe** (commits/diff/status/validação) — **não executa** os comandos do `config.yaml`. Incremento 2. | REQ-EVID-002; NFR-EVID-004. |
| D-Q5 | O `evidence.md` é **gerado** (preview + confirmação) quando ausente; **não sobrescreve** um existente — copia o conteúdo para o usuário mesclar, preservando texto humano (Art. 5). Incremento 2. | REQ-EVID-002. |
| D-Q6 | A **trava de conclusão sem evidência** (REQ-EVID-003) fica fora do escopo desta feature na extensão: a extensão não executa a conclusão/verificação de uma mudança (é ação das skills / `/sdd-kit:verify`). Registrada como lacuna; candidata a uma ação futura de "concluir". | REQ-EVID-003. |

---

## Requisitos funcionais

### REQ-EVID-001 — Relatório de validação

Para uma mudança, a extensão deve classificar cada requisito da matriz de rastreabilidade em
uma de cinco categorias — **atendido**, **parcialmente atendido**, **não atendido**, **não
testado**, **não aplicável** — comparando requisitos × tarefas × testes × implementação ×
evidências, e destacar pendências e divergências (RF-017). Robusto a matriz ausente/incompleta.

#### SCN-EVID-001 — Requisito plenamente coberto

DADO um requisito com tarefas, testes e implementação na matriz, e testes passando
QUANDO a extensão valida a mudança
ENTÃO classifica o requisito como "atendido".

#### SCN-EVID-002 — Requisito sem teste

DADO um requisito com tarefas e implementação, mas sem testes ligados
QUANDO a extensão valida a mudança
ENTÃO classifica o requisito como "não testado".

#### SCN-EVID-003 — Requisito sem implementação

DADO um requisito com tarefas mas sem implementação ligada
QUANDO a extensão valida a mudança
ENTÃO classifica o requisito como "não atendido" (ou "parcial", conforme a heurística Q3).

#### SCN-EVID-004 — Requisito declarado como lacuna

DADO um requisito listado em `gaps` da matriz (só verificável por revisão humana)
QUANDO a extensão valida a mudança
ENTÃO classifica o requisito como "não aplicável" (à cobertura automatizada) e o sinaliza.

### REQ-EVID-002 — Coleta de evidências

A extensão deve coletar e organizar as evidências disponíveis da implementação num `evidence.md`
da mudança (RF-016), suportando os tipos: testes automatizados, lint, build, cobertura, capturas,
logs, resposta de API, SQL, diff, commits, validação manual, checklist. A escrita do
`evidence.md` só ocorre por ação explícita do usuário.

#### SCN-EVID-005 — Organizar evidências disponíveis

DADO commits e um diff da mudança (via 0007) e resultados de validação fornecidos
QUANDO o usuário aciona a coleta de evidências
ENTÃO a extensão organiza as evidências por tipo num `evidence.md`, sem sobrescrever sem aviso.

### REQ-EVID-003 — Conclusão sem evidência exige confirmação

A extensão não deve permitir marcar uma mudança/tarefa como concluída **sem evidência** a não
ser mediante confirmação explícita do usuário (RF-016, constituição Art. 13).

#### SCN-EVID-006 — Concluir sem evidência

DADO uma mudança sem evidência coletada
QUANDO o usuário tenta marcá-la como concluída
ENTÃO a extensão exige uma confirmação explícita antes de prosseguir.

---

## Requisitos não funcionais

### NFR-EVID-001 — Núcleo puro e testável

A classificação de validação e a organização de evidências são puras (sem a API do VS Code),
testáveis fora do host (standards §6), à semelhança de 0005/0006/0007.

### NFR-EVID-002 — Robustez

Matriz/estado ausentes, incompletos ou malformados resultam em relatório informativo, nunca em
exceção (herda NFR-FEAT-001).

### NFR-EVID-003 — Sem rede

Nenhum I/O de rede (ADR-005).

### NFR-EVID-004 — Nada roda nem se escreve à revelia

Nenhum comando de validação é executado, e nenhum arquivo é escrito, sem ação explícita do
usuário. Comandos do `config.yaml` são entrada não confiável (arquitetura §6).

---

## Critérios de aceite

- [ ] Cada requisito recebe uma das cinco classificações, com pendências/divergências
      destacadas (REQ-EVID-001).
- [ ] As evidências disponíveis são organizadas por tipo num `evidence.md`, só por ação
      explícita (REQ-EVID-002).
- [ ] Concluir sem evidência exige confirmação explícita (REQ-EVID-003, NFR-EVID-004).
- [ ] Núcleos de classificação/organização são puros e cobertos por testes (NFR-EVID-001).

---

## Questões pendentes

Nenhuma pendente para o incremento 1. Q1–Q4 foram respondidas em 2026-08-01 — ver **Decisões
de escopo**. D-Q2 (webview) exige um ADR no design. Q5 (evidence.md gerado vs. preenchido)
fica para o incremento de RF-016 (coleta de evidências), não bloqueia a validação.

## Hipóteses assumidas

Nenhuma em aberto para o incremento 1. A classificação de validação é derivada da **matriz de
rastreabilidade** e dos `gaps` (cobertura declarada), não da execução de testes — o resultado
da suíte, quando disponível, entra como insumo à parte (D-Q3, D-Q4).
