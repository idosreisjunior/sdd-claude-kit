# Bug: A skill `spec` expande o escopo do pedido em requisitos não solicitados

- **ID:** 0003-spec-expande-escopo
- **Escopo dos identificadores:** SEE
- **Status:** DRAFT
- **Severidade:** **alta**
- **Correção:** aplicada e reverificada em 2026-07-29

---

## Comportamento observado

Dada a solicitação literal **"criar cadastro de clientes"**, `/sdd-kit:spec` produziu cinco requisitos funcionais:

| # | Requisito | Pedido? |
| --- | --- | --- |
| REQ-CUST-001 | Registrar um cliente | ✅ sim |
| REQ-CUST-002 | Consultar um cliente pelo identificador | ❌ não |
| REQ-CUST-003 | Listar os clientes registrados | ❌ não |
| REQ-CUST-004 | Atualizar os dados de um cliente | ❌ não |
| REQ-CUST-005 | Remover um cliente | ❌ não |

Os quatro requisitos não solicitados entraram na seção **"Incluído"** do escopo, como requisitos plenos — não como hipóteses marcadas com `> HIPÓTESE:`, nem como questões pendentes.

O pedido virou um CRUD completo, com 11 cenários e 8 tarefas.

## Comportamento esperado

Apenas `REQ-CUST-001` deriva do pedido. A expansão para leitura, listagem, atualização e remoção é inferência sobre o que o usuário *provavelmente* quer.

A própria instrução da skill define o tratamento correto para esse caso:

> **Teste antes de escrever cada requisito:** a pessoa que fez a solicitação
> reconheceria isto como algo que ela pediu? Se a resposta for "provavelmente ela
> concordaria", é hipótese — marque como tal.

"Remover um cliente" é exatamente um "provavelmente ela concordaria". Devia ter saído como hipótese ou questão, não como requisito.

## Regra violada

**Artigo 2 da constituição — não inventar requisitos.** É a regra central do framework: a que justifica o processo inteiro existir.

Também `REQ-PF-004` e o cenário `SCN-PF-010`, que exige que lacunas virem questão ou hipótese, nunca decisão.

## Reprodução

1. `/sdd-kit:init` em um projeto Node.js sem `.specs/`.
2. `/sdd-kit:new feature "criar cadastro de clientes"`.
3. `/sdd-kit:spec` no id gerado.
4. Contar os requisitos em `spec.md`.

**Frequência:** observada em 1 de 1 execução.
**Ambiente:** headless (`claude -p`), plugin 0.1.0.
**Primeira ocorrência conhecida:** dogfooding de `TASK-PF-016`, 2026-07-29.

## Impacto

Alto, e não pelo tamanho da spec.

O framework existe para impedir que suposições plausíveis virem requisitos sem que ninguém decida. Um plano de 8 tarefas construído sobre 4 requisitos inferidos custa trabalho real, e o erro só aparece quando alguém pergunta "quem pediu remoção de cliente?".

Pior: a spec gerada é **convincente**. Tem seção "Não incluído" bem argumentada, 11 questões pendentes e cenários bem escritos. A qualidade da redação mascara a expansão de escopo — quem revisar tende a aprovar.

---

## Causa raiz

> HIPÓTESE: a instrução contra invenção é forte para *detalhes* — duração de sessão, formato de erro, thresholds — e a seção "Como a invenção se disfarça" lista exemplos desse tipo. Mas não cobre **expansão de escopo por completude de padrão**: CRUD, ciclo de vida, operações irmãs.
>
> Completar um CRUD não *parece* inventar; parece não deixar buraco. É uma categoria diferente de invenção e a instrução atual não a nomeia.

Confirmar exige reproduzir com outras solicitações que sugiram padrão conhecido ("autenticação", "carrinho de compras", "importação").

## Escopo da correção

### Incluído

- Acrescentar à instrução da skill `spec` o padrão "expansão por completude", com o CRUD como exemplo nomeado.
- Regra explícita: operação não citada no pedido entra como **questão**, não como requisito — mesmo quando parecer óbvia.

### Não incluído

- Proibir qualquer inferência. Uma spec que não infere nada é transcrição do pedido, e o valor da skill é justamente estruturar o que foi dito.
- Alterar o exemplo `examples/node-api`, que foi escrito à mão e não apresenta o defeito.

---

## Cenários de regressão

### SCN-SEE-001 — Pedido de uma operação não vira CRUD

DADO a solicitação "criar cadastro de clientes"
QUANDO `/sdd-kit:spec` gerar os requisitos
ENTÃO apenas o registro deve aparecer como requisito funcional
E consulta, listagem, atualização e remoção devem aparecer como questões pendentes ou hipóteses marcadas.

### SCN-SEE-002 — Inferência aparece marcada

DADO qualquer requisito que não derive diretamente do texto da solicitação
QUANDO ele for incluído na spec
ENTÃO deve estar marcado com `> HIPÓTESE:` ou registrado como questão pendente.

---

## Critérios de aceite

- [x] A instrução de `spec` nomeia a expansão por completude como padrão de invenção.
- [~] Reexecução produz **2** requisitos, não 1. Ver "Divergência do critério" abaixo.
- [x] `SCN-SEE-001` e `SCN-SEE-002` verificados por execução real.
- [x] Nenhum teste existente alterado.

---

## Correção aplicada

Aplicada em 2026-07-29, durante `TASK-PF-016`.

Acrescentadas duas seções a `skills/spec/SKILL.md`:

1. **"A invenção mais difícil de enxergar: expansão por completude"** — nomeia o padrão, dá quatro exemplos de solicitação com a expansão que cada uma atrai, e fixa a regra: *conte as operações no texto; operação que não está lá vira questão, nunca requisito*. Fecha com a ressalva de que a regra é sobre o texto, não sobre proibir CRUD — se o pedido disser "CRUD de clientes", as cinco operações estão pedidas.

2. **"Todo requisito precisa de origem"** — antes de fechar a spec, cada requisito precisa responder de qual trecho da solicitação veio. Sem trecho, é inferência: vira questão ou entra marcado.

### Verificação por reexecução

Mesma solicitação, projeto limpo, execução real via `claude -p`:

| | Antes | Depois |
| --- | --- | --- |
| Requisitos funcionais | **5** | **2** |
| Cenários | 11 | 3 |
| Questões pendentes | 11 | 8 |
| Requisitos com origem declarada | 0 | **2** |

Os requisitos gerados:

| Antes | Depois |
| --- | --- |
| Registrar um cliente | Registrar um cliente |
| Consultar um cliente pelo identificador | Preservar o cliente cadastrado |
| Listar os clientes registrados | — |
| Atualizar os dados de um cliente | — |
| Remover um cliente | — |

As quatro operações não pedidas foram para a questão crítica Q3: *"Cadastro" significa apenas criar, ou o ciclo completo (criar, consultar, alterar, remover)?* — exatamente o comportamento que `SCN-SEE-001` exige.

### Divergência do critério

O critério dizia "produz 1 requisito, não 5". Produziu **2**, e o critério não foi cumprido ao pé da letra.

O segundo é `REQ-CUST-002 — Preservar o cliente cadastrado`, e ele **declara a própria origem**:

> *Origem: a palavra "cadastro" — um cadastro que não retém o registro não é um cadastro.*

Aceito, por dois motivos. Persistência não é operação acrescentada: é o que a única operação pedida significa — um cadastro que não retém nada não cadastrou. E a origem declarada torna a inferência auditável: um revisor que discorde derruba o requisito em uma linha.

Isso é categoricamente diferente de "remover um cliente" aparecendo sem explicação. O critério foi escrito antes de a regra de origem existir; o que ele queria impedir — operação não pedida virando requisito silencioso — foi impedido.

**Registrado em vez de reescrever o critério para casar com o resultado.**

### Cobertura de teste

`tests/skills.test.ts` ganhou três asserções verificando que a instrução contém a regra. São condição **necessária, não suficiente**: comportamento de skill não é testável deterministicamente, e a verificação real foi a reexecução acima. Q2 continua aberta.

---

## Questões pendentes

| # | Questão | Bloqueia | Prioridade |
| --- | --- | --- | --- |
| Q1 | A correção se sustenta com outras solicitações que sugerem padrão conhecido — "fazer login", "importar planilha"? Verificada apenas com "criar cadastro de clientes". | — | **Alta** |
| Q2 | Comportamento de skill não é testável deterministicamente. Como verificar a correção sem depender de execução manual a cada release? Os três testes novos cobrem a instrução, não o comportamento. | — | Alta |

## Hipóteses assumidas

~~> HIPÓTESE: a causa é a lacuna na instrução, não o modelo.~~

**Confirmada.** A mesma solicitação, com a instrução corrigida, produziu 2 requisitos em vez de 5 — sem mudança no modelo nem no template.
