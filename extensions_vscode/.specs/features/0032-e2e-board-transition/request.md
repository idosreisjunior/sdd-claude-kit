# Solicitação original

- **ID:** 0032-e2e-board-transition
- **Tipo:** feature
- **Criada em:** 2026-08-04
- **Origem:** /sdd-kit:new

---

## Texto da solicitação

> Adicionar os testes E2E do gesto de arrastar.

## Interpretação e limitação honesta

O arrastar-para-transicionar (0026) tinha o **núcleo** 100% testado (máquina de estados +
`statusWriter`), mas o caminho no host — gesto → escrita — era gap de revisão manual.

**Limitação real:** o *gesto de DOM* (dragstart/drop no webview) **não é dirigível** por
`@vscode/test-electron` (ele não controla o DOM do webview), e o E2E do host não consegue injetar a
mensagem `move` no painel. Portanto o gesto em si permanece coberto por revisão manual.

O que **é** testável e traz valor: o **efeito** do gesto — a **aplicação da transição no disco** num
VS Code real. Para isso, a escrita de `moveChange` foi extraída para uma função exportada
`applyTransition`, exercitada por um teste E2E contra um workspace temporário.

## O que esta mudança entrega

- `applyTransition` (a escrita all-or-nothing) extraída e exportada; `moveChange` a reusa.
- Teste E2E que aplica uma transição num workspace temporário no host e verifica `status.yaml`
  (status + history, comentário preservado) e `index.yaml`; e o caminho "arquivos ausentes".

## Fora de escopo

- Simular o gesto de DOM (não suportado pelo tooling) — segue como revisão manual.

## Restrições

- Sem rede; o E2E roda no CI sob `xvfb`.
