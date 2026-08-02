# Runbook — execução real das skills da Fase 2 (0007-sdd-workflow-completion)

Objetivo: executar cada skill **de verdade** com o CLI `claude`, num projeto-cobaia limpo,
e registrar a saída — o que fecha o critério de conclusão de SWC-007..014, mais o percurso
e2e (SWC-017) e a auditoria (SWC-016).

Convenção: **[RODAR]** = comando no terminal. **[VERIFICAR]** = o que olhar no resultado.
**[REGISTRAR]** = cole de volta para mim (vira a seção "Resultado" da tarefa em tasks.md).

Rode tudo no WSL. Repo do plugin: `/home/idosreisjunior/sdd-kit`.

---

## 0. Pré-requisitos (uma vez)

[RODAR]
```bash
claude --version                                  # confirmar o CLI
cd /home/idosreisjunior/sdd-kit
npm ci && npm run build && npm test && npm run validate-plugin   # baseline verde
```

Garantir o plugin disponível numa sessão fora do repo (marketplace local):
```bash
claude plugin marketplace add /home/idosreisjunior/sdd-kit   # usa .claude-plugin/marketplace.json
claude plugin install sdd-kit                                # se ainda não instalado
claude plugin list                                           # confirmar sdd-kit ativo
```

> Se você já dogfooda o plugin, ele provavelmente já está instalado — `claude plugin list` confirma.

---

## 1. Projeto-cobaia limpo

Cada bloco de teste começa de um estado montado à mão (é o que o design pede: cada skill é
exercitada isoladamente). Crie uma raiz descartável:

[RODAR]
```bash
export SMOKE=/tmp/sdd-0007-smoke
rm -rf "$SMOKE" && mkdir -p "$SMOKE" && cd "$SMOKE"
git init -q && git config user.name "Smoke Tester" && git config user.email "smoke@example.com"
claude -p "/sdd-kit:init"                          # cria .specs/ com config.yaml e index.yaml
ls -la .specs
```
[VERIFICAR] `.specs/config.yaml` e `.specs/index.yaml` existem; `workflow.mode: guided`.

Crie uma mudança-cobaia:
```bash
claude -p '/sdd-kit:new feature "cadastro de clientes"'
CH=$(ls .specs/features)                           # ex.: 0001-customer-registration
echo "$CH"
claude -p "/sdd-kit:spec ${CH%%-*}-*"              # ou passe o id completo
```
[VERIFICAR] a mudança nasce em `DRAFT`; `spec.md` tem requisitos e questões pendentes.

> Onde um cenário exigir um estado específico (CLARIFIED, PLANNED, etc.), o caminho honesto é
> chegar lá **rodando as skills anteriores** — é exatamente o que o percurso e2e (seção 3) faz.
> Os blocos por-skill abaixo assumem que você chegou ao estado de entrada pela skill anterior.

---

## 2. Por skill

Para cada skill, rode em uma **sessão interativa** (`claude` sem `-p`) quando o cenário exigir
resposta/confirmação; use `claude -p "<prompt>"` para os casos de uma tacada só. Depois de cada
execução, capture o `status.yaml` e o artefato tocado.

Helper para capturar o estado:
```bash
snap() { echo "== $1 =="; sed -n '1,20p' ".specs/features/$CH/status.yaml"; }
```

### 2.1 clarify — TASK-SWC-007  (DRAFT → CLARIFIED)

- **SCN-SWC-001 / TEST-SWC-010** — questão crítica **respondida** promove a CLARIFIED.
  [RODAR] sessão interativa: `claude` → `/sdd-kit:clarify <id>` → responda a questão crítica.
  [VERIFICAR] status vira `CLARIFIED`; `resolved_questions` ganhou a Q com `date` e `summary`;
  a Q saiu de `blocked_by`; `history` ganhou UMA entrada nova (as anteriores intactas).
- **SCN-SWC-009 / TEST-SWC-011** — questão crítica **sem resposta** mantém DRAFT.
  [RODAR] repita, mas **não** responda a questão crítica.
  [VERIFICAR] status **continua** `DRAFT`; a Q crítica continua em `blocked_by`, reportada por id+severidade.
- **SCN-SWC-016 / TEST-SWC-012** — a promoção só acrescenta ao histórico.
  [VERIFICAR] `status` do topo == status da última entrada de `history`; nenhuma entrada reescrita.

[REGISTRAR] os dois `status.yaml` (promovido e não promovido) + o trecho de `resolved_questions`.

### 2.2 design — TASK-SWC-008  (CLARIFIED → DESIGNED)

- **SCN-SWC-002 / TEST-SWC-014** — de CLARIFIED, cria design.md e promove.
  [RODAR] `claude -p "/sdd-kit:design <id>"` (com a mudança em CLARIFIED).
  [VERIFICAR] `design.md` criado a partir do template (15 seções, **nenhum `{{`**); status `DESIGNED`.
- **SCN-SWC-010 / TEST-SWC-015** — de DRAFT com questão crítica, **recusa** e não escreve nada.
  [RODAR] antes: `sha256sum .specs/features/$CH/status.yaml` → guarde o hash. Rode design numa
  mudança ainda em DRAFT com questão crítica. Depois: `sha256sum` de novo.
  [VERIFICAR] a skill recusa informando estado atual/exigido; `design.md` **não existe**;
  o hash de `status.yaml` é **idêntico** ao de antes (byte a byte inalterado).

[REGISTRAR] o `design.md` gerado (topo) + a mensagem de recusa + os dois hashes.

### 2.3 approve — TASK-SWC-009  (PLANNED → APPROVED)   [precisa de ato humano]

Chegue a PLANNED rodando `/sdd-kit:tasks <id>` antes.

- **SCN-SWC-003 / TEST-SWC-017** — aprovação dada grava date/by/revision e promove.
  [RODAR] sessão interativa: `/sdd-kit:approve <id>` → escreva explicitamente **"aprovo o plano"**.
  [VERIFICAR] `approval` tem `date`, `by` (de git config) e `revision`; status `APPROVED`.
  Confirme a revisão: `node -e "const c=require('crypto');console.log(c.createHash('sha256').update(require('fs').readFileSync('.specs/features/$CH/spec.md')).digest('hex').slice(0,12))"`
  deve **bater** com `approval.revision`.
- **SCN-SWC-011 / TEST-SWC-018** — aprovação **negada**.
  [RODAR] repita e, quando perguntado, **recuse** ("não aprovo ainda").
  [VERIFICAR] `approval: null`, status `PLANNED`, **sem** entrada nova em `history`.
- **SCN-SWC-007 / TEST-SWC-019** — DRAFT → APPROVED é recusada.
  [RODAR] `claude -p "/sdd-kit:approve <id-de-uma-mudança-em-DRAFT>"`.
  [VERIFICAR] recusa com origem (DRAFT), destino (APPROVED) e as transições válidas de DRAFT;
  `status` e `history` inalterados.

[REGISTRAR] o `approval` gravado + o hash conferido + o caso negado + o caso recusado.

### 2.4 implement — TASK-SWC-010 (portões) e TASK-SWC-011 (execução)   [não autoinvocável]

- **SCN-SWC-012 / TEST-SWC-020** — `require_approval: true` + `approval: null` recusa; nada de código muda.
  [RODAR] com a mudança sem aprovação: `git status --porcelain > /tmp/before.txt`; rode implement;
  `git status --porcelain > /tmp/after.txt`; `diff /tmp/before.txt /tmp/after.txt`.
  [VERIFICAR] recusa citando a config; `diff` vazio (nenhum arquivo de código tocado).
- **SCN-SWC-020 / TEST-SWC-021** — spec.md alterada após APPROVED → aprovação vencida.
  [RODAR] aprove; depois edite `spec.md` (uma linha); rode implement.
  [VERIFICAR] reporta aprovação **vencida** (hash divergente); **não** regride o estado sozinho.
- **SCN-SWC-013 / TEST-SWC-022** — tarefa com dependência pendente não inicia.
  [VERIFICAR] a dependência é nomeada por identificador; a tarefa não começa.
- **SCN-SWC-022 / TEST-SWC-023** — `require_approval: false` prossegue de PLANNED.
  [RODAR] ponha `require_approval: false` no `config.yaml`; rode implement de uma mudança em PLANNED.
  [VERIFICAR] prossegue para `IN_PROGRESS` sem exigir APPROVED.
- **SCN-SWC-004 / TEST-SWC-024** — tarefa concluída atualiza tasks.md e contadores; estado IN_PROGRESS.
  [VERIFICAR] a tarefa fica concluída em `tasks.md`; `total = pending + in_progress + done`; **não** promove a VERIFIED.
- **SCN-SWC-017 / TEST-SWC-025** — a matriz recebe arquivos e testes e valida contra o schema.
  [VERIFICAR] `traceability.yaml` da linha aponta arquivos existentes; valide:
  `node -e "..."` ou rode `npm test` no repo do plugin com o artefato copiado.
- **SCN-SWC-019 / TEST-SWC-026** — decisão arquitetural não prevista → BLOCKED com motivo.
  [VERIFICAR] status `BLOCKED`; motivo nomeia a decisão; ADR proposto.

[REGISTRAR] os `diff` de git, os `status.yaml` de cada caso, e o trecho da matriz atualizada.

### 2.5 verify — TASK-SWC-012 (validações) e TASK-SWC-013 (aceite/órfãos)   (IN_PROGRESS → VERIFIED)

- **SCN-SWC-005 / TEST-SWC-027** — um comando de validação falhando não promove.
  [RODAR] no `config.yaml` do cobaia, aponte `validation.commands.test` para um comando que **falha**;
  rode verify.
  [VERIFICAR] status **não** vira VERIFIED; `validation.md` traz o comando exato e a saída obtida.
- **TEST-SWC-028** — os três estados; ausente não bloqueia; zero-testes bloqueia; indeterminado bloqueia.
  [RODAR] variações: comando `null` (não configurada), um que roda sem testes (`--passWithNoTests`),
  um que não dá para contar testes.
  [VERIFICAR] `validation.md` distingue *não configurada* / *executada sem efeito* / *aprovada*;
  sob `require_tests: true`, "executada sem efeito" e "não foi possível confirmar execução" **bloqueiam**.
- **SCN-SWC-014 / TEST-SWC-029** — tudo aprovado + critérios satisfeitos → VERIFIED.
  [VERIFICAR] `acceptance.md` tem uma linha por critério, com evidência; status `VERIFIED`.
- **SCN-SWC-008 / TEST-SWC-030** — `require_traceability: true` com órfão recusa.
  [RODAR] deixe um requisito sem tarefa (ou tarefa sem teste); ponha `require_traceability: true`; rode verify.
  [VERIFICAR] recusa listando **cada** órfão por identificador.

[REGISTRAR] os `validation.md`/`acceptance.md` gerados + os `status.yaml`.

### 2.6 archive — TASK-SWC-014  (VERIFIED → ARCHIVED)   [não autoinvocável]

- **SCN-SWC-006 / TEST-SWC-031** — de VERIFIED, move e atualiza o índice.
  [RODAR] `claude -p "/sdd-kit:archive <id>"` (mudança em VERIFIED).
  [VERIFICAR] diretório agora em `.specs/archive/<id>`; entrada migrou de `changes` para `archive`
  no `index.yaml`, com `status: ARCHIVED` e o novo `path`.
- **SCN-SWC-015 / TEST-SWC-032** — destino já ocupado recusa, sem alterar nada.
  [RODAR] crie `.specs/archive/<id>` à mão antes; guarde hashes dos dois diretórios
  (`find ... | xargs sha256sum`); rode archive; recompare.
  [VERIFICAR] recusa com o caminho do conflito; hashes de origem e destino inalterados.

[REGISTRAR] o `index.yaml` depois de arquivar + a recusa por conflito.

---

## 3. Percurso e2e — TASK-SWC-017  (DRAFT → ARCHIVED, sem editar status.yaml à mão)

Num cobaia novo, leve UMA mudança-de-brinquedo pelo fluxo inteiro, **só com skills**:

[RODAR]
```bash
export SMOKE=/tmp/sdd-0007-e2e; rm -rf "$SMOKE"; mkdir -p "$SMOKE"; cd "$SMOKE"
git init -q; git config user.name X; git config user.email x@e.com
claude -p "/sdd-kit:init"
claude -p '/sdd-kit:new feature "somar dois números"'
CH=$(ls .specs/features)
# a partir daqui, uma skill por passo — responda/aprove quando pedido:
#   /sdd-kit:spec $CH   → /sdd-kit:clarify $CH  → /sdd-kit:design $CH
#   /sdd-kit:tasks $CH  → /sdd-kit:approve $CH  → /sdd-kit:implement $CH (repita)
#   /sdd-kit:verify $CH → /sdd-kit:archive $CH
```
[VERIFICAR] após **cada** skill: `status.yaml` válido contra o schema, `history` com uma entrada
por transição (`reason` não vazio), `status` == última entrada. Ao final: 8 estados alcançados
na ordem `DRAFT → CLARIFIED → DESIGNED → PLANNED → APPROVED → IN_PROGRESS → VERIFIED → ARCHIVED`,
**sem nenhuma edição manual de status.yaml**.

[REGISTRAR] a sequência de `status` após cada passo (um `grep '^status:' status.yaml` por etapa).

---

## 4. Auditoria — TASK-SWC-016  (idioma e contexto)

[RODAR] no repo do plugin:
```bash
cd /home/idosreisjunior/sdd-kit
# custo de contexto por skill (tokens ~ bytes/4):
for s in plugins/sdd-kit/skills/*/SKILL.md; do printf "%-14s %6s bytes\n" "$(basename $(dirname $s))" "$(wc -c < $s)"; done
# nenhum glob de leitura alcança outra mudança:
grep -rn "features/\*\|\.specs/features/" plugins/sdd-kit/skills/*/SKILL.md || echo "ok: sem glob amplo"
```
[VERIFICAR] textos dos SKILL.md em pt-BR; nenhuma skill lê `.specs/{features,bugs,...}/*/` sem fixar
o id ativo (Art. 7); registre o custo de contexto real das 10 skills (alimenta Q10 do design).

[REGISTRAR] a tabela de bytes/skill + o resultado do grep.

---

## 5. Como me devolver

Para cada skill, cole:
1. o **comando** exato que você rodou;
2. a **saída** relevante do `claude` (a mensagem final da skill);
3. o **status.yaml** (ou o trecho pedido) e o artefato tocado.

Com isso eu: (a) confirmo se o cenário fechou; (b) ajusto o `SKILL.md` se algo divergiu; (c) escrevo
a seção **"## Resultado"** na tarefa correspondente em `tasks.md` e marco `done` o que passou; (d) só
então promovo os contadores e, ao fim, fecho SWC-016/017.

> Dica: rode **uma leva por vez** (clarify+design primeiro). Não precisa fazer tudo de uma sentada —
> me mande o que rodar e seguimos incrementalmente, tarefa a tarefa.
