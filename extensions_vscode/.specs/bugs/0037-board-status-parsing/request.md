# Solicitação original

- **ID:** 0037-board-status-parsing
- **Tipo:** bug
- **Criada em:** 2026-08-05
- **Origem:** achado por auditoria independente do painel de progresso
  (`scripts/progress.mjs`), durante a feature 0036

---

## Texto da solicitação

> `/home/idosreisjunior/sdd-kit/extensions_vscode/src/sdd/boardModel.ts:345` usa
>
> ```js
> const TASK_STATUS = /^\*\*Status:\*\*\s*(pending|in_progress|done)\b/i
> ```
>
> que **não aceita a forma em negrito** `**Status:** **done** — 2026-07-29`. As 17 linhas
> nessa forma (todas em `/home/idosreisjunior/sdd-kit/.specs/features/0001-plugin-foundation/tasks.md`)
> seriam contadas como `pending` por esse parser. É exatamente o bug que o comentário de
> `scripts/progress.mjs:83-86` diz ter corrigido no painel — o painel está certo e o parser
> da extensão continua com o buraco.

## Interpretação

O relato é factual e verificável, e não veio de um pedido de usuário: apareceu quando um
agente auditou o painel de progresso que acabara de ser construído. O painel havia acabado
de corrigir exatamente este defeito em si mesmo, o que tornou a comparação inevitável.

A questão que decide se isto é bug ou feature faltando: **existe regra especificada que o
comportamento atual contradiz?** Existe — SCN-BOARD-002 diz que as tarefas aparecem em
colunas por status, e a ressalva de fallback é para tarefa "sem status reconhecido", não
para tarefa cujo status está escrito numa forma que o parser deixou de reconhecer. Uma
tarefa marcada `**done**` tem status; ela só não é lida. Portanto, bug.

## O que esta mudança entrega

O parser de status do kanban de tarefas passa a reconhecer as formas de `**Status:**` que
os `tasks.md` deste repositório realmente usam, e um teste que falha antes e passa depois.

## O que esta mudança deliberadamente não entrega

- **Nenhuma alteração visual no Board.** O redesenho é da feature 0036 e está em curso;
  misturar as duas coisas tornaria impossível reverter uma sem a outra.
- **Nenhuma normalização dos `tasks.md` existentes.** Reescrever os 17 blocos para a forma
  simples também eliminaria o sintoma, mas trocaria um parser frágil por uma convenção não
  verificada — o próximo arquivo escrito à mão traria o defeito de volta. A correção é no
  leitor, não nos dados.
- **Nenhuma correção dos contadores desatualizados de `status.yaml`** em 0004, 0005, 0006 e
  0012, achados pela mesma auditoria. São um problema diferente (o histórico do projeto diz
  que a verificação foi feita; o `tasks.md` diz que não) e a decisão é do dono do projeto.
- **Nenhuma unificação com os outros parsers de status** (`tasksPlan.ts`, `taskAnalysis.ts`,
  `specsIndex.ts`). Há mais de um lugar lendo a mesma linha de formas diferentes, o que é
  um problema real — mas é refatoração, e bug é a porta de entrada favorita para escopo
  extra. Fica registrado como questão.

## Restrições conhecidas

- Nenhum teste existente pode ser alterado para acomodar a correção (critério de aceite do
  template de bug, e regra do design da 0036 §11).
- `boardModel.ts` é núcleo puro, sem a API do VS Code — a correção precisa continuar assim.
