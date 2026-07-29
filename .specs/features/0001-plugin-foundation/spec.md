# Feature: Fundação do plugin SDD Claude Kit

- **ID:** 0001-plugin-foundation
- **Escopo dos identificadores:** `PF`
- **Estado:** ver `status.yaml` — a autoridade é ele
- **Cobre do PRD:** RF-001, RF-003, RF-004, RF-007, RF-014 (parcial)

---

## Objetivo

Entregar o primeiro artefato instalável do SDD Claude Kit: um plugin do Claude Code capaz de inicializar o framework em um projeto e conduzir uma solicitação em linguagem natural até um plano de tarefas implementáveis.

## Contexto

O repositório contém hoje apenas documentação e especificações. Não existe plugin, nem templates, nem schemas. Um usuário não consegue instalar nem usar nada.

Esta feature fecha a lacuna entre "o método está descrito" e "o método é executável".

## Escopo

### Incluído

- Manifesto do plugin e manifesto de marketplace, permitindo instalação a partir do GitHub.
- Skills `init`, `new`, `spec` e `tasks`.
- Templates para `config.yaml`, documentos de projeto, feature e ADR.
- Schemas de `config.yaml` e `status.yaml`.
- Índice de mudanças (`index.yaml`) mantido pelas skills.
- Leitura do modo de governança a partir da configuração, com comportamento `advisory` e `guided`.
- Toolchain de desenvolvimento (Node, TypeScript, lint, testes) e pipeline de CI.
- Um projeto de exemplo demonstrando o fluxo.

### Não incluído

- Skills `discover`, `clarify`, `design`, `approve`, `implement`, `verify`, `review`, `archive`.
- Os sete agentes especializados.
- Hooks e modo `strict`.
- Validador determinístico completo (`validate-specs`) e `traceability.yaml` gerado automaticamente.
- CLI.
- Documentação em inglês.

---

## Requisitos funcionais

### REQ-PF-001 — Plugin instalável a partir do repositório

O repositório deve expor um marketplace de plugins do Claude Code que permita instalar o plugin `sdd-kit` diretamente do GitHub, sem clonar o repositório nem executar instalação manual de dependências.

#### SCN-PF-001 — Instalação a partir do repositório

DADO um usuário com Claude Code instalado
QUANDO adicionar este repositório como marketplace e instalar o plugin `sdd-kit`
ENTÃO as skills `init`, `new`, `spec` e `tasks` devem aparecer disponíveis como `/sdd-kit:<nome>`
E nenhuma instalação adicional de dependências deve ser necessária para usá-las.

---

### REQ-PF-002 — Inicializar o framework em um projeto

*(PRD RF-001)*

A skill `/sdd-kit:init` deve criar a estrutura `.specs` em um projeto, funcionando tanto em diretório vazio quanto em projeto existente, sem sobrescrever arquivos sem confirmação.

Parâmetros opcionais: `--mode <advisory|guided|strict>` e `--language <pt-BR|en>`.

#### SCN-PF-002 — Inicialização em projeto vazio

DADO um diretório sem `.specs`
QUANDO o usuário executar `/sdd-kit:init`
ENTÃO o framework deve criar `.specs/` com `config.yaml`, `index.yaml` e o diretório `project/`
E `config.yaml` deve ter `workflow.mode: guided`
E deve apresentar um resumo do que foi criado.

#### SCN-PF-003 — Inicialização em projeto já existente

DADO um projeto com código-fonte e sem `.specs`
QUANDO o usuário executar `/sdd-kit:init`
ENTÃO o framework deve detectar linguagem, gerenciador de pacotes e comandos de build, teste e lint
E registrar o resultado em `.specs/project/context.md`
E marcar como hipótese toda informação de que não tiver certeza
E não deve modificar nenhum arquivo de código.

#### SCN-PF-004 — Projeto já inicializado

DADO um projeto que já possui `.specs/config.yaml`
QUANDO o usuário executar `/sdd-kit:init`
ENTÃO o framework deve informar que o projeto já está inicializado
E não deve sobrescrever nenhum arquivo existente sem confirmação explícita do usuário.

#### SCN-PF-005 — Modo informado por parâmetro

DADO um diretório sem `.specs`
QUANDO o usuário executar `/sdd-kit:init --mode advisory`
ENTÃO `config.yaml` deve registrar `workflow.mode: advisory`
E o texto do argumento deve ser interpretado pela própria skill, já que não há parsing nativo de flags (Q2).

#### SCN-PF-021 — Idioma sem templates disponíveis

DADO um diretório sem `.specs` e um plugin que só possui `templates/pt-BR/`
QUANDO o usuário executar `/sdd-kit:init --language en`
ENTÃO o framework deve informar que `en` ainda não possui templates
E listar os idiomas disponíveis
E **não** deve gerar documentos em pt-BR sem que o usuário decida.

> Este cenário substitui a parte de idioma do antigo SCN-PF-005, que era inalcançável na Fase 1: `templates/en/` só existe na Fase 6 ([ADR-009](../../project/decisions/ADR-009-templates-por-idioma.md)). Um cenário que não pode ser satisfeito não é requisito, é dívida disfarçada.
>
> Quando `templates/en/` existir, `--language en` deve passar a gerar `project.language: en` — comportamento a especificar na feature que entregar a tradução.

---

### REQ-PF-003 — Criar uma mudança a partir de linguagem natural

*(PRD RF-003)*

A skill `/sdd-kit:new` deve criar uma nova mudança a partir de uma solicitação em linguagem natural, nos tipos `feature`, `bug`, `refactor` e `change`.

#### SCN-PF-006 — Criação de uma feature

DADO um projeto inicializado
QUANDO o usuário executar `/sdd-kit:new feature "autenticação de usuários"`
ENTÃO o framework deve criar o diretório `.specs/features/0001-user-authentication/`
E gravar a solicitação original em `request.md`
E criar `spec.md` a partir do template, com requisitos iniciais
E criar `status.yaml` com estado `DRAFT`
E registrar a mudança em `.specs/index.yaml`.

#### SCN-PF-007 — Identificador único e sequencial

DADO um projeto que já possui a mudança `0001-user-authentication`
QUANDO o usuário criar uma nova mudança
ENTÃO o identificador atribuído deve ser `0002`
E nenhum identificador existente deve ser reutilizado ou renumerado.

#### SCN-PF-008 — Tipo não informado

DADO um projeto inicializado
QUANDO o usuário executar `/sdd-kit:new "corrigir erro no login"` sem informar o tipo
ENTÃO o framework deve propor um tipo com base no texto
E pedir confirmação antes de criar os arquivos.

---

### REQ-PF-004 — Elaborar e refinar requisitos

*(apoia PRD RF-003)*

A skill `/sdd-kit:spec` deve criar ou melhorar `spec.md`, produzindo requisitos numerados, cenários em Gherkin e critérios de aceite, sem inventar decisões.

#### SCN-PF-009 — Geração de requisitos

DADO uma mudança com `request.md` preenchido
QUANDO o usuário executar `/sdd-kit:spec 0001-user-authentication`
ENTÃO `spec.md` deve conter ao menos um requisito `REQ-*` com identificador único
E cada requisito deve ter ao menos um cenário `SCN-*`
E a seção de critérios de aceite deve estar preenchida.

#### SCN-PF-010 — Informação ausente não é inventada

DADO uma solicitação que não define a duração da sessão de login
QUANDO o framework gerar `spec.md`
ENTÃO a lacuna deve aparecer como questão pendente ou como hipótese marcada com `> HIPÓTESE:`
E o framework não deve registrar um valor específico como se fosse decisão do usuário.

#### SCN-PF-011 — Refinamento preserva identificadores

DADO uma `spec.md` existente com os requisitos `REQ-AUTH-001` e `REQ-AUTH-002`
QUANDO o usuário executar `/sdd-kit:spec` novamente sobre a mesma mudança
ENTÃO os identificadores existentes devem ser preservados
E novos requisitos devem continuar a numeração a partir de `REQ-AUTH-003`.

---

### REQ-PF-005 — Gerar plano de tarefas

*(PRD RF-007)*

A skill `/sdd-kit:tasks` deve decompor a especificação em tarefas pequenas, ordenadas por dependência e vinculadas a requisitos.

#### SCN-PF-012 — Decomposição em tarefas

DADO uma mudança com `spec.md` contendo requisitos e cenários
QUANDO o usuário executar `/sdd-kit:tasks 0001-user-authentication`
ENTÃO `tasks.md` deve conter tarefas `TASK-*`, cada uma com requisitos relacionados, dependências, arquivos prováveis, testes esperados e critério de conclusão
E cada requisito da spec deve estar associado a pelo menos uma tarefa
E o estado da mudança deve passar para `PLANNED`.

#### SCN-PF-013 — Requisito sem tarefa é reportado

DADO uma spec com um requisito que não foi coberto na decomposição
QUANDO o plano de tarefas for gerado
ENTÃO o framework deve reportar o requisito descoberto ao usuário
E não deve marcar a mudança como `PLANNED` sem que a lacuna seja resolvida ou aceita explicitamente.

#### SCN-PF-014 — Dependência inexistente

DADO um plano de tarefas em que `TASK-AUTH-002` depende de `TASK-AUTH-009`, que não existe
QUANDO o plano for gerado ou revisado
ENTÃO o framework deve reportar a dependência inválida.

---

### REQ-PF-006 — Registrar e transicionar estado

*(PRD RF-004)*

Cada mudança deve manter seu estado em `status.yaml`, com histórico de transições.

#### SCN-PF-015 — Registro de transição

DADO uma mudança no estado `DRAFT`
QUANDO uma skill promover a mudança para `PLANNED`
ENTÃO `status.yaml` deve registrar o novo estado, a data e o motivo da transição
E o estado anterior deve permanecer no histórico.

#### SCN-PF-016 — Transição inválida no modo guided

DADO uma mudança no estado `DRAFT` e o modo `guided`
QUANDO for solicitada uma transição direta para `VERIFIED`
ENTÃO o framework deve emitir um aviso informando que a transição é inválida
E não deve aplicar a transição sem confirmação explícita do usuário.

---

### REQ-PF-007 — Manter o índice de mudanças

O arquivo `.specs/index.yaml` deve refletir todas as mudanças existentes, permitindo responder "o que existe neste projeto" sem abrir nenhuma spec.

#### SCN-PF-017 — Índice atualizado na criação

DADO um projeto inicializado
QUANDO uma nova mudança for criada
ENTÃO `index.yaml` deve conter uma entrada com id, tipo, título, estado, caminho e data
E `next_id` deve ser incrementado.

---

### REQ-PF-008 — Templates padronizados

O plugin deve fornecer templates para os documentos gerados, de modo que duas execuções da mesma skill produzam artefatos com a mesma estrutura.

#### SCN-PF-018 — Estrutura consistente

DADO duas mudanças criadas em momentos diferentes
QUANDO ambas forem geradas pela skill `new`
ENTÃO os arquivos produzidos devem ter as mesmas seções, na mesma ordem.

---

### REQ-PF-009 — Respeitar o modo de governança

*(PRD RF-014, parcial)*

As skills devem ler `workflow.mode` de `.specs/config.yaml` e ajustar o comportamento. Nesta feature apenas `advisory` e `guided` são implementados; `strict` depende de hooks (Fase 4).

#### SCN-PF-019 — Modo advisory não bloqueia

DADO um projeto com `workflow.mode: advisory`
QUANDO uma inconsistência for detectada
ENTÃO o framework deve informar a inconsistência
E não deve impedir nenhuma ação do usuário.

#### SCN-PF-020 — Modo strict ainda não suportado

DADO um projeto com `workflow.mode: strict`
QUANDO uma skill desta feature for executada
ENTÃO o framework deve informar que o modo `strict` ainda não está implementado
E operar com o comportamento de `guided`
E não deve falhar silenciosamente nem fingir bloqueio.

---

## Requisitos não funcionais

### NFR-PF-001 — Compatibilidade multiplataforma

*(PRD RNF-001)* Todas as skills e scripts devem funcionar em Windows, Linux, macOS e WSL. Caminhos devem ser tratados de forma portável; nenhuma dependência de shell POSIX.

### NFR-PF-002 — Isolamento e segurança

*(PRD RNF-003, ADR-005)* Nenhum componente faz requisição de rede. Nenhuma escrita fora de `.specs/`, exceto arquivos explicitamente confirmados pelo usuário. Nenhum segredo gravado em `.specs`. Hooks não são instalados nem ativados por esta feature.

### NFR-PF-003 — Contexto sob demanda

*(PRD RNF-002, princípio §7.6)* Cada `SKILL.md` deve declarar explicitamente os arquivos que sua etapa lê. Nenhuma skill lê a árvore completa de `.specs` nem o repositório inteiro. Diretórios em `paths.ignored` são ignorados na descoberta.

### NFR-PF-004 — Preparação para internacionalização

*(PRD RNF-008)* Textos exibidos ao usuário devem estar separados da lógica, de forma que a tradução para `en` (Fase 6) não exija reescrever skills ou scripts.

### NFR-PF-005 — Specs legíveis sem o plugin

*(PRD RNF-004)* Todos os artefatos gerados devem ser Markdown ou YAML válidos, legíveis e editáveis manualmente.

---

## Critérios de aceite

- [ ] O plugin pode ser instalado no Claude Code a partir deste repositório.
- [ ] `/sdd-kit:init` cria `.specs` válida em projeto vazio e em projeto existente.
- [ ] `/sdd-kit:init` não sobrescreve arquivos existentes sem confirmação.
- [ ] `/sdd-kit:new` cria uma mudança com id único, `request.md`, `spec.md`, `status.yaml` em `DRAFT` e entrada em `index.yaml`.
- [ ] `/sdd-kit:spec` gera requisitos numerados com cenários e critérios de aceite, marcando lacunas em vez de inventá-las.
- [ ] `/sdd-kit:tasks` gera tarefas pequenas, com dependências explícitas e cada requisito coberto por ao menos uma tarefa.
- [ ] Transições de estado são registradas com data e motivo.
- [ ] O modo `advisory` não bloqueia nenhuma ação; o modo `strict` informa que ainda não está implementado.
- [ ] `config.yaml` e `status.yaml` validam contra seus schemas.
- [ ] Existe um projeto de exemplo percorrendo `init → new → spec → tasks`.
- [ ] Lint, testes e build passam em Ubuntu, Windows e macOS no CI.
- [ ] O plugin consegue operar sobre as specs deste próprio repositório.

---

## Questões resolvidas

Resolvidas por `TASK-PF-001` em 2026-07-29, a partir da documentação oficial e da inspeção do marketplace oficial em cache local (`~/.claude/plugins/marketplaces/claude-plugins-official/`).

Fontes: [Plugins reference](https://code.claude.com/docs/en/plugins-reference) · [Plugin marketplaces](https://code.claude.com/docs/en/plugin-marketplaces) · [Skills](https://code.claude.com/docs/en/skills)

### Q1 — Formato de `plugin.json`, `marketplace.json` e `SKILL.md` ✅

**`plugin.json`** vive em `.claude-plugin/plugin.json` na raiz do plugin. **É opcional** — se ausente, os componentes são autodescobertos nos diretórios padrão e o nome vem do diretório. Quando presente, **`name` é o único campo obrigatório**. Opcionais relevantes: `displayName`, `version`, `description`, `author{name,email,url}`, `homepage`, `repository`, `license`, `keywords`, `defaultEnabled`, `$schema`. Campos não reconhecidos são ignorados (viram aviso em `claude plugin validate`).

**`marketplace.json`** vive em `.claude-plugin/marketplace.json` na raiz do repositório. Obrigatórios: `name`, `owner` (com `owner.name` obrigatório), `plugins[]`. Cada entrada exige `name` e `source`. `source` aceita caminho relativo (`"./plugins/sdd-kit"`), ou objeto `github` / `git-subdir` / `url` / `npm`. `metadata.pluginRoot` permite encurtar caminhos relativos.

**`SKILL.md`** vive em `skills/<nome>/SKILL.md`. Front matter: nenhum campo é estritamente obrigatório; `description` é recomendado; `name`, `when_to_use`, `argument-hint`, `arguments`, `disable-model-invocation`, `user-invocable`, `allowed-tools`, `disallowed-tools`, `model`, `effort`, `context`, `agent`, `paths`, `hooks`, `shell` são opcionais.

**Namespace confirmado:** `plugins/sdd-kit/skills/init/SKILL.md` → **`/sdd-kit:init`**. A UX descrita no PRD §11 está correta. Em skill de plugin, o `name` do front matter substitui o último segmento; o prefixo do plugin permanece.

> Restrição descoberta: o nome de marketplace não pode imitar fontes oficiais da Anthropic. Há uma lista de nomes reservados (`claude-plugins-official`, `anthropic-plugins`, etc.). `sdd-claude-kit` não conflita.

### Q2 — Passagem de argumentos ✅ *(com correção ao PRD)*

**Não existe parsing nativo de flags.** Os argumentos chegam como texto:

| Placeholder | Significado |
| --- | --- |
| `$ARGUMENTS` | String completa, como digitada |
| `$ARGUMENTS[N]` / `$N` | Argumento por posição, índice **base 0** (`$0` é o primeiro) |
| `$nome` | Argumento nomeado, declarado em `arguments:` no front matter |

Indexados usam aspas no estilo shell: `/skill "hello world" second` → `$0` = `hello world`, `$1` = `second`. Se a skill não contiver `$ARGUMENTS`, o Claude Code anexa `ARGUMENTS: <valor>` ao final do conteúdo.

`argument-hint` é **apenas dica de autocomplete** — não valida nem parseia nada.

> **Impacto em SCN-PF-005:** `--mode advisory --language en` continua válido como interface, mas `TASK-PF-007` precisa instruir a skill a **parsear esse texto a partir de `$ARGUMENTS`**. Não são flags reais. O cenário não muda; a implementação sim.

### Q3 — Referência a arquivos empacotados ✅

Duas variáveis substituem **em qualquer ponto do conteúdo de skills e agentes**:

| Variável | Resolve para |
| --- | --- |
| `${CLAUDE_PLUGIN_ROOT}` | Diretório de instalação do plugin |
| `${CLAUDE_SKILL_DIR}` | Subdiretório da própria skill, **não** a raiz do plugin |
| `${CLAUDE_PROJECT_DIR}` | Raiz do projeto do usuário |

Templates e schemas são compartilhados entre as quatro skills, logo devem ser referenciados por **`${CLAUDE_PLUGIN_ROOT}/templates/...`** e `${CLAUDE_PLUGIN_ROOT}/schemas/...`.

Duas restrições confirmadas, ambas já compatíveis com o design:

1. **Sem travessia de caminho.** Plugins instalados não conseguem referenciar arquivos fora do próprio diretório — o cache não os copia. Templates e schemas *precisam* viver dentro de `plugins/sdd-kit/`.
2. **`${CLAUDE_PLUGIN_ROOT}` é efêmero.** Muda a cada atualização do plugin; não se deve gravar estado ali. Artefatos vão para `.specs/` do projeto, via `${CLAUDE_PROJECT_DIR}`.

### Q7 — Autoinvocação das skills de governança ✅

Resolvida por `TASK-PF-017` em 2026-07-29. Decisão registrada em [`ADR-008`](../../project/decisions/ADR-008-autoinvocacao-de-skills.md).

`disable-model-invocation: true` aplica-se **apenas** às skills que consomem ou executam uma decisão humana: `approve`, `implement` e `archive` — todas da Fase 2. As demais dez permanecem no padrão.

O critério é: *a skill produz um rascunho para revisão humana, ou age sobre uma decisão já tomada?*

**Nenhuma das quatro skills desta feature é bloqueada.** `init`, `new`, `spec` e `tasks` produzem rascunhos revisáveis, preservam identificadores e não sobrescrevem sem confirmação. A decisão não altera `TASK-PF-007` a `TASK-PF-010`, exceto por exigir que o campo apareça explicitamente no front matter, com referência ao ADR.

> **Limite registrado no ADR:** `disable-model-invocation` não é fronteira de segurança. Impede a invocação da *skill*, não a edição direta de arquivos com `Write`/`Edit`. A aplicação efetiva do Artigo 3 depende do hook `PreToolUse` do modo `strict` (Fase 4).

### Q4 — Idioma do slug ✅

Resolvida por `TASK-PF-008` em 2026-07-29. **Slug em inglês**, mesmo com solicitação em pt-BR.

Não é decisão nova: `standards.md` §3 já determina `NNNN-slug-em-ingles-com-hifens`, e §1 coloca nomes de diretório sob a regra de código, não a de documentação. Q4 apenas perguntava se a regra valia também para slugs gerados automaticamente. Vale.

O risco real não é o idioma — é a **tradução imprecisa virar permanente**. O slug não é só um nome de diretório: dele deriva o escopo dos identificadores (`0001-user-authentication` → `AUTH` → `REQ-AUTH-001`), e identificadores nunca são renumerados.

Mitigação: `TASK-PF-008` exige que a skill apresente o slug, a tradução e o escopo derivado **antes** de criar o diretório. O risco vira uma etapa de revisão em vez de um defeito silencioso.

---

## Questões pendentes

| # | Questão | Bloqueia | Prioridade |
| --- | --- | --- | --- |
| Q5 | Numeração sequencial global conflita entre branches paralelos. Qual a estratégia? *(questão A4 de `architecture.md`; adiável para a Fase 2)* | — | Média |
| Q6 | Scripts embarcados serão TypeScript compilado ou JS puro? *(ADR-004, questão A1)* — não afeta esta feature, que não tem scripts executáveis | `TASK-PF-011` | Média |
| Q10 | **Nova.** A matriz de CI passa em Windows, Linux e macOS? O pipeline foi declarado em `TASK-PF-013` mas nunca executou — o repositório não tem commits nem remote, e `act` não está disponível para simular localmente. **`NFR-PF-001` não tem verificação real**: nada no ambiente de desenvolvimento comprova compatibilidade multiplataforma. | `TASK-PF-013`, `NFR-PF-001` | **Alta** |
| Q9 | **Nova.** Quais são os valores válidos de `security.allow_shell_commands`? O PRD §16 define apenas `prompt`. `config.schema.json` mantém o campo como string em vez de enum, para não inventar semântica de segurança (constituição Art. 2). Fechar na Fase 4, quando a execução de comandos passar a existir — não bloqueia nada agora, já que hooks estão desativados e nenhum comando é executado. | — | Baixa |

## Restrições descobertas

Não são questões em aberto: são fatos da plataforma a honrar no design das skills.

| # | Restrição | Afeta |
| --- | --- | --- |
| R1 | O conteúdo de uma skill entra na conversa **uma vez e permanece pela sessão** — o Claude Code não relê o arquivo. O custo de contexto é por invocação, não por turno, e as instruções precisam ser escritas como permanentes, não como passo único. *(era Q8)* | `TASK-PF-007` a `TASK-PF-010` |
| R2 | `description` + `when_to_use` são truncados em 1.536 caracteres na listagem de skills. Descrições longas são cortadas em silêncio. | `TASK-PF-007` a `TASK-PF-010` |
