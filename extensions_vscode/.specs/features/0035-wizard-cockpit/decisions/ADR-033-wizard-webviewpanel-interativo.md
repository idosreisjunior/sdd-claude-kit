# ADR-033 — Wizard como WebviewPanel interativo (script + nonce)

- **Status:** Aceito
- **Data:** 2026-08-05
- **Origem:** design da feature 0035-wizard-cockpit.
- **Decidido em:** design (implementação em TASK-WIZ-*).

---

## Contexto

O wizard tem formulários, navegação entre etapas e transições que gravam em
`status.yaml`. Os demais painéis do kit são script-free e agem por `command:` URI
(ADR-005/ADR-010) — modelo insuficiente para uma superfície de formulário com estado.
O Board já abriu o precedente de um webview interativo com script + nonce e
atualização ao vivo por `postMessage` (ADR-024).

## Decisão

**O wizard é um `WebviewPanel` interativo, estendendo o padrão do Board (ADR-024).**

- CSP com `default-src 'none'` e `script-src`/`style-src` restritos a um **nonce** por
  render; sem rede; todo texto de artefato entra por `textContent`/escape (NFR-WIZ-001).
- Comunicação por **protocolo de mensagens** `postMessage` webview↔extensão; a borda
  (`wizardPanel.ts`) roteia as mensagens para os comandos `sddClaudeKit.*` já existentes.
- **`status.yaml` é a fonte da verdade.** O webview projeta o estado derivado por um
  núcleo puro (`wizardModel`) e reidrata em alterações de `.specs/**`; nunca mantém uma
  verdade paralela.
- As guardas de transição vivem em núcleo puro (`wizardStepGuards`), espelhando
  `stateMachine.ts` — a UI só desabilita/explica, não decide a regra.

## Alternativas consideradas

| Alternativa | Por que não |
| --- | --- |
| **Manter script-free + `command:` URIs** (ADR-005) | Não comporta formulários com estado nem navegação de etapas; a descoberta e a edição ficariam pobres |
| **Sequência de QuickPick/InputBox nativos** (como o `newFeature` atual) | Serial, sem visão do fluxo, sem "onde estou"; é justamente o que a feature substitui |
| **Editor customizado (CustomEditor)** | Amarrado a um arquivo; o wizard opera sobre um conjunto de artefatos e o índice, não um documento |

## Consequências

**Positivas**

- Reusa um padrão de segurança já aprovado e testado (ADR-024); núcleo puro testável;
  a regra de transição não é duplicada na UI.

**Negativas**

- Segunda superfície com script no projeto → mais atenção a CSP e a XSS.
  **Mitigação:** mesma disciplina do Board (nonce, `textContent`, sem `innerHTML`, sem rede).
- Sincronização com edições externas do disco. **Mitigação:** reidratar por
  `FileSystemWatcher` de `.specs/**` (SCN-WIZ-008).

## Limite desta decisão

Decide **a natureza da superfície** (WebviewPanel interativo), **o modelo de segurança**
(CSP+nonce+escape) e **a fonte da verdade** (`status.yaml` + núcleo puro). **Não** decide
a stack de UI do webview (ADR-034) nem a camada visual (ADR-035).
