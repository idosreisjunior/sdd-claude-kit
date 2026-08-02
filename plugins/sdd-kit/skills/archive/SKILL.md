---
name: archive
description: Arquiva uma mudança verificada. Move o diretório da mudança para .specs/archive/, atualiza o índice para o novo caminho e o status ARCHIVED, e promove de VERIFIED para ARCHIVED. Não sobrescreve um destino existente e não reescreve links Markdown — mudanças são referenciadas por identificador, resolvido pelo índice. Use quando o usuário pedir /sdd-kit:archive uma mudança já verificada, ou quiser encerrar o ciclo de uma mudança concluída.
when_to_use: Gatilhos — "/sdd-kit:archive", "arquivar a mudança", "encerrar X". Exige uma mudança em VERIFIED.
argument-hint: "<id-da-mudança>"
disable-model-invocation: true
allowed-tools: Read Glob Grep
disallowed-tools: Edit NotebookEdit
---

# /sdd-kit:archive — arquivar uma mudança

Move uma mudança verificada para o arquivo e atualiza o índice — o passo terminal do fluxo SDD.

## Por que esta skill NÃO é autoinvocável

`disable-model-invocation: true` porque `archive` **move diretórios**, o que é irreversível na prática. Encerrar uma mudança é uma decisão do usuário, não algo que o modelo deva fazer por conta própria. Ver ADR-008.

## Modo de governança

Leia `workflow.mode` de `.specs/config.yaml` antes de agir.

| Modo | Comportamento desta skill |
| --- | --- |
| `advisory` | Informa o que seria arquivado e para onde; **nunca** bloqueia nem move sem o pedido explícito |
| `guided` *(padrão)* | Pede confirmação antes de mover o diretório |
| `strict` | **Ainda não implementado na Fase 1.** Informe isso ao usuário e opere como `guided` |

Nunca finja um bloqueio que não existe. Dizer que o modo `strict` impediu algo, quando ele não está implementado, é pior que não ter o modo — cria confiança em uma proteção ausente.

## Arquivos que esta skill lê

| Quando | O quê |
| --- | --- |
| Sempre | `.specs/config.yaml` — idioma e modo |
| Sempre | `<dir-da-mudança>/status.yaml` — estado atual (exige `VERIFIED`) |
| Sempre | `.specs/index.yaml` — a entrada a migrar de `changes` para `archive` |

---

## Procedimento

### 1. Verificar a pré-condição

O argumento é o identificador. A promoção a `ARCHIVED` só é válida a partir de `VERIFIED` (grafo em `${CLAUDE_PLUGIN_ROOT}/schemas/workflow.json`). Fora disso, recuse com origem, destino e as transições válidas, sem alterar nada.

### 2. Checar o destino

O destino é `.specs/archive/<id>`. Se ele **já existir**, o arquivamento é **recusado**: reporte o conflito com o caminho, e **nem a origem nem o destino são alterados** (`SCN-SWC-015`). Nunca sobrescreva.

### 3. Mover, sem reescrever links

Mova o diretório da mudança para `.specs/archive/`. **Não reescreva links Markdown** no restante do repositório. A convenção é referenciar mudanças **por identificador**, resolvido pelo `index.yaml` — ver `standards.md` §11 e a decisão em `design.md` §14 da mudança `0007-sdd-workflow-completion` (Q8). Varrer o repositório reescrevendo prosa é invasivo e erra em bloco de código e em citação; um link relativo que sobreviver quebra, e o validador da Fase 4 o detecta.

### 4. Atualizar o índice, na ordem certa

Migre a entrada de `changes` para a chave `archive` de `.specs/index.yaml`, com o novo `path` (`archive/<id>`) e `status: ARCHIVED`. **Acrescente** uma entrada a `history` com `reason` não vazio.

A ordem importa mais aqui que em qualquer outra skill: **mover o diretório, depois `status.yaml`, `index.yaml` por último.** Falhando no meio, o índice fica **atrasado** — nunca apontando para um diretório que não existe. Como `Edit` está fora do conjunto desta skill, atualize `status.yaml` e `index.yaml` **reescrevendo o arquivo inteiro com `Write`**, preservando o conteúdo e acrescentando o necessário.

### 5. Reportar

```
✔ Mudança arquivada — 0002-customer-registration

  De     .specs/features/0002-customer-registration
  Para   .specs/archive/0002-customer-registration

  Status: VERIFIED → ARCHIVED
```

---

## Erros

```
✖ [archive] Destino já existe
  Caminho: .specs/archive/0002-customer-registration
  Correção: um arquivamento anterior já ocupou o destino. Resolva o conflito
            manualmente — nada foi movido.
```
