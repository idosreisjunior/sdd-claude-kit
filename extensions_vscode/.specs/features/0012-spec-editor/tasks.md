# Tarefas — Editor de especificações (incremento RF-006)

Complexidade: **P** pequena (≤ meio dia) · **M** média (≈ 1 dia) · **G** grande
(deve ser dividida antes de começar).

> Estado (2026-07-31): incremento do editor implementado e testado (compile/lint
> exit 0, 49 testes). EDIT-002/003/007 concluídas; EDIT-004/005 têm código pronto e
> seguem `pending` até a verificação no host (F5, EDIT-006). A mudança está em
> IN_PROGRESS. Formulário estruturado e diff são incrementos seguintes.

---

## Ordem de execução

```
TASK-EDIT-001 ✅ (ADR-006: base = CustomTextEditor)   [Q1/Q2/Q3 resolvidas]
      │
      ├── TASK-EDIT-002 ✅ (render SDD-aware, puro)   ── TEST-EDIT-001
      │
      ├── TASK-EDIT-003 ✅ (HTML do webview: CSP+nonce, textarea) ── TEST-EDIT-002
      │            │
      │            └── TASK-EDIT-004 🔧 (CustomTextEditorProvider + sync)   [host]
      │                       │
      │                       └── TASK-EDIT-005 🔧 (ação "Editar spec" no painel) [host]
      │
      └── TASK-EDIT-006 (verificação no host, F5)  ── depende de 004, 005
                                                     │
TASK-EDIT-007 (gate: build + lint + test)  ◄────────┘  depende de todo o código
```

---

## TASK-EDIT-001 — ADR: base do editor  `✅ done`

**Requisitos:** REQ-EDIT-001, REQ-EDIT-002
**Dependências:** nenhuma
**Complexidade:** P
**Status:** done

Resolve Q1 (e, de tabela, Q2/Q3). Ver `decisions/ADR-006-base-do-editor.md`:
**CustomTextEditor** (prioridade `option`) para `spec.md`, sync sem perda; só
`spec.md` no primeiro incremento; formulário estruturado sem parse frágil (futuro).

### Critério de conclusão

- ✅ ADR-006 registrado (Aceito), com alternativas e consequências.
- ✅ Q1/Q2/Q3 movidas para `resolved_questions` em `status.yaml`.

---

## TASK-EDIT-002 — Render SDD-aware do Markdown (`specView.ts`)  `✅ done`

**Requisitos:** REQ-EDIT-003
**Dependências:** TASK-EDIT-001
**Complexidade:** M
**Status:** done

### Descrição

Função pura (sem API do VS Code) que recebe o Markdown do `spec.md` e produz o HTML
do painel de visualização: cabeçalhos como estrutura navegável e os identificadores
(REQ-*, SCN-*, TASK-*, NFR-*, TEST-*) destacados. Todo texto é escapado.

### Arquivos prováveis

- `src/sdd/specView.ts`

### Testes esperados

- TEST-EDIT-001 — identificadores destacados; cabeçalhos reconhecidos; HTML escapado
  (sem injeção).

### Critério de conclusão

- ✅ `renderSpecView()` destaca os IDs e escapa o conteúdo; nunca lança.

### Resultado (2026-07-31)

`specView.ts` (puro): `renderSpecView` (cabeçalhos → hN, parágrafos) e `highlightIds`
(REQ/NFR/SCN/TASK/TEST/ADR/RF/RNF) sobre texto escapado. Coberto por **TEST-EDIT-001**
(4 casos: highlight, cabeçalho+id, escape anti-injeção, parágrafos). `npm test` 49/49.

---

## TASK-EDIT-003 — HTML do webview do editor (`specEditorHtml.ts`)  `✅ done`

**Requisitos:** REQ-EDIT-002, NFR-EDIT-002
**Dependências:** TASK-EDIT-002
**Complexidade:** M
**Status:** done

### Descrição

Função pura que gera o documento HTML do CustomTextEditor: CSP com `nonce` para
`style-src` e `script-src`; um `<textarea>` com o Markdown (escapado) e o painel
renderizado (de `specView`); um script mínimo (inline, com nonce) que envia as
edições ao provider e aplica as reprojeções. Sem rede.

### Arquivos prováveis

- `src/sdd/specEditorHtml.ts`

### Testes esperados

- TEST-EDIT-002 — CSP com `nonce` em style e script; conteúdo do textarea escapado;
  o script tem o nonce.

### Critério de conclusão

- ✅ O HTML tem `<meta … Content-Security-Policy>` com `nonce`; nenhum conteúdo do
  documento entra sem escape.

### Resultado (2026-07-31)

`specEditorHtml.ts` (puro): documento com CSP+nonce (style e script), textarea
escapado, painel renderizado (specView), script de sync mínimo inline com nonce.
Coberto por **TEST-EDIT-002** (3 casos: CSP/nonce, escape do textarea, textarea+view).
`npm test` 49/49.

---

## TASK-EDIT-004 — CustomTextEditorProvider e sincronização (`specEditor.ts`)

**Requisitos:** REQ-EDIT-001, REQ-EDIT-002, NFR-EDIT-001
**Dependências:** TASK-EDIT-003
**Complexidade:** M
**Status:** pending

### Descrição

`specEditor.ts` implementa `CustomTextEditorProvider` para `spec.md`: monta o HTML,
sincroniza webview↔`TextDocument` — edição do textarea vira `WorkspaceEdit` de
documento inteiro (EOL preservado; guard de eco), e `onDidChangeTextDocument`
reprojeta no webview. Registrado em `extension.ts` e em `contributes.customEditors`
(prioridade `option`, `viewType` `sddClaudeKit.specEditor`).

### Arquivos prováveis

- `src/sdd/specEditor.ts`, `src/extension.ts`, `package.json` (customEditors)

### Testes esperados

- Nenhum automatizado (integração com o host); verificação por F5 (TASK-EDIT-006).

### Critério de conclusão

- Abrir `spec.md` com o editor SDD permite editar e salvar; o texto salvo é o texto
  editado, sem perda (SCN-EDIT-002, NFR-EDIT-001).

### Resultado parcial (2026-07-31)

Implementado: `specEditor.ts` (`CustomTextEditorProvider`) — projeta o documento,
sync por `WorkspaceEdit` de documento inteiro com EOL preservado e guard de eco
(early-return quando igual + textarea só atualiza se sem foco); registrado em
`extension.ts` e em `contributes.customEditors` (prioridade `option`). compile/lint
exit 0. **Falta para `done`:** verificar editar/salvar sem perda no host — TASK-EDIT-006.

---

## TASK-EDIT-005 — Ação "Editar spec" no painel Features

**Requisitos:** REQ-EDIT-001
**Dependências:** TASK-EDIT-004
**Complexidade:** P
**Status:** pending

### Descrição

Ação na feature (menu de contexto) que abre o `spec.md` da mudança com o editor SDD
(`vscode.openWith` + `viewType`). O clique simples (abrir a spec no editor padrão) e
o dashboard são preservados.

### Arquivos prováveis

- `src/extension.ts`, `src/views/featuresTreeProvider.ts`, `package.json` (menus)

### Testes esperados

- Nenhum automatizado (integração com o host); verificação por F5 (TASK-EDIT-006).

### Critério de conclusão

- A ação abre o `spec.md` correto no editor SDD (SCN-EDIT-001).

### Resultado parcial (2026-07-31)

Implementado: comando `sddClaudeKit.editSpec` (abre via `vscode.openWith` +
`viewType`) e ação inline no painel Features (`view/item/context`), ao lado do
dashboard. compile/lint exit 0. **Falta para `done`:** verificar a ação no host —
TASK-EDIT-006.

---

## TASK-EDIT-006 — Verificação no host (F5)

**Requisitos:** REQ-EDIT-001, REQ-EDIT-002, REQ-EDIT-003
**Dependências:** TASK-EDIT-004, TASK-EDIT-005
**Complexidade:** P
**Status:** pending

### Descrição

Verificar no Extension Development Host: abrir o `spec.md` no editor SDD mostra a
visão SDD-aware; editar e salvar preserva o conteúdo (comparar antes/depois);
mudança externa ao arquivo reprojeta no editor. Registrar evidência.

### Critério de conclusão

- SCN-EDIT-001, SCN-EDIT-002 e SCN-EDIT-003 confirmados no host, em `evidence.md`.

---

## TASK-EDIT-007 — Gate: build, lint e testes  `✅ done`

**Requisitos:** NFR-EDIT-001, NFR-EDIT-002
**Dependências:** TASK-EDIT-002, -003, -004, -005
**Complexidade:** P
**Status:** done

### Descrição

Rodar `npm run compile`, `npm run lint` e `npm test`, registrando as saídas.
Inclui TEST-EDIT-001 e TEST-EDIT-002.

### Critério de conclusão

- ✅ `compile` e `lint` terminam com código 0; a suíte passa (49/49, +7 novos).

### Resultado (2026-07-31)

compile exit 0 · lint exit 0 · `npm test` 49/49 (TEST-EDIT-001 4, TEST-EDIT-002 3).
`package.json` válido; integração do HTML do editor com o `spec.md` real (CSP+nonce,
textarea+view, 20 ids destacados, sem injeção).

---

## Resumo

| Complexidade | Quantidade |
| --- | --- |
| P | 4 |
| M | 3 |
| G | 0 |

Total: 7 tarefas · 4 concluídas (001, 002, 003, 007) · 3 pendentes (004, 005, 006).

**Caminho crítico:** EDIT-001 ✅ → EDIT-002 ✅ → EDIT-003 ✅ → EDIT-004 🔧 → EDIT-005 🔧 → EDIT-006.

**Bloqueios ativos:** nenhum. Q1/Q2/Q3 → ADR-006. Resta a verificação no host (F5):
EDIT-004/005 (código pronto) e EDIT-006 (o teste em si).

**Fora deste incremento:** formulário estruturado, diff de versões, demais documentos
(research/design/tarefas/evidências/validação), edição de YAML de máquina.
