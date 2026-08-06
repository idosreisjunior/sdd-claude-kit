# Bug: Kanban de tarefas conta `**done**` como pendente

- **ID:** 0037-board-status-parsing
- **Escopo dos identificadores:** BSTAT
- **Estado:** ver `status.yaml` — a autoridade é ele
- **Severidade:** média

---

## Comportamento observado

`parseTaskBoard` (`src/sdd/boardModel.ts`) coloca na coluna **Pendente** tarefas cujo
`**Status:**` está escrito com o valor em negrito.

O parser é:

```js
const TASK_STATUS = /^\*\*Status:\*\*\s*(pending|in_progress|done)\b/i   // linha 345
```

Ele exige que a palavra venha logo após `**Status:**`. A linha real em 17 tarefas é:

```
**Status:** **done** — 2026-07-29
```

Os asteriscos do negrito impedem o casamento, `exec` devolve `null`, e o bloco cai no
fallback de "pendente".

**Evidência.** As 17 ocorrências estão em `.specs/features/0001-plugin-foundation/tasks.md`
(projeto do plugin). Contagem por forma literal em todo o repositório:

| Forma | Ocorrências | Reconhecida hoje? |
| --- | --- | --- |
| `**Status:** done` | 161 | sim |
| `**Status:** pending` | 27 | sim |
| `**Status:** **done** — 2026-07-29` | **17** | **não** |
| `**Status:** in_progress` | 5 | sim |
| `**Status:** pending (nota entre parênteses)` | 3 | sim |

## Comportamento esperado

Uma tarefa marcada como concluída aparece na coluna **Concluída**, independentemente de o
valor estar em negrito, seguido de data ou de nota. O fallback para "Pendente" vale para
tarefa **sem status reconhecível**, não para status escrito de outra forma.

## Regra violada

**SCN-BOARD-002** (feature 0025-sdd-board, REQ-BOARD-002):

> DADO o `tasks.md` de uma mudança, com tarefas em vários status
> QUANDO o drill-down de tarefas é aberto
> ENTÃO as tarefas aparecem em colunas por status; tarefa sem status reconhecido cai em
> "Pendente".

A ressalva final cobre tarefa **sem** status. Uma tarefa com `**Status:** **done**` tem
status — o parser é que não o lê. O comportamento observado contradiz a primeira metade do
`ENTÃO`.

## Reprodução

1. Num `tasks.md`, escrever um bloco de tarefa cuja linha de status seja
   `**Status:** **done** — 2026-07-29`.
2. Abrir o Painel SDD e o drill-down de tarefas daquela mudança.
3. A tarefa aparece na coluna **Pendente**, embora esteja concluída.

Sem abrir o VS Code, a mesma reprodução em uma linha:

```
node -e "console.log(/^\*\*Status:\*\*\s*(pending|in_progress|done)\b/i.exec('**Status:** **done** — 2026-07-29'))"
# → null
```

**Frequência:** determinística — sempre que a forma em negrito é usada.
**Ambiente:** qualquer; é lógica pura, sem dependência de plataforma.
**Primeira ocorrência conhecida:** desde a feature 0025 (o parser nasceu assim). Só ficou
visível em 2026-08-05, ao comparar o Board com o painel `scripts/progress.mjs`.

## Impacto

Quem usa a extensão vê o progresso de tarefas **subestimado** num projeto que use essa
forma: no `0001-plugin-foundation`, 17 de 17 tarefas concluídas aparecem como pendentes —
o kanban mostra 0% quando o correto é 100%.

A gravidade não está no pixel: uma ferramenta cujo propósito é dizer em que pé está o
trabalho, dizendo errado, corrói a confiança em todos os outros números que ela mostra.
Não há contorno pela interface; o usuário precisaria reescrever os próprios arquivos.

Severidade **média** e não alta porque é somente-leitura: nada é gravado errado, nenhum
dado se perde, e o `tasks.md` continua correto — apenas a leitura dele é que erra.

---

## Causa raiz

Confirmada. O parser assume **uma** forma de escrita (`**Status:** <palavra>`) para uma
linha que, na prática, tem forma livre depois dos dois-pontos. O `\s*` só tolera espaço; o
negrito, a data e a nota nunca foram previstos.

O defeito é o mesmo que o painel `scripts/progress.mjs` cometeu e corrigiu em 2026-08-05 —
o que sugere que a forma em negrito não é excêntrica, e sim algo que quem escreve
`tasks.md` à mão produz naturalmente.

## Escopo da correção

### Incluído

- `TASK_STATUS` em `boardModel.ts` passa a extrair a palavra de status de qualquer ponto
  do valor, tolerando negrito, data e nota.
- Teste de regressão com as cinco formas literais que o repositório usa hoje.

### Não incluído

- **Redesenho visual do Board** — é a feature 0036, em curso. Misturar impede reverter uma
  sem a outra.
- **Normalizar os `tasks.md` existentes** — trocaria um parser frágil por uma convenção não
  verificada; o próximo arquivo escrito à mão traria o defeito de volta.
- **Unificar os parsers de status** espalhados por `tasksPlan.ts`, `taskAnalysis.ts` e
  `boardModel.ts` — é refatoração de verdade, e vira mudança própria (ver Q1).
- **Corrigir os contadores de `status.yaml`** de 0004, 0005, 0006 e 0012 — problema
  distinto, decisão do dono do projeto.

---

## Cenários de regressão

### SCN-BSTAT-001 — Status em negrito com data é lido como concluído

DADO um `tasks.md` com uma tarefa cuja linha é `**Status:** **done** — 2026-07-29`
QUANDO `parseTaskBoard` processa o arquivo
ENTÃO a tarefa aparece na coluna **Concluída**

### SCN-BSTAT-002 — As formas já suportadas continuam funcionando

DADO um `tasks.md` com `**Status:** done`, `**Status:** pending`, `**Status:** in_progress`
e `**Status:** pending (código pronto; falta a verificação no host)`
QUANDO `parseTaskBoard` processa o arquivo
ENTÃO cada tarefa cai na coluna do seu status, como antes da correção

### SCN-BSTAT-003 — Tarefa sem status reconhecível continua em Pendente

DADO um `tasks.md` com uma tarefa cuja linha de status é `**Status:** quase-lá`
QUANDO `parseTaskBoard` processa o arquivo
ENTÃO a tarefa aparece na coluna **Pendente**, preservando a ressalva do SCN-BOARD-002

---

## Critérios de aceite

- [ ] Existe um teste que **falha antes da correção e passa depois** (SCN-BSTAT-001).
- [ ] Os cenários de regressão acima passam.
- [ ] Nenhum teste existente foi alterado para acomodar a correção.
- [ ] `boardModel.ts` continua sem depender da API do VS Code.
- [ ] O drill-down do `0001-plugin-foundation` passa a mostrar 17 de 17 concluídas.

---

## Questões pendentes

| # | Questão | Bloqueia | Prioridade |
| --- | --- | --- | --- |
| Q1 | Pelo menos três módulos leem a linha `**Status:**` com regex próprias e divergentes (`boardModel.ts:345`, `tasksPlan.ts:13`, e o painel `scripts/progress.mjs`). `tasksPlan.ts` captura a linha inteira sem normalizar, então também carrega `**done** — 2026-07-29` como se fosse o status. Unificar num único leitor é refatoração — vale abrir mudança própria agora ou deixar registrado? | Nada nesta correção | média |

## Hipóteses assumidas

> HIPÓTESE: as cinco formas literais medidas no repositório em 2026-08-05 representam o que
> se deve suportar. Não há especificação de qual é a forma canônica da linha `**Status:**` —
> o template `_shared/tasks.md` emite `**Status:** pending`, mas nada impede o que foi
> escrito à mão depois. A correção é deliberadamente tolerante em vez de estrita, porque um
> parser estrito exigiria uma convenção que ninguém escreveu e que não é verificada.
