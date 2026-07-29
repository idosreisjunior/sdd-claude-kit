---
name: new
description: Cria uma nova mudança especificada a partir de uma solicitação em linguagem natural. Aloca um identificador, cria o diretório com request.md, spec.md inicial e status.yaml em DRAFT, e registra a mudança no índice. Aceita os tipos feature, bug, refactor e change. Use quando o usuário quiser começar a especificar uma funcionalidade, registrar um bug, planejar uma refatoração ou uma mudança arquitetural.
when_to_use: Gatilhos — "/sdd-kit:new", "criar uma spec", "quero implementar X", "registrar um bug", "planejar uma refatoração". Exige projeto já inicializado com /sdd-kit:init.
argument-hint: "[feature|bug|refactor|change] \"descrição da mudança\""
disable-model-invocation: false
allowed-tools: Read Glob Grep
disallowed-tools: Edit NotebookEdit
---

# /sdd-kit:new — criar uma mudança

Transforma uma solicitação em linguagem natural no primeiro artefato versionado do fluxo SDD.

`disable-model-invocation: false` é deliberado: `new` produz um rascunho em `DRAFT`, explicitamente provisório e revisável. Ver [ADR-008](../../../../.specs/project/decisions/ADR-008-autoinvocacao-de-skills.md).

## Regras que valem durante toda a execução

1. **A alocação de identificador é irreversível.** Identificadores nunca são reutilizados nem renumerados (`standards.md` §2). Confirme antes de alocar, não depois.
2. **Nunca sobrescrever um diretório de mudança existente.** Se o caminho já existe, isso é um conflito a reportar, não um estado a corrigir sozinho.
3. **Nunca alterar arquivo de código.** `Edit` está removido do conjunto de ferramentas.
4. **Escrever apenas dentro de `${CLAUDE_PROJECT_DIR}/.specs/`.**
5. **A spec inicial é rascunho, não adivinhação.** Onde faltar informação, registre questão pendente ou hipótese marcada — nunca preencha com um palpite plausível. Ver constitution.md, Art. 2.
6. **Todo texto apresentado ao usuário segue `project.language`.**

## Modo de governança

Leia `workflow.mode` de `.specs/config.yaml` antes de agir.

| Modo | Comportamento desta skill |
| --- | --- |
| `advisory` | Informa o tipo e o slug propostos; **nunca** bloqueia |
| `guided` *(padrão)* | Pede confirmação do tipo, do slug e do identificador antes de criar — a alocação é irreversível |
| `strict` | **Ainda não implementado na Fase 1.** Informe isso ao usuário e opere como `guided` |

Nunca finja um bloqueio que não existe. Dizer que o modo `strict` impediu algo, quando ele não está implementado, é pior que não ter o modo — cria confiança em uma proteção ausente.

## Arquivos que esta skill lê

| Quando | O quê |
| --- | --- |
| Sempre | `${CLAUDE_PROJECT_DIR}/.specs/config.yaml` — idioma, modo, nome do projeto |
| Sempre | `${CLAUDE_PROJECT_DIR}/.specs/index.yaml` — `next_id` e mudanças existentes |
| Sempre | Nomes dos diretórios em `.specs/{features,bugs,refactors,changes,archive}/` — **apenas os nomes**, para reconciliar identificadores |
| Se existir | `${CLAUDE_PROJECT_DIR}/.specs/project/glossary.md` — vocabulário do domínio, para nomear com os termos do projeto |
| Ao gerar | `${CLAUDE_PLUGIN_ROOT}/templates/<idioma>/_shared/` e `.../<tipo>/spec.md` |

**Não leia o conteúdo de outras specs.** Reconciliar identificadores exige os nomes dos diretórios, não o que há dentro deles. Ver constitution.md, Art. 7.

---

## Procedimento

### 1. Verificar que o projeto está inicializado

Se `.specs/config.yaml` não existir, pare. Informe que o projeto ainda não foi inicializado e sugira `/sdd-kit:init`. Não crie `.specs/` por conta própria — `init` faz diagnóstico e pede revisão, e pular essa etapa produziria uma configuração que ninguém conferiu.

### 2. Interpretar os argumentos

`$ARGUMENTS` chega como texto bruto; não há parsing nativo de flags.

| Forma | Interpretação |
| --- | --- |
| `feature "texto"` | Tipo explícito e descrição |
| `"texto"` | Só a descrição — o tipo precisa ser proposto |
| `texto sem aspas` | Trate tudo como descrição |

Se a descrição estiver vazia, pergunte o que a pessoa quer construir. Não invente uma.

### 3. Determinar o tipo

Quando o tipo vier explícito, use-o. Quando não vier, **proponha e peça confirmação** — nunca decida em silêncio.

| Tipo | Indícios no texto | Diretório |
| --- | --- | --- |
| `bug` | "corrigir", "erro", "falha", "não funciona", "quebrado", "regressão" | `.specs/bugs/` |
| `refactor` | "refatorar", "extrair", "reorganizar", "simplificar", "limpar", "renomear" | `.specs/refactors/` |
| `change` | "migrar", "substituir X por Y", "trocar de", "mover para", mudança de contrato ou de estrutura | `.specs/changes/` |
| `feature` | comportamento novo; é também o padrão quando nada indica outro tipo | `.specs/features/` |

Ao propor, diga **por que**:

```
Isto parece um bug: o texto descreve algo que deveria funcionar e não funciona.
Tipo proposto: bug  →  .specs/bugs/

Confirma, ou é outro tipo?
```

A escolha importa porque cada tipo tem um `spec.md` diferente e um escrutínio diferente. Um bug registrado como feature perde o critério "teste que falha antes e passa depois"; uma feature registrada como refatoração escapa da revisão de escopo.

**Dois casos exigem correção, não classificação:**

- Texto que descreve um bug mas **não viola nenhuma regra especificada** é funcionalidade faltando. Diga isso e proponha `feature`.
- Texto que diz "refatorar" mas **muda comportamento observável** não é refatoração. Diga isso e proponha `feature` ou `change`.

### 4. Gerar o slug

O slug é **em inglês**, mesmo quando a solicitação está em português (`standards.md` §3). Nomes de diretório seguem a regra de código, não a de documentação.

Transformação determinística, nesta ordem:

1. Traduzir a descrição para inglês, de forma sucinta — de 2 a 4 palavras que nomeiem a mudança.
2. Passar para minúsculas.
3. Transliterar acentos: `ã`→`a`, `ç`→`c`, `é`→`e`, e assim por diante.
4. Trocar espaços e `_` por `-`.
5. Remover tudo que não seja `[a-z0-9-]`.
6. Colapsar hifens repetidos; remover hifens do início e do fim.
7. Limitar a 40 caracteres, cortando em fronteira de palavra.

O resultado deve casar com `^[a-z0-9]+(-[a-z0-9]+)*$`.

**Mostre o slug e a tradução ao usuário antes de criar o diretório.** O slug é permanente e dele deriva o escopo dos identificadores (`0001-user-authentication` → `AUTH`, usado em `REQ-AUTH-001` e em tudo que vier depois). Uma tradução imprecisa fica no repositório para sempre.

```
Descrição:  "cadastro de clientes"
Slug:       customer-registration
Escopo:     CUST        →  REQ-CUST-001, TASK-CUST-001, …

Confirma?
```

### 5. Alocar o identificador

1. Leia `next_id` de `index.yaml`.
2. **Reconcilie com o disco:** liste os diretórios em `.specs/{features,bugs,refactors,changes,archive}/` e extraia os identificadores numéricos já usados.
3. Se algum identificador `>= next_id` existir no disco, `index.yaml` está defasado — provavelmente porque duas pessoas criaram mudanças em branches paralelos. **Reporte e pare.** Não escolha um número sozinho: renumerar depois é proibido, e uma colisão silenciosa corrompe a rastreabilidade dos dois lados.
4. Formate com quatro dígitos: `next_id` 2 → `0002`.
5. O diretório é `<NNNN>-<slug>`.

Se `<NNNN>-<slug>` já existir, pare e reporte. Nunca sobrescreva.

### 6. Criar a mudança

De `${CLAUDE_PLUGIN_ROOT}/templates/<idioma>/`:

| Destino | Origem |
| --- | --- |
| `<dir>/request.md` | `_shared/request.md` |
| `<dir>/status.yaml` | `_shared/status.yaml` |
| `<dir>/spec.md` | `<tipo>/spec.md` |

Crie também `<dir>/decisions/`.

`tasks.md` e `traceability.yaml` **não** são criados aqui — são produzidos por `/sdd-kit:tasks`, a partir de uma spec que já tenha requisitos. Um `tasks.md` vazio criado agora seria um artefato que aparenta planejamento inexistente.

**Preenchimento:**

- `request.md` recebe o texto original **literal**, sem correção nem melhoria. O valor dele é ser o registro fiel do que foi pedido. A interpretação vai em seção separada.
- `status.yaml` nasce em `DRAFT`, com `created` e `updated` na data de hoje, **entre aspas**, e uma entrada de `history` com motivo preenchido.
- `spec.md` recebe um rascunho: objetivo e contexto a partir da solicitação, e o que faltar vira questão pendente ou hipótese marcada. **Não invente requisitos para preencher o template** — uma spec com cinco requisitos inventados é pior que uma com um requisito real e quatro perguntas.
- Remova as linhas `{{guia: …}}` e resolva `{{opcional: …}}` e `{{repetir: …}}`.
- **Nenhum `{{` pode sobrar.** Verifique antes de concluir.

### 7. Atualizar o índice

Acrescente a entrada em `index.yaml` e incremente `next_id`:

```yaml
changes:
  - id: 0002-customer-registration
    type: feature
    title: Cadastro de clientes
    status: DRAFT
    path: features/0002-customer-registration
    created: "2026-07-29"
    updated: "2026-07-29"
```

Datas entre aspas. `next_id` passa a `3`.

O índice existe para responder "o que existe neste projeto" sem abrir spec nenhuma. Uma entrada faltando torna a mudança invisível para `/sdd-kit:status`.

### 8. Reportar

```
✔ Mudança criada — 0002-customer-registration

  Tipo      feature
  Status    DRAFT
  Local     .specs/features/0002-customer-registration/
  Escopo    CUST

  Criados   request.md, spec.md, status.yaml

  A spec inicial tem {n} questões em aberto e {m} hipóteses a confirmar.

  Próximo passo:
    /sdd-kit:spec 0002-customer-registration     — detalhar requisitos e cenários
```

Se a spec inicial ficou majoritariamente com questões em aberto, diga isso sem rodeios. É o resultado esperado de uma solicitação de uma linha — e saber disso agora é melhor que descobrir no design.

---

## Erros

```
✖ [new] Índice defasado em relação ao disco
  Arquivo: .specs/index.yaml
  next_id: 2, mas .specs/features/ já contém 0002-user-authentication
  Causa: provável criação de mudanças em branches paralelos.
  Correção: reconcilie index.yaml com os diretórios existentes e ajuste next_id
            para 3. Não renumere as mudanças que já existem.
```

Nunca prossiga com um conflito de identificador não resolvido. Identificadores são permanentes: um erro aqui atravessa toda a rastreabilidade da mudança e não pode ser corrigido depois.
