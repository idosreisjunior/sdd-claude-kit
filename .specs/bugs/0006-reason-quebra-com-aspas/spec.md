# Bug: `reason` entre aspas quebra o YAML quando o texto contém aspas

- **ID:** 0006-reason-quebra-com-aspas
- **Escopo dos identificadores:** RQA
- **Estado:** ver `status.yaml` — a autoridade é ele
- **Severidade:** **alta**

---

## Comportamento observado

O template `_shared/status.yaml` declarava:

```yaml
    reason: "{{CREATION_REASON}}"
```

Qualquer aspa dupla no motivo produz YAML inválido:

```
YAMLParseError: Unexpected scalar at node end at line 24, column 68
```

O arquivo deixa de ser carregável. Não é degradação — é perda total do artefato de estado.

## Comportamento esperado

`reason` aceita qualquer texto, inclusive aspas. Escalar de bloco (`>-`) resolve, e é o que os artefatos escritos à mão neste repositório já usavam.

## Regra violada

`REQ-PF-006` — o estado é armazenado em `status.yaml`. Um arquivo que não parseia não armazena nada.

## Reprodução

1. Criar uma mudança cujo motivo cite o pedido do usuário entre aspas.
2. Tentar carregar o `status.yaml` gerado.

**Frequência:** determinística sempre que o motivo contiver `"`.
**Ambiente:** qualquer.
**Primeira ocorrência conhecida:** `TASK-PF-006`, quando o template foi escrito.

## Impacto

Alto, e a probabilidade é o que agrava. O campo existe justamente para registrar **por que** a mudança foi criada — e citar o pedido do usuário entre aspas é a redação natural.

Os quatro `status.yaml` já gerados neste repositório tinham o defeito: nenhum carregava.

---

## Causa raiz

Confirmada. Os `status.yaml` escritos à mão na Fase 0 usam `reason: >-` com o texto indentado. O template de `TASK-PF-006` foi escrito com escalar entre aspas, e ninguém comparou os dois.

Nenhum teste cobria: o template só era exercitado com motivos curtos e sem aspas.

É a **terceira ocorrência da mesma classe** nesta feature — YAML reinterpretando ou rejeitando escalares. As anteriores foram datas sem aspas (`TASK-PF-004`) e marcadores sem aspas (`TASK-PF-005`).

## Escopo da correção

### Incluído

- Trocar `reason: "{{CREATION_REASON}}"` por escalar de bloco `>-` no template.
- Corrigir os `status.yaml` já gerados.
- Teste com aspas no valor.

### Não incluído

- Varrer todo campo de texto livre dos demais templates em busca do mesmo padrão. É a correção certa da classe, mas exige trabalho próprio — registrado como questão.

---

## Cenários de regressão

### SCN-RQA-001 — Motivo com aspas produz YAML válido

DADO um motivo que contenha aspas duplas
QUANDO `status.yaml` for gerado a partir do template
ENTÃO o arquivo deve parsear
E o texto do motivo deve estar preservado.

---

## Critérios de aceite

- [x] Existe teste que falha antes da correção e passa depois.
- [x] O template usa escalar de bloco.
- [x] Os `status.yaml` gerados carregam.
- [x] Nenhum teste existente alterado.

---

## Correção aplicada

Aplicada em 2026-07-29, durante `TASK-PF-016`.

| Arquivo | Mudança |
| --- | --- |
| `templates/pt-BR/_shared/status.yaml` | `reason: "…"` → `reason: >-` |
| `.specs/bugs/000{2,3,4,5}/status.yaml` | Mesma correção nos gerados |
| `tests/templates.test.ts` | `SCN-RQA-001` |

---

## Questões pendentes

| # | Questão | Bloqueia | Prioridade |
| --- | --- | --- | --- |
| Q1 | Que outros campos de texto livre nos templates usam escalar entre aspas? Terceira ocorrência da mesma classe — vale varredura, não correção pontual. | — | **Alta** |

## Hipóteses assumidas

Nenhuma. A causa foi confirmada comparando o template com os artefatos escritos à mão.
