# Tarefas — Testes E2E / integração no host do VS Code

Complexidade: **P** pequena (≤ meio dia) · **M** média (≈ 1 dia) · **G** grande
(deve ser dividida antes de começar).

> Plano montado a partir dos requisitos. A pendência de design — Q3 (runner, layout, CI, fixtures) —
> é resolvida em **TASK-E2E-001 (ADR-022)**. Escopo **smoke** (D-Q1); suíte isolada da unitária
> (D-Q2). Não depende da Fase 2.

---

## Ordem de execução

```
TASK-E2E-001 (ADR-022: runner + layout + CI + fixtures)
        │
        ▼
TASK-E2E-002 (harness: devDeps, .vscode-test.mjs, scripts, fixtures)
        │
        ▼
TASK-E2E-003 (testes smoke: ativação, paridade de comandos, SQL Guard, Project Doctor)
        │
        ▼
TASK-E2E-004 (CI: passo xvfb no job extension)
```

Caminho crítico: **TASK-E2E-001 → 002 → 003 → 004** (linear).

---

## TASK-E2E-001 — ADR-022: runner, layout, CI e fixtures

**Requisitos:** REQ-E2E-001
**Dependências:** —
**Complexidade:** P
**Status:** done

### Descrição

Resolver e registrar em ADR: **(Q3a)** runner — `@vscode/test-cli` + `@vscode/test-electron` +
Mocha vs. runner próprio; **(Q3b)** isolamento — `src/e2e` → `out/e2e`, fora de `out/test`;
**(Q3c)** CI — passo `xvfb` no job `extension` vs. job separado; e a forma das fixtures.

### Arquivos prováveis

- `.specs/features/0023-e2e-tests/decisions/ADR-022-runner-e-layout-dos-testes-e2e.md`

### Testes esperados

- Nenhum — decisão/documentação (ver `gaps`).

### Critério de conclusão

- ADR-022 escrito, decidindo Q3; questão Q3 marcada como resolvida.

### Evidências necessárias

- ADR-022 presente com Decisão e Alternativas; `resolved_questions` referenciando Q3.

---

## TASK-E2E-002 — Harness: dependências, config do runner, scripts e fixtures

**Requisitos:** REQ-E2E-001, NFR-E2E-001, NFR-E2E-002
**Dependências:** TASK-E2E-001
**Complexidade:** M
**Status:** done

### Descrição

Acrescentar os `devDependencies` (`@vscode/test-cli`, `@vscode/test-electron`, `mocha`,
`@types/mocha`); criar `.vscode-test.mjs` (`files: out/e2e/**/*.test.js`, `workspaceFolder` de
fixture); scripts `test:e2e` e `pretest:e2e` no `package.json`; a fixture `test-fixtures/
e2e-workspace/` (`.specs` mínima + `sample.sql`); e excluir tudo isso do pacote (`.vscodeignore`).

### Arquivos prováveis

- `package.json`, `package-lock.json`
- `.vscode-test.mjs`
- `test-fixtures/e2e-workspace/.specs/…`, `test-fixtures/e2e-workspace/sample.sql`
- `.vscodeignore`

### Testes esperados

- Nenhum automatizado próprio — é infraestrutura; validada por TASK-E2E-003 rodando sobre ela e por
  `npm test` (unitário) continuar verde sem tocar a E2E (NFR-E2E-001).

### Critério de conclusão

- `npm run compile` limpo; `.vscode-test.mjs` aponta para `out/e2e`; `npm test` (unitário) não
  executa E2E.

### Evidências necessárias

- `package.json` com os devDeps e scripts; `.vscode-test.mjs`; saída de `npm test` mostrando só a
  suíte unitária.

---

## TASK-E2E-003 — Testes smoke: ativação, paridade de comandos, SQL Guard, Project Doctor

**Requisitos:** REQ-E2E-002, REQ-E2E-003, NFR-E2E-003
**Dependências:** TASK-E2E-002
**Complexidade:** M
**Status:** done

### Descrição

Escrever a suíte smoke em `src/e2e/`: **(a)** ativa a extensão e verifica `isActive` (SCN-E2E-002);
**(b)** compara os comandos `sddClaudeKit.*` do `package.json` com `vscode.commands.getCommands`
(SCN-E2E-003); **(c)** abre um `.sql` com `DELETE FROM t` e roda `sddClaudeKit.sqlGuard`, checando
≥1 diagnóstico (SCN-E2E-004); **(d)** roda `sddClaudeKit.runDoctor` sobre a fixture sem lançar
(SCN-E2E-005). Sem `gh`, sem Claude Code, sem rede (NFR-E2E-003).

### Arquivos prováveis

- `src/e2e/activation.test.ts`
- `src/e2e/commands.test.ts`
- `src/e2e/flows.test.ts`

### Testes esperados

- TEST-E2E-001 — ativação: `extension.isActive` (SCN-E2E-002)
- TEST-E2E-002 — paridade: todo `sddClaudeKit.*` do `package.json` está registrado (SCN-E2E-003)
- TEST-E2E-003 — SQL Guard: `DELETE FROM t` gera ≥1 diagnóstico (SCN-E2E-004)
- TEST-E2E-004 — Project Doctor: `runDoctor` conclui sem lançar (SCN-E2E-005)

### Critério de conclusão

- TEST-E2E-001..004 passam no host (localmente onde houver display, e no CI). `npm test` (unitário)
  segue verde e sem tocar a E2E.

### Evidências necessárias

- Saída do runner E2E com os quatro testes verdes (do CI, o gate autoritativo).

---

## TASK-E2E-004 — CI: passo E2E sob xvfb no job `extension`

**Requisitos:** NFR-E2E-002
**Dependências:** TASK-E2E-003
**Complexidade:** P
**Status:** done

### Descrição

Acrescentar ao job `extension` do `.github/workflows/ci.yml` um passo, após o `compile`, que roda a
E2E em Linux sob `xvfb`: `xvfb-run -a npm run test:e2e`. Instalar libs de sistema se necessário.

### Arquivos prováveis

- `.github/workflows/ci.yml`

### Testes esperados

- Nenhum automatizado próprio — o próprio passo de CI é a verificação (executa TEST-E2E-001..004).

### Critério de conclusão

- O job `extension` roda a suíte E2E sob `xvfb` e fica verde no CI.

### Evidências necessárias

- Run do CI com o passo E2E concluído com sucesso.

---

## Resumo

| Complexidade | Quantidade |
| --- | --- |
| P | 2 |
| M | 2 |
| G | 0 |

Total: 4 tarefas · 4 concluídas · 0 pendentes.

**Caminho crítico:** TASK-E2E-001 → 002 → 003 → 004 (linear; concluído).

**Bloqueios ativos:** nenhum — Q3 resolvida por ADR-022 (TASK-E2E-001).

> Plano implementado em 2026-08-03. Verificação local: `compile`, `lint` e **136** testes unitários
> limpos, com a suíte E2E fora de `out/test` (NFR-E2E-001). A execução da E2E no host real
> (TEST-E2E-001..004) roda no **CI** sob `xvfb` — `xvfb` não existe no ambiente WSL de
> desenvolvimento, então o gate autoritativo da E2E é a CI (job `extension`). **CI verde**: os quatro
> testes passaram num VS Code de teste real (linux-x64 1.131.0), run 30867590113.
