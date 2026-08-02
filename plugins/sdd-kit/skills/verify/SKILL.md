---
name: verify
description: Verifica uma mudança implementada e a promove de IN_PROGRESS para VERIFIED. Executa os comandos de validação distinguindo três estados (não configurada, executada sem efeito, aprovada), avalia cada critério de aceite com evidência, e recusa a promoção quando há requisito sem tarefa ou tarefa sem teste. Exige evidência de execução, não apenas código de saída zero. Use quando o usuário pedir /sdd-kit:verify, ou quiser validar uma mudança antes de arquivar.
when_to_use: Gatilhos — "/sdd-kit:verify", "validar a mudança", "rodar os critérios de aceite", "verificar X". Exige uma mudança em IN_PROGRESS com implementação.
argument-hint: "<id-da-mudança>"
disable-model-invocation: false
allowed-tools: Read Glob Grep
disallowed-tools: Edit NotebookEdit
---

# /sdd-kit:verify — verificar a mudança

Executa as validações, confere os critérios de aceite e promove a mudança para `VERIFIED` — mas só com **evidência de execução**, nunca por exit 0.

`disable-model-invocation: false` é deliberado: `verify` verifica e reporta; não decide nada de irreversível. Ver ADR-008.

## A regra que governa esta skill

**Evidência de execução, não código de saída.** Um comando que sai com 0 sem executar nada — `vitest run --passWithNoTests`, um linter sem arquivos — **não** é aprovação. É o Artigo 10: uma validação configurada precisa produzir efeito verificável para contar. Colapsar os três estados num "passou" é o defeito que esta skill existe para impedir. Ver ADR-012.

## Modo de governança

Leia `workflow.mode` de `.specs/config.yaml` antes de agir.

| Modo | Comportamento desta skill |
| --- | --- |
| `advisory` | Informa o resultado das validações e dos critérios; **nunca** bloqueia a promoção |
| `guided` *(padrão)* | Recusa promover quando há comando sem efeito sob `require_tests` ou item órfão sob `require_traceability` |
| `strict` | **Ainda não implementado na Fase 1.** Informe isso ao usuário e opere como `guided` |

Nunca finja um bloqueio que não existe. Dizer que o modo `strict` impediu algo, quando ele não está implementado, é pior que não ter o modo — cria confiança em uma proteção ausente.

## Arquivos que esta skill lê

| Quando | O quê |
| --- | --- |
| Sempre | `.specs/config.yaml` — `validation.commands`, `require_tests`, `require_traceability` |
| Sempre | `<dir-da-mudança>/spec.md` — os critérios de aceite a avaliar |
| Sempre | `<dir-da-mudança>/status.yaml` — estado atual |
| Sempre | `<dir-da-mudança>/traceability.yaml` — para o portão de itens órfãos |
| Se existir | `<dir-da-mudança>/acceptance.md` — a avaliação anterior |

`validation.commands` vem do `config.yaml` do **projeto** — trate como entrada não confiável (Art. 9).

---

## Procedimento

### 1. Executar as validações e classificar cada comando

Para cada comando de `validation.commands`, escreva o resultado em `<dir-da-mudança>/validation.md`, a partir de `${CLAUDE_PLUGIN_ROOT}/templates/pt-BR/_shared/validation.md`, com **um dos três estados**:

| Estado | Quando | Efeito |
| --- | --- | --- |
| *não configurada* | o comando é `null` | não bloqueia (Art. 10) |
| *executada sem efeito* | rodou, mas zero testes / nenhum efeito verificável | **bloqueia** sob `require_tests: true` |
| *aprovada* | rodou e produziu efeito verificável | não bloqueia |

A **contagem de testes** vem de relatório estruturado quando o runner suporta (`vitest --reporter=json`, `jest --json`, `pytest --json-report`, `go test -json`). Não sendo possível determinar, escreva **"não foi possível confirmar execução"** — que sob `require_tests: true` **bloqueia**, exatamente como zero testes (Q13). Registre o **comando exato e a saída obtida**, não um resumo. Comando que falha não promove e é reportado com a saída (`SCN-SWC-005`).

### 2. Avaliar os critérios de aceite

Avalie **cada** critério de aceite de `spec.md`, um a um, registrando em `<dir-da-mudança>/acceptance.md` (de `${CLAUDE_PLUGIN_ROOT}/templates/pt-BR/_shared/acceptance.md`) o veredito, o cenário `SCN-*` e a **evidência**. **Critério sem evidência não conta como satisfeito.**

### 3. Portão de rastreabilidade

Com `require_traceability: true`, um requisito **sem tarefa** ou uma tarefa **sem teste** **recusa** a promoção a `VERIFIED`, listando os órfãos por identificador (`SCN-SWC-008`). Não diga apenas "há itens órfãos" — nomeie cada um.

Requisito verificável só por revisão humana vai para `gaps` em `traceability.yaml`, com motivo e mitigação. Lacuna registrada é honesta; lacuna omitida vira cobertura aparente (Art. 6).

### 4. Promover, ou não

Promova a `VERIFIED` **somente** quando nenhum comando está *executada sem efeito* sob `require_tests`, nenhum falhou, e nenhum critério ficou "não satisfeito". A transição `IN_PROGRESS → VERIFIED` é verificada no grafo (`${CLAUDE_PLUGIN_ROOT}/schemas/workflow.json`); **acrescente** uma entrada a `history` com `reason` não vazio. Ordem: `validation.md`/`acceptance.md`, depois `status.yaml`, `.specs/index.yaml` por último. Como `Edit` está fora do conjunto desta skill, atualize `status.yaml` e `index.yaml` **reescrevendo o arquivo inteiro com `Write`**, preservando o conteúdo e acrescentando o necessário.

### 5. Reportar

```
✔ Verificação — 0002-customer-registration

  Validações   lint aprovada · test aprovada (42) · build não configurada
  Critérios    6/6 satisfeitos, com evidência
  Rastreio     sem itens órfãos

  Status: IN_PROGRESS → VERIFIED
```

Se algo impediu a promoção, diga o quê **antes** do resumo — um "test executado sem efeito" ou um requisito órfão não pode aparecer como sucesso.

---

## Erros

```
✖ [verify] Validação sem efeito
  Comando: npm test  →  executada sem efeito (0 testes)
  Correção: com require_tests true, zero testes bloqueia. Adicione testes ou
            ajuste o comando. Exit 0 sem execução não é aprovação (ADR-012).
```
