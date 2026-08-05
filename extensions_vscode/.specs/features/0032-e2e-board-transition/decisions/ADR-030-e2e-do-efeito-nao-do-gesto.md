# ADR-030 — E2E cobre o efeito da transição, não o gesto de DOM

- **Status:** Aceito
- **Data:** 2026-08-04
- **Origem:** feature 0032-e2e-board-transition.
- **Decidido em:** TASK-TRANS-001

---

## Contexto

Pediu-se um E2E do gesto de arrastar (0026). O `@vscode/test-electron` roda testes no **host da
extensão**, não dirige o **DOM do webview**; e o E2E não tem um handle do `BoardPanel` para injetar a
mensagem `move`. Logo, o gesto de DOM não é reproduzível automaticamente com o tooling atual.

## Decisão

**E2E do efeito, não do gesto.** A escrita da transição — antes embutida em `moveChange` — é extraída
para `applyTransition(root, id, path, target, reason)` **exportada** (all-or-nothing, preservando o
arquivo). Um teste E2E, num VS Code real, cria um workspace **temporário** (`os.tmpdir`), chama
`applyTransition` e verifica `status.yaml` (status + `history`, comentário preservado) e `index.yaml`;
além do caminho "arquivos ausentes". Assim exercitamos o caminho real de IO no host (a parte antes só
revisada manualmente). O **gesto de DOM** permanece como revisão manual, registrado como limitação.

## Alternativas consideradas

| Alternativa | Por que não |
| --- | --- |
| **Dirigir o DOM do webview** (drag) | Não suportado pelo `@vscode/test-electron` |
| **Injetar a mensagem `move` no painel** | O `BoardPanel` não é exposto ao teste; o webview não é acessível |
| **Escrever no fixture versionado** | Sujaria a árvore; o workspace temporário é isolado e idempotente |
| **Só manter revisão manual** | Perde a chance de cobrir o caminho de IO real, que é extraível |

## Consequências

**Positivas**

- O caminho de escrita da transição passa a ter cobertura E2E real (host + fs); `applyTransition`
  fica reutilizável e testável.

**Negativas**

- O gesto de DOM continua sem automação. **Mitigação:** registrado como limitação (NFR-TRANS-001); o
  resto do caminho (resolução do alvo, escrita, restauração) é testado por unidade + este E2E.

## Limite desta decisão

Decide **o que** é coberto por E2E (o efeito da transição) e **como** (`applyTransition` + workspace
temporário). **Não** simula o gesto de DOM.
