# Feature: Reordenar as colunas do quadro

- **ID:** 0033-board-column-order
- **Escopo dos identificadores:** COLORD
- **Estado:** ver `status.yaml` — a autoridade é ele

---

## Objetivo

Permitir **reordenar as colunas** do kanban (setas ◂/▸ no cabeçalho), com um reset para a ordem
padrão e persistência na sessão do painel.

## Contexto

As colunas vêm do modelo em `GROUP_ORDER`. Reordená-las ajuda a montar a visão que o usuário prefere.
Optou-se por **setas** no cabeçalho (não arrastar) para não conflitar com o arrastar de cartões. A
lógica de ordem é pura e testável; a UI a espelha.

## Escopo

### Incluído

- Setas ◂/▸ em cada cabeçalho de coluna (desabilitadas nas bordas); botão "↺ Colunas" (ordem padrão).
- A ordem persiste via `vscode.setState` (sobrevive às atualizações ao vivo e a reloads do webview).

### Não incluído

- Arrastar colunas; persistência entre reaberturas do painel. Futuros.

---

## Requisitos funcionais

### REQ-COLORD-001 — Reordenar as colunas

Cada cabeçalho de coluna deve permitir mover a coluna à esquerda/direita; nas bordas, a ação é inócua.
Um reset restaura a ordem padrão.

#### SCN-COLORD-001 — Reordenar

DADO o quadro com várias colunas
QUANDO o usuário move uma coluna à esquerda/direita
ENTÃO as colunas são reordenadas conforme a nova posição.

#### SCN-COLORD-002 — Bordas

DADO a primeira (ou última) coluna
QUANDO o usuário tenta movê-la além da borda
ENTÃO a ordem não muda.

### REQ-COLORD-002 — Persistência na sessão

A ordem escolhida deve persistir entre as atualizações ao vivo e reloads do webview.

#### SCN-COLORD-003 — Ordem preservada ao vivo

DADO uma ordem de colunas escolhida
QUANDO os `.specs` mudam e o quadro é reenviado
ENTÃO a ordem escolhida continua aplicada.

---

## Requisitos não funcionais

### NFR-COLORD-001 — Lógica pura e testável

`orderColumns` e `moveColumn` são puros, sem a API do VS Code, não mutam a entrada, e são testados. O
cliente os espelha.

### NFR-COLORD-002 — Client-side e seguro

Reordenar roda no cliente; a persistência usa `vscode.setState`; a CSP com nonce é mantida.

---

## Critérios de aceite

- [ ] As setas reordenam as colunas; nas bordas nada muda; o reset restaura o padrão (REQ-COLORD-001,
      SCN-COLORD-001/002).
- [ ] A ordem persiste nas atualizações ao vivo/reloads (REQ-COLORD-002, SCN-COLORD-003).
- [ ] `orderColumns`/`moveColumn` puros e testados (NFR-COLORD-001); client-side, CSP preservada
      (NFR-COLORD-002).

---

## Questões pendentes

Nenhuma.

## Hipóteses assumidas

> HIPÓTESE: Setas ◂/▸ no cabeçalho; ordem em `state.columnOrder` (visíveis + ocultas) persistida por
> `vscode.setState`; o cliente espelha `orderColumns`/`moveColumn` — detalhado no ADR-031.
