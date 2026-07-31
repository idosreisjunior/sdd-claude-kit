# Tarefas — Context Guardian (incremento RF-012)

Complexidade: **P** pequena (≤ meio dia) · **M** média (≈ 1 dia) · **G** grande
(deve ser dividida antes de começar).

---

## Ordem de execução

```
TASK-CTX-001 ✅ (ADR-008: heurística local de tokens)   [A3/Q1 resolvida]
      │
      ├── TASK-CTX-002 (contextGuardian.ts, puro)  ── TEST-CTX-001..003
      │            │
      │            └── TASK-CTX-003 (borda: measureContext + barra de status)   [host]
      │                       │
      │                       └── TASK-CTX-005 (verificação no host, F5) ── depende de 003
      │
      └── TASK-CTX-004 (gate: build + lint + test)  ◄── depende de 002 e 003
```

---

## TASK-CTX-001 — ADR: heurística local de tokens  `✅ done`

**Requisitos:** —
**Dependências:** nenhuma
**Complexidade:** P
**Status:** done

Resolve a questão A3 (`architecture.md`) / Q1 da spec. Ver
`decisions/ADR-008-estrategia-de-contagem-de-tokens.md`: contagem por heurística local
(~4 caracteres/token), sempre rotulada como estimativa; sem tokenizer nativo nem rede.

### Critério de conclusão

- ✅ ADR-008 registrado (Aceito), com alternativas e consequências.
- ✅ A3 marcada como resolvida na arquitetura (ver `architecture.md`).

---

## TASK-CTX-002 — Núcleo puro (`contextGuardian.ts`)

**Requisitos:** REQ-CTX-001, REQ-CTX-002, REQ-CTX-003, NFR-CTX-003
**Dependências:** TASK-CTX-001
**Complexidade:** M
**Status:** done

### Descrição

Módulo puro (sem API do VS Code): `estimateTokens(text)` (ADR-008), `classifyUsage(used, max,
thresholds)` (quatro faixas por `≥`), `buildComposition(files, largeBytes?)` (total, entradas
ordenadas maior→menor, listas de grandes/binários; binário conta 0, texto não lido estima por
bytes), `isBinary(sample)` (byte nulo) e `bandLabel(band)`.

### Arquivos prováveis

- `src/sdd/contextGuardian.ts`
- `src/test/contextGuardian.test.ts`

### Testes esperados

- TEST-CTX-001 — `estimateTokens` determinística, proporcional, zero para vazio (SCN-CTX-001).
- TEST-CTX-002 — `classifyUsage` nas fronteiras 0,70/0,85/0,95 com `≥` na faixa mais alta
  (SCN-CTX-002).
- TEST-CTX-003 — `buildComposition` soma contáveis, sinaliza grande/binário, ordena
  maior→menor; `isBinary` detecta byte nulo (SCN-CTX-003).

### Critério de conclusão

- Funções puras, sem `import 'vscode'`; nunca lançam.
- TEST-CTX-001 a TEST-CTX-003 passam.

### Resultado (2026-07-31)

`contextGuardian.ts` (puro): `estimateTokens`, `classifyUsage`, `buildComposition`, `isBinary`,
`bandLabel`, `LARGE_FILE_BYTES`. Coberto por **TEST-CTX-001..003**. `npm test` 58/58 (+5 casos).

---

## TASK-CTX-003 — Borda: `measureContext` e barra de status

**Requisitos:** REQ-CTX-004, NFR-CTX-002, NFR-CTX-004
**Dependências:** TASK-CTX-002
**Complexidade:** M
**Status:** pending (código pronto; falta a verificação no host — TASK-CTX-005)

### Descrição

Comando `sddClaudeKit.measureContext` a partir do nó da feature: coletar docs de projeto
(constitution/architecture/standards) + artefatos da mudança (spec/design/tasks que existirem);
por arquivo, `stat` (grande → não lê, estima por bytes; pequeno → lê amostra, detecta binário,
lê texto); `buildComposition` + `classifyUsage` contra `sddClaudeKit.context.*`; atualizar o
indicador da barra de status (substituindo o *stub* de `updateContextIndicator`) com estimativa
+ faixa; mostrar a composição por arquivo. Adicionar o comando ao menu de contexto da feature.

### Arquivos prováveis

- `src/extension.ts`, `package.json` (comando + `view/item/context`)

### Testes esperados

- Nenhum automatizado (integração com fs/barra de status); verificação por F5 (TASK-CTX-005).

### Critério de conclusão

- "Medir contexto" atualiza a barra (estimativa + faixa) e mostra a composição, marcada como
  estimativa; arquivo grande é sinalizado sem ser lido por inteiro (NFR-CTX-004).
- A leitura é robusta a arquivo ausente/binário (NFR-CTX-002).

### Resultado parcial (2026-07-31)

Implementado: `measureContext(node)` — coleta os arquivos do fluxo, `stat`+leitura com detecção
de binário e corte por tamanho, `buildComposition`/`classifyUsage`, barra de status real
(`updateContextIndicator` passa a receber a última medição) e composição num canal de saída.
Comando no menu `view/item/context`. compile/lint exit 0. **Falta para `done`:** verificar no
host — TASK-CTX-005.

---

## TASK-CTX-004 — Gate: build, lint e testes  `✅ done`

**Requisitos:** NFR-CTX-003
**Dependências:** TASK-CTX-002, TASK-CTX-003
**Complexidade:** P
**Status:** done

### Descrição

Rodar `npm run compile`, `npm run lint` e `npm test`, registrando as saídas. Inclui
TEST-CTX-001..003.

### Critério de conclusão

- ✅ `compile` e `lint` terminam com código 0; a suíte passa (58/58, +5 novos).

### Resultado (2026-07-31)

compile exit 0 · lint exit 0 · `npm test` 58/58 (TEST-CTX-001..003, 5 casos).

---

## TASK-CTX-005 — Verificação no host (F5)

**Requisitos:** REQ-CTX-004, NFR-CTX-002, NFR-CTX-004
**Dependências:** TASK-CTX-003
**Complexidade:** P
**Status:** pending

### Descrição

Verificar no Extension Development Host: acionar "Medir contexto" numa feature; conferir que a
barra de status mostra a estimativa e a faixa; que a composição por arquivo aparece marcada
como estimativa; que um arquivo grande é sinalizado sem travar; e a robustez a arquivo
ausente/binário. Registrar evidência.

### Critério de conclusão

- SCN-CTX-004 confirmado no host, em `evidence.md`.
- Arquivo grande sinalizado sem ser lido por inteiro; arquivo ausente/binário não quebra.

---

## Resumo

| Complexidade | Quantidade |
| --- | --- |
| P | 3 |
| M | 2 |
| G | 0 |

Total: 5 tarefas · 3 concluídas (001, 002, 004) · 2 pendentes (003 código pronto, 005
verificação no host).

**Caminho crítico:** CTX-001 ✅ → CTX-002 ✅ → CTX-003 🔧 (código pronto) → CTX-005 (F5).

**Bloqueios ativos:** nenhum. A3/Q1 → ADR-008. Resta a verificação no host (F5): TASK-CTX-005.

**Fora deste incremento:** context packs (RF-013), sugestão de resumos, separação de tarefas,
limites por modelo, integração com a sessão real do Claude Code.
