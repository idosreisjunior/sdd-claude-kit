---
name: approve
description: Registra a aprovação humana de uma mudança planejada e a promove de PLANNED para APPROVED. Grava quem aprovou, a data e a revisão da spec aprovada (o hash de spec.md), de modo que qualquer edição posterior invalide a aprovação. Nunca aprova por conta própria — a decisão é do usuário. Use quando o usuário disser explicitamente que aprova o plano de uma mudança, ou pedir /sdd-kit:approve.
when_to_use: Gatilhos — "/sdd-kit:approve", "aprovo o plano", "pode implementar X". Exige uma mudança em PLANNED e um ato humano explícito de aprovação na conversa.
argument-hint: "<id-da-mudança>"
disable-model-invocation: true
allowed-tools: Read Glob Grep
disallowed-tools: Edit NotebookEdit
---

# /sdd-kit:approve — registrar a aprovação humana

Registra a aprovação de um plano e promove a mudança para `APPROVED` — o estado do qual `/sdd-kit:implement` parte.

## Por que esta skill NÃO é autoinvocável

`disable-model-invocation: true` **não** é um detalhe de configuração — é a garantia do Artigo 3. Esta skill registra uma **decisão humana**. Se o modelo pudesse invocá-la sozinho, poderia gravar `approval.by` sem que ninguém tivesse aprovado, e o Artigo 3 viraria encenação com rastro documental. A skill só age quando o usuário a invoca e aprova explicitamente. Ver ADR-008 e ADR-011. Se alguém editar este front matter no futuro, esta seção diz por que o campo estava aqui.

## Modo de governança

Leia `workflow.mode` de `.specs/config.yaml` antes de agir.

| Modo | Comportamento desta skill |
| --- | --- |
| `advisory` | Informa o estado e o que a aprovação registraria; **nunca** bloqueia — mas também nunca grava sem o ato humano |
| `guided` *(padrão)* | Exige a frase de aprovação explícita do usuário antes de gravar |
| `strict` | **Ainda não implementado na Fase 1.** Informe isso ao usuário e opere como `guided` |

Nunca finja um bloqueio que não existe. Dizer que o modo `strict` impediu algo, quando ele não está implementado, é pior que não ter o modo — cria confiança em uma proteção ausente.

## Arquivos que esta skill lê

| Quando | O quê |
| --- | --- |
| Sempre | `.specs/config.yaml` — idioma e modo |
| Sempre | `<dir-da-mudança>/spec.md` — para calcular a revisão aprovada (o hash) |
| Sempre | `<dir-da-mudança>/status.yaml` — estado atual e o campo `approval` |
| Se existir | `<dir-da-mudança>/tasks.md` e `traceability.yaml` — para o usuário revisar o plano aprovado |

---

## Procedimento

### 1. Verificar a pré-condição de estado

O argumento é o identificador. Leia `status.yaml`. A promoção a `APPROVED` só é válida a partir de `PLANNED` (grafo em `${CLAUDE_PLUGIN_ROOT}/schemas/workflow.json`). Se o estado for outro, **recuse** com origem, destino e as transições válidas a partir da origem, **sem alterar `status` nem `history`** (`SCN-SWC-007`):

```
✖ [approve] Transição inválida
  Origem: DRAFT     Destino pretendido: APPROVED
  Válidas a partir de DRAFT: CLARIFIED, CANCELLED
```

### 2. Exigir o ato humano

A aprovação é um ato, não uma dedução. **Só prossiga se o usuário aprovou explicitamente** nesta conversa ("aprovo", "pode implementar"). Sem essa frase, pare e peça a decisão — nunca grave `approval` por iniciativa própria.

### 3. Montar o registro de aprovação

- `date`: a data de hoje, entre aspas.
- `by`: a identidade de `git config user.name` e `git config user.email`. O git fornece o **rótulo**; a pessoa forneceu o **ato** no passo 2. Se `git config` não estiver configurado, **peça a identidade ao usuário** — não grave vazio nem invente (ADR-011).
- `revision`: o **SHA-256 de `spec.md`, truncado em 12 caracteres hexadecimais** (`SCN-SWC-003`). É o que torna a invalidação mecânica: qualquer edição posterior em `spec.md` muda o hash, e `/sdd-kit:implement` detecta a aprovação vencida.

### 4. Gravar ou registrar a recusa

- **Aprovada:** grave `approval` com os três campos e **acrescente** uma entrada a `history` com `status: APPROVED` e `reason` não vazio, sem reescrever as anteriores. `status.yaml` primeiro, `.specs/index.yaml` por último. Como `Edit` está fora do conjunto desta skill, atualize `status.yaml` e `index.yaml` **reescrevendo o arquivo inteiro com `Write`**, preservando o conteúdo e acrescentando o necessário.
- **Negada:** deixe `approval: null` e o `status` em `PLANNED`. **Sem entrada de histórico** — não houve transição (`SCN-SWC-011`).

### 5. Reportar

```
✔ Aprovação registrada — 0002-customer-registration

  Por        Ana Souza <ana@exemplo.com>
  Revisão    a1b2c3d4e5f6   (SHA-256 de spec.md, 12 caracteres)

  Status: PLANNED → APPROVED

  Próximo passo:
    /sdd-kit:implement 0002-customer-registration
```

Para uma aprovação negada, diga isso claramente: `approval` continua `null`, `status` continua `PLANNED`.

---

## Erros

```
✖ [approve] git config sem identidade
  Correção: configure git config user.name e user.email, ou informe a
            identidade a registrar. A aprovação não é gravada com o campo vazio.
```
