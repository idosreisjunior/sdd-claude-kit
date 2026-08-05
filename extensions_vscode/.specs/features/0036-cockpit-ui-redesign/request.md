# Solicitação original

- **ID:** 0036-cockpit-ui-redesign
- **Tipo:** feature
- **Criada em:** 2026-08-05
- **Origem:** pedido do usuário em conversa, após instalar a versão 0.3.0-preview.3 e
  inspecionar a interface

---

## Texto da solicitação

> a interface da extensao ainda esta a mesma coisa , os recursos visuais tem que mudar,
> quero que a extensao funcione como se fosse um sistema desktop

## Interpretação

O pedido tem duas partes, e a primeira é uma constatação factual: depois da feature
0035 (Wizard Cockpit), **só o wizard** ganhou identidade visual. As demais superfícies —
sidebar, Painel SDD (Board), dashboard de feature, histórico, métricas, validação e o
editor de spec — seguem herdando o tema cru do VS Code. Isso é verificável: os sete
módulos de HTML da extensão usam `--vscode-*` diretamente e **nenhum** consome a camada
de tokens `--sdd-*` criada na 0035 (`themeTokens.ts`, ADR-035). O resultado é o que o
usuário descreveu: uma tela com identidade e sete sem.

A segunda parte — "funcionar como se fosse um sistema desktop" — foi ambígua e por isso
foi levada de volta ao usuário antes de qualquer código. Entre as leituras possíveis
(janela única que domina o editor · redesenhar as telas existentes · densidade e
comportamento de app), o usuário escolheu **redesenhar as telas que já existem**: manter
a arquitetura atual (sidebar + painéis separados) e aplicar o design system dos mockups
em todas as superfícies. O usuário também pediu explicitamente que isto fosse conduzido
como **spec antes do código**, e não como protótipo.

Esta é, portanto, a iteração que a questão Q3 da feature 0035 adiou de forma registrada:

> Primeira entrega = o wizard completo (criar → conduzir → verificar). O redesenho de
> Board e sidebar fica para uma iteração seguinte.

## O que esta mudança entrega

A identidade visual do SDD Cockpit aplicada às superfícies que hoje não a têm, de modo
que a extensão se apresente como um produto único e não como um conjunto de painéis de
origens diferentes. As telas-alvo têm mockup aprovado em `docs/ui-redesign/mockups/`:
`01-sidebar-cockpit`, `02-welcome-onboarding`, `03-board-kanban` e `13-feature-dashboard`.

## O que esta mudança deliberadamente não entrega

- **Mudança de comportamento, de comandos ou de fluxo.** O usuário pediu recursos
  visuais; alterar o que a extensão faz, a pretexto de mudar como ela parece, seria
  ampliar o pedido por conta própria. Atalhos, arrastar-e-soltar novos, toolbars e undo
  ficam para uma mudança própria, se e quando forem pedidos — foram apresentados ao
  usuário como uma terceira opção e não foram os escolhidos.
- **Janela única que substitui a sidebar e os painéis.** Foi oferecida como opção e
  recusada em favor de redesenhar o que existe. Uma reorganização dessas trocaria a
  arquitetura de navegação da extensão inteira e merece sua própria spec e seu ADR.
- **Redesenho do wizard.** Ele já nasceu com a identidade (feature 0035) e segue em
  implementação; mexer nele agora criaria conflito com as tarefas WIZ-012..015 em curso.
- **Novos mockups.** As 14 telas já existem e foram aprovadas; esta mudança as
  implementa, não as redesenha.

## Restrições conhecidas

- A camada de tokens `--sdd-*` já existe e é a base obrigatória (ADR-035): as cores de
  conteúdo derivam de `--vscode-*` para respeitar tema claro/escuro e a personalização do
  usuário. Nenhuma cor de conteúdo fixa em hex.
- Os painéis atuais são webviews em vanilla/template-string; só o wizard usa esbuild +
  Preact (ADR-034). Unificar ou não a stack é decisão em aberto desta mudança.
- A `TreeView` do VS Code **não é estilizável por CSS** — a API expõe rótulo, ícone,
  descrição e cor temática, e nada mais. Qualquer redesenho da sidebar esbarra nesse
  limite da plataforma, e não numa escolha de implementação.
- A feature 0035 está `IN_PROGRESS` com sete tarefas em andamento; esta mudança não deve
  tocar os arquivos do wizard enquanto aquelas não fecharem.
