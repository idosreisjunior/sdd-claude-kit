# ADR-008 — Autoinvocação das skills do SDD

- **Status:** Aceito
- **Data:** 2026-07-29
- **Origem:** questão Q7 de `0001-plugin-foundation`, levantada por `TASK-PF-001`
- **Decidido em:** `TASK-PF-017`

## Contexto

Por padrão, uma skill do Claude Code pode ser invocada de duas formas: pelo usuário digitando `/nome`, ou pelo próprio Claude, que decide invocá-la quando julga relevante com base no campo `description`.

Isso cria um conflito direto com o Artigo 3 da constituição, que exige aprovação humana antes da implementação. Se o Claude puder invocar `/sdd-kit:implement` sozinho, o checkpoint deixa de existir — o modelo decide que está na hora de implementar e implementa.

O front matter oferece dois controles:

| Campo | Usuário invoca | Claude invoca | Efeito no contexto |
| --- | --- | --- | --- |
| *(padrão)* | Sim | Sim | `description` sempre no contexto |
| `disable-model-invocation: true` | Sim | **Não** | `description` **fora** do contexto; o corpo carrega só na invocação |
| `user-invocable: false` | Não | Sim | `description` sempre no contexto |

O detalhe que torna a decisão não trivial é a terceira coluna. `disable-model-invocation: true` não apenas impede a invocação — **remove a descrição da listagem de skills**. O Claude deixa de saber que a skill existe.

Isso colide com o Artigo 8 e com o princípio §7.4 do PRD: o modo `advisory` é definido como "o Claude recomenda o processo". Um Claude que não sabe que `/sdd-kit:approve` existe não consegue recomendá-lo.

## Decisão

Aplicar `disable-model-invocation: true` **apenas às skills que consomem ou executam uma decisão humana**. As demais permanecem no padrão.

O critério é: *a skill produz um rascunho para revisão humana, ou age sobre uma decisão já tomada?*

| Skill | Fase | Autoinvocação | Razão |
| --- | --- | --- | --- |
| `init` | 1 | **Permitida** | Ponto de entrada. Sem ela o framework é invisível para quem ainda não conhece o comando. Não sobrescreve arquivo sem confirmação (SCN-PF-004) e não altera código (SCN-PF-003) |
| `new` | 1 | **Permitida** | Produz rascunho em `DRAFT`, explicitamente provisório |
| `spec` | 1 | **Permitida** | Preserva identificadores (SCN-PF-011) e marca lacunas em vez de inventá-las (SCN-PF-010) |
| `tasks` | 1 | **Permitida** | `PLANNED` descreve decomposição concluída, não decisão humana |
| `discover` | 2 | **Permitida** | Somente leitura |
| `verify` | 2 | **Permitida** | Somente leitura e relatório |
| `review` | 2 | **Permitida** | Somente leitura e relatório |
| `status` | 2 | **Permitida** | Somente leitura |
| `clarify` | 2 | **Permitida** | Produz perguntas, não respostas |
| `design` | 2 | **Permitida** | Produz rascunho para revisão |
| `approve` | 2 | **Bloqueada** | **É** o registro da decisão humana. Artigo 3 |
| `implement` | 2 | **Bloqueada** | Age sobre a aprovação e escreve código. Artigo 3 |
| `archive` | 2 | **Bloqueada** | Estado terminal; consolida decisões e move diretórios |

`user-invocable` permanece no padrão (`true`) em todas as treze: o PRD §11 documenta todas como comandos de usuário.

## Alternativas consideradas

| Alternativa | Por que não |
| --- | --- |
| **Bloquear todas** | Seguro, mas remove todas as descrições do contexto. O Claude fica cego para o framework e o modo `advisory` deixa de existir na prática — contraria o Artigo 8 e o PRD §7.4. Trocaria um risco real por um produto inútil no seu modo mais permissivo |
| **Bloquear nenhuma** | Deixa o Artigo 3 sem qualquer defesa na camada de skills. Um `/sdd-kit:implement` autoinvocado é exatamente o cenário que a constituição existe para impedir |
| **Vincular ao `workflow.mode`** | O front matter é estático, lido no carregamento do plugin; `workflow.mode` é dado do projeto, lido em tempo de execução. Não há como um campo do manifesto depender do outro. Tecnicamente impossível |
| **`user-invocable: false` nas skills de risco** | Faz o oposto do necessário: esconde a skill do usuário e a deixa para o Claude |

## Consequências

**Positivas**

- O checkpoint de aprovação passa a ter uma defesa na camada de skills, não apenas na documentação.
- O modo `advisory` continua funcionando: dez das treze skills permanecem visíveis, o suficiente para o Claude reconhecer e recomendar o processo.
- Nenhuma skill da feature `0001` é bloqueada — a decisão não atrasa a Fase 1.

**Negativas**

- As descrições de `approve`, `implement` e `archive` ficam fora do contexto do Claude, que portanto não as recomendará espontaneamente. **Mitigação:** as skills visíveis que antecedem cada uma delas devem terminar indicando o próximo comando por extenso — `tasks` aponta para `/sdd-kit:approve`, `approve` aponta para `/sdd-kit:implement`. Isso vira critério de conclusão das tarefas correspondentes em `0002`.
- Cria uma assimetria que precisa ser mantida: toda skill nova exige uma decisão explícita sobre autoinvocação. **Mitigação:** o template de skill deve incluir o campo com um comentário apontando para este ADR.

## Limite desta decisão

**`disable-model-invocation` não é uma fronteira de segurança.** Ela impede que o Claude invoque a *skill*; não impede que o Claude edite arquivos diretamente com `Write` ou `Edit`, sem passar por skill nenhuma.

A aplicação real do Artigo 3 depende do hook `PreToolUse` do modo `strict` (PRD §21.2, Fase 4), que intercepta a edição em si. Este ADR reduz a probabilidade de contorno acidental; não elimina a possibilidade.

Registrar isso explicitamente evita a falsa confiança de tratar o campo como garantia. Quem precisar de bloqueio efetivo precisa do modo `strict`.
