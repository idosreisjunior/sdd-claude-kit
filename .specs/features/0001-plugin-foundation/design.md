# Design técnico — 0001-plugin-foundation

> **Estado:** `DESIGNED`. Q1–Q3 resolvidas por `TASK-PF-001` e Q7 por `TASK-PF-017` ([ADR-008](../../project/decisions/ADR-008-autoinvocacao-de-skills.md)), ambas em 2026-07-29. Os contratos da plataforma estão na §14.
>
> Resta Q6 (TypeScript compilado vs. JS puro), que não toca o design desta feature: a §2 registra que a Fase 1 não entrega scripts executáveis. Q6 bloqueia apenas `TASK-PF-011`.

---

## 1. Contexto

Nenhum código existe. Esta feature cria o plugin do zero, dentro dos limites já fixados em `.specs/project/architecture.md`.

## 2. Solução proposta

Um plugin do Claude Code composto por quatro skills, um conjunto de templates e dois schemas. As skills contêm a lógica de fluxo em linguagem natural; os templates definem a forma dos artefatos; os schemas definem a forma válida dos YAML.

**Nesta feature ainda não há scripts executáveis.** As skills operam com as ferramentas nativas do Claude Code (leitura e escrita de arquivos). Validação determinística por script é Fase 4.

> **Consequência aceita:** sem scripts, a consistência dos artefatos depende de instrução e template, não de verificação. É por isso que `TASK-PF-012` testa os artefatos gerados contra os schemas — o teste substitui provisoriamente o validador.

## 3. Componentes afetados

| Caminho | Ação | Tarefa |
| --- | --- | --- |
| `.claude-plugin/marketplace.json` | Criar | `TASK-PF-003` |
| `plugins/sdd-kit/.claude-plugin/plugin.json` | Criar | `TASK-PF-002` |
| `plugins/sdd-kit/skills/{init,new,spec,tasks}/SKILL.md` | Criar | `TASK-PF-007` a `TASK-PF-010` |
| `plugins/sdd-kit/templates/` | Criar | `TASK-PF-005`, `TASK-PF-006` |
| `plugins/sdd-kit/schemas/{config,status}.schema.json` | Criar | `TASK-PF-004` |
| `package.json`, `tsconfig.json`, config de lint e testes | Criar/alterar | `TASK-PF-011` |
| `tests/` | Criar | `TASK-PF-012` |
| `.github/workflows/ci.yml` | Criar | `TASK-PF-013` |
| `examples/node-api/` | Criar | `TASK-PF-014` |
| `docs/pt-BR/` | Criar | `TASK-PF-015` |

## 4. Fluxo de dados

```
/sdd-kit:init
    lê   → estrutura do projeto (respeitando paths.ignored)
    cria → .specs/config.yaml, .specs/index.yaml, .specs/project/*.md

/sdd-kit:new <tipo> "<texto>"
    lê   → .specs/config.yaml, .specs/index.yaml
    cria → .specs/<tipo>s/<NNNN-slug>/{request.md, spec.md, status.yaml}
    altera → .specs/index.yaml (nova entrada, next_id++)

/sdd-kit:spec <id>
    lê   → config.yaml, <id>/request.md, <id>/spec.md, project/glossary.md
    altera → <id>/spec.md

/sdd-kit:tasks <id>
    lê   → config.yaml, <id>/spec.md, project/standards.md
    cria → <id>/tasks.md, <id>/traceability.yaml
    altera → <id>/status.yaml (→ PLANNED), .specs/index.yaml
```

Cada skill declara essa lista de leitura no seu próprio `SKILL.md` — é a implementação concreta de NFR-PF-003.

## 5. Contratos

### `config.yaml`

Forma definida em `PRD.md` §16 e materializada em `config.schema.json`. Campos obrigatórios: `version`, `project.name`, `project.language`, `workflow.mode`.

Comandos em `validation.commands` podem ser `null` quando não detectados — `null` significa **não executado**, nunca **aprovado**.

### `status.yaml`

Forma materializada em `status.schema.json`. Obrigatórios: `version`, `id`, `type`, `status`, `created`, `updated`, `history`.

```yaml
version: 1
id: 0001-plugin-foundation
type: feature                 # feature | bug | refactor | change
title: Fundação do plugin
status: DRAFT                 # um dos dez estados de RF-004
created: "2026-07-29"         # aspas obrigatórias — ver standards.md §9
updated: "2026-07-29"
history:                      # só acrescenta; nunca reescreve
  - status: DRAFT
    date: "2026-07-29"
    reason: Mudança criada    # obrigatório e não vazio
approval: null                # null = NÃO APROVADO. {date, by, revision} quando aprovado
blocked_by: []                # opcional
resolved_questions: []        # opcional — decisões preservadas, não apagadas
tasks: {total: 0, pending: 0, in_progress: 0, done: 0}   # opcional
```

Transições válidas: tabela em `.specs/project/architecture.md` §3. Nesta feature a tabela é aplicada como **aviso**; bloqueio efetivo depende de hooks (Fase 4).

Três consistências **não** são expressáveis em JSON Schema e ficam a cargo do validador determinístico (Fase 4):

1. `status` igual ao `status` da última entrada de `history`.
2. `tasks.total` igual à soma de `pending`, `in_progress` e `done`.
3. A transição entre entradas consecutivas de `history` ser válida no grafo da §3.

### Geração de identificadores

- Diretório: `NNNN-slug`, `NNNN` = `index.yaml.next_id` com quatro dígitos.
- Escopo dos IDs internos: sigla derivada do slug (`plugin-foundation` → `PF`), em maiúsculas, colisões resolvidas com sufixo numérico.
- IDs nunca são reutilizados nem renumerados (`standards.md` §2).

## 6. Banco de dados

Nenhum. O estado vive em arquivos versionados (RNF-004).

## 7. Dependências

Nenhuma dependência de runtime para o uso do plugin. Dependências apenas de desenvolvimento (`TASK-PF-011`): TypeScript, linter e Vitest.

## 8. Segurança

- Nenhuma requisição de rede em nenhum componente (ADR-005) — verificado por teste em `TASK-PF-012`.
- Escrita restrita a `.specs/` e a arquivos que o usuário confirmar.
- `init` **nunca** sobrescreve arquivo existente sem confirmação (SCN-PF-004).
- Nenhum hook é instalado ou ativado por esta feature (`security.hooks_enabled: false`).
- Durante a descoberta, `init` apenas lê; não altera código (SCN-PF-003).

## 9. Observabilidade

Cada skill termina apresentando: ação executada, arquivos criados ou alterados, avisos e próximo passo sugerido. Mensagens de erro seguem o formato de `standards.md` §6.

## 10. Estratégia de testes

| Nível | O que cobre | Tarefa |
| --- | --- | --- |
| Unitário | Slug, geração de ID, tabela de transições, incremento de `next_id` | `TASK-PF-012` |
| Schema | `config.yaml` e `status.yaml` de exemplo validam contra os schemas | `TASK-PF-012` |
| Snapshot | Artefatos gerados a partir dos templates | `TASK-PF-012` |
| Estrutural | Nenhum arquivo do plugin contém I/O de rede | `TASK-PF-012` |
| Compatibilidade | Matriz Ubuntu / Windows / macOS | `TASK-PF-013` |
| Manual (dogfooding) | Fluxo completo sobre este repositório e sobre `examples/node-api` | `TASK-PF-016` |

Comportamento de skill é instrução em linguagem natural e não é testável deterministicamente. Os testes cobrem os **artefatos** e as **regras**, não a redação da skill.

## 11. Migração e rollback

Não aplicável — não há versão anterior. `config.yaml` já carrega `version: 1` para permitir migração futura.

Rollback: desinstalar o plugin. `.specs/` permanece legível e editável manualmente (RNF-004).

## 12. Riscos

| # | Risco | Mitigação |
| --- | --- | --- |
| 1 | Formato de plugin/skill assumido incorretamente | `TASK-PF-001` bloqueia todo o resto até a confirmação na documentação oficial |
| 2 | Skills produzirem artefatos inconsistentes | Templates rígidos + testes de snapshot + schemas |
| 3 | Escopo crescer para as 13 skills | Escopo fechado em 4 skills; o resto é `0002` |
| 4 | Sem validador, artefatos inválidos passam despercebidos | `TASK-PF-012` valida contra schema; validador completo na Fase 4 |
| 5 | Numeração sequencial conflita entre branches | Aceito nesta feature (uso individual); tratado na Fase 2 (Q5) |

## 13. Alternativas consideradas

| Alternativa | Por que não |
| --- | --- |
| Entregar as 13 skills de uma vez | PRD §29 risco 7; uma fatia vertical funcionando vale mais que treze pela metade |
| Implementar scripts de validação já nesta feature | Depende de decidir Q6 (TS compilado vs JS) e do toolchain; adiar mantém a feature entregável |
| Skills escrevendo YAML sem schema | Sem contrato, cada execução diverge; contraria a constituição Art. 11 |
| Começar pelos agentes em vez das skills | Agentes são invocados por skills; sem skills não há ponto de entrada |

## 14. Contratos da plataforma

Confirmados em `TASK-PF-001` (2026-07-29) contra a documentação oficial e o marketplace oficial em cache. Detalhamento e fontes em `spec.md` → "Questões resolvidas".

### 14.1 `plugins/sdd-kit/.claude-plugin/plugin.json`

Manifesto é **opcional**; usamos um porque precisamos de metadados. Único campo obrigatório: `name`.

```jsonc
{
  "$schema": "https://json.schemastore.org/claude-code-plugin-manifest.json",
  "name": "sdd-kit",                    // obrigatório — define o namespace /sdd-kit:*
  "displayName": "SDD Claude Kit",
  "version": "0.1.0",                   // fixa a versão; sem ele o Claude Code usa o SHA do commit
  "description": "...",
  "author": { "name": "...", "url": "..." },
  "repository": "https://github.com/.../sdd-claude-kit",
  "license": "Apache-2.0",
  "keywords": ["spec-driven-development", "sdd"]
}
```

Não declaramos `skills`, `agents` nem `hooks`: os diretórios padrão (`skills/`, `agents/`, `hooks/hooks.json`) são autodescobertos. Declarar caminho customizado em `agents`/`hooks` **substitui** o diretório padrão; em `skills`, **soma** a ele.

### 14.2 `.claude-plugin/marketplace.json` (raiz do repositório)

Obrigatórios: `name`, `owner` (com `owner.name`), `plugins[]`. Cada entrada exige `name` e `source`.

```jsonc
{
  "name": "sdd-claude-kit",
  "owner": { "name": "...", "url": "..." },
  "plugins": [
    { "name": "sdd-kit", "source": "./plugins/sdd-kit", "category": "development" }
  ]
}
```

Caminhos relativos resolvem a partir da raiz do marketplace (o diretório que contém `.claude-plugin/`), e funcionam quando o usuário adiciona o marketplace por fonte git. `../` é proibido.

> Nomes de marketplace que imitam fontes oficiais da Anthropic são bloqueados. `sdd-claude-kit` não conflita com a lista de reservados.

### 14.3 `skills/<nome>/SKILL.md`

Nenhum campo de front matter é estritamente obrigatório; `description` é o que o Claude usa para decidir quando aplicar a skill. Campos que esta feature usa:

| Campo | Uso aqui |
| --- | --- |
| `name` | Último segmento do comando. `skills/init/` + `name: init` → `/sdd-kit:init` |
| `description` | Gatilho de invocação. `description` + `when_to_use` são truncados em 1.536 caracteres na listagem |
| `argument-hint` | Dica de autocomplete apenas — **não valida nem parseia** |
| `disable-model-invocation` | Ver Q7: pendente de ADR |
| `allowed-tools` | Concessão válida apenas no turno da invocação |

### 14.4 Argumentos

Sem parsing nativo de flags. `$ARGUMENTS` (texto completo), `$ARGUMENTS[N]` / `$N` (posicional, **base 0**), `$nome` (declarado em `arguments:`). Aspas no estilo shell agrupam valores com espaço.

**Consequência para `init`:** `--mode guided --language pt-BR` é texto que a skill precisa interpretar a partir de `$ARGUMENTS`. A interface do PRD §11 se mantém; a instrução da skill é que precisa fazer o trabalho.

### 14.5 Acesso a templates e schemas

`${CLAUDE_PLUGIN_ROOT}` e `${CLAUDE_SKILL_DIR}` substituem em qualquer ponto do conteúdo da skill. Como templates e schemas são compartilhados pelas quatro skills, a referência é sempre **`${CLAUDE_PLUGIN_ROOT}/schemas/…`** e **`${CLAUDE_PLUGIN_ROOT}/templates/<project.language>/…`** — nunca `${CLAUDE_SKILL_DIR}`, que aponta para o subdiretório da skill.

Templates são escopados por idioma no caminho ([ADR-009](../../project/decisions/ADR-009-templates-por-idioma.md)):

```
templates/
├── README.md            ← convenções, para contribuidores; não é template
└── pt-BR/               ← en na Fase 6
    ├── config.yaml
    ├── project/         ← seis documentos criados por init
    ├── _shared/         ← request, tasks, status, traceability (comuns)
    ├── feature/spec.md  bug/spec.md  refactor/spec.md  change/spec.md
    └── adr/ADR-template.md
```

Regra única: tudo sob `templates/<idioma>/` é template; arquivos soltos em `templates/` são documentação. As skills leem `project.language` de `.specs/config.yaml` para montar o caminho.

`_shared/` existe porque `request.md`, `tasks.md`, `status.yaml` e `traceability.yaml` são idênticos entre os tipos — só `type` varia, e é um marcador. Uma skill monta o diretório da mudança combinando `_shared/*` com o `spec.md` do tipo.

Os quatro diretórios de tipo correspondem exatamente ao enum `type` de `status.schema.json` e aos diretórios `.specs/{features,bugs,refactors,changes}/`. O prefixo `_` sinaliza que `_shared` não é um tipo — antes chamava-se `change/` e colidia com o tipo de mesmo nome.

`design.md`, `acceptance.md` e `validation.md` não têm template nesta feature: são produzidos pelas skills `design` e `verify`, da Fase 2.

**Marcadores de preenchimento usam `{{…}}`, nunca `${…}`** — este último é consumido pela substituição do próprio Claude Code antes de chegar ao template. Em YAML, os marcadores vão entre aspas: `name: "{{PROJECT_NAME}}"`, senão `{` abre um mapping em fluxo e o arquivo deixa de ser YAML válido.

Duas restrições da plataforma, ambas compatíveis com o design da §5 e da §8:

- Plugins instalados **não** referenciam arquivos fora do próprio diretório. Templates e schemas ficam dentro de `plugins/sdd-kit/`.
- `${CLAUDE_PLUGIN_ROOT}` muda a cada atualização — não guardar estado ali. Artefatos são escritos em `${CLAUDE_PROJECT_DIR}/.specs/`.

### 14.6 Validação oficial disponível

Existe `claude plugin validate ./plugins/sdd-kit --strict`, que trata avisos como erro. **Substitui a verificação manual de JSON planejada** em `TEST-PF-001` e `TEST-PF-002`, e entra no CI (`TASK-PF-013`).

### 14.7 Impacto nas fases seguintes

Levantado agora porque muda o design de `0002` e da Fase 3 — registrado, não decidido:

- **Agentes de plugin** aceitam `name`, `description`, `model`, `effort`, `maxTurns`, `tools`, `disallowedTools`, `skills`, `memory`, `background`, `isolation`. Por segurança, **`hooks`, `mcpServers` e `permissionMode` não são suportados**. As "permissões recomendadas" do PRD §12.1 (Project Discovery Agent sem permissão de editar) devem ser expressas como `disallowedTools: Write, Edit`.
- **`context: fork`** roda uma skill em subagente próprio — mecanismo natural para o carregamento sob demanda do PRD §7.6.
- **Hooks** confirmam `PreToolUse` e `PostToolUse` do PRD §21, e a lista de eventos é bem maior. Comandos de hook devem usar exec form com `args` para caminhos.

### 14.8 Política de autoinvocação

Decidida em `TASK-PF-017`, registrada em [`ADR-008`](../../project/decisions/ADR-008-autoinvocacao-de-skills.md).

`disable-model-invocation: true` apenas em `approve`, `implement` e `archive` (Fase 2) — as skills que consomem ou executam uma decisão humana. As quatro skills desta feature ficam no padrão e devem declarar o campo explicitamente, apontando para o ADR.

O campo não é fronteira de segurança: impede a invocação da skill, não a edição direta de arquivos. O Artigo 3 só é aplicado de fato pelo hook `PreToolUse` do modo `strict` (Fase 4).

### 14.9 Restrições a honrar no conteúdo das skills

| # | Restrição | Consequência de design |
| --- | --- | --- |
| R1 | O conteúdo da skill entra na conversa uma vez e **permanece pela sessão**; o arquivo não é relido | Escrever as instruções como permanentes, não como passo único. NFR-PF-003 é atingido por invocação, não por turno |
| R2 | `description` + `when_to_use` truncam em 1.536 caracteres na listagem | Colocar o caso de uso principal primeiro; o excesso é cortado em silêncio |

### 14.10 Ainda em aberto

| Item | Questão | Afeta esta feature? |
| --- | --- | --- |
| Scripts embarcados em TS compilado ou JS puro | Q6 | Não — a §2 registra que esta feature não tem scripts executáveis |
