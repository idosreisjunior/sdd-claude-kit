# Tarefas — Editor de especificações (incremento RF-006)

Complexidade: **P** pequena (≤ meio dia) · **M** média (≈ 1 dia) · **G** grande
(deve ser dividida antes de começar).

> Estado (2026-07-31): plano do **primeiro incremento** (base CustomTextEditor +
> edição Markdown do `spec.md` + visão SDD-aware). Q1/Q2/Q3 resolvidas por ADR-006;
> a mudança está em PLANNED. Formulário estruturado e diff são incrementos seguintes.

---

## Ordem de execução

```
TASK-EDIT-001 ✅ (ADR-006: base = CustomTextEditor)   [Q1/Q2/Q3 resolvidas]
      │
      ├── TASK-EDIT-002 (render SDD-aware, puro)   ── TEST-EDIT-001
      │
      ├── TASK-EDIT-003 (HTML do webview: CSP+nonce, textarea)  ── TEST-EDIT-002
      │            │
      │            └── TASK-EDIT-004 (CustomTextEditorProvider + sync)
      │                       │
      │                       └── TASK-EDIT-005 (ação "Editar spec" no painel)
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

## TASK-EDIT-002 — Render SDD-aware do Markdown (`specView.ts`)

**Requisitos:** REQ-EDIT-003
**Dependências:** TASK-EDIT-001
**Complexidade:** M
**Status:** pending

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

- `renderSpecView()` destaca os IDs e escapa o conteúdo; nunca lança.

---

## TASK-EDIT-003 — HTML do webview do editor (`specEditorHtml.ts`)

**Requisitos:** REQ-EDIT-002, NFR-EDIT-002
**Dependências:** TASK-EDIT-002
**Complexidade:** M
**Status:** pending

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

- O HTML tem `<meta … Content-Security-Policy>` com `nonce`; nenhum conteúdo do
  documento entra sem escape.

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

## TASK-EDIT-007 — Gate: build, lint e testes

**Requisitos:** NFR-EDIT-001, NFR-EDIT-002
**Dependências:** TASK-EDIT-002, -003, -004, -005
**Complexidade:** P
**Status:** pending

### Descrição

Rodar `npm run compile`, `npm run lint` e `npm test`, registrando as saídas.
Inclui TEST-EDIT-001 e TEST-EDIT-002.

### Critério de conclusão

- `compile` e `lint` terminam com código 0; a suíte passa (novos testes inclusos).

---

## Resumo

| Complexidade | Quantidade |
| --- | --- |
| P | 4 |
| M | 3 |
| G | 0 |

Total: 7 tarefas · 1 concluída (001) · 6 pendentes (002–007).

**Caminho crítico:** EDIT-001 ✅ → EDIT-002 → EDIT-003 → EDIT-004 → EDIT-005 → EDIT-006.

**Bloqueios ativos:** nenhum. Q1/Q2/Q3 → ADR-006.

**Fora deste incremento:** formulário estruturado, diff de versões, demais documentos
(research/design/tarefas/evidências/validação), edição de YAML de máquina.
