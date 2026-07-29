# Refatoração: {{CHANGE_TITLE}}

- **ID:** {{CHANGE_ID}}
- **Escopo dos identificadores:** {{ID_SCOPE}}
- **Status:** DRAFT

{{guia: refatoração **não muda comportamento observável**. Essa é a definição,
e é o que torna este documento diferente dos outros: o critério de aceite
central não é "o novo comportamento funciona", é "o comportamento não mudou".

Se a mudança altera o que o sistema faz, não é refatoração. Use o template de
feature — a distinção importa porque refatoração pode ser aprovada com muito
menos escrutínio, justamente por não mudar nada para quem usa.}}

---

## Motivação

{{MOTIVATION}}

{{guia: qual dor concreta isto resolve. "Está feio" não é motivação;
"toda mudança em preço exige editar quatro arquivos que precisam concordar
entre si" é.

Refatoração sem dor mensurável é risco sem retorno.}}

## Estado atual

{{CURRENT_STATE}}

{{guia: como o código está organizado hoje e por que ficou assim. Entender a
razão original evita reintroduzir o problema que aquela forma resolvia.}}

## Estado alvo

{{TARGET_STATE}}

## Escopo

### Incluído

- {{IN_SCOPE_ITEM}}

### Não incluído

- {{OUT_OF_SCOPE_ITEM}}

{{guia: refatoração tende a crescer sem limite — cada arquivo aberto revela o
próximo. Delimitar aqui é o que faz a mudança terminar.}}

---

## Garantia de preservação de comportamento

{{BEHAVIOR_PRESERVATION}}

{{guia: **a seção mais importante do documento.** Como você vai provar que nada
mudou?

Formas aceitáveis, da mais forte para a mais fraca:

1. A suíte de testes existente cobre o código afetado e passa sem alteração.
2. Testes de caracterização foram escritos ANTES da refatoração, capturando o
   comportamento atual — inclusive o que parece errado.
3. Comparação de saída entre versões, com entradas reais.

Se a cobertura atual for insuficiente, **escrever os testes é a primeira tarefa
do plano**, antes de qualquer alteração estrutural. Refatorar sem rede não é
refatorar, é reescrever e torcer.}}

### Cobertura atual do código afetado

{{CURRENT_COVERAGE}}

{{guia: um número honesto, ou "desconhecida". Se for desconhecida, medir é
tarefa antes de começar.}}

---

## Interfaces afetadas

| Interface | Muda? | Consumidores |
| --- | --- | --- |
| {{INTERFACE}} | {{CHANGES}} | {{CONSUMERS}} |

{{guia: qualquer "sim" na coluna do meio precisa de justificativa — uma
interface pública que muda deixa de ser refatoração para quem depende dela,
mesmo que o comportamento interno seja idêntico.}}

---

## Cenários de preservação

### {{SCENARIO_ID}} — {{SCENARIO_TITLE}}

DADO {{GIVEN}}
QUANDO {{WHEN}}
ENTÃO {{THEN}}

{{repetir: os comportamentos que precisam continuar valendo, idênticos, depois
da mudança}}

---

## Riscos

| # | Risco | Mitigação |
| --- | --- | --- |
| 1 | {{RISK}} | {{RISK_MITIGATION}} |

{{guia: inclua o risco de reversão. Uma refatoração que não dá para reverter
em um commit é grande demais e precisa ser dividida.}}

---

## Critérios de aceite

- [ ] A suíte de testes existente passa **sem nenhuma alteração**.
- [ ] Nenhuma interface pública mudou, ou as mudanças estão justificadas acima.
- [ ] Os cenários de preservação passam.
- [ ] A dor descrita na motivação foi de fato resolvida.
- [ ] {{ACCEPTANCE_CRITERION}}

{{guia: o primeiro critério é o que define refatoração. Se você precisou editar
um teste para ele passar, o comportamento mudou — e a mudança deixou de ser
uma refatoração, independentemente da intenção.

O último critério evita o resultado mais comum de uma refatoração malsucedida:
código diferente, mesma dor.}}

---

## Questões pendentes

| # | Questão | Bloqueia | Prioridade |
| --- | --- | --- | --- |
| {{QUESTION_ID}} | {{QUESTION}} | {{QUESTION_BLOCKS}} | {{QUESTION_PRIORITY}} |

{{guia: remova a tabela se não houver questões, dizendo isso explicitamente.}}

## Hipóteses assumidas

> HIPÓTESE: {{ASSUMPTION}}

{{repetir: remova a seção se não houver nenhuma}}
