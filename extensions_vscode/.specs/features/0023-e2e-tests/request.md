# Solicitação original

- **ID:** 0023-e2e-tests
- **Tipo:** feature
- **Criada em:** 2026-08-03
- **Origem:** /sdd-kit:new

---

## Texto da solicitação

> Adicionar testes E2E/integração para a extensão VS Code, que hoje só tem testes unitários
> (`node --test`) sobre o núcleo puro. Ativação, comandos, webviews e o custom editor nunca são
> exercitados de ponta a ponta.

## Interpretação

A estratégia de teste da extensão (standards §6/§7) confina os testes ao **núcleo puro** e deixa a
**borda** (a API do VS Code em `extension.ts`/`views/`) para **revisão manual**. Cada feature de
0014 a 0022 declarou essas bordas como `gaps` em `traceability.yaml`, mitigados por "revisão
manual". Não há nenhuma camada que exercite a extensão **dentro de uma instância real do VS Code**.

Esta mudança adiciona uma suíte de **testes de integração (E2E)** que roda no *Extension Development
Host* do VS Code, convertendo parte daquela revisão manual em verificação automatizada — começando
por um escopo **smoke**: ativação, paridade de comandos declarados vs. registrados, e um fluxo
não-interativo com saída observável.

## O que esta mudança entrega

- Um harness de teste de integração no host real do VS Code (`@vscode/test-electron`), separado da
  suíte unitária.
- Testes smoke: ativação da extensão, registro de todos os comandos `sddClaudeKit.*`, e um fluxo
  não-interativo (SQL Guard produzindo diagnósticos; Project Doctor executando sem lançar).
- Integração no CI (Linux, sob `xvfb`).

## O que esta mudança deliberadamente não entrega

- **Cobertura de comandos interativos** (QuickPick, modais) via stubs, webviews e o custom editor —
  frágil e mais custoso; fica para incremento futuro.
- **Substituir os testes unitários** — a suíte unitária (`node --test`) continua sendo a base; a E2E
  é complementar.

## Restrições conhecidas

- Sem rede própria da extensão (RNF-004); os testes não usam `gh` nem a CLI do Claude Code.
- Compatibilidade Windows/Linux/WSL (RNF-002) — o gate de CI roda em Linux sob `xvfb`.
- A extensão evita dependências pesadas de runtime; o runner de E2E é `devDependency`, fora do
  pacote publicado.
