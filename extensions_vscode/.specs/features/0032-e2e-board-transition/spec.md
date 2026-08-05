# Feature: E2E da transição do painel (efeito do arrastar)

- **ID:** 0032-e2e-board-transition
- **Escopo dos identificadores:** TRANS
- **Estado:** ver `status.yaml` — a autoridade é ele

---

## Objetivo

Cobrir por **E2E**, num VS Code real, o **efeito** do arrastar-para-transicionar (0026): a aplicação
da transição no disco (`status.yaml` + `index.yaml`), fechando o gap de borda que era só revisão
manual — dentro do que o tooling permite.

## Contexto

O gesto de DOM no webview não é dirigível por `@vscode/test-electron`, e o E2E do host não injeta a
mensagem `move`. Logo, o gesto em si segue como revisão manual. A escrita da transição, porém, é
extraível: `applyTransition` (all-or-nothing, preservando o arquivo) passa a ser exportada e é
exercitada por E2E.

## Escopo

### Incluído

- Extrair `applyTransition` de `moveChange` (exportada); `moveChange` a reusa.
- Teste E2E: aplica uma transição válida num workspace temporário e verifica os arquivos; e o caminho
  "arquivos ausentes".

### Não incluído

- Simular o gesto de arrastar (não suportado) — revisão manual.

---

## Requisitos funcionais

### REQ-TRANS-001 — E2E da aplicação da transição

Um teste E2E deve, num host real, aplicar uma transição a uma mudança de um workspace temporário e
verificar que `status.yaml` (novo `status` + entrada de `history`, preservando comentários) e
`index.yaml` refletem o novo estado; e que, sem os arquivos, nada é alterado.

#### SCN-TRANS-001 — Transição aplicada no host

DADO um workspace temporário com `status.yaml` (IN_PROGRESS) e `index.yaml`
QUANDO `applyTransition` é chamada para VERIFIED com um motivo
ENTÃO `status.yaml` fica VERIFIED com a entrada de `history` (motivo preservado, comentários
intactos) e `index.yaml` reflete VERIFIED.

#### SCN-TRANS-002 — Arquivos ausentes não alteram nada

DADO um root sem `.specs`
QUANDO `applyTransition` é chamada
ENTÃO ela retorna "missing" e nada é escrito.

---

## Requisitos não funcionais

### NFR-TRANS-001 — Limitação registrada

O gesto de DOM do arrastar não é E2E-testável com o tooling; o E2E cobre o **efeito** (a escrita) no
host real. A limitação é explícita.

---

## Critérios de aceite

- [ ] O E2E aplica a transição no host e verifica `status.yaml` + `index.yaml` (REQ-TRANS-001,
      SCN-TRANS-001).
- [ ] O E2E cobre o caminho "arquivos ausentes" (SCN-TRANS-002).
- [ ] A limitação do gesto de DOM está registrada (NFR-TRANS-001); a suíte unitária segue verde.

---

## Questões pendentes

Nenhuma.
