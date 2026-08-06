# Solicitação original

- **ID:** 0035-wizard-cockpit
- **Tipo:** feature
- **Criada em:** 2026-08-05
- **Origem:** conversa com o usuário no Claude Code

---

## Texto da solicitação

> eu quero que deixe a interface grafica da extensao do sdd claude kit mais
> profissional, com wizard para gerenciar e criar as especificaçãoes até a
> implementação do projeto, faça o planejamento com o time e sugir todo mockup
> das telas antes da implementaçã, gere os arquivos de imagem do mockup em uma
> pastta de docs para eu analisar
>
> (seguido de) faça um plano de implementação do sistema.

## Interpretação

O usuário quer elevar a GUI da extensão VS Code (`extensions_vscode/`) a um nível
profissional, tendo como peça central um **wizard guiado** que conduz uma mudança
por todo o ciclo SDD — da criação da especificação até a implementação e
verificação. Pediu, antes de codar: planejamento, mockups de todas as telas
gerados como arquivos de imagem numa pasta de docs, e depois um plano de
implementação. Os mockups (14 telas SVG), o design system e os planos já foram
entregues em `docs/ui-redesign/` e aprovados; esta spec formaliza a feature.

## O que esta mudança entrega

- Um wizard visual (WebviewPanel interativo) com as 8 etapas do ciclo SDD
  (Solicitar → Especificar → Clarificar → Desenhar → Tarefas → Aprovar →
  Implementar → Verificar) e um *stepper* sempre visível.
- Portões de qualidade que impedem avançar sem os pré-requisitos da etapa.
- Ações de IA contextuais que abrem o Claude Code com o skill `/sdd-kit:*`
  correspondente, sem enviar sozinhas.
- Camada de identidade visual (design system) aplicada sobre o tema do VS Code,
  incluindo a sidebar "cockpit" e o board com cards mais ricos.

## O que esta mudança deliberadamente não entrega

- **Não reimplementa** clarify/design/tasks/verify — o wizard orquestra os
  comandos e skills já existentes (evita duplicação e divergência de regras).
- **Não altera** o formato de `.specs/` nem o `status.yaml` (fonte da verdade
  preservada; risco de regressão em todo o kit).
- **Não** aposenta imediatamente o fluxo atual por QuickPick — ele permanece
  como fallback até a etapa equivalente do wizard estar verificada.

## Restrições conhecidas

- Webview interativo exige CSP + nonce e escape de todo texto de artefato, como o
  Board (ADR-024).
- Deve respeitar o tema claro/escuro do VS Code via variáveis `--vscode-*`.
- Stack do webview do wizard decidida: esbuild + Preact (a ratificar em ADR).
- pt-BR para documentos e rótulos; inglês para identificadores, código e commits.
