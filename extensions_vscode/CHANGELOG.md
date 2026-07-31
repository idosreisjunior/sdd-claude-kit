# Changelog

Todas as mudanças relevantes desta extensão são registradas aqui.

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
