# Tarefas — 0001-plugin-foundation

> **Estado: `DESIGNED`** — Q1–Q4, Q6 e Q7 resolvidas; Q5 e Q9 registradas para fases seguintes, sem bloquear. O plano deixou de ser provisório quando `TASK-PF-001` e `TASK-PF-017` fecharam os bloqueios.
>
> A mudança ainda **não** foi promovida a `PLANNED`: falta o dogfooding de `TASK-PF-016` avaliar os critérios de aceite um a um.

Numeração reflete a **ordem de criação**, não a ordem de execução. A ordem de execução é dada pelas dependências.

Complexidade: **P** pequena (≤ meio dia) · **M** média (≈ 1 dia) · **G** grande (deve ser dividida antes de começar).

---

## Ordem de execução

```
TASK-PF-001 ✅   TASK-PF-017 ✅   (desbloqueios — concluídos)
     │
     ├──▶ TASK-PF-002 ✅ ──▶ TASK-PF-003 ✅
     │
     └──▶ TASK-PF-004 ✅ ──▶ TASK-PF-005 ✅ ──▶ TASK-PF-006 ✅
                                               │
                                               ▼
                            TASK-PF-007 ✅ ──▶ TASK-PF-008 ✅ ──▶ TASK-PF-009 ✅ ──▶ TASK-PF-010 ✅
                                                                                 │
TASK-PF-011 ✅ ──▶ TASK-PF-012 ✅ ◀────────────────────────────────────────────────────┤
     │               │                                                           │
     └──▶ TASK-PF-013 ⛔ ◀──┘                                                       │
                                                                                 ▼
                                            TASK-PF-014 ✅ ──▶ TASK-PF-015 ✅ ──▶ TASK-PF-016 ⛔
```

`TASK-PF-011` (toolchain) nunca dependeu de `TASK-PF-001` e pode ser executada em paralelo desde já.

`TASK-PF-017` foi acrescentada depois de `TASK-PF-001` revelar a questão Q7, e concluída em seguida. O caminho das skills não tem mais bloqueio: o gargalo passou a ser a cadeia de templates `004 → 005 → 006`.

---

## TASK-PF-001 — Confirmar o formato oficial de plugin, marketplace e skill

**Requisitos:** REQ-PF-001
**Dependências:** nenhuma
**Complexidade:** P
**Status:** **done** — 2026-07-29

### Descrição

Consultar a documentação oficial do Claude Code e confirmar: o esquema de `plugin.json`; o esquema de `marketplace.json`; a estrutura de `SKILL.md` (front matter, campos obrigatórios, convenção de nome e namespace `sdd-kit:`); como uma skill recebe argumentos (Q2); como uma skill referencia arquivos empacotados no plugin, de forma portável (Q3).

Registrar o resultado em `design.md` §14, substituindo a seção "Bloqueado por decisão externa" pelos contratos reais.

**Esta tarefa não escreve nenhum manifesto.** Ela apenas produz a informação que torna os manifestos escrevíveis.

### Arquivos prováveis

- `.specs/features/0001-plugin-foundation/design.md`
- `.specs/features/0001-plugin-foundation/spec.md` (fechar Q1, Q2, Q3)

### Testes esperados

Nenhum — tarefa de investigação.

### Critério de conclusão

- [x] Q1, Q2 e Q3 respondidas em `spec.md`, com link para a fonte oficial consultada.
- [x] `design.md` §14 substituída por contratos concretos.
- [x] Nenhuma resposta marcada como hipótese.

### Resultado

Fontes: [Plugins reference](https://code.claude.com/docs/en/plugins-reference), [Plugin marketplaces](https://code.claude.com/docs/en/plugin-marketplaces), [Skills](https://code.claude.com/docs/en/skills), mais inspeção do marketplace oficial em cache (`~/.claude/plugins/marketplaces/claude-plugins-official/`).

O namespace `/sdd-kit:<skill>` do PRD §11 está correto. Dois achados alteram tarefas seguintes e duas questões novas foram abertas:

- **Q2 corrige `TASK-PF-007`:** não há parsing nativo de flags; `--mode`/`--language` são texto a interpretar de `$ARGUMENTS`.
- **`claude plugin validate --strict` existe** e substitui a verificação manual de JSON em `TEST-PF-001`/`TEST-PF-002`.
- **Q7 (nova, alta):** `disable-model-invocation` nas skills de governança — decisão arquitetural não prevista, exige ADR antes de `TASK-PF-007`.
- **Q8 (nova, média):** conteúdo de skill persiste pela sessão inteira; muda como NFR-PF-003 é atingido.

---

## TASK-PF-002 — Criar o manifesto do plugin

**Requisitos:** REQ-PF-001
**Dependências:** TASK-PF-001
**Complexidade:** P
**Status:** **done** — 2026-07-29

### Descrição

Criar `plugins/sdd-kit/.claude-plugin/plugin.json` com nome, versão, descrição, autor, licença e declaração das skills, seguindo o esquema confirmado em `TASK-PF-001`.

### Arquivos prováveis

- `plugins/sdd-kit/.claude-plugin/plugin.json`

### Testes esperados

- `TEST-PF-001` — `claude plugin validate ./plugins/sdd-kit --strict` passa sem avisos.

### Critério de conclusão

- [x] `name: "sdd-kit"` — é o campo obrigatório e define o namespace `/sdd-kit:*`.
- [x] Versão `0.1.0`, licença `Apache-2.0`.
- [x] Sem declarar `skills`, `agents` ou `hooks`: os diretórios padrão são autodescobertos (design §14.1).
- [x] Nenhum campo inventado — `--strict` falha em campo não reconhecido.

### Resultado

`plugins/sdd-kit/.claude-plugin/plugin.json` criado.

**`TEST-PF-001` foi executado de verdade**, não verificado à mão — o `claude` CLI está disponível nesta máquina (v2.1.220):

```
$ claude plugin validate ./plugins/sdd-kit --strict
✔ Validation passed          (exit 0)
```

É o primeiro teste desta feature que roda com a ferramenta real em vez de um harness descartável.

**A autodescoberta foi confirmada empiricamente.** `claude --plugin-dir ./plugins/sdd-kit plugin details sdd-kit` reporta:

```
SDD Claude Kit (sdd-kit) 0.1.0
Component inventory
  Skills (4)  init, new, spec, tasks
  Agents (0)  Hooks (0)  MCP servers (0)  LSP servers (0)
```

As quatro skills são descobertas **sem** o manifesto declarar `skills`, exatamente como `TASK-PF-001` apurou. Os diretórios vazios `agents/` e `hooks/`, com apenas `.gitkeep`, não geram aviso.

**Primeira medida concreta de NFR-PF-003.** O mesmo comando reporta o custo de contexto:

| | Custo |
| --- | --- |
| Sempre ativo (as 4 descrições) | **~971 tokens** por sessão |
| Por invocação | ~3,9k a ~4,5k tokens |

Isto é "contexto sob demanda" medido, não afirmado: o framework custa ~971 tokens a toda sessão e só paga os ~4k quando uma skill efetivamente dispara. A restrição R2 (descrições truncadas em 1.536 caracteres) tem folga — a mais longa tem 568.

O número também dá um teto para as fases seguintes: as 13 skills do MVP completo, no mesmo custo por descrição, ficariam em torno de 3,2k tokens sempre ativos. Vale acompanhar quando `0002` entregar as demais.

---

## TASK-PF-003 — Criar o manifesto de marketplace

**Requisitos:** REQ-PF-001
**Dependências:** TASK-PF-002
**Complexidade:** P
**Status:** **done** — 2026-07-29

### Descrição

Criar `.claude-plugin/marketplace.json` na raiz, apontando para `plugins/sdd-kit`, de modo que o repositório possa ser adicionado como fonte de plugins.

### Arquivos prováveis

- `.claude-plugin/marketplace.json`

### Testes esperados

- `TEST-PF-002` — o manifesto é JSON válido, tem `name`, `owner.name` e `plugins[]`, e `source` aponta para um diretório existente.

### Critério de conclusão

- [x] Instalação a partir do repositório funciona (SCN-PF-001) — exercitada de ponta a ponta.
- [x] Nome do marketplace não colide com a lista de nomes reservados da Anthropic (design §14.2).
- [x] README atualizado com as instruções reais de instalação.

### Resultado

`.claude-plugin/marketplace.json` criado. **`SCN-PF-001` foi exercitado de verdade**, não apenas validado por estrutura:

```
$ claude plugin validate . --strict            → ✔ Validation passed (exit 0)
$ claude plugin marketplace add ./             → ✔ sdd-claude-kit
$ claude plugin install sdd-kit@sdd-claude-kit → ✔ instalado, scope user
$ claude plugin details sdd-kit
    Source: sdd-kit@sdd-claude-kit
    Skills (4)  init, new, spec, tasks
```

O caminho completo do cenário — adicionar o repositório como marketplace, instalar, ver as skills sob `/sdd-kit:*` — funcionou. Diferente de `TASK-PF-002`, que provou a descoberta via `--plugin-dir`, aqui a resolução passou pelo marketplace.

**Estado da máquina revertido** depois do teste: plugin desinstalado, marketplace removido, `known_marketplaces.json` idêntico ao snapshot anterior e `enabledPlugins` vazio. O CLI deixou duas chaves vazias em `~/.claude/settings.json` (`enabledPlugins: {}` e `extraKnownMarketplaces: {}`) que não existiam antes — inertes, e o arquivo é gerenciado pelo próprio CLI, então não foi editado à mão.

**Detalhe de uso descoberto:** `claude plugin marketplace add .` é rejeitado — o formato exige `./`, `owner/repo` ou URL. Está no README para não custar tempo a quem for testar localmente.

**Decisões no manifesto:**

- `version` **não** é duplicada na entrada do plugin. `plugin.json` já a define e vence em caso de divergência; além disso `claude plugin tag` valida que os dois concordem, então duplicar criaria obrigação de sincronia sem ganho.
- `strict` omitido — o padrão `true` já faz `plugin.json` ser a autoridade sobre os componentes.
- `description` e `tags` presentes na entrada porque são o que o usuário vê ao navegar o marketplace, antes de instalar.

---

## TASK-PF-004 — Criar os schemas de `config.yaml` e `status.yaml`

**Requisitos:** REQ-PF-006, REQ-PF-009
**Dependências:** TASK-PF-001
**Complexidade:** M
**Status:** **done** — 2026-07-29

### Descrição

Escrever `config.schema.json` e `status.schema.json` (JSON Schema) refletindo `PRD.md` §16 e `design.md` §5.

`config.schema.json` deve aceitar `null` em `validation.commands.*` e restringir `workflow.mode` a `advisory | guided | strict`. `status.schema.json` deve restringir `status` aos dez estados de RF-004 e exigir `date` e `reason` em cada entrada de `history`.

### Arquivos prováveis

- `plugins/sdd-kit/schemas/config.schema.json`
- `plugins/sdd-kit/schemas/status.schema.json`

### Testes esperados

- `TEST-PF-003` — o `.specs/config.yaml` deste repositório valida contra `config.schema.json`.
- `TEST-PF-004` — um `status.yaml` com estado inexistente é rejeitado.
- `TEST-PF-005` — uma entrada de `history` sem `reason` é rejeitada.

### Critério de conclusão

- [x] Ambos os schemas declaram `$schema` (draft 2020-12) e `$id` versionado (`/schemas/v1/`).
- [x] Os arquivos existentes em `.specs/` deste repositório validam.
- [x] Casos inválidos são rejeitados com mensagem útil.

### Resultado

Criados `plugins/sdd-kit/schemas/config.schema.json` e `status.schema.json`. 21 casos verificados manualmente com `jsonschema` 4.19.2 — 21 como esperado, cada rejeição apontando o campo correto.

> **Os testes automatizados ainda não existem.** `TEST-PF-003`, `TEST-PF-004` e `TEST-PF-005` foram verificados com um harness descartável, não implementados. A implementação continua sendo `TASK-PF-012`, que depende do toolchain (`TASK-PF-011`).

**Defeito encontrado nos artefatos do repositório.** Os schemas rejeitaram `status.yaml` e `index.yaml`: sem aspas, o YAML converte `2026-07-29` em objeto data nativo, e JSON Schema não tem tipo data. As datas foram citadas e a regra entrou em `standards.md` §9 — é a armadilha que o `ADR-002` já antecipava.

O primeiro harness escondia isso: quatro casos passaram pelo motivo errado, falhando na data em vez do defeito que testavam. Passou a exigir que cada rejeição ocorra no campo esperado. `TASK-PF-012` deve fazer o mesmo.

**Decisões tomadas nos schemas:**

- `additionalProperties: false` nos objetos conhecidos. Um `require_aproval` com erro de digitação seria ignorado em silêncio e desligaria um checkpoint de governança sem aviso. A extensibilidade (RNF-005) vem de versionar o schema, não de aceitar chaves desconhecidas.
- `version: {const: 1}` — torna a fronteira de migração explícita.
- Enum apenas onde o PRD enumera de fato: `workflow.mode` (RF-014), `project.language` (RNF-008), `status` (RF-004), `type` (RF-003). `project.type`, `specification.*` e `security.allow_shell_commands` ficaram como string: o PRD define um único valor para cada, e inventar alternativas violaria a constituição Art. 2.
- `validation.commands.*` aceita `string` ou `null`, mas **rejeita string vazia** — seria um comando que não faz nada e passaria como sucesso.
- `date` declara `format` **e** `pattern`: `format` é apenas anotação na maioria dos validadores e não rejeitaria nada sozinho.

**Ajuste em `design.md` §5.** O contrato de `status.yaml` não previa `title`, `resolved_questions` nem `tasks`, que os artefatos reais já usavam. O design foi reconciliado com a realidade, e as três consistências não expressáveis em JSON Schema ficaram registradas para o validador da Fase 4.

---

## TASK-PF-005 — Criar templates de configuração e de documentos de projeto

**Requisitos:** REQ-PF-008, NFR-PF-004
**Dependências:** TASK-PF-004
**Complexidade:** M
**Status:** **done** — 2026-07-29

### Descrição

Criar os templates usados por `/sdd-kit:init`: `config.yaml` e os seis documentos de `project/` (`vision`, `constitution`, `context`, `architecture`, `glossary`, `standards`).

Os templates devem conter marcadores de preenchimento explícitos e textos de usuário separados da estrutura, para permitir tradução futura (NFR-PF-004).

### Arquivos prováveis

- `plugins/sdd-kit/templates/config.yaml`
- `plugins/sdd-kit/templates/project/*.md`

### Testes esperados

- `TEST-PF-006` — o template de `config.yaml`, preenchido com valores padrão, valida contra `config.schema.json`.

### Critério de conclusão

- [x] Todo template é Markdown ou YAML válido.
- [x] Nenhum marcador de preenchimento sobra em um documento gerado com todos os dados disponíveis.
- [x] Nenhum texto de usuário embutido na estrutura de forma que impeça tradução.

### Resultado

Criados `templates/README.md` e sete templates em `templates/pt-BR/`: `config.yaml` e os seis documentos de `project/`. 11 verificações executadas, 11 como esperado.

> `TEST-PF-006` foi **verificado manualmente**, não implementado. A implementação continua sendo `TASK-PF-012`.

**Duas decisões que a NFR-PF-004 forçou**, ambas registradas em [`ADR-009`](../../project/decisions/ADR-009-templates-por-idioma.md):

1. **Templates escopados por idioma no caminho** (`templates/<idioma>/`), não por catálogo de strings. Documentos são prosa inteira — extrair strings produziria um catálogo com parágrafos como valores, ilegível para tradutores. Decidir isso agora custa um diretório; decidir na Fase 6 custaria migrar o caminho referenciado por todas as skills.
2. **Marcadores em `{{…}}`, nunca `${…}`.** `${…}` é reservado: o Claude Code substitui `${CLAUDE_PLUGIN_ROOT}` e afins em qualquer ponto do conteúdo de uma skill, e consumiria o marcador antes de ele chegar ao template. Família única de marcadores torna a verificação trivial — se sobrou `{{`, algo não foi preenchido.

**Defeito encontrado e corrigido.** `name: {{PROJECT_NAME}}` não é YAML válido: `{` abre um mapping em fluxo e o template inteiro deixava de parsear. Marcadores em YAML passaram a ir entre aspas, e a regra entrou no `README.md` dos templates. É a mesma classe do bug de datas de `TASK-PF-004` — o YAML reinterpretando escalares sem aspas.

**Conteúdo dos templates.** `constitution.md` vem com dez artigos prontos do método SDD, marcados como ajustáveis, mais espaço para regras do projeto. `glossary.md` e `standards.md` separam a parte do método (pronta, e da qual as skills dependem para gerar identificadores) da parte do domínio (marcadores). `vision.md`, `context.md` e `architecture.md` são majoritariamente estrutura com guias.

**Lacuna aberta, atribuída a `TASK-PF-007`:** `config.schema.json` aceita `language: en`, mas `templates/en/` só existe na Fase 6. Um `/sdd-kit:init --language en` não pode gerar pt-BR em silêncio — a skill deve detectar a ausência, informar e pedir decisão.

---

## TASK-PF-006 — Criar templates de mudança e de ADR

**Requisitos:** REQ-PF-006, REQ-PF-008
**Dependências:** TASK-PF-005
**Complexidade:** M
**Status:** **done** — 2026-07-29

### Descrição

Criar os templates de `request.md`, `spec.md`, `tasks.md`, `status.yaml`, `traceability.yaml` e do ADR, além das variantes de `bug` e `refactor`.

O template de `spec.md` deve embutir a estrutura de `PRD.md` §17: objetivo, contexto, escopo, requisitos funcionais com cenários Gherkin, requisitos não funcionais, critérios de aceite e questões pendentes.

Seguir as convenções já fixadas em `templates/README.md`: marcadores `{{…}}` (nunca `${…}`), **entre aspas quando em YAML**, e datas sempre citadas.

### Arquivos prováveis

- `plugins/sdd-kit/templates/pt-BR/feature/*`
- `plugins/sdd-kit/templates/pt-BR/bug/*`
- `plugins/sdd-kit/templates/pt-BR/refactor/*`
- `plugins/sdd-kit/templates/pt-BR/adr/ADR-template.md`

### Testes esperados

- `TEST-PF-007` — o template de `status.yaml` valida contra `status.schema.json`.
- `TEST-PF-008` — snapshot dos artefatos gerados a partir dos templates de feature.

### Critério de conclusão

- [x] Duas gerações da mesma skill produzem as mesmas seções, na mesma ordem (SCN-PF-018).
- [x] Os templates incluem as seções de hipótese e questão pendente exigidas pela constituição Art. 2.

### Resultado

Oito templates criados. 19 verificações executadas, 19 como esperado.

> `TEST-PF-007` foi **verificado manualmente** — inclusive além do exigido, validando o `status.yaml` preenchido para os quatro tipos, não só um. `TEST-PF-008` (snapshot) **não foi implementado**: depende do toolchain e continua sendo `TASK-PF-012`.

**Decisão de layout: `change/` compartilhado.** `request.md`, `tasks.md`, `status.yaml` e `traceability.yaml` são idênticos entre os três tipos — só o campo `type` varia, e é um marcador. Duplicá-los por tipo produziria três cópias divergindo a cada correção. Ficaram em `templates/pt-BR/change/`, e uma skill monta o diretório combinando `change/*` com o `spec.md` do tipo.

**Só o `spec.md` é genuinamente diferente por tipo**, e a diferença não é cosmética:

| Tipo | Pergunta que organiza o documento | Critério de aceite central |
| --- | --- | --- |
| `feature` | Que comportamento novo é exigido? | Todos os requisitos têm critério correspondente |
| `bug` | Que regra **já especificada** foi violada? | Um teste que **falha antes e passa depois**, e nenhum teste existente alterado |
| `refactor` | O comportamento observável **não** pode mudar | A suíte existente passa **sem nenhuma alteração** |

Cada template alerta quando o tipo está errado: um bug que não viola regra especificada é feature faltando; uma refatoração que muda comportamento é feature. A distinção importa porque os três passam por escrutínios de escopo diferentes.

**Fora do escopo desta tarefa, por decisão explícita:** `design.md`, `acceptance.md` e `validation.md` não têm template. São produzidos pelas skills `design` e `verify`, ambas da Fase 2 — os templates acompanham a feature `0002`. As quatro skills da Fase 1 não os geram, então não há lacuna escondida.

Nenhum defeito novo encontrado: as convenções fixadas em `TASK-PF-005` — marcadores `{{…}}` entre aspas em YAML, datas citadas — foram seguidas desde o início, e uma verificação específica confirma que nenhum marcador YAML ficou sem aspas.

---

## TASK-PF-017 — ADR sobre autoinvocação das skills de governança

**Requisitos:** REQ-PF-009
**Dependências:** TASK-PF-001
**Complexidade:** P
**Status:** **done** — 2026-07-29

### Descrição

Decidir e registrar em ADR se as skills do SDD devem usar `disable-model-invocation: true` (questão Q7).

O problema: por padrão, o Claude pode invocar uma skill sozinho quando julgar relevante. Um `/sdd-kit:implement` autoinvocado contornaria o checkpoint de aprovação humana — o Artigo 3 da constituição existe justamente para impedir isso. Por outro lado, desligar a autoinvocação em todas as skills contraria o princípio de orientação do modo `advisory`.

Avaliar por skill, não em bloco: `init`, `new` e `spec` são de baixo risco; `implement`, `approve` e `archive` (Fase 2) têm efeito colateral real.

**Tarefa de decisão — não escreve skill nenhuma.**

### Arquivos prováveis

- `.specs/project/decisions/ADR-008-autoinvocacao-de-skills.md`
- `.specs/features/0001-plugin-foundation/spec.md` (fechar Q7)

### Testes esperados

Nenhum — tarefa de decisão.

### Critério de conclusão

- [x] ADR registrado com contexto, alternativas e consequências.
- [x] Q7 fechada em `spec.md`, com a política definida por skill.
- [x] A decisão é consistente com o Artigo 3 da constituição.

### Resultado

[`ADR-008`](../../project/decisions/ADR-008-autoinvocacao-de-skills.md): `disable-model-invocation: true` apenas em `approve`, `implement` e `archive` — as três skills que consomem ou executam uma decisão humana, todas da Fase 2.

O critério adotado: *a skill produz um rascunho para revisão humana, ou age sobre uma decisão já tomada?*

**Nenhuma skill desta feature é bloqueada.** `TASK-PF-007` a `TASK-PF-010` seguem sem alteração de escopo, exceto por declarar o campo explicitamente no front matter com referência ao ADR.

Dois pontos que o ADR registra e que valem para o resto do projeto:

- **Não é fronteira de segurança.** O campo impede a invocação da skill, não a edição direta com `Write`/`Edit`. O Artigo 3 só é aplicado de fato pelo hook `PreToolUse` do modo `strict` (Fase 4).
- **Custo aceito:** as descrições das três skills bloqueadas ficam fora do contexto do Claude, que não as recomendará espontaneamente. A mitigação — cada skill visível terminar apontando o próximo comando por extenso — vira critério de conclusão das tarefas de `0002`.

---

## TASK-PF-007 — Implementar a skill `init`

**Requisitos:** REQ-PF-002, REQ-PF-007, REQ-PF-009, NFR-PF-002, NFR-PF-003
**Dependências:** TASK-PF-005, TASK-PF-017
**Complexidade:** M
**Status:** **done** — 2026-07-29

### Descrição

Escrever `skills/init/SKILL.md`: detectar se o projeto já está inicializado; analisar o projeto respeitando `paths.ignored`; detectar linguagem, gerenciador de pacotes e comandos de build, teste e lint; criar `.specs/` com `config.yaml`, `index.yaml` e `project/`; apresentar resumo do diagnóstico e pedir revisão.

**Argumentos:** `--mode` e `--language` **não são flags nativas** (design §14.4). A skill recebe texto livre em `$ARGUMENTS` e precisa interpretá-lo, com `argument-hint: [--mode <advisory|guided|strict>] [--language <pt-BR|en>]` servindo apenas de dica de autocomplete. Valores ausentes usam o padrão; valores inválidos devem ser reportados, não corrigidos silenciosamente.

Templates são referenciados por `${CLAUDE_PLUGIN_ROOT}/templates/…`; a escrita acontece em `${CLAUDE_PROJECT_DIR}/.specs/` (design §14.5).

A skill deve declarar explicitamente quais arquivos lê (NFR-PF-003) e marcar como hipótese toda detecção incerta.

### Arquivos prováveis

- `plugins/sdd-kit/skills/init/SKILL.md`

### Testes esperados

- `TEST-PF-009` — `config.yaml` gerado em projeto vazio valida contra o schema, tem `mode: guided` e comandos de validação `null`.
- `TEST-PF-010` — `--mode advisory` é refletido no `config.yaml` gerado.
- `TEST-PF-023` — `--language en`, sem `templates/en/`, interrompe e informa, em vez de gerar pt-BR (SCN-PF-021).

### Critério de conclusão

- [x] Cenários SCN-PF-002 a SCN-PF-005 e SCN-PF-021 cobertos pela instrução da skill.
- [x] A skill nunca sobrescreve arquivo existente sem confirmação.
- [x] A skill não altera nenhum arquivo de código durante a detecção.
- [x] A lista de arquivos lidos está declarada no `SKILL.md`.
- [x] **Idioma sem templates:** `--language en` não gera pt-BR em silêncio (lacuna do `ADR-009`).
- [x] Nenhum marcador `{{` sobra nos documentos gerados.

### Resultado

`plugins/sdd-kit/skills/init/SKILL.md` criada. 28 verificações executadas, 28 como esperado.

> `TEST-PF-009`, `TEST-PF-010` e `TEST-PF-023` foram **verificados manualmente** sobre o comportamento especificado, não implementados. Continuam em `TASK-PF-012`.

**Conflito encontrado entre dois critérios desta própria tarefa.** `SCN-PF-005` exigia que `--language en` produzisse `project.language: en`; o critério vindo do `ADR-009` exige que `--language en` **interrompa**, porque `templates/en/` só existe na Fase 6. Os dois não podiam ser satisfeitos ao mesmo tempo.

Resolvido dividindo o cenário: `SCN-PF-005` cobre `--mode advisory`, verificável agora; `SCN-PF-021` (novo) cobre o comportamento de idioma indisponível. Um cenário impossível de satisfazer não é requisito — é dívida disfarçada de especificação.

**`Edit` e `NotebookEdit` removidos via `disallowed-tools`.** `SCN-PF-003` exige que a detecção não altere código. Em vez de confiar só na instrução, o campo remove as ferramentas de edição do conjunto disponível enquanto a skill está ativa. `init` só cria arquivos novos, então não precisa delas — e a garantia passa a ser mecânica.

**`allowed-tools` limitado a `Read Glob Grep`.** Pré-aprovar escrita reduziria confirmações, mas a concessão não seria escopada a `.specs/`. Ferramentas de leitura são seguras de pré-aprovar; escrita continua passando pela permissão normal.

**Lacuna corrigida:** nem `TASK-PF-005` nem `TASK-PF-006` criaram um template de `index.yaml`, exigido por `REQ-PF-007`. Criado aqui como `templates/pt-BR/index.yaml` — oito linhas. Registrado como correção, não como entrega original.

**Sem schema para `index.yaml`.** `TASK-PF-004` cobriu apenas `config` e `status`, conforme seu escopo declarado. O índice não tem validação automática. Não bloqueia a Fase 1, mas deve entrar no validador da Fase 4.

---

## TASK-PF-008 — Implementar a skill `new`

**Requisitos:** REQ-PF-003, REQ-PF-006, REQ-PF-007, REQ-PF-009
**Dependências:** TASK-PF-006, TASK-PF-007
**Complexidade:** M
**Status:** **done** — 2026-07-29

### Descrição

Escrever `skills/new/SKILL.md`: aceitar tipo e texto livre; propor o tipo quando não informado e pedir confirmação; gerar slug em inglês; alocar o próximo id a partir de `index.yaml.next_id`; criar o diretório da mudança com `request.md`, `spec.md` inicial e `status.yaml` em `DRAFT`; atualizar `index.yaml`.

### Arquivos prováveis

- `plugins/sdd-kit/skills/new/SKILL.md`

### Testes esperados

- `TEST-PF-011` — a alocação de id é sequencial e não reutiliza ids existentes.
- `TEST-PF-012` — a geração de slug é determinística e produz nomes de diretório válidos nas quatro plataformas.
- `TEST-PF-013` — `index.yaml` gerado contém a nova entrada e `next_id` incrementado.

### Critério de conclusão

- [x] Cenários SCN-PF-006 a SCN-PF-008 e SCN-PF-017 cobertos.
- [x] Os quatro tipos (`feature`, `bug`, `refactor`, `change`) criam no diretório correto.
- [x] Slugs contêm apenas `[a-z0-9-]` — sem acentos, espaços ou caracteres inválidos em Windows.

### Resultado

`plugins/sdd-kit/skills/new/SKILL.md` criada. 34 verificações executadas, 34 como esperado.

> `TEST-PF-011`, `TEST-PF-012` e `TEST-PF-013` foram **verificados manualmente** — a regra de slug foi executada contra casos reais em português (`"Ação do usuário!!"` → `acao-do-usuario`) e o `status.yaml` gerado validou para os quatro tipos. Nenhum está implementado; continuam em `TASK-PF-012`.

**Q4 resolvida:** slug em inglês. Não era decisão nova — `standards.md` §3 já determinava isso, e §1 coloca nomes de diretório sob a regra de código. O risco real não é o idioma, é a **tradução imprecisa virar permanente**: do slug deriva o escopo dos identificadores (`0001-user-authentication` → `AUTH` → `REQ-AUTH-001`), e identificadores nunca são renumerados. A skill apresenta slug, tradução e escopo derivado antes de criar o diretório, convertendo o risco numa etapa de revisão.

**Colisão de nomes corrigida — defeito meu em `TASK-PF-006`.** O diretório compartilhado chamava-se `change/`, mesmo nome do tipo `change` (mudança arquitetural). Pior: o tipo `change` estava no enum de `status.schema.json` e em `.specs/changes/`, mas **não tinha `spec.md`** — a descrição de `TASK-PF-006` pedia "as variantes de bug e refactor" e eu não confrontei isso com RF-003, que exige quatro tipos.

Corrigido aqui, porque o critério desta tarefa exige que os quatro tipos funcionem: `change/` → `_shared/`, e criado `change/spec.md` para mudança arquitetural — centrado em ADR obrigatório, raio de impacto, migração com critério de encerramento e rollback.

**Salvaguarda parcial para Q5**, que permanece aberta. Antes de alocar um identificador, a skill reconcilia `next_id` com os diretórios existentes no disco. Se encontrar identificador `>= next_id`, para e reporta em vez de escolher um número. Não resolve conflito entre branches paralelos — resolve o pior sintoma dele, que é a colisão silenciosa corrompendo a rastreabilidade dos dois lados.

**`tasks.md` e `traceability.yaml` não são criados aqui**, apesar de existirem em `_shared/`. São produzidos por `/sdd-kit:tasks`, a partir de uma spec que já tenha requisitos. Um `tasks.md` vazio criado agora seria um artefato aparentando planejamento inexistente.

---

## TASK-PF-009 — Implementar a skill `spec`

**Requisitos:** REQ-PF-004, REQ-PF-009, NFR-PF-003
**Dependências:** TASK-PF-008
**Complexidade:** M
**Status:** **done** — 2026-07-29

### Descrição

Escrever `skills/spec/SKILL.md`: ler `request.md`, `spec.md` atual e o glossário do projeto; produzir requisitos `REQ-*`/`NFR-*` com cenários `SCN-*` em Gherkin e critérios de aceite; preservar identificadores existentes ao refinar; registrar lacunas como questão pendente ou hipótese marcada, nunca como decisão.

### Arquivos prováveis

- `plugins/sdd-kit/skills/spec/SKILL.md`

### Testes esperados

- `TEST-PF-014` — snapshot de uma `spec.md` gerada contém requisito, cenário e critérios de aceite.
- `TEST-PF-015` — o refinamento de uma spec existente preserva os ids anteriores.

### Critério de conclusão

- [x] Cenários SCN-PF-009 a SCN-PF-011 cobertos.
- [x] A skill instrui explicitamente a **não** inventar decisões (constituição Art. 2).
- [x] A lista de arquivos lidos está declarada e não inclui a árvore completa de `.specs`.

### Resultado

`plugins/sdd-kit/skills/spec/SKILL.md` criada. 41 verificações executadas, 41 como esperado.

> `TEST-PF-014` e `TEST-PF-015` foram **verificados manualmente** sobre o comportamento especificado. Continuam em `TASK-PF-012`.

**Lacuna corrigida em `TASK-PF-007` e `TASK-PF-008`.** As duas declaravam `REQ-PF-009`, mas nenhuma tratava `SCN-PF-019` (advisory nunca bloqueia) nem `SCN-PF-020` (strict informa que não está implementado). `new` não mencionava governança em lugar nenhum; `init` só citava `--mode` no parsing de argumentos.

Marquei duas tarefas como concluídas com um cenário inteiro descoberto em cada. Corrigido: as três skills agora têm uma seção "Modo de governança" com a mesma estrutura e a mesma regra — *nunca finja um bloqueio que não existe*, porque afirmar que o modo `strict` impediu algo, quando ele não está implementado, cria confiança numa proteção ausente.

Adicionado `TEST-PF-024` para tornar isso mecânico: toda skill precisa declarar a seção. Duplicar o bloco em cada `SKILL.md` foi decisão consciente — skills são instruções autocontidas, e um arquivo compartilhado lido em runtime criaria uma dependência que falha em silêncio. O teste é o que impede a divergência.

**A instrução contra invenção é concreta, não um princípio.** A seção "Como a invenção se disfarça" lista os padrões reais — "a sessão expira em 30 minutos", "o sistema deve ser seguro", completar todas as seções do template por simetria — e dá um teste operacional: *a pessoa que fez a solicitação reconheceria isto como algo que ela pediu?* Se a resposta for "ela provavelmente concordaria", é hipótese.

**`spec` não altera o estado.** Sair de `DRAFT` exige que as ambiguidades críticas tenham sido resolvidas, o que é trabalho de `/sdd-kit:clarify`, da Fase 2. Promover o estado aqui seria afirmar que as questões foram tratadas quando acabaram de ser levantadas.

**Conflito descoberto, atribuído a `TASK-PF-010`:** `SCN-PF-012` exige que `tasks` promova a mudança para `PLANNED`, mas a máquina de estados de `architecture.md` §3 só permite `DRAFT → CLARIFIED | CANCELLED`. Na Fase 1 não existem `clarify` nem `design`, então o fluxo `init → new → spec → tasks` precisaria de uma transição inválida. Detalhes no critério de conclusão de `TASK-PF-010`.

---

## TASK-PF-010 — Implementar a skill `tasks`

**Requisitos:** REQ-PF-005, REQ-PF-006, REQ-PF-009
**Dependências:** TASK-PF-009
**Complexidade:** M
**Status:** **done** — 2026-07-29

### Descrição

Escrever `skills/tasks/SKILL.md`: ler `spec.md` e `standards.md`; decompor em tarefas pequenas com requisitos, dependências, arquivos prováveis, testes esperados e critério de conclusão; gerar `traceability.yaml` inicial; reportar requisitos descobertos e dependências inválidas; transicionar o estado para `PLANNED` registrando data e motivo.

### Arquivos prováveis

- `plugins/sdd-kit/skills/tasks/SKILL.md`

### Testes esperados

- `TEST-PF-016` — todo requisito da spec aparece em ao menos uma tarefa do `traceability.yaml` gerado.
- `TEST-PF-017` — uma dependência para tarefa inexistente é detectada.
- `TEST-PF-018` — a transição para `PLANNED` grava `date` e `reason` no `history`.

### Critério de conclusão

- Cenários SCN-PF-012 a SCN-PF-016 cobertos.
- A skill não promove a `PLANNED` com requisito descoberto sem aceite explícito.
- Transições inválidas geram aviso, conforme a tabela de `architecture.md` §3.
- Seção "Modo de governança" presente, cobrindo SCN-PF-019 e SCN-PF-020 (`TEST-PF-024`).
- **Resolver o conflito `DRAFT → PLANNED`.** `SCN-PF-012` exige promoção a `PLANNED`, mas `architecture.md` §3 só permite `DRAFT → CLARIFIED | CANCELLED`. Como `clarify` e `design` são da Fase 2, o fluxo desta feature chega em `tasks` ainda em `DRAFT`.

  Encaminhamento sugerido, a confirmar na tarefa: tratar como transição inválida, que já tem comportamento especificado em `SCN-PF-016` — aviso no modo `guided` e confirmação explícita do usuário, em vez de promover em silêncio ou inventar uma regra nova. Não relaxe a máquina de estados sem ADR.

### Resultado

`plugins/sdd-kit/skills/tasks/SKILL.md` criada. 53 verificações executadas sobre as quatro skills, 53 como esperado.

> `TEST-PF-016`, `TEST-PF-017` e `TEST-PF-018` foram **verificados manualmente** sobre o comportamento especificado. Continuam em `TASK-PF-012`.

**Conflito `DRAFT → PLANNED` resolvido — sem relaxar a máquina de estados.** Reconsiderei o encaminhamento sugerido e ele se confirmou, mas por um motivo mais forte do que o registrado: a tabela de transições não é um artefato da Fase 1, é uma afirmação metodológica. `CLARIFIED` significa ambiguidades críticas resolvidas; `DESIGNED` significa design técnico decidido. Pular os dois e declarar `PLANNED` afirma um preparo que não aconteceu — e `PLANNED` é justamente o estado do qual `approve` parte.

A skill aplica o comportamento já especificado em `SCN-PF-016`: avisa nomeando os estados pulados, exige confirmação explícita em `guided`, e **registra o salto no `reason` do histórico** para que o registro não pareça um fluxo normal. Se o usuário recusar, `tasks.md` é gravado mesmo assim — o plano tem valor independentemente do estado.

Também cobre os casos que o conflito original não mencionava: recuo a partir de `APPROVED`, `IN_PROGRESS` ou `VERIFIED` invalidaria trabalho já aprovado e é recusado; `ARCHIVED` e `CANCELLED` são terminais.

**Duas verificações além do exigido.** `TEST-PF-017` pedia detecção de dependência inexistente; acrescentei detecção de **ciclos**, que tornam o plano inexecutável em qualquer ordem e não seriam pegos por uma verificação de existência. E tarefas órfãs — tarefa sem requisito é trabalho que ninguém pediu, o espelho do requisito descoberto.

**A skill não corrige lacunas sozinha.** Diante de um requisito descoberto, ela reporta em vez de inventar uma tarefa para cobri-lo: a lacuna pode significar que o requisito é desnecessário, e essa é decisão do usuário.

**`implementation` fica vazio** na matriz gerada. Preenchê-lo aqui afirmaria que arquivos foram tocados quando nada foi implementado.

---

## TASK-PF-011 — Configurar o toolchain de desenvolvimento

**Requisitos:** NFR-PF-001
**Dependências:** nenhuma
**Complexidade:** M
**Status:** **done** — 2026-07-29

### Descrição

Configurar Node.js ≥ 20, TypeScript, linter e Vitest. Definir os scripts `lint`, `test` e `build` em `package.json` e preencher `validation.commands` em `.specs/config.yaml`, hoje `null`.

Resolver Q6 / questão A1 de `architecture.md` (TypeScript compilado ou JS puro nos scripts embarcados) e registrar como `ADR-007`.

### Arquivos prováveis

- `package.json`, `tsconfig.json`, configuração de lint, `vitest.config.ts`
- `.specs/config.yaml`
- `.specs/project/decisions/ADR-007-*.md`

### Testes esperados

- `TEST-PF-019` — `npm run lint`, `npm test` e `npm run build` executam com sucesso em um checkout limpo.

### Critério de conclusão

- [x] Os três comandos funcionam — **verificado em Linux**; Windows e macOS são a matriz de `TASK-PF-013`.
- [x] `validation.commands` deixa de ser `null`.
- [x] ADR-007 registrado.
- [x] `CONTRIBUTING.md` atualizado: a nota "toolchain ainda não configurado" foi removida.

### Resultado

**`TEST-PF-019` executado de verdade**, em checkout com `npm install` (130 pacotes):

```
lint   → exit 0    (eslint .)
build  → exit 0    (tsc --noEmit)
test   → exit 0    (vitest run --passWithNoTests)
```

> **Ressalva sobre `npm test`:** o exit 0 significa "nenhum teste a executar", **não** "tudo passou". `--passWithNoTests` está lá porque nenhum teste existe ainda. A flag sai em `TASK-PF-012`, e isso virou critério de conclusão daquela tarefa — deixar essa distinção implícita seria exatamente o que o Artigo 13 proíbe.

> **Cobertura de plataforma:** os comandos foram verificados apenas em **Linux** (Node v20.20.2). O critério original dizia "Windows, Linux e macOS", o que não é verificável nesta máquina. `NFR-PF-001` só estará cumprido quando a matriz de CI de `TASK-PF-013` rodar nos três.

**Q6 resolvida — [ADR-007](../../project/decisions/ADR-007-scripts-do-plugin-em-javascript.md).** A resposta veio de uma restrição da plataforma apurada em `TASK-PF-001`, não de preferência: plugins de marketplace são copiados como estão, **sem `npm install` e sem build**. O padrão documentado para instalar dependências é um hook `SessionStart` — mas hooks são opt-in por decisão do Artigo 9, e o framework não pode depender de algo que o usuário precisa ligar.

Daí a divisão por canal de distribuição: `plugins/sdd-kit/scripts/` em **JavaScript com JSDoc**, verificado por `tsc --checkJs`; `packages/cli/` em **TypeScript compilado**, porque pacote npm tem build normal. Descartei `dist/` commitado principalmente porque o usuário passaria a auditar código gerado em vez do que os mantenedores escreveram — ruim para uma ferramenta que executa na máquina dele e cujo `SECURITY.md` promete transparência.

O ADR registra um limite explícito: **não** decide como a Fase 4 fará parsing de YAML sem dependências de runtime. Node não traz parser de YAML e escrever um completo é inviável; os caminhos plausíveis ficam registrados para quando o validador for especificado.

**Um defeito encontrado e corrigido.** O primeiro `npm run build` falhou com `Cannot find type definition file for 'node'` — eu havia declarado `"types": ["node"]` sem instalar `@types/node`. Corrigido instalando a dependência, não removendo a declaração: os scripts vão usar `node:fs`.

**Além do exigido:** `npm run validate-plugin` executa o validador oficial nos dois manifestos, e o ESLint tem `no-restricted-imports` bloqueando `http`, `https`, `net` e clientes HTTP — uma checagem barata de ADR-005, complementar à verificação estrutural de `TEST-PF-022`.

---

## TASK-PF-012 — Testes automatizados dos artefatos e regras

**Requisitos:** REQ-PF-006, REQ-PF-008, NFR-PF-002, NFR-PF-005
**Dependências:** TASK-PF-010, TASK-PF-011
**Complexidade:** M
**Status:** **done** — 2026-07-29

### Descrição

Implementar os testes `TEST-PF-001` a `TEST-PF-018`: validação de schema, snapshots de templates, alocação de id, geração de slug, tabela de transições de estado.

Incluir `TEST-PF-022`, um teste estrutural que falhe se qualquer arquivo sob `plugins/sdd-kit/` contiver I/O de rede (`fetch`, `http`, `https`, `net`) — verificação executável de NFR-PF-002 e da constituição Art. 9.

### Arquivos prováveis

- `tests/**/*.test.ts`

### Testes esperados

- `TEST-PF-022` — nenhum arquivo do plugin contém I/O de rede.

As demais são a implementação dos testes já declarados nas outras tarefas.

### Critério de conclusão

- [x] **Removido `--passWithNoTests` de `npm test`.**
- [x] `TEST-PF-001` a `TEST-PF-024` implementados e passando — 127 testes em 5 arquivos.
- [x] Testes determinísticos: sem rede, sem relógio real, sem dependência de ordem.
- [x] Cada caso negativo falha **no campo esperado**, não em qualquer campo.
- [x] O teste de I/O de rede falha quando a regra é violada — verificado por mutação.

### Resultado

Cinco arquivos, **127 testes, todos passando**. `lint`, `build` e `test` saem 0.

**Reformulação necessária — e a razão importa.** `TEST-PF-011`, `012`, `015`, `016`, `017` e `018` foram planejados em `TASK-PF-010` como testes unitários de lógica: geração de slug, alocação de id, transições de estado. Mas o `design.md` §2 estabelece que esta feature **não entrega scripts executáveis** — essa lógica é instrução em linguagem natural dentro dos `SKILL.md`. Não existe função para chamar.

Nos harnesses manuais das tarefas anteriores eu reimplementei a regra de slug em Python e a testei. Isso testa a reimplementação, não o produto. Como suíte permanente seria pior: daria cobertura aparente enquanto o artefato real poderia divergir à vontade.

Reformulei os seis como **invariantes sobre os artefatos reais de `.specs/`**: identificadores únicos e sequenciais, slugs portáveis nas quatro plataformas, índice refletindo o disco, todo requisito com ao menos uma tarefa, nenhuma dependência pendente, nenhum ciclo no grafo, estado igual à última entrada do histórico, e **cada transição do histórico válida na máquina de estados de `architecture.md` §3**. Isso é observável, captura regressão e exercita o próprio repositório — Artigo 14.

**Quatro mutações confirmaram que os testes não são vacuosos:**

| Mutação | Resultado |
| --- | --- |
| Script com `fetch()` em `plugins/sdd-kit/scripts/` | `TEST-PF-022` falhou ✔ |
| Requisito com `tasks: []` na matriz | `TEST-PF-016` falhou ✔ |
| `DRAFT → VERIFIED` no histórico | Transição inválida detectada ✔ |
| `==` em arquivo `.ts` | `eqeqeq` acusou ✔ |

O teste de rede tem ainda uma asserção que valida **o próprio detector** contra amostras sintéticas, e outra que registra explicitamente que hoje há **zero** arquivos executáveis no plugin — para a aprovação por ausência não parecer cobertura.

**Dois defeitos encontrados, ambos aprovações vacuosas anteriores:**

1. **ESLint não parseava TypeScript.** `TASK-PF-011` configurou o linter sem parser de TS e ele passou porque o único arquivo era `eslint.config.js`. Assim que os testes `.ts` chegaram, seis erros de parsing. Corrigido com `typescript-eslint`, e verificado por mutação que o linter agora enxerga TS.
2. **Falso positivo no detector de marcadores.** A verificação inicial procurava `{{` literal e acusava `tasks.md`, que **cita** marcadores entre crases ao documentar o defeito de `TASK-PF-005`. Corrigido ignorando código inline e blocos de código — um marcador esquecido nunca aparece entre crases. O detector também tem asserção própria contra um marcador real.

**Cobertura honesta.** `TEST-PF-019` (os três comandos) não é auto-testável sem recursão e fica no CI. `TEST-PF-020` (matriz de plataformas) é `TASK-PF-013`. `TEST-PF-021` (specs do exemplo) é `TASK-PF-014`. `TEST-PF-009`, `010`, `023` verificam que a instrução **declara** o comportamento — não que o modelo o executa, o que não é determinístico e continua registrado como lacuna.
- O teste de ausência de I/O de rede falha se a regra for violada (verificado por mutação manual).

---

## TASK-PF-013 — Pipeline de CI multiplataforma

**Requisitos:** NFR-PF-001
**Dependências:** TASK-PF-011
**Complexidade:** P
**Status:** **blocked** — implementação concluída, verificação exige publicar o repositório

### Descrição

Criar `.github/workflows/ci.yml` executando lint, testes e build em matriz Ubuntu / Windows / macOS, em cada push e pull request.

### Arquivos prováveis

- `.github/workflows/ci.yml`

### Testes esperados

- `TEST-PF-020` — o pipeline passa nas três plataformas.

### Critério de conclusão

- [x] Matriz com os três sistemas operacionais **declarada**.
- [x] Badge de status no README.
- [ ] **Matriz verde.** Não verificável: o repositório não tem commits nem remote, e o workflow nunca executou.
- [ ] **Pipeline falha com uma falha proposital.** Mesma razão.

### Resultado

`.github/workflows/ci.yml` criado. **A tarefa não está concluída** — dois dos quatro critérios exigem que o workflow tenha executado, e ele não pode executar: o repositório não tem commits nem remote, e `act` não está disponível para simular localmente.

Marcá-la como `done` seria exatamente o que o Artigo 13 proíbe: "não executado" reportado como "aprovado". `NFR-PF-001` continua sem verificação real — nada no ambiente de desenvolvimento comprova compatibilidade com Windows ou macOS.

**O que foi verificado de verdade, localmente:**

| Verificação | Resultado |
| --- | --- |
| YAML do workflow parseia; matriz e permissões corretas | ✔ |
| `npm ci` a partir do lockfile, instalação limpa | ✔ exit 0, 159 pacotes |
| `npm run lint`, `npm run build`, `npm test` após `npm ci` | ✔ exit 0 |
| Job `specs` isolado (`vitest run tests/specs-invariants.test.ts`) | ✔ 21 testes |
| `package-lock.json` não está no `.gitignore` | ✔ — se estivesse, `npm ci` quebraria no primeiro run |

**Decisões no pipeline:**

- **`fail-fast: false`.** Interessa saber *quais* plataformas falham. Um erro exclusivo de Windows desapareceria se o job de Ubuntu abortasse a matriz antes — e é justamente o erro de Windows que `NFR-PF-001` existe para pegar.
- **`npm ci`, não `npm install`.** Falha se o lockfile divergir do `package.json`, em vez de corrigir em silêncio.
- **Node 22 só em Ubuntu.** Cobre a versão seguinte sem triplicar o custo da matriz.
- **`permissions: contents: read`.** Menor privilégio; o pipeline só lê.
- **Job `specs` separado.** Uma quebra de especificação — órfão na rastreabilidade, transição inválida, índice fora de sincronia — aparece como check distinto de uma quebra de código na lista do PR.
- **Sem `claude plugin validate` no CI.** Os runners não têm o CLI. A validação estrutural dos manifestos está em `TEST-PF-001` e `TEST-PF-002`, que rodam sem ele; `npm run validate-plugin` continua sendo a verificação definitiva, feita localmente antes de release.

**O badge no README aponta para um workflow que nunca rodou** e vai aparecer sem status até o primeiro push. Isso é o estado real, não um defeito a esconder.

### Para desbloquear

1. Commitar o repositório e publicá-lo em `github.com/idosreisjunior/sdd-claude-kit`.
2. Confirmar que a matriz fica verde nos três sistemas — só então `TEST-PF-020` e `NFR-PF-001` estão cumpridos.
3. Introduzir uma falha proposital em um teste, confirmar que o pipeline fica vermelho, e reverter.

---

## TASK-PF-014 — Projeto de exemplo

**Requisitos:** REQ-PF-002, REQ-PF-003, REQ-PF-004, REQ-PF-005
**Dependências:** TASK-PF-010
**Complexidade:** M
**Status:** **done** — 2026-07-29

### Descrição

Criar `examples/node-api/` — uma API Node.js mínima com o fluxo `init → new → spec → tasks` já executado e os artefatos resultantes versionados, servindo de referência do que o framework produz.

### Arquivos prováveis

- `examples/node-api/**`
- `examples/node-api/.specs/**`
- `examples/node-api/README.md`

### Testes esperados

- `TEST-PF-021` — os artefatos `.specs` do exemplo validam contra os schemas.

### Critério de conclusão

- [x] O exemplo demonstra as quatro skills.
- [x] O `README.md` do exemplo explica o que foi executado e o que foi gerado.
- [x] O exemplo é ignorado pelo lint e pelo build do repositório principal — verificado: `eslint` enxerga 0 arquivos de `examples/`.

### Resultado

`examples/node-api/` criado: API sem dependências (só `node:http` e `node:test`) mais os artefatos das quatro skills. `TEST-PF-021` implementado — 7 asserções sobre os artefatos do exemplo, dentro da suíte. Total agora: **134 testes**.

> **Como os artefatos foram produzidos.** Não invoquei as skills numa sessão viva — segui as instruções dos `SKILL.md` fielmente, à mão. Isso já testa se as instruções são seguíveis, mas **não** é a invocação real; essa é `TASK-PF-016`. O `README.md` do exemplo não afirma o contrário.

**A solicitação foi escolhida para ser vaga de propósito.** `"criar cadastro de clientes"` — cinco palavras, exatamente o exemplo do PRD §34. O resultado é uma spec com **2 requisitos e 6 questões em aberto**, três delas críticas, e **nenhum requisito não funcional**.

Esse é o ponto do exemplo. Um assistente sem o processo produziria seis requisitos plausíveis — e-mail obrigatório, CPF único, resposta 201 — todos razoáveis, nenhum pedido, e o erro só apareceria na revisão de código. A spec do exemplo mostra a alternativa: perguntas registradas em vez de suposições preenchidas.

**Três comportamentos que o exemplo torna concretos:**

| | Como aparece |
| --- | --- |
| Lacuna não vira palpite | `spec.md` com 6 questões; `vision.md` quase inteiro em questões, porque a descoberta não sabe *por que* o projeto existe |
| "Não detectado" ≠ "aprovado" | `config.yaml` com `lint: null` — o projeto não tem linter e a descoberta **não** inventou `npm run lint` |
| Estado não avança por conveniência | Continua em `DRAFT`: três questões críticas abertas, e `DRAFT → PLANNED` é transição inválida |

As duas primeiras tarefas do plano são **decisões arquiteturais** (persistência e autorização), não código — o que reflete o fato de que a feature força escolhas que o projeto ainda não fez.

**Verificações executadas:**

- `npm test` dentro de `examples/node-api`: 2 testes passam, exit 0. O exemplo roda de verdade.
- `eslint` e `tsc` ignoram `examples/` — confirmado programaticamente, 0 arquivos.
- Suíte completa: 134 testes, `lint`/`build`/`test` exit 0.

**Um defeito encontrado.** O helper `schema()` recompilava o schema a cada chamada, e o Ajv recusa registrar o mesmo `$id` duas vezes. Passou despercebido enquanto só um teste usava `status.schema.json`; quebrou assim que o exemplo virou um segundo consumidor. Corrigido com memoização por nome — mais um caso de verde por ausência de segundo caso.

---

## TASK-PF-015 — Documentação de instalação e primeiro uso

**Requisitos:** REQ-PF-001
**Dependências:** TASK-PF-014
**Complexidade:** P
**Status:** **done** — 2026-07-29

### Descrição

Escrever, em `docs/pt-BR/`, o guia de instalação e o tutorial da primeira feature, do zero até um plano de tarefas.

### Arquivos prováveis

- `docs/pt-BR/instalacao.md`
- `docs/pt-BR/primeira-feature.md`
- `README.md`

### Testes esperados

Nenhum automatizado. Validação: uma pessoa que nunca usou o framework consegue seguir o guia sem ajuda.

### Critério de conclusão

- [x] Instruções de instalação verificadas — ver ressalva abaixo sobre "máquina limpa".
- [x] O tutorial cobre `init → new → spec → tasks` com artefatos reais, não hipotéticos.
- [x] README aponta para os dois documentos.

### Resultado

`docs/pt-BR/instalacao.md` e `docs/pt-BR/primeira-feature.md` criados; README reorganizado em "Comece aqui" e "Referência". Suíte agora com **148 testes**.

**Distinção que o critério "saídas reais" exige.** O guia mistura dois tipos de conteúdo e diz qual é qual:

| Conteúdo | Origem |
| --- | --- |
| Saídas de `claude plugin validate`, `marketplace add`, `install`, `details` | **Capturadas de execução real** em `TASK-PF-003` e `TASK-PF-002` |
| Artefatos citados (`spec.md`, `config.yaml`, `tasks.md`) | **Arquivos reais** de `examples/node-api`, com link para conferir |
| Blocos de console das skills | Descrevem o que a instrução manda reportar. O texto exato varia — quem redige é o Claude, não um programa |

O tutorial declara isso num aviso inicial em vez de deixar o leitor supor que tudo foi capturado.

> **Ressalva sobre "máquina limpa":** os comandos foram executados nesta máquina, onde o plugin não estava instalado, e o estado foi revertido. Não é um sistema recém-instalado. E o caminho `claude plugin marketplace add idosreisjunior/sdd-claude-kit` **não foi verificado** — depende de publicar o repositório. O guia registra isso explicitamente e recomenda o clone local até lá.

**A documentação virou teste.** O tutorial cita números concretos — "1 requisito, 6 questões, 3 críticas, 5 tarefas". Sem verificação, mudar o exemplo faria o tutorial mentir em silêncio, que é o modo de falha mais comum de documentação.

`tests/docs.test.ts` (14 testes) verifica: os 27 links relativos resolvem; cada número citado bate com o artefato real; nenhuma skill da Fase 2 aparece apresentada como comando pronto; e o README declara que `docs/en/` está vazio.

**O que o guia de instalação responde e a maioria omite:** o que o plugin faz na máquina do usuário — sem rede, sem telemetria, sem hooks, sem escrever fora de `.specs/` — e o alerta de que `validation.commands` é entrada não confiável ao aceitar repositório de terceiros.

---

## TASK-PF-016 — Dogfooding sobre este repositório

**Requisitos:** todos os desta feature
**Dependências:** TASK-PF-012, TASK-PF-014, TASK-PF-015
**Complexidade:** P
**Status:** **blocked** — dogfooding executado; resta rodar as skills sobre `.specs/` deste repositório

### Descrição

Instalar o plugin e executá-lo sobre este próprio repositório: rodar `/sdd-kit:new` para criar a feature `0002` (Fase 2), e comparar os artefatos gerados com os que foram escritos à mão na Fase 0.

Divergências entre o que a skill gera e o que a Fase 0 produziu manualmente são defeitos — dos templates ou das skills — e devem virar tarefas.

### Arquivos prováveis

- `.specs/features/0002-*/**`
- Correções em templates e skills

### Testes esperados

Nenhum automatizado — exercício de validação (constituição Art. 14).

### Critério de conclusão

- [x] Divergências registradas — bug `0002-dangling-constitution-reference`.
- [x] Critérios de aceite avaliados um a um em `acceptance.md`.
- [~] O plugin opera sobre este repositório: as skills foram executadas de verdade, mas num projeto de teste limpo, não sobre `.specs/` deste repositório.

### Resultado

**A invocação real aconteceu.** A primeira tentativa falhou — `Skill(sdd-kit:new)` retornava `Unknown skill`, porque skills de um plugin instalado durante uma sessão só carregam na seguinte. Concluí cedo demais que era impossível: o obstáculo era a sessão *em andamento*, não o ambiente. `claude -p` inicia uma sessão nova, que carrega o plugin.

Duas barreiras no caminho: `--permission-mode acceptEdits` não cobre invocação de Skill (precisou de `--allowed-tools "Skill"`), e a sessão aninhada **recusou-se a improvisar os artefatos** ao bater na permissão — argumentou que arquivos escritos por ela pareceriam saída do plugin sem ser, escondendo o que a sessão existia para testar. Comportamento correto.

O fluxo `init → new → spec → tasks` foi executado num projeto Node limpo, com o mesmo código-fonte do exemplo e sem `.specs/` — para comparar o que a skill gera com o que escrevi à mão a partir da mesma entrada.

**Cinco defeitos encontrados**, todos registrados em `.specs/bugs/` e **todos corrigidos**:

| Bug | Defeito | Verificação da correção |
| --- | --- | --- |
| `0003` | `spec` expandia "criar cadastro de clientes" em CRUD completo — 5 requisitos, 4 não pedidos | **Reexecução real**: 5 → 2 requisitos |
| `0004` | `status.yaml` gerado violava o próprio schema em `blocked_by` | Mutação |
| `0005` | Artigo 10 exigia lint incondicionalmente; projeto sem linter nunca cumpria a DoD | Mutação |
| `0006` | `reason` entre aspas quebrava o YAML — e o motivo cita o pedido do usuário | Mutação |
| `0002` | Referência a artigo inexistente da constituição | Mutação |

O `0003` é o que justifica o dogfooding existir: viola o Artigo 2, a regra central do framework, e **nenhum teste estrutural o pegaria**. Só execução real expõe expansão de escopo.

Também corrigido: `init` relatava "9 arquivos" e criava 8 — encontrado pela própria sessão aninhada.

**A comparação sistemática encontrou nove divergências.** Comparei as seções de cada artefato da Fase 0 contra o template correspondente. Oito são variação legítima: os artefatos foram escritos **antes** dos templates, e diferem em numeração, nomes de seção e estrutura própria de um framework.

A nona é defeito real.

**Bug encontrado: `0002-dangling-constitution-reference`.**

O template de `config.yaml` referenciava `constitution.md, Art. 13`. A constituição **gerada por init** tem 11 artigos — a referência não aponta para lugar nenhum. Escrevi essa referência em `TASK-PF-005` consultando a constituição *deste repositório*, que tem 14 artigos porque inclui regras próprias.

| Nº | Neste repositório | Gerada por init |
| --- | --- | --- |
| 10 | Portabilidade e formatos abertos | **Definition of Done** |
| 13 | **Definition of Done** | *(não existe)* |

O defeito estava presente num artefato genuinamente gerado: `examples/node-api/.specs/config.yaml`.

Registrado com o próprio template de bug do framework — o que também dogfooda o template, a alocação de identificador e o índice. Corrigido, com teste de regressão que **falhou antes e passou depois**, e nenhum teste existente alterado.

O teste cobre mais que o defeito pontual: percorre todo arquivo distribuído — templates e `SKILL.md` — verificando que cada `Art. N` citado existe na constituição **gerada**. Havia 26 referências válidas e uma quebrada. Referências de seção (`§N`) foram checadas pelo mesmo critério: 8 válidas, 0 quebradas.

**O schema me impediu de inventar um campo.** Tentei registrar a correção como `notes_fix` no `status.yaml` e o `additionalProperties: false` rejeitou. O registro foi para a spec do bug, onde pertence.

**Avaliação dos critérios de aceite: 5 aprovados, 6 com ressalva, 1 reprovado.** Ver `acceptance.md`. O reprovado é o critério 11 — lint, testes e build nos três sistemas operacionais, verificado só em Linux. As seis ressalvas compartilham a mesma causa: as skills nunca foram invocadas numa sessão viva.

**A feature não pode ser promovida a `VERIFIED`.**

### Para desbloquear

1. Numa **sessão nova** do Claude Code, com o plugin instalado, executar `/sdd-kit:new`, `/sdd-kit:spec` e `/sdd-kit:tasks` sobre este repositório.
2. Comparar o gerado com `examples/node-api`. Divergências viram bugs.
3. Converter as seis ressalvas de `acceptance.md` em aprovação ou defeito.

---

## Resumo

| Complexidade | Quantidade |
| --- | --- |
| P | 7 |
| M | 10 |
| G | 0 |

Total: 17 tarefas · 15 concluídas · 2 bloqueadas (`013` CI, `016` invocação viva) · 0 pendentes.

Nenhuma tarefa grande — nenhuma precisa ser dividida antes de começar (constituição Art. 4).

**Caminho crítico:** `001 ✅ → 004 ✅ → 005 ✅ → 006 ✅ → 007 ✅ → 008 ✅ → 009 ✅ → 010 ✅ → 012 → 016`.

**Nenhum bloqueio ativo.** Q5 segue aberta mas não bloqueia — `TASK-PF-008` adicionou detecção de colisão. Q6 atinge só `TASK-PF-011`; Q9 é da Fase 4.

**O fluxo da Fase 1 está completo**: `init → new → spec → tasks`. O que resta é o que torna o plugin instalável e verificável.

**O plugin já é instalável e funcional.** `REQ-PF-001` está cumprido: marketplace, manifesto e as quatro skills, verificados com o CLI oficial.

**Nenhuma tarefa pendente.** As duas bloqueadas dependem do mesmo tipo de evento externo: publicar o repositório (`013`) e abrir uma sessão nova (`016`).

A suíte tem 159 testes passando. `NFR-PF-001` só fecha quando a matriz de CI rodar nos três sistemas operacionais (Q10).

Todas as questões desta feature estão fechadas: Q1–Q4, Q6 e Q7 resolvidas; Q5 e Q9 registradas para fases seguintes, sem bloquear.
