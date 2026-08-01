# Tarefas — Project Doctor (incremento RF-002)

Complexidade: **P** pequena (≤ meio dia) · **M** média (≈ 1 dia) · **G** grande
(deve ser dividida antes de começar).

---

## Ordem de execução

```
TASK-PD-001 ✅ (ADR-009: superfície = Diagnostics API / Problems)   [Q1 resolvida]
      │
      ├── TASK-PD-002 (projectDoctor.ts + parseStatusField, puro)  ── TEST-PD-001..003
      │            │
      │            └── TASK-PD-003 (borda: runDoctor + DiagnosticCollection)   [host]
      │                       │
      │                       └── TASK-PD-005 (verificação no host, F5) ── depende de 003
      │
      └── TASK-PD-004 (gate: build + lint + test)  ◄── depende de 002 e 003
```

---

## TASK-PD-001 — ADR: superfície do Project Doctor  `✅ done`

**Requisitos:** REQ-PD-002
**Dependências:** nenhuma
**Complexidade:** P
**Status:** done

Resolve Q1. Ver `decisions/ADR-009-superficie-do-project-doctor.md`: apresentar via
Diagnostics API no painel Problems; núcleo de diagnóstico puro.

### Critério de conclusão

- ✅ ADR-009 registrado (Aceito), com alternativas e consequências.
- ✅ ADR-009 anotado na arquitetura (§9).

---

## TASK-PD-002 — Núcleo puro (`projectDoctor.ts`) e `parseStatusField`

**Requisitos:** REQ-PD-001, NFR-PD-002, NFR-PD-003
**Dependências:** TASK-PD-001
**Complexidade:** M
**Status:** done

### Descrição

Módulo puro `projectDoctor.ts`: `diagnose(input)` com as regras do design §4, `VALID_STATUSES`,
`REQUIRED_PROJECT_FILES` e os tipos. Acrescentar `parseStatusField(yamlText)` a `specsIndex.ts`
(lê o `status:` de um `status.yaml`, robusto a YAML inválido → `undefined`).

### Arquivos prováveis

- `src/sdd/projectDoctor.ts`, `src/sdd/specsIndex.ts`
- `src/test/projectDoctor.test.ts`, `src/test/specsIndex.test.ts`

### Testes esperados

- TEST-PD-001 — saudável → sem erro/aviso (SCN-PD-001); só informativo quando cabe.
- TEST-PD-002 — sem status → erro; status inválido → erro; divergência → aviso
  (SCN-PD-002/003).
- TEST-PD-003 — órfão → aviso; arquivo obrigatório ausente → erro; no-git/no-claude
  (SCN-PD-004/005); `parseStatusField` lê o status e é robusto a YAML inválido.

### Critério de conclusão

- Funções puras, sem `import 'vscode'`; nunca lançam.
- TEST-PD-001 a TEST-PD-003 passam.

### Resultado (2026-07-31)

`projectDoctor.ts` (puro): `diagnose`, `VALID_STATUSES`, `REQUIRED_PROJECT_FILES`, tipos.
`parseStatusField` em `specsIndex.ts`. Coberto por **TEST-PD-001..003** (projectDoctor) e casos
de `parseStatusField` em specsIndex.test. `npm test` 65/65 (+7 casos).

---

## TASK-PD-003 — Borda: `runDoctor` e DiagnosticCollection

**Requisitos:** REQ-PD-002, NFR-PD-001, NFR-PD-002
**Dependências:** TASK-PD-002
**Complexidade:** M
**Status:** pending (código pronto; falta a verificação no host — TASK-PD-005)

### Descrição

Comando `sddClaudeKit.runDoctor`: coletar o retrato do disco (arquivos obrigatórios, mudanças
do índice, status em disco, spec, diretórios de mudança, Git, Claude Code), chamar `diagnose`,
traduzir para `vscode.Diagnostic` e publicar numa `DiagnosticCollection` (`source: 'SDD
Doctor'`), limpando antes para não duplicar; ancorar os diagnósticos "de projeto" ao
`index.yaml`; revelar o painel Problems. Comando no painel Projeto e na paleta.

### Arquivos prováveis

- `src/extension.ts`, `package.json` (comando + `view/title` do painel Projeto)

### Testes esperados

- Nenhum automatizado (integração com Diagnostics API/fs); verificação por F5 (TASK-PD-005).

### Critério de conclusão

- Os diagnósticos aparecem no Problems ancorados aos arquivos; rodar de novo não duplica;
  nada é alterado no disco (NFR-PD-001).

### Resultado parcial (2026-07-31)

Implementado: `runDoctor(node?)` — coleta o retrato (`workspace.fs` + `parseChanges` +
`parseStatusField` + `detectProject` + `detectClaudeCode`), `diagnose`, publica na
`DiagnosticCollection` limpando antes, ancora "de projeto" no `index.yaml`, revela o Problems.
Comando no `view/title` do painel Projeto. compile/lint exit 0. **Falta para `done`:** verificar
no host — TASK-PD-005.

---

## TASK-PD-004 — Gate: build, lint e testes  `✅ done`

**Requisitos:** NFR-PD-003
**Dependências:** TASK-PD-002, TASK-PD-003
**Complexidade:** P
**Status:** done

### Descrição

Rodar `npm run compile`, `npm run lint` e `npm test`, registrando as saídas. Inclui
TEST-PD-001..003.

### Critério de conclusão

- ✅ `compile` e `lint` terminam com código 0; a suíte passa (65/65, +7 novos).

### Resultado (2026-07-31)

compile exit 0 · lint exit 0 · `npm test` 65/65 (TEST-PD-001..003 + parseStatusField, 7 casos).

---

## TASK-PD-005 — Verificação no host (F5)

**Requisitos:** REQ-PD-002, NFR-PD-001
**Dependências:** TASK-PD-003
**Complexidade:** P
**Status:** pending

### Descrição

Verificar no Extension Development Host: acionar "Diagnosticar projeto"; conferir que os
diagnósticos aparecem no painel Problems ancorados aos arquivos certos; que rodar de novo não
duplica; que um problema induzido (ex.: renomear um `status.yaml`) é apontado; e que nada é
alterado no disco. Registrar evidência.

### Critério de conclusão

- SCN-PD-006 confirmado no host, em `evidence.md`.
- Rodar de novo não duplica; nada é alterado no disco.

---

## Resumo

| Complexidade | Quantidade |
| --- | --- |
| P | 3 |
| M | 2 |
| G | 0 |

Total: 5 tarefas · 3 concluídas (001, 002, 004) · 2 pendentes (003 código pronto, 005
verificação no host).

**Caminho crítico:** PD-001 ✅ → PD-002 ✅ → PD-003 🔧 (código pronto) → PD-005 (F5).

**Bloqueios ativos:** nenhum. Q1 → ADR-009. Resta a verificação no host (F5): TASK-PD-005.

**Fora deste incremento:** checagens semânticas (0008), riscos de Git (0007), verificação de
links Markdown, correção automática.
