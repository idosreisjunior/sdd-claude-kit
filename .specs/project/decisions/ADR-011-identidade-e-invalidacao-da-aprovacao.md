# ADR-011 — Identidade e invalidação da aprovação

- **Status:** Aceito
- **Data:** 2026-07-29
- **Origem:** questão Q2 de `0007-sdd-workflow-completion`
- **Decidido em:** refinamento da `0007`

## Contexto

`status.schema.json` exige que `approval` tenha `date`, `by` e `revision`, todos não vazios. A skill `approve` precisa preenchê-los, e nenhum dos dois últimos tem origem óbvia.

O problema com `by` não é técnico. O Artigo 3 da constituição exige **aprovação humana** antes da implementação. Se o agente puder preencher `by` com uma sessão sua, o campo registra que alguém aprovou quando ninguém aprovou — e o checkpoint que justifica o framework inteiro vira encenação com rastro documental.

O problema com `revision` é o RF-008: *"alterações importantes após aprovação devem invalidar ou solicitar nova aprovação"*. O campo só serve se permitir **detectar** que a spec mudou depois de aprovada.

## Decisão

### `by` — identidade humana, ato humano

O valor vem de `git config user.name` e `user.email`, no formato `Nome <email>`.

Mas a origem do **valor** não é a origem da **aprovação**. A skill `approve` só grava depois de um ato humano explícito na conversa: apresenta o resumo, pergunta, e espera. O git fornece o rótulo; a pessoa fornece o ato.

**A skill nunca aprova em nome de ninguém.** Sem `git config`, ela pergunta em vez de inventar — o campo não pode ficar vazio, e um valor presumido é pior que uma pergunta.

### `revision` — hash do conteúdo

SHA-256 de `spec.md`, truncado em 12 caracteres hexadecimais: `revision: "a3f2b81c9d04"`.

Aprovar recalcula e grava. Qualquer skill posterior recalcula e compara: divergiu, a spec mudou depois da aprovação, e a aprovação está **vencida**.

Isso torna o RF-008 mecânico em vez de depender de alguém julgar se a alteração foi "importante".

## Alternativas consideradas

| Alternativa | Por que não |
| --- | --- |
| **`by` = identidade do agente** | Viola o Artigo 3. Registraria aprovação humana onde não houve |
| **`by` = usuário do sistema operacional** | Não é a identidade do projeto, e em container costuma ser `root` |
| **`revision` = SHA do commit** | Falha nos dois casos que mais importam: spec ainda não commitada, e spec editada depois de aprovada dentro do mesmo commit — exatamente o que o RF-008 quer pegar |
| **`revision` = número incremental** | Não detecta alteração nenhuma; só registra quantas vezes alguém aprovou |
| **`revision` = texto livre** | O schema aceitaria, mas nada seria verificável. Campo obrigatório que não permite verificação é ruído |

## Consequências

**Positivas**

- Aprovação vencida vira detecção automática, não julgamento.
- `by` sai da mesma configuração que assina os commits — a coerência é natural para quem já usa git.
- Hash com `node:crypto`, sem dependência de runtime ([ADR-007](./ADR-007-scripts-do-plugin-em-javascript.md)).

**Negativas**

- Toda edição em `spec.md` invalida a aprovação, inclusive um typo. **Aceito:** o custo é reaprovar; a alternativa é decidir programaticamente o que é "alteração importante", e errar isso silenciosamente é pior.
- Projeto sem git não tem `user.name`. **Mitigação:** a skill pergunta. É o caso raro pagando o custo, não o comum.

## Limite desta decisão

**`git config` é autodeclarado, não autenticado.** Qualquer pessoa com acesso à máquina define qualquer nome. O campo `by` é trilha de auditoria, não prova de identidade.

Isso é suficiente para o que o Artigo 3 protege — impedir que uma implementação avance sem alguém ter olhado — e insuficiente para qualquer coisa que dependa de não repúdio. Um projeto que precise disso usa commits assinados, e a aprovação passa a ser o commit, não o campo.

Também não impede que a pessoa aprove sem ler. Nenhum campo impede.
