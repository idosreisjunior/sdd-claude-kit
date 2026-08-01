# Solicitação original

- **ID:** 0009-metrics
- **Tipo:** feature
- **Criada em:** 2026-08-01
- **Origem:** Backlog do MVP (Épico 9 do PRD); materializada a pedido do usuário para especificar e implementar.

---

## Texto da solicitação

> Seguir para o Épico 9 — métricas locais. Cobre RF-021 (medir métricas de produtividade,
> quando tecnicamente possível) e RF-022 (gerar relatórios por feature/projeto/período/…, em
> visualização no VS Code, Markdown, JSON, CSV), respeitando RNF-004 (dados locais, sem
> telemetria obrigatória, coleta desativável).

## Interpretação

A extensão passa a **calcular e apresentar métricas locais** de uma mudança a partir dos
artefatos que já existem em `.specs/` (e, quando disponível, do Git) — sem telemetria e sem
enviar nada para fora (RNF-004). O RF-021 lista muitas métricas "quando tecnicamente possível":
a extensão computa o **subconjunto viável localmente** (contagens de tarefas/testes/requisitos,
% de requisitos validados via 0008, arquivos/linhas via 0007, durações a partir das datas do
`status.yaml`, tokens estimados via 0005), rotulando estimativas como tal. O RF-022 gera o
relatório da feature em visualização e exportação (Markdown/JSON). É o "Metrics Collector" da
arquitetura (§2). Implementação incremental.

## O que esta mudança entrega

Um relatório de métricas por feature, calculado sob demanda a partir de `.specs/` (+ Git),
apresentado no VS Code e exportável (Markdown/JSON). Métricas de economia claramente rotuladas
como estimativas, com a metodologia explícita (RF-021).

## O que esta mudança deliberadamente não entrega

- **Telemetria ou envio de dados** — nada sai da máquina (RNF-004); a coleta é desativável.
- Métricas que a extensão **não consegue** obter de forma confiável (tokens reais de entrada/
  saída do agente, interações com o modelo, custo real) — usa-se estimativa local rotulada.
- Agregações por projeto/período/desenvolvedor/equipe/modelo e formatos CSV/PDF — incrementos
  seguintes (RF-022).

## Restrições conhecidas

- **Sem telemetria; dados locais; coleta desativável** (RNF-004).
- Núcleo de cálculo puro e testável, separado da borda (standards §6).
- Sem I/O de rede (ADR-005).
- Reusa 0005 (contexto), 0007 (git/rastreabilidade) e 0008 (validação).
- Estimativas rotuladas com a metodologia (RF-021).
