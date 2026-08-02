# Solicitação original

- **ID:** 0017-research
- **Tipo:** feature
- **Criada em:** 2026-08-01
- **Origem:** /sdd-kit:new

---

## Texto da solicitação

> Research assistido (RF-007) — permitir iniciar uma etapa de research antes da especificação, que analise estrutura do projeto, arquivos relacionados, dependências, padrões existentes, documentação local, riscos, soluções já implementadas e APIs/integrações relevantes; e permitir revisar o material coletado antes de incorporá-lo à especificação.

## Interpretação

Materializar o RF-007 do PRD da extensão: uma etapa de **research** no início do fluxo SDD, **antes
da spec**, que reúne material sobre oito frentes (estrutura do projeto, arquivos relacionados,
dependências, padrões existentes, documentação local, riscos, soluções já implementadas,
APIs/integrações). O material fica registrado para **revisão humana** antes de ser incorporado à
especificação — a incorporação é decisão da pessoa, não automática.

Como as demais etapas de análise (0014 design, 0015 clarify), a realização natural é o **modelo
híbrido**: a extensão scaffolda um `research.md`-esqueleto (as oito frentes como seções) e delega a
análise ao Claude Code. Diferença relevante: a ação `research` **não existe** no adapter 0004
(que tem spec/clarify/design/tasks/implement/verify) — habilitar a análise por IA exigiria
acrescentá-la (Q1).

## O que esta mudança entrega

- Uma forma de iniciar o research de uma mudança, cobrindo as oito frentes do RF-007.
- O material registrado em `research.md`, revisável antes de incorporar à spec.

## O que esta mudança deliberadamente não entrega

- **Incorporação automática à spec** — RF-007 pede revisar "antes de incorporar"; a incorporação é
  do humano (constituição, Art. 2/9).
- **Design (0014), clarify (0015)** — etapas próprias.
- **Análise por IA fora do Claude Code** — sem rede própria (RNF-004).

## Restrições conhecidas

- Sem rede própria: a análise por IA passa pelo Claude Code (RNF-004), padrão do 0014/0015.
- A ação `research` não existe no adapter 0004 — a camada assistida depende de acrescentá-la (Q1)
  e da skill `/sdd-kit:research` (Fase 2).
- Compatibilidade Windows/Linux/WSL (RNF-002).
