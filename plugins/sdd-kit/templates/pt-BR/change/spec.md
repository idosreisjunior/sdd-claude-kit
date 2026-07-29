# Mudança arquitetural: {{CHANGE_TITLE}}

- **ID:** {{CHANGE_ID}}
- **Escopo dos identificadores:** {{ID_SCOPE}}
- **Status:** DRAFT
- **ADR:** {{ADR_REFERENCE}}

{{guia: uma mudança arquitetural altera **estrutura ou contratos**, não apenas
a organização interna do código. É o que a distingue de uma refatoração: aqui o
comportamento observável ou a forma de integrar podem mudar, e por isso a
mudança exige um ADR.

Regra: **este documento não existe sozinho.** Se não houver um ADR registrando
a decisão, contexto e alternativas, a mudança ainda não está pronta para ser
especificada. Escreva o ADR primeiro — ver constitution.md, Art. 8.}}

---

## Motivação

{{MOTIVATION}}

{{guia: que limite a arquitetura atual atingiu. Mudança arquitetural é cara e
arriscada; a motivação precisa justificar o custo com um problema concreto, não
com preferência de estilo.}}

## Arquitetura atual

{{CURRENT_ARCHITECTURE}}

{{guia: como está hoje e por que foi feito assim. Entender a razão original
evita descartar uma restrição que ainda vale.}}

## Arquitetura alvo

{{TARGET_ARCHITECTURE}}

## Decisão registrada

{{ADR_SUMMARY}}

{{guia: resumo da decisão e link para o ADR. As alternativas consideradas ficam
lá, não aqui — este documento descreve a execução da decisão, não a tomada
dela.}}

---

## Raio de impacto

| Componente | Tipo de impacto | Consumidores afetados |
| --- | --- | --- |
| {{COMPONENT}} | {{IMPACT_TYPE}} | {{AFFECTED_CONSUMERS}} |

{{repetir: um por componente atingido}}

{{guia: "tipo de impacto" é interno, contrato público ou dados. Contrato
público e dados são os que exigem plano de migração — os outros normalmente
não.

Se você não consegue enumerar os consumidores, essa é a primeira tarefa do
plano. Migrar um contrato sem saber quem depende dele é como remover uma parede
sem saber se é estrutural.}}

## Contratos que mudam

| Contrato | Antes | Depois | Compatível? |
| --- | --- | --- | --- |
| {{CONTRACT}} | {{BEFORE}} | {{AFTER}} | {{COMPATIBLE}} |

{{guia: qualquer "não" na última coluna exige plano de migração e janela de
convivência entre as duas versões. Remova a tabela se nenhum contrato mudar.}}

---

## Migração

{{MIGRATION_PLAN}}

{{guia: os passos para sair do estado atual sem interromper quem depende do
sistema. Se a migração precisar de convivência entre as duas arquiteturas,
diga por quanto tempo e como se decide encerrá-la.

Migração sem critério de encerramento vira estado permanente: o sistema fica
com as duas arquiteturas para sempre, que é pior que qualquer uma das duas.}}

## Rollback

{{ROLLBACK_PLAN}}

{{guia: **como desfazer, e até que ponto.** Uma migração de dados destrutiva
costuma ter ponto de não retorno — identifique-o explicitamente e diga o que
protege esse momento.

"Não é possível reverter" é uma resposta aceitável, desde que escrita antes de
começar e não descoberta durante.}}

---

## Cenários

### {{SCENARIO_ID}} — {{SCENARIO_TITLE}}

DADO {{GIVEN}}
QUANDO {{WHEN}}
ENTÃO {{THEN}}

{{repetir: inclua tanto os comportamentos que devem mudar quanto os que devem
permanecer idênticos. Os segundos são os que ninguém lembra de testar.}}

---

## Riscos

| # | Risco | Mitigação |
| --- | --- | --- |
| 1 | {{RISK}} | {{RISK_MITIGATION}} |

---

## Critérios de aceite

- [ ] Existe um ADR registrando decisão, alternativas e consequências.
- [ ] Todos os consumidores afetados foram identificados e notificados.
- [ ] O plano de migração tem critério de encerramento definido.
- [ ] O rollback foi descrito, ou o ponto de não retorno está identificado.
- [ ] Os comportamentos que **não** deviam mudar continuam idênticos.
- [ ] {{ACCEPTANCE_CRITERION}}

---

## Questões pendentes

| # | Questão | Bloqueia | Prioridade |
| --- | --- | --- | --- |
| {{QUESTION_ID}} | {{QUESTION}} | {{QUESTION_BLOCKS}} | {{QUESTION_PRIORITY}} |

{{guia: remova a tabela se não houver questões, dizendo isso explicitamente.}}

## Hipóteses assumidas

> HIPÓTESE: {{ASSUMPTION}}

{{repetir: remova a seção se não houver nenhuma}}
