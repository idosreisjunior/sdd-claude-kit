# ADR-012 — Execução vazia não é aprovação

- **Status:** Aceito
- **Data:** 2026-07-29
- **Origem:** questão Q5 de `0007-sdd-workflow-completion`
- **Decidido em:** refinamento da `0007`

## Contexto

`verify` decide se uma mudança passou. Hoje ela olharia o código de saída dos comandos em `validation.commands` — e código de saída não distingue "passou" de "não fez nada".

Este projeto caiu exatamente nesse buraco. `TASK-PF-011` configurou `npm test` como `vitest run --passWithNoTests`, que sai com **exit 0 sem executar teste nenhum**. Foi preciso um comentário em `config.yaml`, uma nota no `CONTRIBUTING.md` e um critério de conclusão em `TASK-PF-012` para impedir que aquele zero fosse lido como aprovação.

Não é um caso construído. É a configuração padrão de qualquer suíte que ainda não tem testes — o momento em que a proteção mais importa e menos existe.

O [ADR-005 do bug](../../bugs/0005-dod-insatisfazivel-sem-linter/spec.md) já separou "não configurado" de "reprovado". Falta separar **"executou e não fez nada"**.

## Decisão

`verify` exige **evidência de execução**, não código de saída.

Três estados, distintos no relatório:

| Estado | Significado | Bloqueia? |
| --- | --- | --- |
| Não configurada | `null` em `config.yaml` | Não — registrada como tal (Artigo 10) |
| Executada sem efeito | Comando rodou, zero testes | **Sim, quando `require_tests: true`** |
| Aprovada | Comando rodou, testes executaram e passaram | Não |

Com `require_tests: true`, um requisito sem teste executado é **falha de verificação**. A flag é escolha explícita do projeto: quem a liga está dizendo que testes são condição, e uma suíte vazia não satisfaz condição nenhuma.

Com `require_tests: false`, a ausência é reportada e não bloqueia.

**O relatório nunca omite qual dos três ocorreu.** "Testes: aprovado" sobre zero testes é a mentira que este ADR existe para impedir.

## Alternativas consideradas

| Alternativa | Por que não |
| --- | --- |
| **Confiar no código de saída** | É a armadilha em que este projeto caiu. Exit 0 de suíte vazia é indistinguível de exit 0 de suíte que passou |
| **Sempre falhar com zero testes** | Ignora `require_tests: false`, que existe justamente para projetos que ainda não adotaram testes. Repetiria o erro do bug `0005`: regra que ninguém cumpre é regra ignorada |
| **Avisar sem bloquear** | Com `require_tests: true`, um aviso ignorável esvazia a flag |
| **Exigir cobertura mínima** | Cobertura é outra métrica, com outra decisão. Aqui a pergunta é se *algo* executou |

## Consequências

**Positivas**

- Fecha o buraco mais provável do framework: a validação que passa sem verificar.
- Dá conteúdo operacional ao Artigo 10 — que diz o quê, e agora `verify` sabe como.
- `require_tests` deixa de ser decorativo.

**Negativas**

- `verify` precisa contar testes executados, não só ler o código de saída. Isso é específico do runner: Vitest, Jest, pytest e `go test` reportam de formas diferentes. **Registrado como questão em aberto na `0007`** — a decisão de *o quê* está tomada; o *como* é implementação e precisa de investigação própria.
- Projeto novo com `require_tests: true` não consegue verificar nada até escrever o primeiro teste. **Aceito, e é o ponto:** ligar a flag antes de ter testes é declarar uma exigência que não se cumpre.

## Limite desta decisão

Contar testes executados não diz que eles **verificam** alguma coisa. Um teste que roda e não afirma nada passa em qualquer contagem.

Este ADR fecha "nada executou" mascarado de aprovação. Não fecha "executou e não testou" — isso é revisão humana, e nenhum código de saída resolve.
