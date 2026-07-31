# Solicitação original

- **ID:** 0012-spec-editor
- **Tipo:** feature
- **Criada em:** 2026-07-31
- **Origem:** Backlog do MVP (Épico 3 — Interface, RF-006) + solicitação do usuário

---

## Texto da solicitação

> "inicie o RF-006, o editor visual"

## Interpretação

Iniciar o editor de especificações (RF-006). Após o dashboard (RF-005, entregue e
verificado na 0003), o editor é a superfície de **edição** dos documentos SDD.
Modelado como mudança própria (decisão do usuário): a 0003/dashboard permanece
fechada e verificada; o RF-006 é a 0012.

## O que esta mudança entrega

O começo do editor: uma base de edição (a definir por ADR) para o `spec.md`, com
edição Markdown salva com segurança e uma visualização consciente da estrutura SDD.
Formulário estruturado e diff ficam para incrementos seguintes.

## O que esta mudança deliberadamente não entrega

- Formulário estruturado (editar requisitos/cenários por campos) — alto risco de
  perda de dados no ida-e-volta com o Markdown; incremento próprio (Q3).
- Comparação de versões (diff) — incremento seguinte.
- Edição dos documentos produzidos por outras features (research, design, tarefas,
  evidências, validação) — dependem de 0004/0007/0008.
- Edição por formulário dos YAML de máquina — a serialização precisa casar com os
  schemas.

Motivo do corte: fixar primeiro a base (Q1) e um modo de edição seguro, sem entrar
na parte frágil (parse↔serialize estruturado) antes de decidi-la.

## Restrições conhecidas

- O arquivo em disco é a fonte de verdade; ler/escrever via `workspace.fs`.
- Salvar não pode corromper nem truncar (NFR-EDIT-001) — a lição dos bugs 0006/0011.
- Se a base for webview, valem as regras de segurança do NFR-UI-002 (CSP + nonce).
