# Solicitação original

- **ID:** 0004-claude-code-adapter
- **Tipo:** feature
- **Criada em:** 2026-07-31
- **Origem:** Backlog do MVP (Épico 4 — Claude Code, RF-011) + solicitação do usuário

---

## Texto da solicitação

> "continue com o desenvolvimento da extensão do sdd" → iniciar a feature
> **0004 — Claude Code Adapter**.

Contexto do backlog (PRD, Épico 4 — Claude Code): detectar a CLI, abrir o
terminal, montar o prompt, copiar o prompt, executar ações e capturar o resultado
quando possível. Cobre o **RF-011** (Execução pelo Claude Code).

## Interpretação

A **detecção da CLI** já foi entregue por 0001 (`src/sdd/claudeCode.ts`, ADR-002) e
o comando `sddClaudeKit.openInClaudeCode` já existe como *stub* (`TODO(0004)`). O que
falta do épico, e é entregável agora, é a ponte entre uma mudança do painel e o
Claude Code: **montar o prompt** de uma ação do fluxo SDD, **copiar o prompt** e
**abrir a mudança no Claude Code** no terminal integrado.

Como o épico é grande (RF-011 lista onze ações e uma prévia com tamanho de contexto),
esta mudança foca no núcleo entregável sem depender de features ainda não construídas:
a estimativa de tamanho de contexto e a seleção de arquivos são do **Context Guardian
(0005)**; a captura de resultado/diff/testes é do **Evidence Engine (0008)**.

## O que esta mudança entrega

- Compor o texto do prompt de uma ação SDD sobre uma mudança (ex.:
  `/sdd-kit:spec 0004-claude-code-adapter`) — lógica pura e testável.
- **Copiar o prompt** para a área de transferência (RF-011, "copiar prompt").
- **Abrir a mudança no Claude Code**: abrir/reutilizar o terminal integrado com a CLI
  detectada, deixando o prompt pronto para o usuário revisar e enviar.
- Degradar com elegância quando o Claude Code não é detectado: o prompt é copiado e o
  usuário é orientado (configurar `sddClaudeKit.claudeCode.path` ou instalar a CLI).

## O que esta mudança deliberadamente não entrega

- **Tamanho estimado do contexto e seleção de arquivos** (RF-011, prévia) — dependem do
  Context Guardian (0005). Aqui o prompt é o comando da ação, não o contexto montado.
- **Captura de resultado** (diff, testes, stdout) — questão arquitetural A2; adiada por
  ADR-007 para a feature 0008 (Evidências).
- **Context packs** (RF-013) — fora do MVP enxuto.
- **Envio automático da ação** — por princípio (constituição, "humano no controle"): a
  extensão prepara e abre, mas não dispara a ação sozinha.

Motivo do corte: manter o incremento entregável sem depender de 0005/0008 e preservar
o humano no controle da execução.

## Restrições conhecidas

- Nada é executado automaticamente sem ação humana; nenhum dado sai da máquina além do
  que o usuário enviar no seu próprio terminal (RNF-003, constituição Art. 9).
- Comando/caminho vindos de configuração são entrada não confiável: o caminho da CLI é
  tratado como caminho (citado com segurança), não concatenado em linha de shell.
- Compatível com Windows, Linux e WSL, usando a API de terminal do VS Code (herdado de
  0001).
