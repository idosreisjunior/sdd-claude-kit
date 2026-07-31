# Feature: Fundação do projeto e inicialização

- **ID:** 0001-project-foundation
- **Escopo dos identificadores:** FOUND
- **Estado:** ver `status.yaml` — a autoridade é ele
- **Requisitos de produto cobertos:** RF-001 (PRD §11); base para §13.1 e §13.3

---

## Objetivo

Entregar a base executável da extensão VS Code: ativação, Activity Bar,
diagnóstico do workspace e inicialização da estrutura `.specs` — o alicerce sobre
o qual as features 0002–0010 serão construídas.

## Contexto

O produto (PRD) descreve um cockpit visual de SDD sobre o Claude Code. Nada disso
é possível sem a fundação: a extensão precisa ativar, mostrar sua interface e
saber se o projeto atual já usa SDD. A inicialização (RF-001) é a porta de
entrada da Jornada 1 do PRD (§14).

## Escopo

### Incluído

- Ativação da extensão e registro da Activity Bar (seções Projeto e Features).
- Indicador de contexto na status bar (shell; valor real fica na feature 0005).
- Diagnóstico do workspace: `.specs`, Git, Claude Code.
- Comando de inicialização que cria `.specs` sem sobrescrever código.

### Não incluído

- Leitura/renderização das features no painel (feature 0002).
- Execução de ações no Claude Code (feature 0004).
- Estimativa real de tokens (feature 0005).

---

## Requisitos funcionais

### REQ-FOUND-001 — Ativação e Activity Bar

Ao ativar, a extensão deve registrar um container próprio na Activity Bar com as
seções **Projeto** e **Features**, e um item de contexto na status bar.

#### SCN-FOUND-001 — Ativação com Activity Bar visível

DADO um VS Code com a extensão instalada
QUANDO uma janela do editor é aberta
ENTÃO o container "SDD Claude Kit" aparece na Activity Bar
E exibe as seções Projeto e Features.

### REQ-FOUND-002 — Diagnóstico do workspace

A extensão deve detectar, de forma somente-leitura, se o workspace possui
`.specs/config.yaml`, um repositório Git e o Claude Code disponível.

#### SCN-FOUND-002 — Projeto já inicializado

DADO um workspace que contém `.specs/config.yaml`
QUANDO a extensão diagnostica o projeto
ENTÃO marca o projeto como inicializado
E a seção Projeto lista os documentos de `.specs/project`.

#### SCN-FOUND-003 — Projeto não inicializado

DADO um workspace sem `.specs/config.yaml`
QUANDO a extensão diagnostica o projeto
ENTÃO a seção Projeto exibe a ação "Inicializar SDD"
E o indicador de contexto na status bar permanece oculto.

### REQ-FOUND-003 — Inicialização da estrutura `.specs`

A extensão deve oferecer uma ação que cria a estrutura `.specs` (config,
templates, documentos de projeto), exibindo antes a lista de arquivos que serão
criados e sem sobrescrever nenhum arquivo existente.

#### SCN-FOUND-004 — Inicializar mostrando prévia

DADO um workspace sem `.specs`
QUANDO o usuário aciona "Inicializar SDD"
ENTÃO a extensão exibe os arquivos que serão criados
E, após confirmação, cria a estrutura `.specs`
E não altera nenhum arquivo de código existente.

#### SCN-FOUND-005 — Recusar sobrescrita

DADO um workspace que já contém `.specs/config.yaml`
QUANDO o usuário aciona "Inicializar SDD"
ENTÃO a extensão informa que o projeto já está inicializado
E não sobrescreve nenhum arquivo.

### REQ-FOUND-004 — Indicador de contexto (shell)

Quando o projeto está inicializado, a status bar deve exibir um indicador de
contexto com o teto configurado (`sddClaudeKit.context.maxTokens`).

#### SCN-FOUND-006 — Indicador exibe o teto configurado

DADO um projeto inicializado com teto de 200000 tokens
QUANDO a extensão atualiza o diagnóstico
ENTÃO a status bar exibe o indicador com o teto "200k"
E o valor usado aparece como "—" até a feature 0005.

---

## Requisitos não funcionais

### NFR-FOUND-001 — Compatibilidade

A fundação deve funcionar em Windows, Linux e WSL (RNF-002), usando a API de
sistema de arquivos do VS Code (`workspace.fs`) em vez de caminhos do SO.

### NFR-FOUND-002 — Não bloquear o editor

O diagnóstico e a inicialização devem ser assíncronos; nenhuma operação bloqueia
a thread da UI (RNF-001).

### NFR-FOUND-003 — CLI como base

A estrutura `.specs` criada pela extensão deve ser idêntica à do plugin sdd-kit e
continuar utilizável pela CLI, sem a extensão (PRD §7.6).

---

## Critérios de aceite

- [ ] A extensão ativa e a Activity Bar exibe Projeto e Features (SCN-FOUND-001).
- [ ] Projeto com `.specs/config.yaml` é reconhecido como inicializado
      (SCN-FOUND-002).
- [ ] Projeto sem `.specs` oferece "Inicializar SDD" e oculta o indicador
      (SCN-FOUND-003).
- [ ] "Inicializar SDD" mostra prévia, cria `.specs` e não toca em código
      (SCN-FOUND-004).
- [ ] "Inicializar SDD" recusa sobrescrever projeto já inicializado
      (SCN-FOUND-005).
- [ ] A status bar exibe o teto configurado quando inicializado (SCN-FOUND-006).
- [ ] `npm run compile` e `npm run lint` passam após `npm install`.

---

## Questões pendentes

| # | Questão | Bloqueia | Prioridade |
| --- | --- | --- | --- |
| ~~Q1~~ | ~~Como detectar o Claude Code em Windows/Linux/WSL?~~ **RESOLVIDA por ADR-002** (varredura do PATH sem spawn) | — | ~~alta~~ |
| ~~Q2~~ | ~~Embutir templates próprios ou depender do plugin sdd-kit?~~ **RESOLVIDA por ADR-001** (embutir + sync do plugin) | — | ~~crítica~~ |
| ~~Q3~~ | ~~Versão mínima do VS Code — 1.90 é adequada?~~ **RESOLVIDA** (sim; `@types/vscode` fixado em `~1.90.0`, tsc compila contra 1.90.0) | — | ~~média~~ |

**Nenhuma questão em aberto.** Q1→ADR-002, Q2→ADR-001, Q3 confirmada. A mudança
segue em `DRAFT` porque `CLARIFIED`/`DESIGNED` chegam na Fase 2 do plugin sdd-kit.

## Hipóteses assumidas

> HIPÓTESE: a extensão exigirá VS Code >= 1.90 e Node >= 20, conforme o
> `package.json` do scaffold. Sujeita a confirmação em Q3.

> HIPÓTESE: o indicador de contexto usa o formato `SDD Context: — / 200k` na
> fundação, evoluindo para `X% | usado / teto` (PRD §13.3) na feature 0005.
