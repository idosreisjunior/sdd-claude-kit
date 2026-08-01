# Changelog

Todas as mudanças relevantes desta extensão são registradas aqui.

## [0.0.6] — não lançado

### Adicionado

- Comando **"Navegar rastreabilidade"** (feature 0007, incremento 2): a partir de uma
  feature, um QuickPick de requisitos → dos artefatos ligados (cenário/tarefa/arquivo/
  teste), abrindo o artefato — `spec.md`/`tasks.md` na linha do identificador, o arquivo,
  ou uma busca no workspace para testes. Somente leitura (RF-015).
- Comando **"Sugerir commit (Git)"** (feature 0007, incremento 3): sugere um nome de branch
  (`<prefixo>/<id>`) e uma mensagem de commit conventional (`<tipo>: <título> (<NNNN>)`)
  para a mudança, com botões Copiar. **Nunca executa git** (RF-018).

Com isso a feature 0007 (Git e rastreabilidade) cobre os três RFs (014/015/018): os três
comandos — Verificar escopo, Navegar rastreabilidade e Sugerir commit — estão disponíveis.

## [0.0.5] — não lançado

### Adicionado

- Comando **"Verificar escopo (Git)"** (feature 0007, incremento 1): a partir de uma
  feature no painel Features, compara os arquivos alterados (lidos do Git) com os
  arquivos prováveis da tarefa em andamento e alerta sobre arquivos não previstos,
  sensíveis, remoções, diff acima do limite e dependências novas. Os alertas aparecem
  no canal "SDD · Escopo". Adapter de Git **somente leitura** (ADR-011) — nunca
  escreve no repositório. Config `sddClaudeKit.scope.*` (globs sensíveis, limites,
  manifestos).

## [0.0.4] — não lançado

### Corrigido

- Painel **Projeto** (webview) renderizava sem estilo — cartões sem borda nem cor.
  A CSP `default-src 'none'` bloqueava as variáveis de tema (`--vscode-*`) que o VS
  Code injeta num `WebviewView`. Correção: liberar `webview.cspSource` no `style-src`
  (e `img-src`), mantendo o nonce para os estilos próprios (feature 0013).

## [0.0.3] — não lançado

### Alterado

- Painel **Projeto** deixa de ser uma lista de links e passa a um resumo vivo
  (feature 0013, ADR-010): agora é um `WebviewView` com cartões de **saúde
  estrutural** (Project Doctor), **contexto** (Context Guardian, com barra e faixa)
  e **contadores de mudanças por status** na ordem do fluxo SDD; os documentos de
  projeto seguem acessíveis abaixo. Somente leitura, CSP com nonce, sem rede.
- Clicar numa feature no painel **Features** abre o **dashboard visual** (antes
  abria o `spec.md` em texto); o editor visual de spec passa a ser o padrão ao
  abrir um `spec.md`.
- Painéis com *welcome views* clicáveis quando vazios (Inicializar SDD / Nova feature).

## [0.0.2] — não lançado

### Alterado

- Novo ícone da Activity Bar: um documento de especificação (SDD, spec-first) com
  uma faísca de IA, no lugar do documento genérico. Monocromático (currentColor),
  legível a 24px em temas claro e escuro.

> As features entregues desde 0.0.1 (adapter do Claude Code — 0004; Context
> Guardian — 0005; editor de spec — 0012) são rastreadas em `.specs/`; este
> changelog será consolidado na etapa de publicação (Épico 10).

## [0.0.1] — não lançado

### Adicionado

- Esqueleto da extensão: ativação, Activity Bar (Projeto e Features),
  indicador de contexto na status bar e comandos base.
- Estrutura SDD do próprio projeto em `.specs/`, com o backlog do MVP derivado
  do PRD e a feature `0001-project-foundation` especificada e decomposta em
  tarefas.
- Sincronização dos templates embutidos a partir de `plugins/sdd-kit/templates`
  (`sync-templates`/`check-templates`), com verificação de frescor no CI (ADR-001).
- Comando "Inicializar SDD" (`sddClaudeKit.initProject`): cria a estrutura
  `.specs` com prévia, confirmação, sem sobrescrever arquivos existentes.
- Harness de testes `node:test` com a lógica pura da inicialização e do detector
  do workspace coberta (9 testes).
- Detector do workspace isolado da API do VS Code (`detection.ts`), com probe
  injetável — testável sem o host do editor.
- Detecção do Claude Code por varredura do `PATH` (sem executar processo), com
  suporte a `PATHEXT` no Windows e override `sddClaudeKit.claudeCode.path`
  (ADR-002). Coberta por 7 testes.
- Configurações de debug (`.vscode/launch.json` e `tasks.json`): "Executar
  extensão" (Extension Development Host) e "Testes (node --test)".
- `engines.vscode` mínimo confirmado em `^1.90.0`, com `@types/vscode` fixado em
  `~1.90.0` para alinhar a superfície de tipos ao mínimo declarado (Q3).
- Painel **Features** funcional: lê `.specs/index.yaml`, agrupa as mudanças por
  status e abre a `spec.md` ao clicar (feature 0002, RF-004). Leitura robusta a
  YAML inválido. Parser: `js-yaml` (ADR-003). Coberto por 5 testes.
