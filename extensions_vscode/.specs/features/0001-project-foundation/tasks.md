# Tarefas — Fundação do projeto e inicialização

Complexidade: **P** pequena (≤ meio dia) · **M** média (≈ 1 dia) · **G** grande
(deve ser dividida antes de começar).

> Estado (2026-07-31): dependências instaladas; `build`, `lint` e `test` (16)
> passam (exit 0). FOUND-001, -003, -004, -007, -009 e -010 concluídas.
> FOUND-002 e -006 têm código escrito, mas seguem `pending` porque a Definição de
> Pronto (Art. 10) exige verificação no host do editor (F5). FOUND-008 é o gate
> final (roda quando todo o código estiver pronto).

---

## Ordem de execução

```
TASK-FOUND-009 ✅ (ADR-001: origem dos templates)  ─┐  Q2 resolvida
                                                     │
TASK-FOUND-010 (sync-templates + verificação CI)  ◄─┘  consequência do ADR-001
      │
TASK-FOUND-001 (scaffold TS + manifest)
      │
      ├── TASK-FOUND-002 (ativação + UI shell)
      │         │
      │         └── TASK-FOUND-006 (watcher + setContext)
      │
      ├── TASK-FOUND-003 ✅ (detector .specs/Git) ── TASK-FOUND-007 ✅ (testes)
      │         │
      │         └── TASK-FOUND-004 ✅ (detectar Claude Code)   [Q1 → ADR-002]
      │
      └── TASK-FOUND-005 (comando Inicializar SDD)  ── depende de -003, -010
                                                       (Q2 resolvida por ADR-001)

TASK-FOUND-008 (npm install + build + lint)  ── depende de todo o código acima
```

---

## TASK-FOUND-009 — ADR: origem dos templates da inicialização  `✅ done`

**Requisitos:** REQ-FOUND-003
**Dependências:** nenhuma
**Complexidade:** P
**Status:** done

### Descrição

Resolver a questão Q2: a inicialização (`Inicializar SDD`) deve **embutir** cópias
próprias dos templates `.specs` ou **depender** do plugin sdd-kit instalado?
Registrar a decisão como ADR-001 em `decisions/`, com alternativas e consequências
(acoplamento, versionamento, tamanho do .vsix, uso offline).

### Arquivos prováveis

- `.specs/features/0001-project-foundation/decisions/ADR-001-*.md`

### Testes esperados

- Nenhum — é uma decisão. A consequência é verificada por TASK-FOUND-005.

### Critério de conclusão

- ✅ ADR-001 registrado (status Aceito), cobrindo três alternativas.
- ✅ Q2 movida para `resolved_questions` em `status.yaml`.

### Resultado (2026-07-31)

Decisão: **embutir os templates no `.vsix`**, com `plugins/sdd-kit/templates`
como fonte única no monorepo e sincronização por build + verificação em CI. A
inicialização não depende do plugin instalado. Ver
`decisions/ADR-001-origem-dos-templates-de-inicializacao.md`. Consequência: nova
tarefa TASK-FOUND-010 (mecanismo de sync).

---

## TASK-FOUND-001 — Scaffold TypeScript + manifest da extensão  `✅ done`

**Requisitos:** REQ-FOUND-001, NFR-FOUND-001
**Dependências:** nenhuma
**Complexidade:** P
**Status:** done

### Descrição

Estrutura base do projeto: `package.json` (manifest da extensão com
`contributes`), `tsconfig.json` (strict), `eslint.config.js`, `.vscodeignore`,
`.gitignore` e ícone da Activity Bar.

### Arquivos prováveis

- `package.json`, `tsconfig.json`, `eslint.config.js`, `.vscodeignore`,
  `.gitignore`, `resources/sdd-icon.svg`

### Testes esperados

- Nenhum diretamente; a verificação é o build de TASK-FOUND-008.

### Critério de conclusão

- `package.json` declara o container da Activity Bar, as views, os comandos e a
  configuração `sddClaudeKit.*`.
- `npm run compile` compila sem erro (verificado em TASK-FOUND-008).

---

## TASK-FOUND-002 — Ativação e shell da Activity Bar

**Requisitos:** REQ-FOUND-001, REQ-FOUND-004, NFR-FOUND-002
**Dependências:** TASK-FOUND-001
**Complexidade:** M
**Status:** pending

### Descrição

`activate()` registra os dois `TreeDataProvider` (Projeto e Features), o item de
contexto na status bar e os comandos base. Tudo em `context.subscriptions`.

### Arquivos prováveis

- `src/extension.ts`, `src/views/projectTreeProvider.ts`,
  `src/views/featuresTreeProvider.ts`

### Testes esperados

- TEST-FOUND-002 — a status bar exibe o teto configurado quando inicializado.

### Critério de conclusão

- Ao ativar, o container e as duas seções aparecem (SCN-FOUND-001).
- O indicador de contexto reflete `context.maxTokens` (SCN-FOUND-006).

---

## TASK-FOUND-003 — Detector do workspace (.specs, Git)  `✅ done`

**Requisitos:** REQ-FOUND-002, NFR-FOUND-001, NFR-FOUND-002
**Dependências:** TASK-FOUND-001
**Complexidade:** P
**Status:** done

### Descrição

Módulo somente-leitura que detecta `.specs/config.yaml` e `.git` via
`workspace.fs` (sem caminhos do SO, para compatibilidade WSL).

### Arquivos prováveis

- `src/sdd/projectDetector.ts`, `src/sdd/detection.ts`

### Testes esperados

- TEST-FOUND-001 — detecta corretamente projeto inicializado e não inicializado.

### Critério de conclusão

- ✅ `detectFrom()` retorna `hasSpecs`/`hasGit` corretos (SCN-FOUND-002/003).
- ✅ TEST-FOUND-001 passa (5 casos).

### Resultado (2026-07-31)

Lógica de decisão extraída para `detection.ts` (sem VS Code); `projectDetector.ts`
injeta um probe apoiado em `workspace.fs`. Coberto por `src/test/detection.test.ts`
(projeto inicializado, sem .specs, sem git/specs, sem workspace, e verificação de
quais marcadores são sondados). `npm test` exit 0.

---

## TASK-FOUND-004 — Detecção do Claude Code  `✅ done`

**Requisitos:** REQ-FOUND-002
**Dependências:** TASK-FOUND-003
**Complexidade:** M
**Status:** done

### Descrição

Detectar a disponibilidade do Claude Code de forma confiável em Windows, Linux e
WSL. Q1 resolvida pelo **ADR-002**: varredura do `PATH` (sem executar processo),
com nomes por plataforma e override via `sddClaudeKit.claudeCode.path`.

### Arquivos prováveis

- `src/sdd/claudeCode.ts`, `src/sdd/projectDetector.ts`, `package.json` (config)

### Testes esperados

- TEST-FOUND-003 — reporta presença/ausência do Claude Code sem lançar erro.

### Critério de conclusão

- ✅ Q1 resolvida e registrada (ADR-002).
- ✅ A detecção não trava nem lança em ambiente sem Claude Code — coberto por
  TEST-FOUND-003 (7 casos, incluindo probe que lança).

### Resultado (2026-07-31)

Lógica pura em `claudeCode.ts` (varre `PATH`, respeita `PATHEXT` no Windows e o
bit de execução no POSIX, nunca lança). `projectDetector.ts` injeta o probe real
com `fs.access(X_OK)` e expõe `claudeCode` em `detectProject()`. Override
`sddClaudeKit.claudeCode.path` adicionado ao manifest. `npm test` exit 0.

---

## TASK-FOUND-005 — Comando "Inicializar SDD"  `🔧 in_progress`

**Requisitos:** REQ-FOUND-003, NFR-FOUND-003
**Dependências:** TASK-FOUND-003, TASK-FOUND-010
**Complexidade:** M
**Status:** in_progress

### Descrição

Implementar o comando que cria a estrutura `.specs`: exibir a prévia dos arquivos,
pedir confirmação, criar os arquivos sem sobrescrever código, e recusar quando o
projeto já estiver inicializado. Por ADR-001, os templates vêm **embutidos** no
pacote da extensão (produzidos por TASK-FOUND-010), nunca do plugin instalado.

### Arquivos prováveis

- `src/sdd/initializer.ts`, `src/sdd/initTemplates.ts`, `src/extension.ts`

### Testes esperados

- TEST-FOUND-004 — inicialização cria os arquivos esperados e não sobrescreve
  arquivo existente.

### Critério de conclusão

- SCN-FOUND-004 e SCN-FOUND-005 satisfeitos.
- A estrutura criada é lida sem erro pela CLI do sdd-kit (NFR-FOUND-003).

### Resultado parcial (2026-07-31)

Implementado: comando `sddClaudeKit.initProject` com prévia modal, confirmação,
recusa quando já inicializado (SCN-FOUND-005) e escrita sem sobrescrita via
`workspace.fs`. `config.yaml`/`index.yaml` são **gerados** válidos (sem
placeholder); os 6 documentos de projeto vêm dos templates embutidos com
`{{PROJECT_NAME}}`/`{{DATE}}` substituídos. Lógica pura isolada em
`initTemplates.ts` e coberta por 4 testes (`node --test`, exit 0).

**Falta para `done`:** verificar SCN-FOUND-004/005 no Extension Development Host
(F5) — o comportamento de UI/FS no host não é executável fora do editor. Registrar
como evidência na Fase 2. Ver também a questão do preenchimento profundo dos docs
(marcadores `{{guia}}`/`{{...}}` remanescentes) — decisão adiada; a inicialização
"instala templates" (RF-001), não faz descoberta.

---

## TASK-FOUND-006 — Watcher de `.specs/config.yaml` e contexto de UI

**Requisitos:** REQ-FOUND-001, NFR-FOUND-002
**Dependências:** TASK-FOUND-002
**Complexidade:** P
**Status:** pending

### Descrição

`FileSystemWatcher` sobre `**/.specs/config.yaml` que refaz o diagnóstico e ajusta
o contexto `sddClaudeKit.initialized` (usado pelo `viewsWelcome`) sem exigir
reload.

### Arquivos prováveis

- `src/extension.ts`

### Testes esperados

- Nenhum automatizado (integração com o host); verificação manual registrada em
  `evidence` na Fase 2.

### Critério de conclusão

- Criar/remover `.specs/config.yaml` alterna a tela de boas-vindas sem reload.

---

## TASK-FOUND-007 — Testes do detector e harness  `✅ done`

**Requisitos:** REQ-FOUND-002, NFR-FOUND-001
**Dependências:** TASK-FOUND-003
**Complexidade:** M
**Status:** done

### Descrição

Estruturar `src/test/` com `node:test`, isolando a lógica de domínio da API do VS
Code para permitir teste unitário do detector.

### Arquivos prováveis

- `src/test/detection.test.ts`, `src/test/claudeCode.test.ts`,
  `src/test/initTemplates.test.ts`

### Testes esperados

- TEST-FOUND-001, TEST-FOUND-003.

### Critério de conclusão

- ✅ `npm test` executa e os testes do detector passam (16/16).

### Resultado (2026-07-31)

Harness `node:test` no ar. **TEST-FOUND-001** (`detection.test.ts`, 5 casos) e
**TEST-FOUND-003** (`claudeCode.test.ts`, 7 casos) entregues, além de
`initTemplates.test.ts` (4). A domain logic ficou isolada da API do VS Code
(`detection.ts`, `claudeCode.ts`), o que tornou os testes possíveis. `npm test`
→ 16/16, exit 0.

---

## TASK-FOUND-010 — Sincronização dos templates embutidos  `✅ done`

**Requisitos:** REQ-FOUND-003, NFR-FOUND-003
**Dependências:** TASK-FOUND-001
**Complexidade:** P
**Status:** done

### Descrição

Consequência do ADR-001. Script `npm run sync-templates` que copia
`../plugins/sdd-kit/templates/<idioma>/` para o diretório embutido da extensão,
mais uma verificação em CI que falha o build se a cópia embutida divergir da
fonte. Registrar a versão/commit dos templates embutidos.

### Arquivos prováveis

- `scripts/sync-templates.mjs`, `scripts/check-templates.mjs`,
  `scripts/templates-lib.mjs`, `package.json`, `.gitattributes`, `.github/workflows/ci.yml`

### Testes esperados

- TEST-FOUND-005 — a cópia embutida é byte-a-byte igual à fonte do plugin.

### Critério de conclusão

- ✅ `npm run sync-templates` reproduz os 18 arquivos do plugin em `templates/`.
- ✅ `npm run check-templates` (TEST-FOUND-005) falha na divergência — verificado
  com teste negativo (exit 1) e positivo (exit 0).
- ✅ Versão registrada em `templates/.sync-manifest.json` (hash combinado + por arquivo).
- ✅ Job `extension` no CI da raiz roda `check-templates`.

### Resultado (2026-07-31)

Templates embutidos **versionados** em `templates/` (padrão gerado-mas-commitado
com checagem de frescor). EOL normalizado por `.gitattributes` para estabilidade
entre Windows/Linux/WSL. `sync exit 0`, `check exit 0` (18 idênticos); teste
negativo confirmou `check exit 1` na divergência.

---

## TASK-FOUND-008 — Instalar dependências e validar build/lint

**Requisitos:** REQ-FOUND-001, NFR-FOUND-001
**Dependências:** TASK-FOUND-001, -002, -003, -004, -005, -006, -007
**Complexidade:** P
**Status:** pending

### Descrição

Rodar `npm install`, depois `npm run compile` e `npm run lint`, registrando as
saídas como evidência. É a tarefa que transforma "código escrito" em "validado".

### Arquivos prováveis

- `package-lock.json` (gerado)

### Testes esperados

- Nenhum novo; executa a suíte de TASK-FOUND-007.

### Critério de conclusão

- `npm run compile` e `npm run lint` terminam com código 0.
- Saídas anexadas às evidências da feature (Fase 2).

---

## Resumo

| Complexidade | Quantidade |
| --- | --- |
| P | 6 |
| M | 4 |
| G | 0 |

Total: 10 tarefas · 6 concluídas (001, 003, 004, 007, 009, 010) · 1 em andamento (005) · 3 pendentes (002, 006, 008).

**Caminho crítico:** FOUND-009 ✅ → FOUND-010 ✅ → FOUND-005 🔧 → FOUND-008.

**Bloqueios ativos:** nenhum crítico/alto. Q1 → ADR-002, Q2 → ADR-001; resta Q3 (média, versão do VS Code).

**Paralelizáveis agora:** FOUND-002, FOUND-006 (e concluir FOUND-005 no host via F5).
