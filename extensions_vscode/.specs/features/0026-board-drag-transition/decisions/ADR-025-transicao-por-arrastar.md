# ADR-025 — Transição por arrastar: resolução por grafo + escrita não destrutiva

- **Status:** Aceito
- **Data:** 2026-08-04
- **Origem:** questões Q1–Q3 da spec de 0026-board-drag-transition.
- **Decidido em:** TASK-DND-001

---

## Contexto

O Painel SDD (0025) tem colunas por **grupo** de status (`groupFor`), mas as transições são entre
**estados** (`workflow.json`). Arrastar um cartão para uma coluna precisa: (a) resolver o estado-alvo
sem ambiguidade; (b) validar contra o grafo; (c) escrever `status.yaml`/`index.yaml` sem corromper os
arquivos (que têm comentários e block scalars nos `reason`).

## Decisão

**Q1 — Resolução do alvo pela interseção grupo × grafo.** Ao soltar na coluna do grupo G com o cartão
no estado X: candidatos = `GROUP_STATES[G] ∩ TRANSITIONS[X]`. **0** → recusa com aviso; **1** → usa
direto; **>1** → QuickPick. (Ex.: soltar em "Em desenvolvimento" a partir de PLANNED oferece APPROVED
e IN_PROGRESS.) Assim o UX das 6 colunas do incremento 1 é preservado, sem virar 10 colunas de estado.

**Q2 — Escrita por manipulação de texto.** `statusWriter` edita o texto: troca a linha `status:` de
topo e acrescenta uma entrada ao fim de `history:` (achando o fim do bloco pela próxima chave de
coluna 0). **Preserva** comentários, block scalars e demais chaves — o que um round-trip por js-yaml
destruiria. O `index.yaml` tem só o `status:` da entrada trocado.

**Q3 — Motivo, data e grafo.** O `reason` é pedido por InputBox e é **obrigatório** (o schema exige
não-vazio); cancelar aborta sem escrever. A data vem do host (`new Date`). As transições
(`stateMachine.ts`) **espelham** `workflow.json` — embutidas porque a extensão é um pacote autônomo;
se o grafo mudar no plugin, esta cópia acompanha.

Núcleo puro: `stateMachine.ts` (candidatos/validação) e `statusWriter.ts` (escrita) são testáveis; a
borda (`boardPanel`) faz o IO e os diálogos, o cliente (`boardHtml`) faz o arrastar-soltar.

## Alternativas consideradas

| Alternativa | Por que não |
| --- | --- |
| **Colunas = estados (10)** para drop não-ambíguo | Quebra o layout enxuto do incremento 1; QuickPick resolve a ambiguidade pontual |
| **Round-trip por js-yaml** para escrever | Perde comentários e reformata os block scalars — destrói os arquivos do usuário |
| **Motivo opcional / gerado** | O schema exige `reason` não-vazio; um motivo humano é o registro honesto da transição |
| **Ler workflow.json do plugin em runtime** | O plugin não é embarcado no `.vsix`; embutir as transições é mais simples e estável |

## Consequências

**Positivas**

- Kanban interativo com transições válidas e rastreáveis (history + motivo); os arquivos permanecem
  legíveis (comentários preservados).
- Núcleo puro e testado; validado também sobre um `status.yaml` real.

**Negativas**

- As transições embutidas podem divergir do `workflow.json` se este mudar. **Mitigação:** comentário
  apontando a fonte da verdade; teste que fixa arestas conhecidas.
- O comentário de topo do `status.yaml` (ex.: "# Verificada…") pode ficar levemente defasado após uma
  transição por painel. **Mitigação:** o `history` é o registro; o comentário é acessório.
- O arrastar-soltar e o IO no host não têm teste unitário. **Mitigação:** `stateMachine`/`statusWriter`
  testados + validação sobre arquivo real; abrir o painel coberto por E2E; o gesto por revisão manual.

## Limite desta decisão

Decide **a resolução do alvo** (grafo × grupo), **a escrita não destrutiva** e **o motivo obrigatório**.
**Não** permite edição fora do grafo, **não** implementa desfazer próprio e **não** altera os demais
webviews.
