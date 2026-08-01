# Tarefas — Git e rastreabilidade

Complexidade: **P** pequena (≤ meio dia) · **M** média (≈ 1 dia) · **G** grande
(deve ser dividida antes de começar).

> **Incremento 1** (D-Q2): adapter de Git + detecção de escopo (REQ-TRACE-001/002/003).
> A navegação de rastreabilidade (REQ-TRACE-004) e as sugestões de branch/commit
> (REQ-TRACE-005) são incrementos seguintes — 0007 permanece IN_PROGRESS. Plano montado
> sem design técnico formal (Fase 2); TASK-TRACE-001 registra a decisão do Git em ADR.

---

## Ordem de execução

```
TASK-TRACE-001 (ADR git) ─► TASK-TRACE-005 (adapter) ─┐
TASK-TRACE-002 (parser git) ─┬─► TASK-TRACE-003 (escopo) ─┼─► TASK-TRACE-006 (comando)
TASK-TRACE-004 (parser tasks) ┘──────────────────────────┘
```

Caminho crítico: **TASK-TRACE-002 → TASK-TRACE-003 → TASK-TRACE-006**.
Paralelizáveis no início: **TASK-TRACE-001, TASK-TRACE-002, TASK-TRACE-004**.

---

## TASK-TRACE-001 — ADR: acesso ao Git por binário + parser puro

**Requisitos:** NFR-TRACE-002, NFR-TRACE-001
**Dependências:** —
**Complexidade:** P
**Status:** done

### Descrição

Registrar em ADR a decisão D-Q1: acessar o Git executando o binário (`git status
--porcelain=v2 --branch`, `git diff --numstat`, `git rev-parse`) e fazer parsing puro da
saída, em vez da API `vscode.git`. Justificar: testabilidade do parser, consistência com o
padrão núcleo-puro (0005/0006), somente leitura (nunca escreve), sem rede (ADR-005).

### Arquivos prováveis

- `.specs/features/0007-git-traceability/decisions/ADR-011-acesso-ao-git.md`

### Testes esperados

- Nenhum — decisão/documentação (registrado em `gaps`).

### Critério de conclusão

- ADR-011 escrito (decisão, alternativa `vscode.git`, consequências) e referenciado no
  `architecture.md` da extensão.

---

## TASK-TRACE-002 — Núcleo puro: parser da saída do Git

**Requisitos:** REQ-TRACE-001, REQ-TRACE-002, NFR-TRACE-002, NFR-TRACE-003
**Dependências:** —
**Complexidade:** M
**Status:** done

### Descrição

Módulo puro que faz parsing de: (a) `git status --porcelain=v2 --branch` → branch atual e
arquivos com situação (staged, unstaged, não rastreado, conflito); (b) `git diff --numstat`
→ lista de `{path, added, removed}` (binário = `-`). Robusto: linhas inesperadas são
ignoradas, entrada vazia → estado vazio, nunca lança (NFR-TRACE-003). Sem `vscode`.

### Arquivos prováveis

- `src/sdd/gitParse.ts`

### Testes esperados

- TEST-TRACE-001 — parse de porcelain=v2 (branch, staged/unstaged/untracked/conflito)
- TEST-TRACE-002 — parse de `--numstat` (adições/remoções; binário)
- TEST-TRACE-003 — entrada vazia/malformada não lança e degrada para vazio

### Critério de conclusão

- Os três testes passam; nenhum import de `vscode`.

---

## TASK-TRACE-003 — Núcleo puro: detecção de mudanças fora do escopo

**Requisitos:** REQ-TRACE-003, NFR-TRACE-002
**Dependências:** TASK-TRACE-002
**Complexidade:** M
**Status:** done

### Descrição

Módulo puro `checkScope(input)` que, dados os arquivos alterados (do parser), os arquivos
prováveis da tarefa em andamento (D-Q5), as estatísticas do diff e a config (globs sensíveis,
limites, manifests de dependência — D-Q3), devolve uma lista de alertas: arquivo não previsto,
arquivo sensível, remoção não solicitada (removed>0, added=0), diff acima do limite
(linhas/arquivos), dependência nova (manifest no diff). Inclui um matcher de glob simples
(`*`, `**`) puro. Alertas são informativos (D-Q4). Sem `vscode`.

### Arquivos prováveis

- `src/sdd/scopeCheck.ts`

### Testes esperados

- TEST-TRACE-004 — arquivo alterado fora dos prováveis → alerta 'unplanned'
- TEST-TRACE-005 — arquivo sensível (`.env`) → alerta 'sensitive'
- TEST-TRACE-006 — limite de diff, remoção e dependência nova geram alertas
- TEST-TRACE-007 — diff dentro do escopo → sem alertas

### Critério de conclusão

- Os quatro testes passam; a função é pura e determinística.

---

## TASK-TRACE-004 — Núcleo puro: plano da tarefa em andamento

**Requisitos:** REQ-TRACE-003, NFR-TRACE-002
**Dependências:** —
**Complexidade:** M
**Status:** done

### Descrição

Parser puro de `tasks.md`: extrai, por tarefa, o identificador, o `**Status:**` e os itens de
`### Arquivos prováveis`. Expõe um helper para achar a tarefa `in_progress` e seus arquivos
prováveis (D-Q5). Robusto a markdown fora do formato (NFR-TRACE-003). Sem `vscode`.

### Arquivos prováveis

- `src/sdd/tasksPlan.ts`

### Testes esperados

- TEST-TRACE-008 — extrai status e arquivos prováveis por tarefa; acha a `in_progress`
- TEST-TRACE-009 — markdown incompleto/ausente → resultado vazio, sem lançar

### Critério de conclusão

- Os dois testes passam; nenhum import de `vscode`.

---

## TASK-TRACE-005 — Borda: adapter de Git (somente leitura)

**Requisitos:** REQ-TRACE-001, REQ-TRACE-002, NFR-TRACE-001, NFR-TRACE-004
**Dependências:** TASK-TRACE-001
**Complexidade:** P
**Status:** done

### Descrição

Executa o `git` no diretório do workspace (via `node:child_process`, somente comandos de
leitura: `status --porcelain=v2 --branch`, `diff --numstat`, `rev-parse`) e devolve a saída
crua para os parsers puros (TASK-TRACE-002). Nunca escreve no repositório (NFR-TRACE-001);
sem rede (NFR-TRACE-004). Git ausente/erro → resultado indefinido tratado pela borda.

### Arquivos prováveis

- `src/sdd/gitAdapter.ts`

### Testes esperados

- Nenhum automatizado — I/O de processo; o parsing é coberto por TEST-TRACE-001/002.
  Verificação por revisão manual (registrado em `gaps`).

### Critério de conclusão

- O adapter devolve o estado e o diff de um repositório real; nenhuma escrita ocorre;
  `npm run compile`/`lint` limpos.

---

## TASK-TRACE-006 — Comando "Verificar escopo" e wiring

**Requisitos:** REQ-TRACE-003, NFR-TRACE-001
**Dependências:** TASK-TRACE-002, TASK-TRACE-003, TASK-TRACE-004, TASK-TRACE-005
**Complexidade:** M
**Status:** done

### Descrição

Comando `sddClaudeKit.checkScope` (a partir de uma feature no painel Features): roda o adapter
(TRACE-005), lê o `tasks.md` da mudança para achar a tarefa em andamento e seus arquivos
prováveis (TRACE-004), monta o modelo de escopo (TRACE-003) e apresenta os alertas num canal
de saída ("SDD · Escopo"). Adiciona a config `sddClaudeKit.scope.*` (sensíveis, limites) ao
`package.json`. Somente leitura (NFR-TRACE-001).

### Arquivos prováveis

- `src/extension.ts`
- `package.json`

### Testes esperados

- Nenhum automatizado — integração com a API do VS Code; a lógica vive nos núcleos puros.
  Verificação por revisão manual (registrado em `gaps`).

### Critério de conclusão

- Acionar "Verificar escopo" numa feature mostra os alertas corretos no canal; nenhuma
  escrita no repositório; `npm run compile`/`lint`/`test` limpos.

---

## TASK-TRACE-007 — Núcleo puro: navegação de rastreabilidade

**Requisitos:** REQ-TRACE-004, NFR-TRACE-002
**Dependências:** —
**Complexidade:** M
**Status:** done

### Descrição

Parser puro de `traceability.yaml` para um modelo navegável: cada requisito com seus cenários,
tarefas, arquivos (implementation) e testes; e um classificador de artefato pelo identificador
(SCN-/TASK-/TEST-/REQ-/NFR-/caminho). Robusto (NFR-TRACE-003). Sem `vscode`. Incremento 2 (D-Q6).

### Arquivos prováveis

- `src/sdd/traceabilityNav.ts`

### Testes esperados

- TEST-TRACE-010 — parse do modelo navegável e achatamento dos artefatos
- TEST-TRACE-011 — classificação por tipo e robustez a YAML inválido

### Critério de conclusão

- Os dois testes passam; nenhum import de `vscode`.

---

## TASK-TRACE-008 — Comando "Navegar rastreabilidade"

**Requisitos:** REQ-TRACE-004
**Dependências:** TASK-TRACE-007
**Complexidade:** M
**Status:** done

### Descrição

Comando `sddClaudeKit.navigateTraceability` (ação numa feature): lê o `traceability.yaml`,
oferece um QuickPick de requisitos e, do escolhido, um QuickPick dos artefatos ligados; abre o
artefato — `spec.md` (requisito/cenário, posicionando na linha), `tasks.md` (tarefa), o arquivo
(implementation) ou uma busca no workspace (teste). Somente leitura (D-Q6, RF-015).

### Arquivos prováveis

- `src/extension.ts`
- `package.json`

### Testes esperados

- Nenhum automatizado — QuickPick/abertura são integração com a API do VS Code; a lógica de
  parsing/classificação vive em TASK-TRACE-007. Verificação por revisão manual (`gaps`).

### Critério de conclusão

- Acionar "Navegar rastreabilidade" numa feature abre o artefato escolhido; nenhuma escrita;
  `npm run compile`/`lint`/`test` limpos.

---

## Resumo

| Complexidade | Quantidade |
| --- | --- |
| P | 2 |
| M | 6 |
| G | 0 |

Total: 8 tarefas · 8 concluídas · 0 pendentes.

**Caminho crítico:** TASK-TRACE-002 → TASK-TRACE-003 → TASK-TRACE-006 (incremento 1) ·
TASK-TRACE-007 → TASK-TRACE-008 (incremento 2)

**Bloqueios ativos:** nenhum.

**Paralelizáveis agora:** nenhum — incrementos 1 e 2 concluídos.

> Incremento 1 (adapter + escopo) e incremento 2 (navegação de rastreabilidade, REQ-TRACE-004)
> implementados em 2026-07-31, fora da ordem formal do fluxo (sem approve/design — Fase 1).
> Verificação: compile, lint e testes limpos. 0007 segue **IN_PROGRESS**.
>
> Incremento seguinte (D-Q2): REQ-TRACE-005 (sugestões de branch/commit).
