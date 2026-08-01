# ADR-009 — Superfície do Project Doctor: Diagnostics API (painel Problems)

- **Status:** Aceito
- **Data:** 2026-07-31
- **Origem:** questão Q1 da spec de 0006 — onde apresentar os diagnósticos do Project Doctor?
- **Decidido em:** TASK-PD-001

---

## Contexto

O RF-002 pede que o resultado do Project Doctor seja apresentado "em um painel semelhante ao
sistema de Problems do VS Code". As superfícies possíveis:

- **Diagnostics API** (`languages.createDiagnosticCollection`): alimenta o **painel Problems**
  nativo. Cada diagnóstico é ancorado a um arquivo/intervalo, com severidade
  (erro/aviso/informativo), e o usuário navega clicando — exatamente o que o RF-002 descreve.
- **TreeView própria** (nova seção na Activity Bar): controlável, mas reimplementa navegação,
  severidade e agrupamento que o Problems já oferece, e some quando o painel não está aberto.
- **Webview**: layout livre, mas pesado para uma lista de problemas e sem integração com a
  navegação por arquivo do editor.

## Decisão

**Usar a Diagnostics API, alimentando o painel Problems.** O Project Doctor cria uma
`DiagnosticCollection` própria; cada problema estrutural vira um `Diagnostic` ancorado ao
arquivo pertinente (o `status.yaml` da mudança, o `spec.md`, o `index.yaml`, o arquivo de
projeto ausente, etc.), com severidade `Error`/`Warning`/`Information`. Rodar o Doctor
**limpa e repovoa** a coleção — sem duplicar. Um comando a partir do painel Projeto dispara o
diagnóstico e revela o Problems.

O **núcleo de diagnóstico é puro** (`projectDoctor.ts`, sem API do VS Code): recebe um retrato
estruturado do projeto e devolve uma lista de diagnósticos tipados. A borda apenas traduz essa
lista para `vscode.Diagnostic` e a publica — a lógica é testável fora do host.

## Alternativas consideradas

| Alternativa | Por que não |
| --- | --- |
| TreeView própria | Reimplementa navegação/severidade/agrupamento que o Problems já dá; menos idiomático; some fora da Activity Bar |
| Webview | Pesado para uma lista; sem navegação por arquivo integrada; CSP/nonce sem ganho aqui |
| Só mensagens (`showWarningMessage`) | Efêmero, não navegável, não lista vários problemas |

## Consequências

**Positivas**

- Idiomático e navegável: clicar leva ao arquivo; severidades e filtros do Problems de graça.
- Núcleo puro e testável; a borda é uma tradução fina.
- Repovoar a coleção evita duplicação entre execuções.

**Negativas**

- Diagnósticos "de projeto" (sem arquivo natural, ex.: ausência de Git) precisam de uma âncora.
  **Mitigação:** ancorar ao `.specs/index.yaml` (ou `config.yaml`), o arquivo que representa o
  projeto SDD.
- O Problems mistura os diagnósticos do Doctor com os de linters. **Mitigação:** coleção com
  fonte própria (`source: 'SDD Doctor'`), distinguindo a origem.

## Limite desta decisão

Cobre a **apresentação** do incremento estrutural (0006). Não decide as checagens semânticas
(0008) nem os riscos de Git (0007), que, quando chegarem, podem reusar a mesma coleção ou uma
própria — a decisão de superfície já estará tomada.
