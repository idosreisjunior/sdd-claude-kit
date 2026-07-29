# Bug: `status.yaml` gerado viola o schema no campo `blocked_by`

- **ID:** 0004-blocked-by-invalido
- **Escopo dos identificadores:** BBI
- **Status:** DRAFT
- **Severidade:** média
- **Correção:** aplicada e verificada em 2026-07-29

---

## Comportamento observado

O `status.yaml` produzido por `/sdd-kit:tasks` **não valida** contra `status.schema.json`:

```
✘ blocked_by/0/question: 'O que é um cliente neste projeto?' does not match '^Q[0-9]+$'
✘ blocked_by/0/resolves_with: 'Definição do termo em .specs/project/glossary.md'
                              does not match '^TASK-[A-Z0-9]+-[0-9]{3}$'
```

A skill preencheu `question` com o **texto** da pergunta e `resolves_with` com prosa, quando ambos são identificadores.

## Comportamento esperado

```yaml
blocked_by:
  - question: Q2
    description: O que é um cliente neste projeto? …
    severity: critical
    resolves_with: TASK-CUST-003
```

## Regra violada

`REQ-PF-006` — o estado deve ser armazenado em `status.yaml`. Um arquivo que não valida contra o próprio schema do framework não cumpre o requisito.

## Reprodução

1. Executar o fluxo `init → new → spec → tasks` com questões críticas em aberto.
2. Validar `status.yaml` contra `plugins/sdd-kit/schemas/status.schema.json`.

**Frequência:** determinística quando há bloqueio a registrar.
**Ambiente:** headless, plugin 0.1.0.
**Primeira ocorrência conhecida:** dogfooding de `TASK-PF-016`.

## Impacto

Médio. O arquivo continua legível e o conteúdo é correto — só o formato dos dois campos está errado.

Mas é o artefato que o validador da Fase 4 vai consumir. Um `status.yaml` inválido faz a validação falhar em todo projeto que tiver algum bloqueio registrado.

---

## Causa raiz

Confirmada por inspeção do template. `_shared/status.yaml` traz:

```
# {{guia: cada item tem question, description, severity
#   (critical|high|medium|low) e, opcionalmente, resolves_with }}
```

O guia **enumera os campos e não diz o formato de dois deles**. `severity` tem os valores listados; `question` e `resolves_with` não têm nada. Preencher com prosa é a leitura natural do texto.

Nada faz a skill consultar o schema: o guia é a única fonte de formato que ela vê.

## Escopo da correção

### Incluído

- Especificar o formato no guia do template: `question` é `Q<n>`, `resolves_with` é `TASK-<ESCOPO>-NNN`.
- Aplicar o mesmo exame a `resolved_questions`, que tem guia igualmente vago.
- Teste que valide contra o schema um `status.yaml` com `blocked_by` preenchido — hoje só o caso de lista vazia é coberto.

### Não incluído

- Relaxar o schema para aceitar texto livre. A restrição está certa: identificador é o que permite ligar bloqueio a tarefa.

---

## Cenários de regressão

### SCN-BBI-001 — Bloqueio preenchido valida contra o schema

DADO um `status.yaml` gerado com ao menos um item em `blocked_by`
QUANDO for validado contra `status.schema.json`
ENTÃO não deve haver erro.

### SCN-BBI-002 — O guia do template declara o formato

DADO o template `_shared/status.yaml`
QUANDO o guia de `blocked_by` for lido
ENTÃO deve dizer que `question` é `Q<n>` e `resolves_with` é `TASK-<ESCOPO>-NNN`.

---

## Critérios de aceite

- [x] Existe teste que falha antes da correção e passa depois.
- [x] O guia do template especifica o formato dos dois campos.
- [x] `resolved_questions` recebe o mesmo tratamento.
- [x] Nenhum teste existente alterado.

---

## Correção aplicada

Aplicada em 2026-07-29.

| Arquivo | Mudança |
| --- | --- |
| `templates/pt-BR/_shared/status.yaml` | Guia de `blocked_by` e `resolved_questions` passou a declarar o formato de cada campo, com exemplo preenchido |
| `tests/templates.test.ts` | `SCN-BBI-001` e `SCN-BBI-002` |

O guia antes **enumerava** os campos e omitia o formato de dois deles. Agora
diz, campo a campo, que `question` é `Q<n>`, `resolves_with` e `resolved_by`
são `TASK-<ESCOPO>-NNN`, `adr` é `ADR-NNN`, e traz um exemplo concreto — que é
o que a skill copia na prática.

`resolved_questions` recebeu o mesmo tratamento, como o escopo previa: tinha o
guia igualmente vago e teria falhado do mesmo jeito na primeira questão
resolvida.

**Verificação por mutação:** com o template anterior, os dois testes falham;
com o corrigido, passam. Nenhum teste existente alterado.

> **Não corrigido:** o `status.yaml` já gerado em `dogfood/` era de um
> diretório temporário, descartado. Nenhum artefato versionado tinha o defeito
> — os `blocked_by` deste repositório foram escritos à mão, com identificador.

---

## Questões pendentes

| # | Questão | Bloqueia | Prioridade |
| --- | --- | --- | --- |
| Q1 | As skills deveriam consultar os schemas ao gerar YAML, em vez de depender do guia do template? Resolveria a classe inteira, mas adiciona leitura de arquivo a cada geração. | — | Média |

## Hipóteses assumidas

Nenhuma. A causa raiz foi confirmada por inspeção do template.
