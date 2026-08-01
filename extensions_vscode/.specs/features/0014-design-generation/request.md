# Solicitação original

- **ID:** 0014-design-generation
- **Tipo:** feature
- **Criada em:** 2026-08-01
- **Origem:** /sdd-kit:new

---

## Texto da solicitação

> Geração do design técnico (RF-009) — a partir da spec aprovada, gerar/auxiliar o design.md da feature com visão da solução, componentes afetados, fluxo de dados, contratos, APIs, banco de dados, segurança, tratamento de erros, observabilidade, testes, migração, rollback, riscos e alternativas consideradas.

## Interpretação

Materializar o RF-009 do PRD da extensão: dar à extensão a etapa de **design técnico** do
fluxo SDD, entre a spec aprovada e a geração de tarefas. A extensão deve produzir — ou ajudar a
produzir — o `design.md` da feature, com a estrutura de seções que o RF-009 enumera. "Gerar ou
auxiliar" indica que a geração de conteúdo é assistida (delegada ao agente, como as demais ações
de execução do RF-011), e o resultado é revisável antes de ser adotado.

## O que esta mudança entrega

- Uma forma de, a partir de uma spec aprovada, obter um `design.md` estruturado com as seções do
  RF-009 (visão da solução, componentes afetados, fluxo de dados, contratos, APIs, banco de
  dados, segurança, tratamento de erros, observabilidade, testes, migração, rollback, riscos,
  alternativas consideradas).
- O design gerado é um rascunho revisável/editável, não uma decisão final imposta.

## O que esta mudança deliberadamente não entrega

- **Research assistido (RF-007)** e **clarificação (RF-008)** — são features próprias e pré-MVP
  distintas; ficam fora para manter o escopo pequeno.
- **Geração de tarefas a partir do design (RF-010)** — etapa seguinte, feature separada.
- **Validação de qualidade do design** (completude, coerência com a spec) além da estrutura —
  não previsto pelo RF-009 nesta iteração.

## Restrições conhecidas

- Sem rede própria: a geração de conteúdo por IA passa pelo Claude Code (ADR-005, RNF-004).
- Pré-condição de spec aprovada — a etapa de design só faz sentido depois da aprovação (fluxo
  SDD: spec → clarify → **design** → tasks).
- Compatibilidade Windows/Linux/WSL (RNF-002).
