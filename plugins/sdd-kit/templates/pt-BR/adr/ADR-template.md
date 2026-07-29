# ADR-{{ADR_NUMBER}} — {{ADR_TITLE}}

- **Status:** {{ADR_STATUS}}
- **Data:** {{DATE}}
- **Origem:** {{ADR_ORIGIN}}
- **Decidido em:** {{DECIDED_IN}}

{{guia: Status é Proposto, Aceito, Substituído por ADR-NNN ou Revogado. Um ADR
nunca é apagado nem editado depois de aceito: para mudar de ideia, escreva
outro e marque este como substituído. O valor do registro está em preservar o
raciocínio, inclusive o que se mostrou errado.

Numeração global e sequencial, entre ADRs de projeto e de mudança. Não reutilize
números.

"Origem" é o que provocou a decisão — uma questão da spec, um bloqueio, uma
revisão. "Decidido em" é a tarefa que a resolveu.}}

---

## Contexto

{{CONTEXT}}

{{guia: as forças em jogo, escritas antes de você saber a resposta. O que
tornava a decisão difícil? Que restrições existiam?

Quem ler isto daqui a um ano precisa entender por que a decisão não era óbvia.
Um contexto que faz a escolha parecer trivial não explica nada — e sugere que a
alternativa foi descartada sem análise.}}

## Decisão

{{DECISION}}

{{guia: a decisão em voz ativa e afirmativa: "usar X", "restringir Y a Z".
Específica o bastante para dar para verificar se o código a respeita.}}

## Alternativas consideradas

| Alternativa | Por que não |
| --- | --- |
| {{ALTERNATIVE}} | {{REJECTION_REASON}} |

{{repetir: uma linha por alternativa real}}

{{guia: **um ADR sem alternativas não é um registro de decisão, é uma
declaração.** Se você não considerou nenhuma, ou a escolha era forçada — e
então diga isso — ou a análise não aconteceu.

Inclua as alternativas que quase venceram. São elas que alguém vai propor de
novo daqui a seis meses.}}

## Consequências

**Positivas**

- {{POSITIVE_CONSEQUENCE}}

**Negativas**

- {{NEGATIVE_CONSEQUENCE}} **Mitigação:** {{MITIGATION}}

{{guia: toda decisão real tem custo. Um ADR só com consequências positivas não
foi examinado com honestidade — e quem herdar a decisão vai descobrir o custo
sozinho, no pior momento.

Onde houver mitigação, diga qual e a quem cabe.}}

## Limite desta decisão

{{DECISION_BOUNDARY}}

{{guia: o que esta decisão **não** garante. É a seção que evita falsa confiança:
alguém vai presumir que o problema está resolvido em casos que ela não cobre.

Remova a seção se a decisão não tiver limite relevante — mas pense duas vezes
antes de remover.}}
