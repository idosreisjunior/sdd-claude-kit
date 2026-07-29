# Solicitação original

- **ID:** 0001-plugin-foundation
- **Tipo:** feature
- **Criada em:** 2026-07-29
- **Origem:** PRD §25 (Fase 0 e Fase 1), §26 (Épicos 1, 2 e parte do 3), §33 (instrução inicial)

---

## Texto da solicitação

> Crie a estrutura inicial do repositório, a constituição do projeto, a arquitetura e a feature `0001-plugin-foundation`, dividida em tarefas pequenas. Não implemente código antes de apresentar o plano.

Do PRD §25, Fase 1 — Plugin mínimo:

> Entregas: manifesto do plugin; marketplace; skill `init`; skill `new`; skill `spec`; skill `tasks`; templates iniciais; projeto de exemplo.

## Interpretação

A solicitação cobre duas fases do roadmap:

1. **Fase 0 (Fundação)** — já entregue fora desta feature: repositório, licença, README, PRD, constituição, arquitetura, estrutura `.specs`, guia de contribuição, código de conduta e política de segurança.
2. **Fase 1 (Plugin mínimo)** — o escopo desta feature.

## O que esta feature entrega

O primeiro artefato **instalável e utilizável**: um plugin do Claude Code que permite iniciar o framework num projeto e produzir a primeira metade do fluxo SDD — da solicitação em linguagem natural até um plano de tarefas.

```
/sdd-kit:init  →  /sdd-kit:new  →  /sdd-kit:spec  →  /sdd-kit:tasks
```

## O que esta feature deliberadamente não entrega

As skills `clarify`, `design`, `approve`, `implement`, `verify`, `review`, `archive` e `discover`; os sete agentes especializados; hooks; o modo `strict`; o validador determinístico; a CLI.

**Motivo:** PRD §29, risco 7 — escopo inicial muito grande. A mitigação declarada é "priorizar skills essenciais" e "entregar um fluxo completo antes de adicionar novos perfis". Entregar `init → new → spec → tasks` funcionando é uma fatia vertical verificável; entregar treze skills pela metade não é.

Esses itens serão especificados em `0002` (Fase 2) e seguintes.

## Restrições conhecidas

- Deve funcionar em Windows, Linux, macOS e WSL (RNF-001).
- Hooks desativados por padrão; nenhum bloqueio no modo padrão (constituição Art. 8).
- Nenhum acesso de rede (ADR-005).
- O repositório precisa se auto-hospedar: depois de pronto, o plugin deve conseguir operar sobre as specs deste próprio repositório (constituição Art. 14).
