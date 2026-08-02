# Solicitação original

- **ID:** 0018-task-generation
- **Tipo:** feature
- **Criada em:** 2026-08-02
- **Origem:** /sdd-kit:new

---

## Texto da solicitação

> Geração de tarefas (RF-010) — decompor o design em tarefas pequenas, cada uma com identificador, título, descrição, arquivos prováveis, dependências, requisitos relacionados, critérios de conclusão, testes esperados, complexidade, status e evidências necessárias; e impedir ou alertar sobre tarefas excessivamente grandes.

## Interpretação

Materializar o RF-010 do PRD da extensão: a etapa de **decomposição em tarefas**. Duas partes: (1)
gerar as tarefas a partir do design/spec, com os onze campos por tarefa; (2) **impedir ou alertar
sobre tarefas excessivamente grandes** (complexidade G).

Diferença marcante em relação a 0014/0015/0017: a **geração já existe** — a skill `/sdd-kit:tasks`
está implementada (não é Fase 2) e a ação `tasks` já está no adapter 0004. Então o incremento novo
do RF-010 na extensão é principalmente a **análise** do `tasks.md`: alertar sobre tarefas G e
verificar a completude dos campos obrigatórios — no molde de um analisador (validação 0008,
Project Doctor 0006), não do padrão híbrido de esqueleto (que não cabe: o `tasks.md` tem N tarefas
variáveis, não seções fixas).

## O que esta mudança entrega

- Uma **análise do `tasks.md`** de uma mudança: alerta sobre tarefas excessivamente grandes
  (complexidade G) e sobre tarefas sem os campos obrigatórios do RF-010.
- Um atalho para **gerar/refinar as tarefas** com o Claude Code, reusando a ação `tasks` já
  existente (0004, `/sdd-kit:tasks`).

## O que esta mudança deliberadamente não entrega

- **Reimplementar a geração de tarefas na extensão** — a skill `/sdd-kit:tasks` já faz isso; a
  extensão delega, não duplica.
- **Bloquear o Claude Code** — a extensão não controla o que o agente escreve; "impedir" vira
  **alertar** (a extensão sinaliza; o humano/o fluxo decide).

## Restrições conhecidas

- Análise somente leitura sobre o `tasks.md` existente (herda o padrão dos analisadores 0006/0008).
- Sem rede própria (RNF-004); compatibilidade Windows/Linux/WSL (RNF-002).
- Já existe `parseTasksPlan` (0007) parseando o `tasks.md` — reusar ou estender é decisão de design.
