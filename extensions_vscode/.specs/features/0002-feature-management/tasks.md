# Tarefas — Gerenciamento de features

Complexidade: **P** pequena (≤ meio dia) · **M** média (≈ 1 dia) · **G** grande.

> Estado (2026-07-31): **feature completa — 9/9 tarefas.** Leitura/listagem,
> progresso por feature (FEAT-007) e criação (FEAT-006, Q1 → ADR-004) implementados
> e testados (compile/lint exit 0, 33 testes); verificação no host (FEAT-008) ✅ em
> `evidence.md`. Pronta para aprovação.

---

## Ordem de execução

```
TASK-FEAT-001 ✅ (ADR-003: parser YAML)
      │
TASK-FEAT-002 ✅ (reader specsIndex.ts + js-yaml) ── TASK-FEAT-005 ✅ (testes)
      │
      ├── TASK-FEAT-003 ✅ (árvore agrupa por status)
      │         └── TASK-FEAT-004 ✅ (clique abre spec)
      │
      ├── TASK-FEAT-006 ✅ (criar feature, RF-003)   [Q1 → ADR-004]
      ├── TASK-FEAT-007 ✅ (progresso por feature)
      ├── TASK-FEAT-008 ✅ (verificação no host, F5)
      └── TASK-FEAT-009 (empacotar incluindo js-yaml)
```

---

## TASK-FEAT-001 — ADR: parser de YAML das specs  `✅ done`

**Requisitos:** REQ-FEAT-001
**Dependências:** nenhuma
**Complexidade:** P
**Status:** done

Resolve A4. Ver `decisions/ADR-003-parser-de-yaml-das-specs.md`: usar js-yaml,
leitura robusta, empacotar incluindo dependências.

### Critério de conclusão

- ✅ ADR-003 registrado (Aceito), com alternativas e consequências.

---

## TASK-FEAT-002 — Reader do índice (`specsIndex.ts`)  `✅ done`

**Requisitos:** REQ-FEAT-001, NFR-FEAT-001
**Dependências:** TASK-FEAT-001
**Complexidade:** M
**Status:** done

### Descrição

Ler `.specs/index.yaml` com js-yaml e mapear para um modelo tipado; robusto a
YAML inválido (retorna lista vazia). Sem dependência da API do VS Code.

### Arquivos prováveis

- `src/sdd/specsIndex.ts`, `package.json` (dependência js-yaml)

### Testes esperados

- TEST-FEAT-001.

### Critério de conclusão

- ✅ `parseChanges()` extrai os campos; YAML inválido não lança (NFR-FEAT-001).

---

## TASK-FEAT-003 — Árvore de features agrupada por status  `✅ done`

**Requisitos:** REQ-FEAT-002
**Dependências:** TASK-FEAT-002
**Complexidade:** M
**Status:** done

### Descrição

`FeaturesTreeProvider` de dois níveis (grupo de status → features), omitindo
grupos vazios; nó informativo quando não há `.specs` ou não há features.

### Arquivos prováveis

- `src/views/featuresTreeProvider.ts`, `src/extension.ts` (watcher de `*.yaml`)

### Testes esperados

- TEST-FEAT-001 (agrupamento); a renderização em si é verificação de host.

### Critério de conclusão

- ✅ `groupByStatus()` agrupa na ordem do painel; provider consome o reader.

---

## TASK-FEAT-004 — Clique abre a spec  `✅ done`

**Requisitos:** REQ-FEAT-003
**Dependências:** TASK-FEAT-003
**Complexidade:** P
**Status:** done

### Descrição

Item de feature com `command: vscode.open` apontando para o `spec.md` da mudança.

### Arquivos prováveis

- `src/views/featuresTreeProvider.ts`

### Testes esperados

- Nenhum automatizado (integração com o host); verificação por F5.

### Critério de conclusão

- ✅ O item da feature abre o `spec.md` correto (a confirmar no host — TASK-FEAT-008).

---

## TASK-FEAT-005 — Testes do reader  `✅ done`

**Requisitos:** REQ-FEAT-001, REQ-FEAT-002, NFR-FEAT-001
**Dependências:** TASK-FEAT-002
**Complexidade:** P
**Status:** done

### Descrição

`src/test/specsIndex.test.ts` com casos de leitura, agrupamento, mapeamento de
estados, YAML inválido e entradas sem id.

### Testes esperados

- TEST-FEAT-001.

### Critério de conclusão

- ✅ `npm test` passa (21/21 no total).

---

## TASK-FEAT-006 — Criar feature (formulário, RF-003)  `✅ done`

**Requisitos:** REQ-FEAT-004
**Dependências:** TASK-FEAT-002
**Complexidade:** M
**Status:** done

### Descrição

Formulário (tipo/título/slug/escopo) que aloca id, cria a pasta e os documentos
iniciais e registra no índice em `DRAFT`. Q1 resolvida por **ADR-004**: o
formulário é um scaffolder determinístico — slug/escopo são entradas do usuário;
o `status.yaml` nasce por substituição de template; a entrada do `index.yaml` é
inserida por edição textual (preserva comentários/layout); o rascunho inteligente
da spec é delegado a `/sdd-kit:spec`.

### Arquivos prováveis

- `src/sdd/featureCreator.ts`, `src/extension.ts`

### Testes esperados

- TEST-FEAT-002 — alocação de id/slug e escrita dos arquivos esperados.

### Critério de conclusão

- ✅ Uma feature criada é lida pela CLI sem erro (verificado por integração).
- Aparecer no painel: verificação de UI no host (TASK-FEAT-008).

### Resultado (2026-07-31)

Q1 resolvida por **ADR-004**. Lógica pura em `featureCreator.ts` (saneamento de
slug, validação de slug/escopo, `reconcileNextId`, `insertChangeEntry` por edição
textual, `substituteChange`), coberta por **TEST-FEAT-002** (10 casos). Comando
`sddClaudeKit.newFeature` fiado em `extension.ts`: coleta tipo/título/slug/escopo,
reconcilia o id com o disco (para com erro no índice defasado), recusa diretório
existente, escreve `request.md`/`status.yaml`/`spec.md`/`decisions/` sem
sobrescrever, e atualiza o índice preservando comentários. Verificação de
integração: inserir no `index.yaml` real e reparsear com js-yaml → válido, título
com `:` citado, comentários intactos. compile/lint exit 0, npm test 33/33.

**Falta para o fechamento pleno:** verificar o formulário no host (F5) — parte de
TASK-FEAT-008.

---

## TASK-FEAT-007 — Progresso de tarefas por feature  `✅ done`

**Requisitos:** REQ-FEAT-005
**Dependências:** TASK-FEAT-003
**Complexidade:** P
**Status:** done

### Descrição

Ler os contadores de `status.yaml` de cada feature e exibir progresso no item.

### Arquivos prováveis

- `src/sdd/specsIndex.ts` (leitura de status.yaml), `src/views/featuresTreeProvider.ts`

### Testes esperados

- TEST-FEAT-003 — cálculo de progresso a partir dos contadores.

### Critério de conclusão

- ✅ O item mostra `done/total` de tarefas por feature.

### Resultado (2026-07-31)

Função pura `parseTaskProgress()` em `specsIndex.ts` lê o bloco `tasks` do
`status.yaml` e retorna `{ done, total }`; robusta a YAML inválido, bloco ausente
ou contadores não numéricos (retorna `undefined`, nunca lança — NFR-FEAT-001). O
`FeaturesTreeProvider` lê o `status.yaml` de cada mudança e anexa o progresso ao
`description`/`tooltip` do item (`id · done/total`); feature sem status apenas
omite o progresso. Coberto por **TEST-FEAT-003** (2 casos: leitura e
inválido/incompleto). `npm test` → 23/23, compile e lint exit 0.

---

## TASK-FEAT-008 — Verificação no host (F5)  `✅ done`

**Requisitos:** REQ-FEAT-002, REQ-FEAT-003, REQ-FEAT-004, REQ-FEAT-005
**Dependências:** TASK-FEAT-003, TASK-FEAT-004, TASK-FEAT-006, TASK-FEAT-007
**Complexidade:** P
**Status:** done

### Descrição

Verificar no Extension Development Host: o painel lista as features agrupadas,
mostra o progresso `done/total`, clicar abre a spec, e o comando "Nova feature"
cria a mudança (id alocado, arquivos escritos, índice atualizado). Registrar
evidência.

### Critério de conclusão

- ✅ SCN-FEAT-002 e SCN-FEAT-003 confirmados no host.
- ✅ Progresso por feature (FEAT-007) e criação pelo formulário (FEAT-006) confirmados.

### Resultado (2026-07-31)

Verificado no host (Windows 11 + WSL, VS Code). E1–E5 ✅, sem divergência —
listagem agrupada, progresso `6/10` e `8/9`, clique abre a spec, criação pelo
formulário (feature criada, índice com `next_id` incrementado e comentários
preservados, item no painel) e o caminho de recusa (diretório existente). Registro
em `evidence.md`.

---

## TASK-FEAT-009 — Empacotamento inclui js-yaml  `✅ done`

**Requisitos:** REQ-FEAT-001
**Dependências:** TASK-FEAT-002
**Complexidade:** P
**Status:** done

### Descrição

Consequência do ADR-003: o `.vsix` precisa **incluir** a dependência de runtime.
Garantir que o empacotamento use `vsce package` **sem** `--no-dependencies` e
verificar que `js-yaml` está no pacote (senão a extensão quebra em runtime).

### Arquivos prováveis

- `.vscodeignore` (removido `node_modules/**`), `package.json` (script `package`)

### Critério de conclusão

- ✅ Removido `node_modules/**` do `.vscodeignore` (excluía as deps de produção).
- ✅ `.vsix` reempacotado com `vsce package` (sem `--no-dependencies`): 74 arquivos,
  190 KB, contém `node_modules/js-yaml` (e `argparse`); devDeps podadas.
- ✅ Extensão reinstalada; `js-yaml` confirmado em `.../extensions/…/node_modules/js-yaml`.

---

## Resumo

| Complexidade | Quantidade |
| --- | --- |
| P | 6 |
| M | 3 |
| G | 0 |

Total: 9 tarefas · **9 concluídas (001–009)** · 0 pendentes.

**Caminho crítico:** FEAT-001 ✅ → FEAT-002 ✅ → FEAT-003 ✅ → FEAT-008 ✅ (host).

**Bloqueios ativos:** nenhum. Q1 → ADR-004; A4 → ADR-003.

**Pendente:** nenhum. Feature pronta para aprovação (`/sdd-kit:approve`).
