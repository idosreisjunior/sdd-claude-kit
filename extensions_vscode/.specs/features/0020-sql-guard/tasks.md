# Tarefas — SQL Guard (RF-024)

Complexidade: **P** pequena (≤ meio dia) · **M** média (≈ 1 dia) · **G** grande
(deve ser dividida antes de começar).

> Plano montado a partir dos requisitos, **sem design técnico prévio** (clarify/design são de
> Fase 2). As pendências de design — Q3 (superfície) e Q4 (gatilho) — são resolvidas em
> **TASK-SQL-001 (ADR-019)**. Analisador puro, heurístico e **sem dependência** (D-Q5), no molde do
> 0018 — mas o insumo é o **editor SQL** (D-Q2), não um artefato `.specs`. Não depende da Fase 2.

---

## Ordem de execução

```
TASK-SQL-001 (ADR-019: superfície + gatilho) ✅
        │
        ▼
TASK-SQL-002 (núcleo puro: sqlGuard — 4 verificações heurísticas, com posição) ✅
        │
        ▼
TASK-SQL-003 (comando "SQL Guard" na borda: lê o editor + apresenta os riscos) ✅
```

Caminho crítico: **TASK-SQL-001 → TASK-SQL-002 → TASK-SQL-003** (linear; nada paralelizável).

---

## TASK-SQL-001 — ADR-019: superfície e gatilho do SQL Guard

**Requisitos:** REQ-SQL-002, NFR-SQL-001
**Dependências:** —
**Complexidade:** P
**Status:** done

### Descrição

Resolver e registrar em ADR: **(Q3)** a superfície — diagnósticos no Problems sobre o SQL (como
0006/0018), webview, ou canal; **(Q4)** o gatilho — comando na paleta e/ou no menu de contexto do
editor `.sql` (SQL não é feature, então não é ação do painel Features). Registrar a decisão e as
alternativas.

### Arquivos prováveis

- `.specs/features/0020-sql-guard/decisions/ADR-019-superficie-e-gatilho-do-sql-guard.md`

### Testes esperados

- Nenhum — decisão/documentação (ver `gaps`).

### Critério de conclusão

- ADR-019 escrito, decidindo Q3 e Q4; questões Q3/Q4 marcadas como resolvidas. ✅

---

## TASK-SQL-002 — Núcleo puro: `sqlGuard` (4 verificações heurísticas, com posição)

**Requisitos:** REQ-SQL-001, NFR-SQL-001, NFR-SQL-003
**Dependências:** TASK-SQL-001
**Complexidade:** M
**Status:** done

### Descrição

`sqlGuard.ts` (novo), puro, sem a API do VS Code e **sem dependência de parser** (D-Q5):
`analyzeSql(sql)` devolve os achados **com posição** — `{ kind, message, line }` — para as quatro
verificações (D-Q1): **(a)** alteração/exclusão sem WHERE (DELETE/UPDATE/TRUNCATE); **(b)** ausência
de filtro / full scan (SELECT sem WHERE ou `SELECT *`); **(c)** divisão por zero (literal `/ 0`);
**(d)** ausência de rollback num script de transação (BEGIN/START TRANSACTION sem COMMIT/ROLLBACK).
Heurística dialeto-agnóstica (D-Q6), robusta a SQL vazio/comentado. Somente análise (NFR-SQL-001).

### Arquivos prováveis

- `src/sdd/sqlGuard.ts`

### Testes esperados

- TEST-SQL-001 — DELETE/UPDATE sem WHERE e full scan (`SELECT *`) sinalizados, com posição
- TEST-SQL-002 — divisão por zero e transação sem rollback sinalizados; SQL seguro → sem achado

### Critério de conclusão

- TEST-SQL-001 e TEST-SQL-002 passam; nenhum import de `vscode`/rede/parser em `sqlGuard.ts`.

---

## TASK-SQL-003 — Comando "SQL Guard" na borda: lê o editor e apresenta os riscos

**Requisitos:** REQ-SQL-001, REQ-SQL-002, NFR-SQL-002
**Dependências:** TASK-SQL-002
**Complexidade:** M
**Status:** done

### Descrição

Comando **"SQL Guard"** (gatilho conforme ADR-019, Q4): lê o SQL do **editor ativo** — arquivo
`.sql` ou a seleção (D-Q2) —, roda `analyzeSql` e apresenta os achados conforme o ADR-019 (Q3;
provável: diagnósticos no `.sql`, com a posição). Somente leitura, sem executar o SQL (NFR-SQL-001);
sem rede (NFR-SQL-002). Comando em `extension.ts` e `package.json` (habilitado quando o editor é SQL).

### Arquivos prováveis

- `src/extension.ts`
- `package.json`

### Testes esperados

- Nenhum automatizado — ler o editor, publicar diagnósticos e o gatilho são integração com o host;
  a análise vive no núcleo puro (TASK-SQL-002). Revisão manual (ver `gaps`).

### Critério de conclusão

- Sobre um SQL no editor, "SQL Guard" sinaliza as quatro verificações com posição; SQL seguro não
  gera alerta; nada é executado. `npm run compile`/`lint`/`test` limpos.

---

## Resumo

| Complexidade | Quantidade |
| --- | --- |
| P | 1 |
| M | 2 |
| G | 0 |

Total: 3 tarefas · 3 concluídas · 0 pendentes.

**Caminho crítico:** TASK-SQL-001 ✅ → TASK-SQL-002 ✅ → TASK-SQL-003 ✅ (concluído)

**Bloqueios ativos:** nenhum — Q3 e Q4 resolvidas por ADR-019 (TASK-SQL-001).

**Paralelizáveis agora:** nenhum — as três tarefas do plano estão concluídas.

> Plano implementado em 2026-08-02, fora da ordem formal do fluxo (sem approve/design — Fase 1),
> como os anteriores. Verificação: `compile`, `lint` e **131 testes** limpos. O SQL Guard analisa
> o editor SQL (seleção ou documento) e publica diagnósticos no Problems; comando na paleta e no
> menu de contexto do editor (when: editorLangId == sql). **Não depende da Fase 2**, sem dependência
> de parser. Incremento 1 = 4 verificações heurísticas (D-Q1); as semânticas (joins, casts, nulos,
> funções, custo) ficam para incrementos futuros — precisariam de parser + esquema.
