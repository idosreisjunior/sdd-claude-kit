# Bug: {{CHANGE_TITLE}}

- **ID:** {{CHANGE_ID}}
- **Escopo dos identificadores:** {{ID_SCOPE}}
- **Estado:** ver `status.yaml` — a autoridade é ele
- **Severidade:** {{SEVERITY}}

{{guia: uma spec de bug não descreve funcionalidade nova — descreve uma
divergência entre o comportamento esperado e o observado.

A pergunta que organiza o documento é: **qual regra já especificada foi
violada?** Se nenhuma foi, isso não é um bug, é uma feature faltando. Nesse
caso, use o template de feature — a distinção importa, porque bug não passa
pelo mesmo escrutínio de escopo que feature.}}

---

## Comportamento observado

{{OBSERVED_BEHAVIOR}}

{{guia: o que acontece de fato. Fatos e evidências — mensagem de erro, log,
código de status. Sem interpretação ainda.}}

## Comportamento esperado

{{EXPECTED_BEHAVIOR}}

## Regra violada

{{VIOLATED_REQUIREMENT}}

{{guia: o identificador do requisito ou o trecho de spec que o comportamento
atual contradiz.

Se não existir nenhum, escreva "nenhuma regra especificada cobre este caso" —
e trate como feature, não como bug.}}

## Reprodução

1. {{REPRO_STEP}}

{{repetir: passos numerados, do estado inicial ao defeito}}

**Frequência:** {{FREQUENCY}}
**Ambiente:** {{ENVIRONMENT}}
**Primeira ocorrência conhecida:** {{FIRST_SEEN}}

{{guia: um bug que você não sabe reproduzir não está pronto para ser
corrigido. Se a reprodução for intermitente, diga em que condições — e trate
descobrir isso como a primeira tarefa.}}

## Impacto

{{IMPACT}}

{{guia: quem é afetado, com que gravidade, e se há contorno. É o que justifica
a prioridade.}}

---

## Causa raiz

{{ROOT_CAUSE}}

{{guia: preenchido durante a investigação, não no momento do registro.

Enquanto não houver causa raiz confirmada, escreva "não investigada". Corrigir
sintoma sem entender a causa produz o mesmo bug com outra aparência.}}

## Escopo da correção

### Incluído

- {{IN_SCOPE_ITEM}}

### Não incluído

- {{OUT_OF_SCOPE_ITEM}}

{{guia: bug é a porta de entrada favorita para mudanças fora de escopo — o
código já está aberto, e sempre há algo ali perto que dá para melhorar.

Melhorias adjacentes viram uma mudança própria. Se você corrigir três coisas
neste PR, ninguém consegue reverter só a que quebrou.}}

---

## Cenários de regressão

### {{SCENARIO_ID}} — {{SCENARIO_TITLE}}

DADO {{GIVEN}}
QUANDO {{WHEN}}
ENTÃO {{THEN}}

{{repetir: um cenário por caminho afetado}}

{{guia: estes cenários viram os testes de regressão. Um deles precisa
reproduzir exatamente o defeito relatado.}}

---

## Critérios de aceite

- [ ] Existe um teste que **falha antes da correção e passa depois**.
- [ ] Os cenários de regressão acima passam.
- [ ] Nenhum teste existente foi alterado para acomodar a correção.
- [ ] {{ACCEPTANCE_CRITERION}}

{{guia: o primeiro critério é o que separa correção de coincidência. Um teste
escrito depois da correção, que nunca falhou, não prova nada.

O terceiro é o alarme: se você precisou mudar um teste que passava, ou o teste
estava errado — e isso é outro bug — ou a "correção" mudou comportamento
especificado, e isso não é uma correção.}}

---

## Questões pendentes

| # | Questão | Bloqueia | Prioridade |
| --- | --- | --- | --- |
| {{QUESTION_ID}} | {{QUESTION}} | {{QUESTION_BLOCKS}} | {{QUESTION_PRIORITY}} |

{{guia: remova a tabela se não houver questões, dizendo isso explicitamente.}}

## Hipóteses assumidas

> HIPÓTESE: {{ASSUMPTION}}

{{repetir: remova a seção se não houver nenhuma}}
