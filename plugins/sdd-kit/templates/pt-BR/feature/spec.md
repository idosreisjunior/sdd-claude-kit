# Feature: {{CHANGE_TITLE}}

- **ID:** {{CHANGE_ID}}
- **Escopo dos identificadores:** {{ID_SCOPE}}
- **Status:** DRAFT

{{guia: esta spec descreve **o quê** e **por quê**. O **como** vai em
design.md. Se você estiver escrevendo nomes de classe ou de tabela aqui,
provavelmente está no documento errado.

Regra que atravessa o documento inteiro: onde faltar informação, registre uma
questão pendente ou uma hipótese marcada — nunca preencha a lacuna em silêncio.
Ver constitution.md, Art. 2.}}

---

## Objetivo

{{OBJECTIVE}}

{{guia: uma ou duas frases. O resultado esperado, não a atividade.}}

## Contexto

{{CONTEXT}}

{{guia: o que existe hoje e por que isso não basta. Quem lê a spec daqui a seis
meses precisa entender a motivação sem reconstruir a conversa.}}

## Escopo

### Incluído

- {{IN_SCOPE_ITEM}}

### Não incluído

- {{OUT_OF_SCOPE_ITEM}}

{{guia: liste o que uma pessoa razoável presumiria estar incluído e não está.
"Não incluído" sem motivo declarado é uma decisão não registrada.}}

---

## Requisitos funcionais

### {{REQUIREMENT_ID}} — {{REQUIREMENT_TITLE}}

{{REQUIREMENT_STATEMENT}}

{{guia: uma afirmação verificável sobre o que o sistema deve fazer. Se você não
consegue imaginar um teste que a refute, ela ainda não é um requisito.}}

#### {{SCENARIO_ID}} — {{SCENARIO_TITLE}}

DADO {{GIVEN}}
QUANDO {{WHEN}}
ENTÃO {{THEN}}
E {{AND}}

{{repetir: um cenário por caminho. Caminho de erro é cenário separado, nunca um
"senão" dentro do caminho feliz.

Todo requisito precisa de pelo menos um cenário — inclusive o caminho de falha,
que é onde os defeitos moram.}}

{{repetir: um bloco por requisito funcional}}

---

## Requisitos não funcionais

### {{NFR_ID}} — {{NFR_TITLE}}

{{NFR_STATEMENT}}

{{guia: segurança, desempenho, compatibilidade, observabilidade, portabilidade.

Um NFR precisa ser verificável do mesmo jeito que um requisito funcional.
"O sistema deve ser rápido" não é verificável; "a listagem responde em menos de
300 ms no percentil 95, com 10 mil registros" é.}}

{{repetir: um bloco por requisito não funcional}}

---

## Critérios de aceite

- [ ] {{ACCEPTANCE_CRITERION}}

{{repetir: condições objetivas que precisam ser verdadeiras para a mudança ser
aceita. Devem cobrir todos os requisitos acima — um requisito sem critério
correspondente é um requisito que ninguém vai verificar.}}

---

## Questões pendentes

| # | Questão | Bloqueia | Prioridade |
| --- | --- | --- | --- |
| {{QUESTION_ID}} | {{QUESTION}} | {{QUESTION_BLOCKS}} | {{QUESTION_PRIORITY}} |

{{guia: prioridade em crítica / alta / média / baixa. "Bloqueia" nomeia a tarefa
ou etapa travada, ou fica vazio se não travar nada.

Uma questão crítica em aberto impede a mudança de sair de DRAFT. Perguntas não
respondidas permanecem registradas — não as apague por parecerem inconvenientes.

Se não houver nenhuma questão, diga isso explicitamente: uma seção vazia parece
esquecimento, e "nada em aberto" é uma afirmação forte que vale registrar.}}

## Hipóteses assumidas

> HIPÓTESE: {{ASSUMPTION}}

{{repetir: toda suposição feita na ausência de informação, sujeita a confirmação
humana. Remova a seção se não houver nenhuma.}}
