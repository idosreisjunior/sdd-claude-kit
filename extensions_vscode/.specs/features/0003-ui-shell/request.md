# Solicitação original

- **ID:** 0003-ui-shell
- **Tipo:** feature
- **Criada em:** 2026-07-31
- **Origem:** Backlog do MVP (Épico 3 — Interface, RF-005/RF-006) + solicitação do usuário

---

## Texto da solicitação

> "materialize a 0003 e comece o próximo épico"

Contexto do backlog (PRD, Épico 3): Activity Bar, árvore do projeto, dashboard,
editor visual, comandos, barra de status. A Activity Bar, a árvore e a barra de
status já foram entregues por 0001 e 0002; o que resta do épico é o **dashboard da
feature (RF-005)** e o **editor de especificações (RF-006)**.

## Interpretação

O pedido é iniciar o Épico 3. Como o épico é grande e parte dele já existe, esta
mudança foca no que falta e é entregável agora: o **dashboard da feature**, uma
visão consolidada e somente-leitura dos artefatos de uma mudança. O editor visual
(RF-006) é reconhecido como parte da feature, mas fica para um incremento seguinte,
atrelado a uma decisão de base (webview vs. custom editor).

## O que esta mudança entrega

Um dashboard que abre a partir do painel Features e reúne o estado da mudança:
objetivo, status, progresso, contagens (requisitos, critérios, tarefas), bloqueios,
histórico e arquivos relacionados — lido dos artefatos `.specs`, sem edição.

## O que esta mudança deliberadamente não entrega

- Edição visual/Markdown dos documentos (RF-006) — próximo incremento; a base
  (webview vs. custom editor) é uma questão em aberto (Q1).
- Tokens/tempo (feature 0005), commits (feature 0007), evidências/validação como
  dados vivos (feature 0008) — o dashboard os marca como pendentes.
- Execução das ações do fluxo (research, design, implementar, abrir no Claude
  Code) — dependem de features 0004+.

Motivo do corte: manter o incremento entregável sem depender de features ainda não
construídas, e separar a decisão de base do editor (Q1) da entrega do dashboard.

## Restrições conhecidas

- O webview segue a segurança do PRD §22 / arquitetura §6: CSP com `nonce`, sem
  rede, sem execução de código do projeto.
- Leitura robusta e compatível com Windows/Linux/WSL (`workspace.fs`), herdada de
  0001/0002.
