# Feature: Git e rastreabilidade

- **ID:** 0007-git-traceability
- **Escopo dos identificadores:** TRACE
- **Estado:** ver `status.yaml` — a autoridade é ele

---

## Objetivo

Dar à extensão a capacidade de ler o estado do Git do workspace, detectar mudanças fora do
escopo de uma tarefa e navegar a cadeia de rastreabilidade — sem nunca escrever no
repositório sozinha.

## Contexto

Hoje a extensão só sabe se existe um `.git` (presença, em `detection.ts`); não lê branch,
diff nem status. O fluxo SDD exige fechar o laço entre o que foi **planejado** (tasks.md,
traceability.yaml) e o que foi **efetivamente mudado** (o diff do Git) — é isso que sustenta
a disciplina de escopo (constituição Art. 4: uma tarefa por vez, sem tocar o que não foi
pedido) e a rastreabilidade requisito→teste→commit (RF-015). Esta feature é o componente
"Traceability + Git Adapter" da arquitetura (§2), que a 0008 (evidências) depois consome.

## Escopo

### Incluído

- Adapter de Git **somente leitura**: branch, arquivos alterados (staged/unstaged), não
  rastreados, em conflito, e o diff da mudança (RF-018).
- Detecção de mudanças **fora do escopo** de uma tarefa (RF-014).
- Navegação da **rastreabilidade** requisito → cenário → tarefa → arquivo → teste (RF-015).
- Sugestão (não execução) de nome de branch e mensagem de commit (RF-018).

### Não incluído

- Commit/push/qualquer escrita no repositório (RF-018) — a extensão só lê e sugere.
- Integração com GitHub (issues/PR) — RF-019, pós-MVP.
- Evidências e validação da feature — RF-016/017, feature 0008.
- Resolução de conflitos — apenas os identifica.

---

## Decisões de escopo (2026-07-31)

As cinco questões levantadas na materialização foram respondidas pelo autor. Ficam
registradas aqui para dar rastro (constituição, Art. 5); a de natureza arquitetural será
formalizada em ADR no `design.md`.

| # | Decisão | Efeito |
| --- | --- | --- |
| D-Q1 | Acesso ao Git por **execução do binário `git`** (porcelain/numstat) com **parser puro** da saída — não a API `vscode.git`. | NFR-TRACE-002; **requer ADR** (borda executa, núcleo faz parsing). |
| D-Q2 | **Primeiro incremento**: adapter de Git (REQ-TRACE-001/002) + detecção de escopo (REQ-TRACE-003). Navegação (004) e sugestões (005) ficam para incrementos seguintes; 0007 permanece IN_PROGRESS. | tasks. |
| D-Q3 | Defaults de sensíveis (`.env`, `.env.*`, `*.pem`, `*.key`, `**/id_rsa`) e limite (~400 linhas ou 20 arquivos), **configuráveis** em `sddClaudeKit.scope.*`. | REQ-TRACE-003. |
| D-Q4 | Divergência de escopo é **alerta informativo**, nunca bloqueio ("arquivos prováveis" é previsão). | REQ-TRACE-003. |
| D-Q5 | A detecção compara o diff contra os arquivos prováveis da **tarefa em andamento** (`in_progress` no `tasks.md`). | REQ-TRACE-003. |
| D-Q6 | Navegação de rastreabilidade (REQ-TRACE-004) por **QuickPick** (ação numa feature) — não painel/webview — leve e consistente com "Verificar escopo". Incremento 2. | REQ-TRACE-004. |
| D-Q7 | Sugestões de branch/commit (REQ-TRACE-005) via mensagem com botões **Copiar** — nunca executa git. Convenção: branch `<prefixo>/<id>`; commit conventional `<tipo>: <título> (<NNNN>)`, editável. Incremento 3. | REQ-TRACE-005. |

---

## Requisitos funcionais

### REQ-TRACE-001 — Estado do Git

A extensão deve identificar, para o workspace, o branch atual, os arquivos alterados
(diferenciando staged de unstaged), os arquivos não rastreados e os em conflito. Quando não
houver repositório Git ou o Git estiver indisponível, deve reportar isso como estado
informativo, sem lançar (RF-018).

#### SCN-TRACE-001 — Repositório com alterações

DADO um workspace com repositório Git no branch "feature/x" e três arquivos alterados
QUANDO a extensão consulta o estado do Git
ENTÃO reporta o branch "feature/x" e os três arquivos, classificados por situação.

#### SCN-TRACE-002 — Workspace sem Git

DADO um workspace sem repositório Git
QUANDO a extensão consulta o estado do Git
ENTÃO reporta "sem repositório Git", sem erro.

### REQ-TRACE-002 — Diff da mudança

A extensão deve obter o conjunto de arquivos modificados e as estatísticas do diff
(linhas adicionadas/removidas por arquivo) do trabalho corrente, para servir de base à
detecção de escopo (RF-018/RF-014).

#### SCN-TRACE-003 — Diff disponível

DADO um repositório com alterações não commitadas
QUANDO a extensão obtém o diff da mudança
ENTÃO devolve a lista de arquivos com linhas adicionadas e removidas por arquivo.

### REQ-TRACE-003 — Detecção de mudanças fora do escopo

Dada uma mudança, a extensão deve comparar os arquivos efetivamente alterados (do Git) com
os arquivos prováveis da **tarefa em andamento** (`in_progress` no `tasks.md`, D-Q5) e
sinalizar (RF-014): arquivos não previstos; remoções não solicitadas; diff acima de um limite
configurável; introdução de novas dependências (manifests de pacote no diff); alteração de
arquivos sensíveis. Os limites e a lista de sensíveis têm defaults e são configuráveis em
`sddClaudeKit.scope.*` (D-Q3). Os sinais são **alertas informativos**, não bloqueios —
"arquivos prováveis" é previsão, não contrato (D-Q4).

#### SCN-TRACE-004 — Arquivo não previsto alterado

DADO uma tarefa cujos arquivos prováveis são A e B, e um diff que alterou A, B e C
QUANDO a extensão avalia o escopo
ENTÃO alerta que C foi alterado sem estar previsto na tarefa.

#### SCN-TRACE-005 — Arquivo sensível alterado

DADO um diff que altera um arquivo sensível (ex.: `.env`)
QUANDO a extensão avalia o escopo
ENTÃO emite um alerta de arquivo sensível, independentemente do previsto.

#### SCN-TRACE-006 — Dentro do escopo

DADO uma tarefa cujos arquivos prováveis são A e B, e um diff que alterou apenas A e B
QUANDO a extensão avalia o escopo
ENTÃO não emite alerta de escopo.

### REQ-TRACE-004 — Navegação de rastreabilidade

A extensão deve permitir navegar a cadeia requisito → cenário → tarefa → arquivo → teste a
partir do `traceability.yaml` de uma mudança, abrindo os artefatos referenciados. Commit,
evidência e PR ficam para incrementos futuros (dependem da 0008).

#### SCN-TRACE-007 — Navegar de um requisito

DADO um `traceability.yaml` com REQ-X ligado a tarefas, arquivos e testes
QUANDO o usuário navega a partir de REQ-X
ENTÃO a extensão mostra e permite abrir os artefatos ligados a REQ-X.

### REQ-TRACE-005 — Sugestões sem commit automático

A extensão pode sugerir um nome de branch e uma mensagem de commit derivados da mudança,
mas nunca executa commit, push ou qualquer escrita no repositório sem uma ação explícita do
usuário (RF-018).

#### SCN-TRACE-008 — Sugestão de commit

DADO uma mudança com título e id
QUANDO o usuário pede uma sugestão de commit
ENTÃO a extensão apresenta uma mensagem sugerida, copiável, sem executar o commit.

---

## Requisitos não funcionais

### NFR-TRACE-001 — Nenhuma escrita sem autorização

Nenhuma operação da feature escreve no repositório (commit, push, checkout, stage). O adapter
é somente leitura; sugestões são texto, aplicadas pelo usuário (RF-018, arquitetura §8).

### NFR-TRACE-002 — Núcleo puro e testável

O parsing da saída do Git e a lógica de detecção de escopo e de navegação são puros (sem a
API do VS Code), testáveis fora do host (standards §6), à semelhança de 0005/0006.

### NFR-TRACE-003 — Robustez

Ausência de Git, comando indisponível, saída inesperada ou arquivos ausentes resultam em
estado informativo, nunca em exceção (herda NFR-FEAT-001).

### NFR-TRACE-004 — Sem rede

Nenhum I/O de rede (ADR-005). Operações locais de Git apenas.

---

## Critérios de aceite

- [ ] O estado do Git (branch, alterados, não rastreados, conflitos) é reportado, e a
      ausência de Git é tratada sem erro (REQ-TRACE-001).
- [ ] O diff da mudança devolve arquivos e estatísticas (REQ-TRACE-002).
- [ ] A detecção de escopo sinaliza arquivos não previstos, sensíveis, limite de diff e
      dependências novas, como alertas (REQ-TRACE-003).
- [ ] A navegação de rastreabilidade abre os artefatos ligados a um requisito
      (REQ-TRACE-004).
- [ ] Sugestões de branch/commit são apresentadas sem nunca commitar (REQ-TRACE-005,
      NFR-TRACE-001).
- [ ] Núcleos de parsing/detecção são puros e cobertos por testes (NFR-TRACE-002).

---

## Questões pendentes

Nenhuma pendente. As cinco questões da materialização (Q1–Q5) foram respondidas em
2026-07-31 — ver **Decisões de escopo**. D-Q1 (acesso ao Git via binário) exige um ADR na
fase de design; é tarefa de design registrada, não questão em aberto.

## Hipóteses assumidas

Nenhuma em aberto. A hipótese de detectar "novas dependências" (RF-014) pela alteração dos
**manifests de pacote** (`package.json`/`package-lock.json`) no diff — e não por análise
semântica do grafo — fica **assumida** para este incremento (parte de D-Q3); a extensão a um
grafo de dependências real, se necessária, é trabalho futuro.
