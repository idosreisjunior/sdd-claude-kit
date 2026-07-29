# Design técnico — 0007-sdd-workflow-completion

Escrito à mão em 2026-07-29. A skill `design`, que faria este trabalho, é uma das entregas desta mudança.

Decisões que este design **consome** e não rediscute: [ADR-007](../../project/decisions/ADR-007-scripts-do-plugin-em-javascript.md) (sem dependências de runtime), [ADR-008](../../project/decisions/ADR-008-autoinvocacao-de-skills.md) (autoinvocação), [ADR-010](../../project/decisions/ADR-010-maquina-de-estados-como-dado.md) (grafo como dado), [ADR-011](../../project/decisions/ADR-011-identidade-e-invalidacao-da-aprovacao.md) (aprovação), [ADR-012](../../project/decisions/ADR-012-execucao-vazia-nao-e-aprovacao.md) (execução vazia), [ADR-013](../../project/decisions/ADR-013-semantica-da-maquina-de-estados.md) (semântica do grafo).

---

## 1. Contexto

A Fase 1 entregou `init → new → spec → tasks`: da solicitação até um plano. Falta a metade que executa — clarificação, design, aprovação, implementação, verificação e arquivamento — mais os dois mecanismos que atravessam todas elas.

O dogfooding da Fase 1 encontrou cinco defeitos em quatro skills. Esta mudança entrega **seis**, e três delas escrevem código ou registram decisão humana. O design precisa levar isso a sério.

## 2. Solução proposta

Seis `SKILL.md` novos, dois artefatos de dados novos, e nenhum script executável — os scripts continuam na Fase 4 por [ADR-007](../../project/decisions/ADR-007-scripts-do-plugin-em-javascript.md).

O que muda de natureza em relação à Fase 1: três skills passam a ter **efeito colateral irreversível** — `implement` escreve código, `approve` registra decisão humana, `archive` move diretórios. As quatro da Fase 1 só produziam rascunhos revisáveis.

## 3. Componentes afetados

| Caminho | Ação |
| --- | --- |
| `skills/{clarify,design,approve,implement,verify,archive}/SKILL.md` | Criar |
| `schemas/workflow.json` | Criar — o grafo, fonte única |
| `schemas/traceability.schema.json` | Criar — o PRD §14 lista e `TASK-PF-004` não entregou |
| `templates/pt-BR/_shared/{design,acceptance,validation}.md` | Criar — os três que a Fase 1 deixou de fora |
| `.specs/project/architecture.md` §3 | Alterar — passa a apontar para `workflow.json` |
| `tests/` | Alterar — carregar `workflow.json` em vez da constante local |

## 4. Contratos

### 4.1 `workflow.json`

```jsonc
{
  "version": 1,
  "states": ["DRAFT", "CLARIFIED", "DESIGNED", "PLANNED", "APPROVED",
             "IN_PROGRESS", "BLOCKED", "VERIFIED", "ARCHIVED", "CANCELLED"],
  "terminal": ["ARCHIVED", "CANCELLED"],
  "transitions": {
    "DRAFT":       ["CLARIFIED", "CANCELLED"],
    "CLARIFIED":   ["DESIGNED", "DRAFT", "CANCELLED"],
    "DESIGNED":    ["PLANNED", "CLARIFIED", "CANCELLED"],
    "PLANNED":     ["APPROVED", "IN_PROGRESS", "DESIGNED", "CANCELLED"],
    "APPROVED":    ["IN_PROGRESS", "PLANNED", "CANCELLED"],
    "IN_PROGRESS": ["BLOCKED", "VERIFIED", "CANCELLED"],
    "BLOCKED":     ["IN_PROGRESS", "PLANNED", "CANCELLED"],
    "VERIFIED":    ["ARCHIVED", "IN_PROGRESS"],
    "ARCHIVED":    [],
    "CANCELLED":   []
  }
}
```

`PLANNED → IN_PROGRESS` está no grafo, sempre. Quem decide se é permitido é `workflow.require_approval` em `config.yaml` — estrutura e política separadas ([ADR-013](../../project/decisions/ADR-013-semantica-da-maquina-de-estados.md)).

O arquivo é dado, não código: legível sem runtime e verificável por schema.

### 4.2 Aprovação

```yaml
approval:
  date: "2026-07-29"
  by: "Ana Souza <ana@exemplo.com>"     # git config, após ato humano
  revision: "a3f2b81c9d04"              # SHA-256 de spec.md, 12 hex
```

`revision` usa `node:crypto`, sem dependência. Toda skill posterior recalcula e compara: divergiu, a aprovação está **vencida**.

### 4.3 Contrato de cada skill

| Skill | Lê | Escreve | Transição | Autoinvocável |
| --- | --- | --- | --- | --- |
| `clarify` | `spec.md`, `glossary.md` | `spec.md` | `DRAFT → CLARIFIED` | Sim |
| `design` | `spec.md`, `architecture.md`, `context.md` | `design.md`, ADRs | `CLARIFIED → DESIGNED` | Sim |
| `approve` | `spec.md`, `tasks.md`, `traceability.yaml` | `status.yaml` | `PLANNED → APPROVED` | **Não** |
| `implement` | tarefa atual, requisitos dela, `design.md` | código, testes, `tasks.md`, `traceability.yaml` | `→ IN_PROGRESS` / `BLOCKED` | **Não** |
| `verify` | `spec.md`, `acceptance.md`, `config.yaml` | `validation.md`, `acceptance.md` | `IN_PROGRESS → VERIFIED` | Sim |
| `archive` | tudo da mudança | move para `archive/`, atualiza índice | `VERIFIED → ARCHIVED` | **Não** |

As três não autoinvocáveis são as que consomem ou executam decisão humana ([ADR-008](../../project/decisions/ADR-008-autoinvocacao-de-skills.md)).

## 5. Fluxo de dados

```
clarify   → spec.md (questões respondidas)        → CLARIFIED
design    → design.md + ADRs                      → DESIGNED
tasks     → tasks.md + traceability.yaml          → PLANNED
approve   → status.yaml.approval {date,by,revision} → APPROVED
implement → código + testes + rastreio, 1 tarefa    → IN_PROGRESS
verify    → validation.md + acceptance.md          → VERIFIED
archive   → move para archive/ + índice            → ARCHIVED
```

### Ordem de escrita

Sem transação, escolhe-se a ordem em que a falha parcial é **detectável** (Q12):

```
1. artefatos da mudança
2. status.yaml
3. index.yaml          ← sempre por último
```

Falhando no meio, o índice fica **atrasado** — nunca apontando para o que não existe. `TEST-PF-013` já detecta a divergência.

## 6. Persistência

Nenhuma além dos arquivos. Sem banco, sem estado fora do repositório do usuário.

## 7. Dependências

Nenhuma de runtime. `node:crypto` para o hash da aprovação é biblioteca padrão.

## 8. Segurança

- `approve` **nunca** grava `by` sem ato humano explícito na conversa. É o Artigo 3 em código, e o [ADR-011](../../project/decisions/ADR-011-identidade-e-invalidacao-da-aprovacao.md) registra que `git config` é auditoria, não autenticação.
- `implement` é a primeira skill a escrever fora de `.specs/`. Escreve apenas nos arquivos declarados na tarefa; sair disso exige justificativa explícita.
- `verify` executa `validation.commands`, que é **entrada não confiável** vinda do `config.yaml` do projeto. Trata como tal.
- Nenhuma requisição de rede. `TEST-PF-022` continua valendo.

## 9. Observabilidade

Cada skill termina reportando ação, arquivos tocados, avisos e próximo passo. `verify` reporta os três estados de cada validação — *não configurada*, *executada sem efeito*, *aprovada* ([ADR-012](../../project/decisions/ADR-012-execucao-vazia-nao-e-aprovacao.md)) — e nunca omite qual ocorreu.

## 10. Estratégia de testes

A Fase 1 ensinou que teste estrutural sobre `SKILL.md` **não pega defeito de comportamento**: o bug `0003` — a skill expandindo o pedido em CRUD completo — passou por 201 testes verdes e só apareceu na execução real.

Três níveis, e o terceiro é o que importa:

| Nível | O quê |
| --- | --- |
| Estrutural | Front matter, campos declarados, seção de governança, referências a artigo |
| Invariante | `workflow.json` carregado pelos testes; artefatos reais de `.specs` satisfazendo o grafo |
| **Comportamental** | **Execução real via `claude -p`**, em projeto limpo, comparando o gerado |

O terceiro nível não existia quando a Fase 1 foi planejada. Existe agora, e é o único que pega expansão de escopo, invenção de requisito e aprovação indevida.

**Cada uma das seis skills precisa de ao menos uma execução real antes de ser dada como pronta.**

## 11. Migração e rollback

Não há versão anterior das seis skills. A migração real é do grafo: `architecture.md` §3 deixa de ser tabela e passa a apontar para `workflow.json`, e os testes param de redeclarar a constante `TRANSICOES`.

Rollback: desinstalar o plugin. As quatro skills da Fase 1 continuam funcionando sem as seis novas — o fluxo simplesmente para em `PLANNED`.

## 12. Riscos

| # | Risco | Mitigação |
| --- | --- | --- |
| 1 | Seis skills é 50% mais que a Fase 1 inteira, e a Fase 1 teve 5 defeitos em 4 skills | Execução real obrigatória por skill; entregar em duas levas, `clarify`+`design` antes de `approve`+`implement` |
| 2 | `implement` escreve código — o primeiro efeito colateral irreversível do framework | `disable-model-invocation`, aprovação válida como pré-condição, escopo restrito aos arquivos da tarefa |
| 3 | Custo de contexto: 4 skills custam ~971 tokens sempre ativos; 10 tendem a ~2,4k | As três não autoinvocáveis **não** entram no contexto — o [ADR-008](../../project/decisions/ADR-008-autoinvocacao-de-skills.md) economiza duas vezes |
| 4 | Seis skills escrevendo `traceability.yaml` divergem, como o grafo divergiu em três cópias | `traceability.schema.json` como contenção, até o script da Fase 4 |
| 5 | Aprovação vencida detectada tarde, depois de trabalho feito | `implement` verifica o hash **antes** de tocar qualquer arquivo |

## 13. Alternativas consideradas

| Alternativa | Por que não |
| --- | --- |
| **Entregar as seis de uma vez** | É a estrutura que produziu 5 defeitos na Fase 1. Duas levas permitem que a segunda aprenda com a primeira |
| **Scripts já nesta fase** | [ADR-007](../../project/decisions/ADR-007-scripts-do-plugin-em-javascript.md) coloca a validação determinística na Fase 4; antecipar mistura duas mudanças |
| **`approve` autoinvocável em modo `advisory`** | Autoinvocação condicional a configuração é exatamente o que o [ADR-013](../../project/decisions/ADR-013-semantica-da-maquina-de-estados.md) recusa para o grafo. Front matter é estático |
| **`archive` reescrevendo links Markdown** | Ver §14 |

---

## 14. Questões fechadas por este design

### Q8 — referência por identificador, não por caminho ✅

`archive` move o diretório, e qualquer link relativo apontando para ele quebra. As opções eram reescrever os links ou aceitar a quebra.

**Nenhuma das duas.** A causa é referenciar mudança por caminho. Convenção: **mudanças são referenciadas por identificador** (`0001-plugin-foundation`), e o identificador resolve pelo `index.yaml`, que `archive` atualiza.

`archive` move o diretório e atualiza o índice. Não reescreve Markdown — varrer o repositório reescrevendo links é invasivo, e erra em bloco de código e em citação. Links relativos que sobreviverem quebram, e o validador da Fase 4 os detecta.

A regra vai para `standards.md`.

### Q14 — remover a duplicação, não testá-la ✅

A pergunta era como manter `architecture.md` §3 sincronizado com `workflow.json`.

**Não manter.** §3 deixa de conter a tabela e passa a apontar para o arquivo, explicando a semântica sem repetir os dados. Um teste verifica que o documento referencia `workflow.json`.

Sincronizar duas cópias é problema que se resolve apagando uma.

## 15. Ainda em aberto

| # | Questão | Por que não é decisão de design |
| --- | --- | --- |
| Q10 | Existem NFRs específicos desta mudança? | Acrescentar requisito é trabalho de spec, não de design. O design **sugere** um candidato — teto de custo de contexto por skill, ver risco 3 — e a decisão de virar requisito é da próxima passagem de `spec` |
