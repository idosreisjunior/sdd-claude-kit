# PRD — SDD Claude Kit

> Product Requirements Document

| Campo | Valor |
| --- | --- |
| Produto | SDD Claude Kit |
| Tipo | Framework open source para Claude Code |
| Categoria | Developer Tools / AI-Assisted Development |
| Repositório | GitHub público |
| Status | Planejamento |
| Versão do PRD | 1.0 |
| Licença | Apache 2.0 |
| Idiomas iniciais | Português e inglês |
| Plataformas | Windows, Linux, macOS e WSL |
| Público inicial | Desenvolvedores que utilizam Claude Code |

---

## 1. Resumo executivo

O SDD Claude Kit será um framework open source para apoiar equipes e desenvolvedores na aplicação de Spec-Driven Development (SDD) em projetos desenvolvidos com Claude Code.

O framework transformará solicitações em linguagem natural em um processo estruturado composto por:

1. Descoberta do contexto do projeto.
2. Definição de requisitos.
3. Identificação de ambiguidades.
4. Criação do design técnico.
5. Decomposição em tarefas.
6. Aprovação humana.
7. Implementação orientada pelas especificações.
8. Validação técnica e funcional.
9. Atualização da rastreabilidade.
10. Arquivamento da mudança.

As especificações serão armazenadas no diretório `.specs`, versionadas no Git junto com o código-fonte.

O produto será distribuído inicialmente como um plugin para Claude Code, com skills, agentes, templates e hooks. Posteriormente, poderá receber uma CLI opcional para validações determinísticas, integração com CI/CD e geração de relatórios.

## 2. Problema

Claude Code consegue gerar e modificar grandes volumes de código, mas projetos complexos podem apresentar problemas quando o desenvolvimento ocorre apenas por meio de conversas e prompts.

Principais problemas identificados:

- Requisitos espalhados em diferentes conversas.
- Implementações iniciadas antes do esclarecimento das regras de negócio.
- Perda de decisões importantes entre sessões.
- Falta de rastreabilidade entre requisito, código e teste.
- Alterações arquiteturais sem documentação.
- Planos de implementação muito amplos.
- Dificuldade para retomar projetos grandes.
- Claude carregando contexto excessivo.
- Divergência entre o código implementado e a necessidade original.
- Falta de um processo padronizado para projetos novos e existentes.
- Ausência de checkpoints claros para aprovação humana.

O framework deverá resolver esses problemas transformando especificações em artefatos permanentes, estruturados e versionados.

## 3. Visão do produto

Permitir que desenvolvedores utilizem Claude Code de forma mais previsível, organizada e rastreável, mantendo especificações, decisões, tarefas e critérios de aceite versionados junto ao código.

O framework deverá atuar como uma camada de governança entre a intenção do usuário e a implementação realizada pelo Claude.

```
Solicitação do usuário
        ↓
Descoberta e análise
        ↓
Especificação funcional
        ↓
Clarificação
        ↓
Design técnico
        ↓
Planejamento de tarefas
        ↓
Aprovação humana
        ↓
Implementação
        ↓
Testes e validação
        ↓
Rastreabilidade
        ↓
Arquivamento
```

## 4. Objetivos do produto

### 4.1 Objetivos principais

- Criar um processo padronizado de SDD para Claude Code.
- Manter as especificações versionadas no Git.
- Evitar implementação antes da definição mínima dos requisitos.
- Reduzir ambiguidades em solicitações feitas ao Claude.
- Dividir grandes funcionalidades em tarefas pequenas.
- Registrar decisões técnicas relevantes.
- Criar rastreabilidade entre requisitos, tarefas, arquivos e testes.
- Permitir uso em projetos novos e projetos já existentes.
- Oferecer diferentes níveis de controle.
- Permitir instalação simples a partir de um repositório GitHub.
- Facilitar a colaboração da comunidade open source.

### 4.2 Objetivos secundários

- Criar perfis específicos para backend, frontend, dados, IA e DevOps.
- Permitir integração futura com GitHub Issues e Pull Requests.
- Permitir validações em pipelines de CI/CD.
- Gerar relatórios de cobertura de requisitos.
- Detectar divergências entre specs e implementação.
- Suportar projetos monorepo.
- Permitir especificações em português e inglês.

## 5. Não objetivos do MVP

O MVP **não** terá como objetivo:

- Criar uma IDE própria.
- Substituir o Claude Code.
- Hospedar código ou especificações em um serviço externo.
- Criar uma plataforma SaaS.
- Executar gerenciamento completo de projetos.
- Substituir Jira, Linear, Trello ou GitHub Projects.
- Suportar todos os assistentes de programação.
- Criar interface gráfica.
- Executar deploy de aplicações.
- Gerenciar infraestrutura.
- Criar automaticamente Pull Requests.
- Sincronizar informações com serviços externos.
- Manter banco de dados remoto.
- Obrigar o uso da CLI.

Essas funcionalidades poderão ser consideradas em versões futuras.

## 6. Público-alvo

### 6.1 Desenvolvedor individual

Utiliza Claude Code para criar aplicações, automações, APIs, scripts ou protótipos.

Necessidades: manter o Claude focado; retomar o trabalho em sessões futuras; evitar mudanças fora do escopo; organizar requisitos e tarefas; validar o que foi implementado.

### 6.2 Desenvolvedor responsável por projeto existente

Precisa adicionar funcionalidades em um sistema grande ou legado.

Necessidades: mapear a arquitetura atual; evitar quebra de funcionalidades; identificar módulos afetados; documentar decisões; aplicar SDD sem reescrever o projeto.

### 6.3 Líder técnico

Utiliza Claude Code com uma equipe.

Necessidades: padronizar o processo; revisar especificações antes da implementação; garantir rastreabilidade; controlar decisões arquiteturais; facilitar revisão de Pull Requests.

### 6.4 Mantenedor open source

Mantém projetos que recebem contribuições externas.

Necessidades: padronizar propostas de funcionalidades; relacionar issues, specs e Pull Requests; facilitar contribuições; reduzir alterações sem contexto.

## 7. Princípios do produto

### 7.1 Especificar antes de implementar

O framework deve incentivar a criação da especificação antes da alteração do código.

### 7.2 Aprovação humana

O Claude poderá propor requisitos, arquitetura e tarefas, mas o início da implementação poderá depender de aprovação explícita, de acordo com o modo configurado.

### 7.3 Especificações como fonte da verdade

As decisões relevantes devem estar registradas nos arquivos `.specs`, e não apenas no histórico da conversa.

### 7.4 Adoção gradual

O framework não deverá bloquear o desenvolvimento por padrão. O usuário poderá começar com orientações e aumentar gradualmente o nível de controle.

### 7.5 Compatibilidade com projetos existentes

O produto deverá funcionar tanto em projetos novos quanto em projetos em andamento.

### 7.6 Contexto sob demanda

Documentos extensos não devem ser carregados permanentemente no `CLAUDE.md`. Skills e agentes devem carregar somente o contexto necessário para cada etapa.

### 7.7 Automação transparente

Toda ação automática deverá ser previsível e documentada.

### 7.8 Segurança por padrão

Hooks que executem comandos ou bloqueiem ações deverão ser opcionais e configuráveis.

## 8. Proposta de valor

- Estrutura padronizada para `.specs`.
- Fluxo completo de desenvolvimento orientado a especificações.
- Skills instaláveis no Claude Code.
- Agentes especializados.
- Templates reutilizáveis.
- Validação de consistência.
- Rastreabilidade.
- Modos de governança.
- Adoção em projetos novos e existentes.
- Documentação em português e inglês.
- Instalação por GitHub.
- Processo adequado para contribuições open source.

## 9. Experiência principal do usuário

### 9.1 Inicialização

```
/sdd-kit:init
```

O framework deve: analisar a estrutura do projeto; detectar tecnologias; identificar comandos de build, teste e lint; identificar módulos principais; criar o diretório `.specs`; criar os documentos iniciais; criar a configuração do framework; apresentar um resumo do diagnóstico; solicitar revisão das informações detectadas.

### 9.2 Criação de uma funcionalidade

```
/sdd-kit:new implementar autenticação de usuários
```

O framework deve: criar um identificador; criar o diretório da feature; registrar a solicitação original; elaborar um rascunho da especificação; identificar questões pendentes; definir o status inicial como `DRAFT`.

### 9.3 Clarificação

```
/sdd-kit:clarify 0001-user-authentication
```

O framework deve: ler a especificação; identificar ambiguidades; apresentar perguntas prioritárias; registrar respostas; atualizar requisitos e cenários; marcar dúvidas não resolvidas; atualizar o status para `CLARIFIED` quando os requisitos mínimos estiverem definidos.

### 9.4 Design técnico

```
/sdd-kit:design 0001-user-authentication
```

O framework deve: analisar a arquitetura atual; identificar módulos afetados; criar a solução proposta; definir contratos e interfaces; registrar impactos em banco de dados; registrar riscos; criar ADRs quando necessário; atualizar o status para `DESIGNED`.

### 9.5 Planejamento

```
/sdd-kit:tasks 0001-user-authentication
```

O framework deve: dividir a implementação em tarefas pequenas; ordenar tarefas por dependência; relacionar cada tarefa a requisitos; definir arquivos prováveis; definir testes esperados; identificar tarefas paralelizáveis; atualizar o status da feature.

### 9.6 Aprovação

```
/sdd-kit:approve 0001-user-authentication
```

O framework deve: verificar se não existem bloqueios críticos; validar requisitos obrigatórios; validar design e tarefas; exibir um resumo final; registrar a aprovação; atualizar o status para `APPROVED`.

### 9.7 Implementação

```
/sdd-kit:implement 0001-user-authentication
```

O framework deve: selecionar a próxima tarefa pendente; ler apenas os documentos necessários; implementar dentro do escopo; criar ou atualizar testes; executar validações configuradas; atualizar o status da tarefa; atualizar a matriz de rastreabilidade; interromper em caso de decisão arquitetural não prevista.

### 9.8 Verificação

```
/sdd-kit:verify 0001-user-authentication
```

O framework deve: executar testes; executar lint; executar build; revisar critérios de aceite; comparar implementação e especificação; identificar arquivos não rastreados; identificar requisitos não cobertos; gerar relatório de validação; atualizar o status para `VERIFIED`, quando aprovado.

### 9.9 Arquivamento

```
/sdd-kit:archive 0001-user-authentication
```

O framework deve: verificar se a feature está validada; consolidar decisões; atualizar documentação do projeto; gerar resumo final; mover a mudança para `.specs/archive`; atualizar o índice; definir o status como `ARCHIVED`.

## 10. Escopo funcional do MVP

### RF-001 — Inicializar o framework

O sistema deve criar a estrutura básica do SDD Claude Kit em um projeto.

**Critérios de aceite**

- Deve criar `.specs`.
- Não deve sobrescrever arquivos existentes sem confirmação.
- Deve detectar se o projeto já está inicializado.
- Deve criar uma configuração válida.
- Deve funcionar em projeto vazio ou existente.

### RF-002 — Detectar o contexto do projeto

O sistema deve analisar o projeto e identificar: linguagens; frameworks; gerenciadores de pacote; estrutura de diretórios; comandos de build; comandos de teste; comandos de lint; banco de dados; infraestrutura; padrões de arquitetura; documentação existente.

**Critérios de aceite**

- A detecção deve ser registrada em `.specs/project/context.md`.
- Informações incertas devem ser marcadas como hipótese.
- O sistema não deve alterar código durante a descoberta.

### RF-003 — Criar uma especificação

O sistema deve criar uma nova especificação a partir de uma solicitação em linguagem natural.

Tipos suportados no MVP: feature, bug, refatoração, mudança arquitetural.

**Critérios de aceite**

- Deve criar um identificador único.
- Deve criar um diretório próprio.
- Deve registrar a solicitação original.
- Deve criar requisitos iniciais.
- Deve definir o status como `DRAFT`.

### RF-004 — Gerenciar estados

Cada especificação deve possuir um estado: `DRAFT`, `CLARIFIED`, `DESIGNED`, `PLANNED`, `APPROVED`, `IN_PROGRESS`, `BLOCKED`, `VERIFIED`, `ARCHIVED`, `CANCELLED`.

**Critérios de aceite**

- O estado deve ser armazenado em `status.yaml`.
- Toda mudança de estado deve registrar data e motivo.
- Transições inválidas devem gerar aviso.
- O modo strict poderá impedir transições inválidas.

### RF-005 — Clarificar requisitos

O sistema deve analisar especificações e identificar ambiguidades.

Categorias: regra de negócio; usuários e permissões; entrada e saída; tratamento de erros; segurança; desempenho; compatibilidade; persistência; observabilidade; critérios de aceite.

**Critérios de aceite**

- As perguntas devem ser priorizadas.
- Perguntas não respondidas devem permanecer registradas.
- Decisões devem atualizar a especificação.
- O Claude não deve inventar decisões críticas sem sinalizar a hipótese.

### RF-006 — Criar design técnico

O documento deve conter: contexto; solução proposta; componentes afetados; fluxo de dados; APIs; banco de dados; dependências; segurança; observabilidade; estratégia de testes; migração; rollback; riscos; alternativas consideradas.

**Critérios de aceite**

- O design deve relacionar requisitos.
- Decisões arquiteturais relevantes devem gerar ADR.
- Arquivos e módulos afetados devem ser listados como previsão.
- Hipóteses devem ser identificadas.

### RF-007 — Gerar tarefas

Cada tarefa deve conter: identificador; título; descrição; requisitos relacionados; dependências; arquivos prováveis; testes esperados; critério de conclusão; status; complexidade estimada.

**Critérios de aceite**

- Tarefas devem ser pequenas.
- Uma tarefa deve possuir resultado verificável.
- Tarefas grandes devem ser divididas.
- Dependências devem estar explícitas.
- Cada requisito deve estar associado a pelo menos uma tarefa.

### RF-008 — Registrar aprovação

**Critérios de aceite**

- Deve registrar data e responsável.
- Deve registrar a versão aprovada.
- Alterações importantes após aprovação devem invalidar ou solicitar nova aprovação.
- No modo guided, o sistema deve solicitar aprovação.
- No modo strict, a implementação sem aprovação deve ser bloqueada.

### RF-009 — Implementar por tarefa

**Critérios de aceite**

- Deve carregar apenas o contexto necessário.
- Deve respeitar o escopo definido.
- Deve atualizar o status da tarefa.
- Deve executar os testes relacionados.
- Deve interromper quando encontrar uma decisão não prevista.
- Não deve marcar uma tarefa como concluída sem validação.

### RF-010 — Validar especificações

Validações mínimas: campos obrigatórios; identificadores duplicados; requisitos sem tarefas; tarefas sem requisitos; critérios de aceite ausentes; dependências inválidas; estados inválidos; arquivos referenciados inexistentes; testes não executados; requisitos não cobertos.

### RF-011 — Criar rastreabilidade

```
Requisito
  → Cenário
    → Tarefa
      → Arquivo
        → Teste
```

**Critérios de aceite**

- A rastreabilidade deve ser armazenada em YAML.
- O sistema deve identificar itens órfãos.
- O relatório deve mostrar cobertura por requisito.
- A matriz deve ser atualizada durante a implementação.

### RF-012 — Gerar relatório de status

O relatório deve mostrar: features por estado; tarefas concluídas e pendentes; requisitos cobertos; bloqueios; validações com falha; mudanças em andamento.

### RF-013 — Arquivar especificações

**Critérios de aceite**

- Apenas mudanças verificadas podem ser arquivadas.
- O histórico deve ser preservado.
- O índice geral deve ser atualizado.
- Documentos relevantes do projeto devem ser consolidados.
- O arquivamento não deve apagar decisões.

### RF-014 — Oferecer modos de governança

| Modo | Comportamento |
| --- | --- |
| `advisory` | O Claude recomenda o processo. Nenhuma ação é bloqueada. Specs são opcionais. |
| `guided` | O Claude orienta o fluxo. Solicita aprovação antes de implementar. Emite alertas de inconsistência. |
| `strict` | Hooks bloqueiam operações fora do fluxo. Implementação exige spec aprovada. Validações são obrigatórias. |

O modo padrão deve ser `guided`.

## 11. Skills do MVP

| Skill | Finalidade | Exemplo |
| --- | --- | --- |
| `/sdd-kit:init` | Inicializa o framework | `/sdd-kit:init --mode guided --language pt-BR` |
| `/sdd-kit:discover` | Mapeia um projeto existente | `/sdd-kit:discover` |
| `/sdd-kit:new` | Cria uma mudança | `/sdd-kit:new feature "autenticação de usuários"` |
| `/sdd-kit:spec` | Cria ou melhora os requisitos | `/sdd-kit:spec 0001-user-authentication` |
| `/sdd-kit:clarify` | Identifica e resolve ambiguidades | `/sdd-kit:clarify 0001-user-authentication` |
| `/sdd-kit:design` | Cria o design técnico | `/sdd-kit:design 0001-user-authentication` |
| `/sdd-kit:tasks` | Cria o plano de implementação | `/sdd-kit:tasks 0001-user-authentication` |
| `/sdd-kit:approve` | Aprova a implementação | `/sdd-kit:approve 0001-user-authentication` |
| `/sdd-kit:implement` | Implementa tarefas aprovadas | `/sdd-kit:implement 0001-user-authentication TASK-AUTH-002` |
| `/sdd-kit:verify` | Valida implementação e especificação | `/sdd-kit:verify 0001-user-authentication` |
| `/sdd-kit:review` | Compara código, testes e requisitos | `/sdd-kit:review 0001-user-authentication` |
| `/sdd-kit:status` | Exibe o andamento | `/sdd-kit:status` |
| `/sdd-kit:archive` | Arquiva uma mudança | `/sdd-kit:archive 0001-user-authentication` |

## 12. Agentes especializados

### 12.1 Project Discovery Agent

Analisar o repositório; identificar arquitetura; detectar tecnologias; localizar documentação; mapear módulos; identificar riscos iniciais.

Permissões recomendadas: leitura de arquivos; pesquisa no código; execução de comandos seguros de inspeção; **sem permissão para editar código**.

### 12.2 Requirements Analyst

Criar requisitos; identificar ambiguidades; criar cenários; criar critérios de aceite; manter glossário.

### 12.3 Solution Architect

Criar design técnico; identificar componentes afetados; avaliar alternativas; criar ADRs; identificar riscos arquiteturais.

### 12.4 Task Planner

Dividir o trabalho; ordenar dependências; relacionar tarefas e requisitos; definir critérios de conclusão.

### 12.5 Implementation Agent

Implementar tarefas aprovadas; respeitar escopo; criar testes; atualizar rastreabilidade.

### 12.6 Test Engineer

Criar estratégia de testes; validar critérios de aceite; executar testes; identificar cobertura ausente.

### 12.7 Spec Auditor

Comparar especificação e código; detectar desvios; encontrar requisitos órfãos; avaliar a completude da implementação.

## 13. Estrutura de diretórios `.specs`

```
.specs/
├── config.yaml
├── index.yaml
│
├── project/
│   ├── vision.md
│   ├── constitution.md
│   ├── context.md
│   ├── architecture.md
│   ├── glossary.md
│   └── standards.md
│
├── features/
│   └── 0001-user-authentication/
│       ├── request.md
│       ├── spec.md
│       ├── design.md
│       ├── tasks.md
│       ├── acceptance.md
│       ├── status.yaml
│       ├── validation.md
│       ├── traceability.yaml
│       └── decisions/
│           └── ADR-001-auth-strategy.md
│
├── bugs/
├── refactors/
├── changes/
└── archive/
```

## 14. Estrutura do plugin

```
plugins/sdd-kit/
├── .claude-plugin/
│   └── plugin.json
│
├── skills/
│   ├── init/SKILL.md
│   ├── discover/SKILL.md
│   ├── new/SKILL.md
│   ├── spec/SKILL.md
│   ├── clarify/SKILL.md
│   ├── design/SKILL.md
│   ├── tasks/SKILL.md
│   ├── approve/SKILL.md
│   ├── implement/SKILL.md
│   ├── verify/SKILL.md
│   ├── review/SKILL.md
│   ├── status/SKILL.md
│   └── archive/SKILL.md
│
├── agents/
│   ├── project-discovery.md
│   ├── requirements-analyst.md
│   ├── solution-architect.md
│   ├── task-planner.md
│   ├── implementation-agent.md
│   ├── test-engineer.md
│   └── spec-auditor.md
│
├── hooks/
│   └── hooks.json
│
├── scripts/
│   ├── validate-specs.js
│   ├── update-index.js
│   ├── check-approval.js
│   └── generate-status.js
│
├── templates/
│   ├── config.yaml
│   ├── project/
│   ├── feature/
│   ├── bug/
│   ├── refactor/
│   └── adr/
│
└── schemas/
    ├── config.schema.json
    ├── status.schema.json
    └── traceability.schema.json
```

## 15. Estrutura do repositório

```
sdd-claude-kit/
├── .claude-plugin/marketplace.json
├── plugins/sdd-kit/
├── packages/cli/
├── examples/
│   ├── node-api/
│   ├── python-api/
│   ├── react-app/
│   ├── data-project/
│   └── brownfield-project/
├── docs/
│   ├── pt-BR/
│   └── en/
├── .specs/
├── .github/
│   ├── workflows/
│   ├── ISSUE_TEMPLATE/
│   ├── PULL_REQUEST_TEMPLATE.md
│   └── CODEOWNERS
├── tests/
├── CLAUDE.md
├── README.md
├── CONTRIBUTING.md
├── CODE_OF_CONDUCT.md
├── SECURITY.md
├── CHANGELOG.md
├── ROADMAP.md
├── LICENSE
└── package.json
```

## 16. Modelo de configuração

Arquivo `.specs/config.yaml`:

```yaml
version: 1

project:
  name: example-project
  language: pt-BR
  type: backend

workflow:
  mode: guided
  require_approval: true
  require_tests: true
  require_traceability: true
  allow_parallel_tasks: false

paths:
  source:
    - src
    - app
  tests:
    - tests
    - src/**/*.test.ts
    - src/**/*.spec.ts
  ignored:
    - node_modules
    - dist
    - build
    - coverage
    - .git

validation:
  commands:
    lint: npm run lint
    test: npm test
    build: npm run build

specification:
  scenarios: gherkin
  architecture_decisions: adr
  task_size: small

security:
  hooks_enabled: false
  allow_shell_commands: prompt
```

## 17. Modelo de especificação

Ver `plugins/sdd-kit/templates/feature/spec.md`. Estrutura mínima: Objetivo; Contexto; Escopo (incluído / não incluído); Requisitos funcionais (`REQ-*`) com cenários (`SCN-*`); Requisitos não funcionais (`NFR-*`); Critérios de aceite; Questões pendentes.

## 18. Modelo de tarefas

Ver `plugins/sdd-kit/templates/feature/tasks.md`. Cada tarefa (`TASK-*`) declara: requisitos, dependências, status, descrição, arquivos prováveis, testes esperados e critério de conclusão.

## 19. Modelo de rastreabilidade

Arquivo `traceability.yaml`, relacionando cada requisito a cenários, tarefas, arquivos de implementação e testes.

## 20. Requisitos não funcionais

- **RNF-001 — Compatibilidade**: Windows, Linux, macOS, WSL.
- **RNF-002 — Desempenho**: validações locais rápidas; análise deve ignorar diretórios configurados; não carregar o repositório inteiro sem necessidade.
- **RNF-003 — Segurança**: nenhum segredo em `.specs`; sem envio de dados a serviços próprios; comandos de shell perigosos exigem aprovação; hooks de bloqueio opcionais; política de segurança publicada.
- **RNF-004 — Portabilidade**: formatos abertos; specs legíveis e editáveis sem o plugin; sem dependência de banco de dados.
- **RNF-005 — Extensibilidade**: novas skills, agentes, tipos de especificação, validadores, templates e perfis de projeto.
- **RNF-006 — Manutenibilidade**: código com tipagem; testes automatizados; funções pequenas; baixo acoplamento; schemas versionados; documentação para contribuidores.
- **RNF-007 — Observabilidade**: scripts e hooks devem informar ação executada, resultado, erros, arquivo relacionado e forma sugerida de correção.
- **RNF-008 — Internacionalização**: textos preparados para i18n; idiomas iniciais `pt-BR` e `en`.

## 21. Hooks do MVP

- **21.1 Validação após alteração de specs** — `PostToolUse` → validação estrutural → apresentar erros e avisos.
- **21.2 Proteção antes de editar código** (apenas modo strict) — `PreToolUse` → verificar spec ativa → aprovação → tarefa em execução → permitir ou bloquear.
- **21.3 Validação antes da conclusão** — testes executados; build válido; critérios de aceite avaliados; tarefa atualizada; rastreabilidade atualizada.
- **21.4 Regras de segurança** — hooks desativados por padrão; desativáveis pelo usuário; todos os comandos documentados; comandos configurados pelo projeto tratados como não confiáveis.

## 22. CLI futura

A CLI não será obrigatória no MVP, mas sua arquitetura deverá ser prevista.

Comandos planejados: `sdd init`, `sdd discover`, `sdd new feature`, `sdd validate`, `sdd status`, `sdd trace`, `sdd doctor`, `sdd archive`.

Responsabilidades: criar arquivos; validar schemas; atualizar índices; gerar status; verificar rastreabilidade; fornecer códigos de saída para CI; executar migrações entre versões de schema.

Tecnologia recomendada: TypeScript; Node.js; pacote npm; JSON Schema ou Zod; Vitest; Commander ou CAC.

## 23. Arquitetura técnica recomendada

```
Claude Code
    ↓
SDD Plugin
    ├── Skills
    ├── Agents
    ├── Hooks
    ├── Templates
    └── Scripts
          ↓
      Diretório .specs
          ↓
      Código do projeto
```

| Componente | Responsabilidade |
| --- | --- |
| Skills | Orientar os fluxos |
| Agentes | Tarefas cognitivas especializadas |
| Templates | Padronizar os documentos |
| Scripts | Validações determinísticas |
| Hooks | Executar verificações em momentos específicos |
| CLI | Automação local e integração com CI/CD |

## 24. Estratégia de implementação no Claude Code

O projeto deverá ser implementado utilizando o próprio SDD Claude Kit, mesmo antes da primeira versão estar concluída.

O `CLAUDE.md` do repositório deverá instruir o Claude a: ler o PRD antes de mudanças estruturais; consultar a spec ativa; implementar uma tarefa por vez; não inventar requisitos; registrar hipóteses; criar testes para toda regra implementada; atualizar a rastreabilidade; não modificar arquivos fora do escopo sem justificar; interromper diante de decisões arquiteturais não previstas; executar lint, testes e build antes de concluir.

## 25. Roadmap

| Fase | Entregas |
| --- | --- |
| **0 — Fundação** | Repositório, licença, README, PRD, constituição, arquitetura inicial, estrutura `.specs`, guia de contribuição, código de conduta, política de segurança |
| **1 — Plugin mínimo** | Manifesto do plugin, marketplace, skills `init`/`new`/`spec`/`tasks`, templates iniciais, projeto de exemplo |
| **2 — Fluxo SDD completo** | Skills `clarify`/`design`/`approve`/`implement`/`verify`/`archive`, estados de workflow, rastreabilidade básica |
| **3 — Agentes especializados** | Os 7 agentes da seção 12 |
| **4 — Validação e hooks** | Schemas, validador, atualização automática de índices, modos advisory/guided/strict, hooks opcionais |
| **5 — CLI** | Pacote npm, comandos básicos, testes, integração com CI, relatório de rastreabilidade, migração de schemas |
| **6 — Comunidade** | Documentação em inglês, templates de issue e PR, Discussions, releases, changelog, good first issues, exemplos adicionais |

## 26. Backlog inicial

**Épico 1 — Estrutura do projeto**: TASK-001 criar repositório; TASK-002 licença; TASK-003 estrutura de diretórios; TASK-004 manifesto do plugin; TASK-005 marketplace; TASK-006 configuração de desenvolvimento; TASK-007 pipeline de testes.

**Épico 2 — Estrutura `.specs`**: TASK-008 `config.yaml`; TASK-009 `status.yaml`; TASK-010 `traceability.yaml`; TASK-011 templates; TASK-012 schemas; TASK-013 índice de especificações.

**Épico 3 — Skills**: TASK-014 a TASK-024 (`init`, `discover`, `new`, `spec`, `clarify`, `design`, `tasks`, `approve`, `implement`, `verify`, `archive`).

**Épico 4 — Agentes**: TASK-025 a TASK-031 (descoberta, requisitos, arquitetura, planejamento, implementação, testes, auditor).

**Épico 5 — Validação**: TASK-032 campos obrigatórios; TASK-033 IDs duplicados; TASK-034 requisitos órfãos; TASK-035 tarefas órfãs; TASK-036 estados; TASK-037 relatório de cobertura; TASK-038 hooks opcionais.

**Épico 6 — Documentação**: TASK-039 guia de instalação; TASK-040 tutorial da primeira feature; TASK-041 exemplo greenfield; TASK-042 exemplo brownfield; TASK-043 guia de contribuição; TASK-044 tradução para inglês.

## 27. Critérios de sucesso do MVP

O MVP será considerado concluído quando:

1. O plugin puder ser instalado a partir do GitHub.
2. O usuário puder inicializar `.specs`.
3. O usuário puder criar uma feature.
4. O framework puder gerar requisitos.
5. O framework puder gerar design técnico.
6. O framework puder gerar tarefas.
7. O usuário puder aprovar a implementação.
8. Claude conseguir implementar uma tarefa por vez.
9. A validação identificar specs incompletas.
10. A rastreabilidade relacionar requisitos, tarefas e testes.
11. O usuário puder arquivar uma feature concluída.
12. Existir ao menos um projeto de exemplo completo.
13. A documentação permitir utilização sem suporte externo.
14. Os testes automatizados estiverem aprovados.
15. O plugin funcionar em Windows, Linux, macOS e WSL.

## 28. Métricas do produto

**Adoção**: estrelas, forks, instalações, contribuidores, issues da comunidade, PRs externos.

**Uso**: specs criadas; features arquivadas; percentual de requisitos rastreados; percentual de tarefas validadas; projetos em modo strict.

**Qualidade**: cobertura de testes do framework; bugs após releases; tempo de resolução de issues; percentual de specs válidas; compatibilidade entre plataformas.

**Qualitativas**: clareza da documentação; facilidade de instalação; qualidade das especificações geradas; redução de retrabalho; facilidade para retomar projetos.

> O framework não deverá coletar telemetria no MVP.

## 29. Riscos

| # | Risco | Mitigação |
| --- | --- | --- |
| 1 | Processo excessivamente burocrático | Modo advisory; guided como padrão; templates simples; fluxos rápidos para mudanças pequenas |
| 2 | Skills produzirem resultados inconsistentes | Templates rígidos; checklists; schemas; exemplos; testes de comportamento; separação entre geração por IA e validação determinística |
| 3 | Claude ignorar as specs | Instruções no `CLAUDE.md`; agente de implementação dedicado; hooks no modo strict; validação antes da conclusão |
| 4 | Contexto excessivo | Carregamento sob demanda; uma tarefa por vez; separação de agentes; resumos de arquitetura; índices |
| 5 | Incompatibilidade com atualizações do Claude Code | Versionamento semântico; testes de compatibilidade; camada de abstração; releases frequentes; changelog |
| 6 | Execução insegura de hooks | Hooks desativados por padrão; documentação dos comandos; confirmação explícita; lista de comandos permitidos; modo advisory para novos usuários |
| 7 | Escopo inicial muito grande | Priorizar skills essenciais; adiar CLI; adiar integrações externas; entregar um fluxo completo antes de novos perfis |

## 30. Decisões técnicas iniciais

- **ADR-001 — Distribuição como plugin Claude Code**: instalação simplificada; suporte a skills, agentes e hooks; versionamento pelo GitHub.
- **ADR-002 — Especificações em Markdown e YAML**: Markdown para leitura humana; YAML para configuração, status, índices e rastreabilidade.
- **ADR-003 — CLI opcional**: reduzir barreira de entrada; permitir experimentação rápida; separar inteligência do plugin e validação determinística.
- **ADR-004 — TypeScript para scripts e CLI**: compatibilidade entre plataformas; ecossistema npm; facilidade de contribuição; tipagem; boa integração com JSON e YAML.
- **ADR-005 — Sem telemetria no MVP**: o framework não coletará dados de uso.

## 31. Estratégia de testes

**Unitários**: geração de IDs; validação de status; transições de estado; validação de schemas; atualização de índices; rastreamento; detecção de itens órfãos.

**Integração**: inicialização em projeto vazio; inicialização em projeto existente; criação de feature; fluxo completo até arquivamento; validação de configuração; execução de hooks.

**Compatibilidade**: Ubuntu, Windows, macOS.

**Snapshot**: templates e arquivos gerados.

**Projetos de teste**: API Node.js; API Python; aplicação React; projeto de dados; projeto brownfield.

## 32. Definition of Done

Uma tarefa somente poderá ser concluída quando:

1. O código estiver implementado.
2. Os testes relacionados estiverem aprovados.
3. O lint estiver aprovado.
4. O build estiver aprovado, quando aplicável.
5. A documentação estiver atualizada.
6. A rastreabilidade estiver atualizada.
7. Os critérios de aceite estiverem avaliados.
8. Não existirem erros críticos de validação.
9. A tarefa estiver relacionada a uma especificação.
10. Alterações de arquitetura estiverem documentadas.

## 33. Instrução inicial para o Claude Code

Ver `CLAUDE.md`. Regras obrigatórias: não implementar o que não está no PRD ou na spec ativa; não inventar requisitos; registrar hipóteses; uma tarefa por vez; verificar requisitos, dependências e critérios de aceite antes de implementar; criar ou atualizar testes; atualizar status e rastreabilidade; executar lint, testes e build antes de concluir; não alterar arquivos fora do escopo sem justificar; interromper diante de decisão arquitetural não prevista e propor um ADR; não concluir tarefa com falhas de validação.

## 34. Resultado esperado da primeira versão

Um desenvolvedor deverá conseguir instalar o plugin e executar:

```
/sdd-kit:init
/sdd-kit:new feature "criar cadastro de clientes"
/sdd-kit:clarify 0001-customer-registration
/sdd-kit:design 0001-customer-registration
/sdd-kit:tasks 0001-customer-registration
/sdd-kit:approve 0001-customer-registration
/sdd-kit:implement 0001-customer-registration
/sdd-kit:verify 0001-customer-registration
/sdd-kit:archive 0001-customer-registration
```

Resultando em: especificações versionadas; código implementado; testes relacionados; decisões documentadas; matriz de rastreabilidade; histórico da mudança; relatório final de validação.
