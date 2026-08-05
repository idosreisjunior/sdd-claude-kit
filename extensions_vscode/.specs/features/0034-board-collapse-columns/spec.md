# Feature: Colapsar colunas do quadro

- **ID:** 0034-board-collapse-columns
- **Escopo dos identificadores:** COLLAPSE
- **Estado:** ver `status.yaml` — a autoridade é ele

---

## Objetivo

Permitir **colapsar/expandir** cada coluna do kanban (botão no cabeçalho), com o estado persistido na
sessão do painel.

## Contexto

Com várias colunas, colapsar as que não interessam ajuda a focar. Colapsada, a coluna mostra só o
cabeçalho e oculta os cartões, encolhendo. A alternância é uma função pura testável; o cliente a
espelha. O estado persiste junto da ordem das colunas (0033).

## Escopo

### Incluído

- Botão ▾/▸ em cada cabeçalho (colapsar/expandir); coluna colapsada oculta os cartões e encolhe.
- O estado colapsado persiste via `vscode.setState`.

### Não incluído

- Colapsar todas de uma vez; largura customizável. Futuros.

---

## Requisitos funcionais

### REQ-COLLAPSE-001 — Colapsar/expandir uma coluna

Cada cabeçalho de coluna deve ter um botão que alterna entre **colapsada** (só cabeçalho, sem cartões)
e **expandida**.

#### SCN-COLLAPSE-001 — Alternar o colapso

DADO uma coluna expandida
QUANDO o usuário aciona o botão de colapsar
ENTÃO a coluna oculta os cartões e encolhe; acionando de novo, expande.

### REQ-COLLAPSE-002 — Persistência na sessão

O estado colapsado deve persistir entre as atualizações ao vivo e reloads do webview.

#### SCN-COLLAPSE-002 — Colapso preservado ao vivo

DADO uma coluna colapsada
QUANDO os `.specs` mudam e o quadro é reenviado
ENTÃO a coluna continua colapsada.

---

## Requisitos não funcionais

### NFR-COLLAPSE-001 — Lógica pura e testável

A alternância (`toggleLabel`) é pura, sem a API do VS Code, não muta a entrada, e é testada. O cliente
a espelha.

### NFR-COLLAPSE-002 — Client-side e seguro

Roda no cliente; a persistência usa `vscode.setState`; a CSP com nonce é mantida.

---

## Critérios de aceite

- [ ] O botão colapsa/expande a coluna (oculta/mostra os cartões) (REQ-COLLAPSE-001, SCN-COLLAPSE-001).
- [ ] O estado colapsado persiste nas atualizações ao vivo/reloads (REQ-COLLAPSE-002, SCN-COLLAPSE-002).
- [ ] `toggleLabel` puro e testado (NFR-COLLAPSE-001); client-side, CSP preservada (NFR-COLLAPSE-002).

---

## Questões pendentes

Nenhuma.

## Hipóteses assumidas

> HIPÓTESE: Botão ▾/▸ no cabeçalho; `state.collapsed` persistido por `vscode.setState`; o cliente
> espelha `toggleLabel` — detalhado no ADR-032.
