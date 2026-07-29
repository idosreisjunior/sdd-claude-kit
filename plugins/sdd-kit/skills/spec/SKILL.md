---
name: spec
description: Cria ou refina os requisitos de uma mudança. Produz requisitos REQ-* e NFR-* com cenários SCN-* em Gherkin e critérios de aceite, a partir da solicitação original. Preserva identificadores existentes ao refinar e registra lacunas como questão pendente ou hipótese, nunca como decisão. Use quando o usuário pedir /sdd-kit:spec, quiser detalhar requisitos de uma mudança já criada, ou melhorar uma spec incompleta.
when_to_use: Gatilhos — "/sdd-kit:spec", "detalhar os requisitos", "escrever a spec de X", "melhorar a especificação". Exige uma mudança já criada com /sdd-kit:new.
argument-hint: "<id-da-mudança>"
disable-model-invocation: false
allowed-tools: Read Glob Grep
disallowed-tools: Edit NotebookEdit
---

# /sdd-kit:spec — elaborar requisitos

Transforma uma solicitação em requisitos verificáveis. É a etapa em que o framework ganha ou perde valor: uma spec com requisitos inventados é pior que nenhuma spec, porque tudo depois dela — design, tarefas, testes, rastreabilidade — herda a invenção com aparência de decisão.

`disable-model-invocation: false` é deliberado: `spec` produz rascunho revisável e preserva identificadores. Ver [ADR-008](../../../../.specs/project/decisions/ADR-008-autoinvocacao-de-skills.md).

## A regra que governa esta skill

**Não inventar requisitos.** Constituição, Art. 2.

Diante de uma lacuna, existem exatamente três saídas legítimas:

1. **Questão pendente** — registrada na tabela, com prioridade e o que ela bloqueia.
2. **Hipótese explícita** — `> HIPÓTESE: …`, sujeita a confirmação humana.
3. **Interromper e perguntar** — quando a decisão for crítica: segurança, dados pessoais, contrato público, dinheiro, arquitetura.

Preencher a lacuna com o que parece razoável **não** é uma dessas saídas.

### Como a invenção se disfarça

Estes são os padrões a reconhecer em si mesmo enquanto escreve:

| Parece inofensivo | Por que é invenção |
| --- | --- |
| "A sessão expira em 30 minutos" | Ninguém disse 30. É uma regra de negócio inventada com aparência de detalhe técnico |
| "O sistema deve ser seguro e performático" | NFR de enfeite. Não veio da solicitação nem dos padrões do projeto, e não é verificável |
| "Retorna 404 quando não encontrado" | Plausível, mas é decisão de contrato. Se a solicitação não disse, é hipótese |
| "Apenas administradores podem excluir" | Modelo de permissão inventado. Crítico — interrompa e pergunte |
| Completar todas as seções do template | O template é estrutura, não cota. Seção sem informação fica com questão em aberto |

**Teste antes de escrever cada requisito:** a pessoa que fez a solicitação reconheceria isto como algo que ela pediu? Se a resposta for "provavelmente ela concordaria", é hipótese — marque como tal.

Uma spec com um requisito real e cinco perguntas é um bom resultado para uma solicitação de uma linha. Uma spec com seis requisitos, dos quais cinco foram deduzidos, é um problema que só aparece na revisão de código.

### A invenção mais difícil de enxergar: expansão por completude

Os padrões acima inventam **detalhes** de algo que foi pedido. Este inventa **operações que ninguém pediu** — e é muito mais difícil de perceber, porque não parece inventar. Parece não deixar buraco.

Padrões familiares puxam para a completude:

| A solicitação diz | A tentação é acrescentar |
| --- | --- |
| "criar cadastro de clientes" | consultar, listar, atualizar, remover — o CRUD inteiro |
| "fazer login" | logout, recuperar senha, expirar sessão |
| "importar planilha" | exportar, validar, histórico de importações |
| "criar pedido" | cancelar, alterar, acompanhar status |

Nenhuma dessas adições é absurda. Várias vão acabar sendo necessárias. **Isso não as torna pedidas.**

**Regra:** conte as operações no texto da solicitação. Uma operação que não está lá vira **questão pendente**, nunca requisito — mesmo quando o padrão for óbvio, mesmo quando parecer incompleto sem ela.

```
Solicitação: "criar cadastro de clientes"
Operações no texto: 1 — criar

REQ-CUST-001 — Registrar um cliente          ✅ está no texto
Q — O escopo inclui consultar, listar, atualizar e remover clientes?
    O pedido menciona apenas o cadastro.      ← as outras quatro vão aqui
```

Se a resposta for "sim, é CRUD completo", o requisito entra na próxima passagem — com o escopo **decidido**, não presumido. Custa uma pergunta. Presumir custa quatro requisitos, os cenários deles, e as tarefas construídas em cima.

Quando a solicitação **for** explícita — "CRUD de clientes", "gerenciar clientes" — as operações estão pedidas e viram requisitos normalmente. A regra é sobre o texto, não sobre proibir CRUD.

### Todo requisito precisa de origem

Antes de fechar a spec, percorra os requisitos e responda, para cada um: **de qual trecho da solicitação ele veio?**

Requisito sem trecho de origem é inferência. Ou vira questão, ou entra marcado com `> HIPÓTESE:`. Nunca fica como requisito silencioso.

## Modo de governança

Leia `workflow.mode` de `.specs/config.yaml` antes de agir.

| Modo | Comportamento desta skill |
| --- | --- |
| `advisory` | Informa lacunas e inconsistências; **nunca** bloqueia nem exige confirmação |
| `guided` *(padrão)* | Informa e pede confirmação antes de sobrescrever conteúdo escrito por humano |
| `strict` | **Ainda não implementado na Fase 1.** Informe isso ao usuário e opere como `guided` |

Nunca finja um bloqueio que não existe. Dizer que o modo `strict` impediu algo, quando ele não está implementado, é pior que não ter o modo — cria confiança em uma proteção ausente.

## Arquivos que esta skill lê

| Quando | O quê |
| --- | --- |
| Sempre | `${CLAUDE_PROJECT_DIR}/.specs/config.yaml` — idioma e modo |
| Sempre | `<dir-da-mudança>/request.md` — a solicitação original |
| Sempre | `<dir-da-mudança>/spec.md` — o estado atual, para preservar identificadores |
| Sempre | `<dir-da-mudança>/status.yaml` — tipo e estado da mudança |
| Se existir | `.specs/project/glossary.md` — para usar os termos do domínio |
| Se existir | `.specs/project/standards.md` — convenções de identificador, caso o projeto as tenha alterado |

**Não leia o código-fonte.** Esta spec descreve **o quê** e **por quê**; o **como** é do `design.md`. Ler a implementação enviesa os requisitos para o que já existe, que é exatamente o contrário do que a spec serve.

**Não leia as specs de outras mudanças.** Ver constituição, Art. 7.

---

## Procedimento

### 1. Localizar a mudança

O argumento é o identificador (`0002-customer-registration`). Procure em `.specs/{features,bugs,refactors,changes}/`.

Se não encontrar, liste as mudanças existentes a partir de `index.yaml` e pergunte. Não crie a mudança — isso é `/sdd-kit:new`.

### 2. Escolher o modo de operação

| Situação | Modo |
| --- | --- |
| `spec.md` só tem o esqueleto do template | **Elaboração** — preencher a partir de `request.md` |
| `spec.md` já tem requisitos | **Refinamento** — preservar o que existe |

### 3. Inventariar os identificadores existentes

Antes de escrever qualquer coisa, extraia de `spec.md` todos os `REQ-*`, `NFR-*` e `SCN-*` já usados.

**Identificadores nunca são reutilizados nem renumerados** (`standards.md` §2). Numeração nova continua a partir do maior existente: se há `REQ-CUST-001` e `REQ-CUST-002`, o próximo é `REQ-CUST-003` — mesmo que `REQ-CUST-002` tenha sido removido.

O escopo vem do slug da mudança: `0002-customer-registration` → `CUST`.

**Ao refinar, nunca apague um requisito.** Se ele não se aplica mais, marque-o:

```
### REQ-CUST-002 — Importar clientes via CSV  `REMOVIDO`

> Removido em 2026-07-29: movido para escopo próprio em 0007-bulk-import.
```

Tudo que apontava para `REQ-CUST-002` — tarefas, testes, rastreabilidade — continua fazendo sentido. Apagar o identificador quebra esses vínculos em silêncio.

### 4. Escrever os requisitos

Um requisito é uma **afirmação verificável**. O teste: você consegue imaginar um caso concreto que a refute? Se não, ainda não é requisito.

| Não é requisito | É requisito |
| --- | --- |
| "O cadastro deve ser rápido" | "O cadastro responde em menos de 2 s no percentil 95" |
| "Tratar erros adequadamente" | "E-mail já cadastrado é rejeitado com mensagem que não revela se a conta existe" |
| "Melhorar a experiência" | — não é requisito; é motivação, e vai no contexto |

Cada requisito precisa de **ao menos um cenário**, e o caminho de erro é cenário separado — nunca um "senão" dentro do caminho feliz. É no caminho de erro que os defeitos moram, e é o que ninguém escreve espontaneamente.

Gherkin em maiúsculas, conforme `standards.md` §3:

```
#### SCN-CUST-002 — E-mail já cadastrado

DADO que existe um cliente com o e-mail informado
QUANDO o usuário tentar cadastrar outro com o mesmo e-mail
ENTÃO o sistema deve rejeitar o cadastro
E apresentar mensagem que não revela se a conta existe.
```

**Requisitos não funcionais só entram se vierem da solicitação, dos padrões do projeto ou de uma restrição real.** Não preencha a seção por simetria com a de requisitos funcionais.

### 5. Escrever os critérios de aceite

Cada requisito precisa de pelo menos um critério correspondente. Um requisito sem critério é um requisito que ninguém vai verificar.

Critérios são objetivos e checáveis por outra pessoa, não pelo autor.

### 6. Registrar o que não se sabe

Esta é a etapa que mais frequentemente é pulada, e a que mais importa.

Percorra a solicitação e liste tudo que ficou indefinido. Priorize:

| Prioridade | Quando |
| --- | --- |
| **Crítica** | Segurança, dados pessoais, dinheiro, contrato público. A mudança não sai de `DRAFT` sem resposta |
| **Alta** | Regra de negócio central; a implementação erraria sem isso |
| **Média** | Afeta o design, mas há caminho razoável de qualquer forma |
| **Baixa** | Detalhe de acabamento |

Perguntas anteriores não respondidas **permanecem** na tabela. Não as remova por parecerem inconvenientes ou por terem envelhecido.

### 7. Não alterar o estado

`spec` **não** muda o `status.yaml`. A mudança continua em `DRAFT`.

Sair de `DRAFT` para `CLARIFIED` exige que as ambiguidades críticas tenham sido resolvidas — trabalho de `/sdd-kit:clarify`, que chega na Fase 2. Promover o estado aqui seria afirmar que as questões em aberto foram tratadas quando elas acabaram de ser levantadas.

Atualize apenas `updated` em `status.yaml`, com a data entre aspas.

### 8. Reportar

```
✔ Spec atualizada — 0002-customer-registration

  Requisitos      3 funcionais, 1 não funcional   (2 novos)
  Cenários        7                                (5 novos)
  Critérios       6
  Identificadores preservados: REQ-CUST-001, REQ-CUST-002

  Precisam de resposta:
    [crítica] Quem pode excluir um cliente?
    [alta]    E-mail duplicado bloqueia ou apenas alerta?
    [média]   O CPF é obrigatório?

  Hipóteses assumidas:
    - Clientes inativos permanecem no banco, sem exclusão física.

  Status: DRAFT — 1 questão crítica em aberto.

  Próximo passo:
    responda as questões acima e rode /sdd-kit:spec novamente,
    ou /sdd-kit:tasks 0002-customer-registration para planejar assim mesmo.
```

Diga o número de questões em aberto **antes** do resumo do que foi produzido. Uma spec com quatro requisitos e seis perguntas críticas não está pronta, e o relatório não pode dar a impressão contrária.

---

## Erros

```
✖ [spec] Mudança não encontrada
  Solicitado: 0002-customer-registration
  Disponíveis: 0001-user-authentication (DRAFT)
  Correção: verifique o identificador, ou crie a mudança com
            /sdd-kit:new feature "cadastro de clientes".
```
