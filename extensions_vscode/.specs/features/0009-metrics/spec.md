# Feature: Métricas locais

- **ID:** 0009-metrics
- **Escopo dos identificadores:** METR
- **Estado:** ver `status.yaml` — a autoridade é ele

---

## Objetivo

Calcular e apresentar métricas locais de uma mudança — o subconjunto tecnicamente viável a
partir de `.specs/` e do Git — sem telemetria e sem enviar nada para fora.

## Contexto

O RF-021 quer medir produtividade "quando tecnicamente possível", e o RF-022 quer relatórios,
respeitando a privacidade (RNF-004: dados locais, sem telemetria obrigatória, coleta
desativável). A extensão já produz os insumos: rastreabilidade (0007), validação (0008) e
estimativa de contexto (0005). Falta reuni-los em métricas por feature. Muitas métricas do
RF-021 (tokens reais do agente, interações, custo real) a extensão **não** consegue obter com
fidelidade — para essas, usa-se estimativa local rotulada, ou ficam de fora. É o "Metrics
Collector" da arquitetura (§2).

## Escopo

### Incluído

- **Cálculo das métricas viáveis** de uma feature (RF-021): contagens (tarefas, requisitos,
  cenários, testes, arquivos), % de requisitos validados (via 0008), linhas +/- e arquivos
  alterados (via 0007), duração a partir das datas do `status.yaml`, tokens estimados (via 0005).
- **Relatório da feature** (RF-022): visualização no VS Code e exportação Markdown/JSON.
- **Privacidade** (RNF-004): tudo local, sem telemetria, coleta desativável por configuração.

### Não incluído

- Telemetria / envio de dados (RNF-004).
- Métricas não obteníveis com fidelidade (tokens/interações/custo reais do agente) — estimativa
  rotulada, ou fora.
- Agregação por projeto/período/desenvolvedor/equipe/modelo e formatos CSV/PDF — incrementos
  seguintes (RF-022).

---

## Decisões de escopo (2026-08-01)

As questões Q1–Q5 foram respondidas pelo autor; a de natureza arquitetural vira ADR no design.

| # | Decisão | Efeito |
| --- | --- | --- |
| D-Q1 | O relatório de métricas é um **webview** (cartões/tabela), como o de validação. **Requer ADR** (ADR-013). | REQ-METR-002; NFR-METR-001. |
| D-Q2 | **Persistir** um snapshot local por feature no `workspaceState` (RNF-004: local, desativável); o relatório mostra o **delta vs. a medição anterior**. Série temporal completa e métricas de retrabalho ficam para depois. | REQ-METR-001. |
| D-Q3 | **Subconjunto** aprovado: tarefas (total/concluídas), requisitos, cenários, testes, arquivos rastreados, % validado (0008), arquivos alterados e linhas +/- (0007), duração (datas do `status.yaml`), tokens estimados (0005). Demais do RF-021 ficam fora ou como estimativa rotulada. | REQ-METR-001. |
| D-Q4 | Exportação em **Markdown + JSON** (RF-022). CSV/PDF e agregações depois. | REQ-METR-002. |
| D-Q5 | Nova configuração **`sddClaudeKit.metrics.enabled`** (padrão `true`) desativa a coleta (RNF-004); desativada, nada é calculado nem persistido. | REQ-METR-003. |

---

## Requisitos funcionais

### REQ-METR-001 — Cálculo de métricas da feature

Para uma mudança, a extensão deve calcular o subconjunto de métricas tecnicamente viável a
partir de `.specs/` e do Git (RF-021): número de tarefas (total/concluídas), requisitos,
cenários, testes e arquivos rastreados; percentual de requisitos validados; arquivos alterados
e linhas +/-; duração desde a criação; tokens estimados do contexto. As métricas estimadas
(economia, tokens, custo) devem ser rotuladas como estimativa, com a metodologia explícita.
Robusto a artefatos ausentes/incompletos.

#### SCN-METR-001 — Métricas de uma feature com artefatos completos

DADO uma mudança com `status.yaml`, `traceability.yaml` e histórico de datas
QUANDO a extensão calcula as métricas
ENTÃO reporta contagens, % validado, duração e tokens estimados, marcando as estimativas.

#### SCN-METR-002 — Artefatos parciais

DADO uma mudança sem `traceability.yaml`
QUANDO a extensão calcula as métricas
ENTÃO reporta o que for possível e marca as métricas indisponíveis, sem quebrar.

### REQ-METR-002 — Relatório da feature

A extensão deve apresentar as métricas da feature no VS Code e permitir exportá-las em Markdown
e JSON (RF-022). A exportação só ocorre por ação explícita do usuário.

#### SCN-METR-003 — Exportar em Markdown/JSON

DADO um relatório de métricas calculado
QUANDO o usuário pede a exportação
ENTÃO a extensão gera o conteúdo em Markdown ou JSON, sem enviar nada para fora.

### REQ-METR-003 — Privacidade e coleta local

As métricas devem ser calculadas e mantidas **localmente**, sem telemetria, e a coleta deve ser
**desativável** por configuração (RNF-004). Nada é enviado para fora da máquina.

#### SCN-METR-004 — Coleta desativada

DADO que a coleta de métricas está desativada na configuração
QUANDO o usuário aciona as métricas
ENTÃO a extensão informa que a coleta está desativada e não calcula nada.

---

## Requisitos não funcionais

### NFR-METR-001 — Núcleo puro e testável

O cálculo das métricas e a geração dos relatórios (Markdown/JSON) são puros (sem a API do VS
Code), testáveis fora do host (standards §6).

### NFR-METR-002 — Robustez

Artefatos ausentes/incompletos/malformados resultam em métricas parciais marcadas, nunca em
exceção (herda NFR-FEAT-001).

### NFR-METR-003 — Sem rede

Nenhum I/O de rede (ADR-005, RNF-004).

---

## Critérios de aceite

- [ ] As métricas viáveis são calculadas a partir de `.specs/`+Git, com estimativas rotuladas
      (REQ-METR-001).
- [ ] O relatório é apresentado no VS Code e exportável em Markdown/JSON, só por ação explícita
      (REQ-METR-002).
- [ ] Nada é enviado para fora; a coleta é desativável (REQ-METR-003, NFR-METR-003).
- [ ] O núcleo de cálculo/geração é puro e coberto por testes (NFR-METR-001).

---

## Questões pendentes

Nenhuma pendente para o incremento 1. Q1–Q5 foram respondidas em 2026-08-01 — ver **Decisões
de escopo**. D-Q1 (webview) exige um ADR no design. Agregações (projeto/período/equipe) e
formatos CSV/PDF (RF-022) ficam para incrementos seguintes.

## Hipóteses assumidas

Nenhuma em aberto para o incremento 1. As métricas viáveis são derivadas de `.specs/`+Git; um
snapshot local por feature é persistido (D-Q2) para o delta vs. a medição anterior.
