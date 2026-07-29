---
name: init
description: Inicializa o SDD Claude Kit em um projeto. Detecta linguagem, gerenciador de pacotes e comandos de build, teste e lint, depois cria .specs/ com configuração, índice e documentos de projeto. Use quando o usuário pedir /sdd-kit:init, quiser adotar Spec-Driven Development, ou quiser organizar requisitos e decisões de um projeto em arquivos versionados.
when_to_use: Gatilhos — "inicializar o SDD", "configurar spec-driven development", "criar .specs", "começar a usar o sdd-kit". Funciona em projeto vazio e em projeto existente.
argument-hint: "[--mode advisory|guided|strict] [--language pt-BR|en]"
disable-model-invocation: false
allowed-tools: Read Glob Grep
disallowed-tools: Edit NotebookEdit
---

# /sdd-kit:init — inicializar o framework

Cria a estrutura `.specs/` em um projeto, depois de diagnosticar o que já existe ali.

`disable-model-invocation: false` é deliberado: `init` é o ponto de entrada e precisa ser descoberto por quem ainda não conhece o comando. Ver [ADR-008](../../../../.specs/project/decisions/ADR-008-autoinvocacao-de-skills.md).

## Regras que valem durante toda a execução

Estas não são um passo do procedimento — valem do início ao fim.

1. **Nunca sobrescrever arquivo existente sem confirmação explícita do usuário.** Vale para qualquer arquivo, dentro ou fora de `.specs/`.
2. **Nunca alterar arquivo de código.** A detecção é somente leitura. `Edit` está removido do conjunto de ferramentas justamente para tornar isso mecânico, não apenas uma instrução.
3. **Escrever apenas dentro de `${CLAUDE_PROJECT_DIR}/.specs/`.**
4. **Nunca inventar uma detecção.** Sem evidência direta no repositório, o valor é `null` ou vem marcado como hipótese.
5. **`null` significa NÃO DETECTADO — jamais "aprovado".**
6. **Nenhuma requisição de rede.** Nenhuma etapa desta skill acessa a internet.
7. **Todo texto apresentado ao usuário segue `project.language`.**

## Modo de governança

O modo vem do argumento `--mode`, ou de `guided` como padrão. Ele é gravado em `config.yaml` e governa as skills seguintes.

| Modo | Comportamento desta skill |
| --- | --- |
| `advisory` | Informa o que detectou; **nunca** bloqueia |
| `guided` *(padrão)* | Informa e pede revisão do diagnóstico antes de criar os arquivos |
| `strict` | **Ainda não implementado na Fase 1.** Informe isso ao usuário, grave `mode: strict` em `config.yaml` como ele pediu, e opere como `guided` |

Nunca finja um bloqueio que não existe. Dizer que o modo `strict` impediu algo, quando ele não está implementado, é pior que não ter o modo — cria confiança em uma proteção ausente. O bloqueio efetivo depende dos hooks da Fase 4.

## Arquivos que esta skill lê

Declarados explicitamente para não carregar o repositório inteiro:

| Quando | O quê |
| --- | --- |
| Sempre | `${CLAUDE_PROJECT_DIR}/.specs/config.yaml`, se existir — para detectar projeto já inicializado |
| Sempre | Manifestos na raiz: `package.json`, `pyproject.toml`, `requirements.txt`, `go.mod`, `Cargo.toml`, `pom.xml`, `build.gradle*`, `composer.json`, `Gemfile`, `*.csproj` |
| Sempre | `.gitignore`, para compor a lista de ignorados |
| Se existirem | `Makefile`, `justfile`, `Taskfile.yml`, `.github/workflows/*.yml` — para descobrir comandos |
| Se existirem | `README.md`, `CONTRIBUTING.md`, `CLAUDE.md` — para nome e propósito do projeto |
| Sempre | Listagem de diretórios de primeiro e segundo nível, respeitando os ignorados |
| Ao gerar | `${CLAUDE_PLUGIN_ROOT}/templates/<idioma>/…` |

**Não leia o conteúdo dos arquivos de código-fonte.** A estrutura de diretórios e os manifestos bastam para o diagnóstico. Abrir a árvore inteira contraria o Artigo 7 da constituição e não melhora a detecção.

---

## Procedimento

### 1. Interpretar os argumentos

O texto recebido é `$ARGUMENTS`. **Não existe parsing nativo de flags** — o Claude Code entrega texto bruto, e `argument-hint` é apenas dica de autocomplete. Interprete você mesmo:

| Padrão | Efeito |
| --- | --- |
| `--mode advisory\|guided\|strict` | Define `workflow.mode` |
| `--language pt-BR\|en` | Define `project.language` |
| ausente | `mode: guided`, `language: pt-BR` |

Valor inválido — `--mode strictt`, por exemplo — deve ser **reportado ao usuário**, nunca corrigido em silêncio. Diga qual valor foi recebido, quais são aceitos, e pergunte.

### 2. Verificar se já está inicializado

Se `${CLAUDE_PROJECT_DIR}/.specs/config.yaml` existir, o projeto já está inicializado.

Informe isso, mostre a configuração atual (modo, idioma, comandos de validação) e **pare**. Não recrie, não mescle, não sobrescreva. Ofereça as alternativas: rodar `/sdd-kit:discover` para atualizar apenas o contexto detectado, ou editar `config.yaml` à mão.

Só prossiga com sobrescrita se o usuário pedir explicitamente, e mesmo assim arquivo por arquivo.

### 3. Resolver o idioma dos templates

Verifique se `${CLAUDE_PLUGIN_ROOT}/templates/<idioma>/` existe.

**Se não existir, pare e pergunte.** Não gere documentos em outro idioma silenciosamente. Diga quais idiomas têm templates disponíveis e ofereça: usar um deles, ou interromper. Um documento em idioma diferente do configurado é pior que nenhum documento — parece correto e não é.

### 4. Diagnosticar o projeto

Somente leitura. Nenhuma escrita nesta etapa.

**Ignorados.** `config.yaml` ainda não existe, então use a lista padrão do template mais o que estiver em `.gitignore`.

**Linguagem e gerenciador de pacotes** — por evidência direta:

| Evidência | Conclusão |
| --- | --- |
| `package.json` + `package-lock.json` | Node.js, npm |
| `package.json` + `pnpm-lock.yaml` | Node.js, pnpm |
| `package.json` + `yarn.lock` | Node.js, Yarn |
| `package.json` + `bun.lockb` | Node.js, Bun |
| `pyproject.toml` com `[tool.poetry]` | Python, Poetry |
| `pyproject.toml` com `[tool.uv]` ou `uv.lock` | Python, uv |
| `requirements.txt` | Python, pip |
| `go.mod` | Go |
| `Cargo.toml` | Rust, Cargo |
| `pom.xml` | Java, Maven |
| `build.gradle` / `build.gradle.kts` | Java ou Kotlin, Gradle |
| `composer.json` | PHP, Composer |
| `Gemfile` | Ruby, Bundler |
| `*.csproj` / `*.sln` | C#, .NET |

`package.json` sem lockfile significa Node.js com gerenciador indeterminado — registre a linguagem e marque o gerenciador como hipótese.

**Comandos de build, teste e lint** — apenas com origem identificável:

| Onde procurar | Como |
| --- | --- |
| `package.json` | Chaves em `scripts` |
| `Makefile`, `justfile`, `Taskfile.yml` | Alvos com nome de build, test, lint, check |
| `pyproject.toml` | `[tool.poetry.scripts]`, configuração de pytest, ruff, mypy |
| `.github/workflows/*.yml` | Comandos efetivamente executados no CI |

**Um comando sem origem identificável é hipótese, não detecção.** Na dúvida, registre `null`. `npm test` presumido porque "é um projeto Node" é exatamente o tipo de invenção que o Artigo 2 proíbe — e um comando errado em `config.yaml` faz a verificação reportar sucesso sobre nada.

**Módulos e estrutura.** Diretórios de primeiro e segundo nível, ignorando o que estiver na lista. Identifique candidatos a `paths.source` e `paths.tests`.

**Nome do projeto.** De `package.json`, `pyproject.toml` ou equivalente. Sem manifesto, use o nome do diretório e marque como hipótese.

### 5. Apresentar o diagnóstico e pedir revisão

Antes de escrever qualquer arquivo, mostre o que foi detectado e **peça revisão**. O usuário conhece o projeto melhor que a detecção.

```
Diagnóstico — {nome do projeto}

  Linguagem            {valor}          (detectado: {evidência})
  Gerenciador          {valor}          (detectado: {evidência})
  Código-fonte         {caminhos}
  Testes               {caminhos}
  Build                {comando|não detectado}
  Teste                {comando|não detectado}
  Lint                 {comando|não detectado}

  Hipóteses:
    - {o que foi inferido sem evidência direta}

Modo: {modo}   Idioma: {idioma}

Serão criados 8 arquivos em .specs/. Nenhum arquivo existente será alterado.
Confirma, ou quer corrigir algo antes?
```

Liste as hipóteses separadas das detecções. Se não houver nenhuma, diga isso — é uma afirmação forte e vale registrar.

### 6. Criar a estrutura

Depois da confirmação, a partir de `${CLAUDE_PLUGIN_ROOT}/templates/<idioma>/`:

| Arquivo | Origem |
| --- | --- |
| `.specs/config.yaml` | `config.yaml` |
| `.specs/index.yaml` | `index.yaml` |
| `.specs/project/vision.md` | `project/vision.md` |
| `.specs/project/constitution.md` | `project/constitution.md` |
| `.specs/project/context.md` | `project/context.md` |
| `.specs/project/architecture.md` | `project/architecture.md` |
| `.specs/project/glossary.md` | `project/glossary.md` |
| `.specs/project/standards.md` | `project/standards.md` |

Crie também os diretórios vazios `.specs/features/`, `bugs/`, `refactors/`, `changes/`, `archive/` e `project/decisions/`.

**Preenchimento:**

- Substitua os marcadores `{{NOME}}` pelos valores detectados ou confirmados.
- Remova as linhas `{{guia: …}}` — são instruções para quem preenche, não conteúdo.
- Resolva `{{opcional: …}}` e `{{repetir: …}}` conforme o caso, removendo o marcador.
- **Nenhum `{{` pode sobrar em nenhum arquivo gerado.** Verifique antes de concluir.
- Campos sem informação viram uma questão em aberto ou uma hipótese marcada com `> HIPÓTESE:` — nunca ficam preenchidos com um palpite.
- `context.md` recebe o diagnóstico da etapa 4, com a coluna de confiança preenchida honestamente.
- `constitution.md` vem com dez artigos prontos. Não os reescreva; apresente-os ao usuário e ajuste apenas o que ele pedir.
- `vision.md`, `architecture.md` e `glossary.md` dependem de conhecimento que a detecção não tem. Deixe as seções com marcadores de questão em aberto em vez de preencher com generalidades — um documento cheio de texto genérico é pior que um esqueleto honesto, porque ninguém o revisa.

### 7. Reportar

```
✔ SDD Claude Kit inicializado

  Criados      8 arquivos em .specs/
  Modo         {modo}
  Idioma       {idioma}

  Revise antes de seguir:
    .specs/project/context.md       — {n} hipóteses a confirmar
    .specs/project/vision.md        — seções em aberto
    .specs/config.yaml              — comandos de validação

  Próximo passo:
    /sdd-kit:new feature "descreva o que você quer construir"
```

Se algum comando de validação ficou `null`, diga isso explicitamente e explique a consequência: a verificação vai reportar "não executado", nunca "aprovado".

---

## Erros

Formato conforme `standards.md` §6 — ação, arquivo, causa e correção sugerida:

```
✖ [init] Idioma sem templates disponíveis
  Solicitado: en
  Disponíveis: pt-BR
  Correção: use --language pt-BR, ou contribua com templates/en/ no repositório do plugin.
```

Nunca prossiga com um erro não resolvido apenas para produzir um resultado. Um `.specs/` incompleto ou incorreto é pior que nenhum: as skills seguintes vão confiar nele.
