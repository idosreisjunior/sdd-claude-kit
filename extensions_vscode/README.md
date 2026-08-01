# SDD Claude Kit — Extensão VS Code

[![Version](https://img.shields.io/visual-studio-marketplace/v/idosreisjunior.sdd-claude-kit-vscode?label=Marketplace)](https://marketplace.visualstudio.com/items?itemName=idosreisjunior.sdd-claude-kit-vscode)
[![CI](https://github.com/idosreisjunior/sdd-claude-kit/actions/workflows/ci.yml/badge.svg)](https://github.com/idosreisjunior/sdd-claude-kit/actions/workflows/ci.yml)
[![License](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](./LICENSE)

> Cockpit visual de **Spec-Driven Development** para o Claude Code, dentro do VS Code.

Camada de organização, visualização e automação sobre o Claude Code, o terminal, os arquivos
`.specs/`, o Git e o código do projeto. **Não substitui** o Claude Code — o fluxo continua
funcionando pela CLI, sem a extensão (PRD §7.6). O próprio desenvolvimento desta extensão é
organizado com o método SDD, em [`.specs/`](./.specs/).

---

## Recursos

- **Activity Bar SDD** — painel **Projeto** (resumo vivo: saúde do Project Doctor, contexto e
  contadores de mudanças) e painel **Features** (mudanças agrupadas por status).
- **Dashboard da feature** — cartões de progresso, requisitos, cenários, tarefas e testes.
- **Editor de spec** visual para `spec.md`.
- **Context Guardian** — estima o contexto e alerta por faixas.
- **Project Doctor** — diagnóstico estrutural do projeto no painel Problems.
- **Git & rastreabilidade** — verificar escopo, navegar requisito→teste→commit, sugerir commit.
- **Validação & evidências** — classificar requisitos e reunir evidências.
- **Métricas locais** — por feature, sem telemetria.

## Requisitos

- VS Code `^1.90.0`.
- [Claude Code](https://claude.com/claude-code) instalado (opcional; detectado pelo `PATH` ou
  configurável em `sddClaudeKit.claudeCode.path`).

## Comandos

Disponíveis na paleta (`SDD:`) e no menu de contexto de uma feature no painel **Features**.

| Comando | O quê | Feature |
| --- | --- | --- |
| `SDD: Inicializar projeto` | Cria a estrutura `.specs/` | 0001 |
| `SDD: Nova feature` | Formulário de criação de mudança | 0002 |
| `SDD: Abrir dashboard` | Dashboard da feature | 0003 |
| `SDD: Editar spec` | Editor visual do `spec.md` | 0012 |
| `SDD: Abrir no Claude Code` | Compõe o prompt e abre o terminal | 0004 |
| `SDD: Medir contexto` | Estima o contexto da feature | 0005 |
| `SDD: Diagnosticar projeto` | Project Doctor → painel Problems | 0006 |
| `SDD: Verificar escopo (Git)` | Alerta mudanças fora do escopo | 0007 |
| `SDD: Navegar rastreabilidade` | Requisito → cenário/tarefa/arquivo/teste | 0007 |
| `SDD: Sugerir commit (Git)` | Sugere branch e mensagem (não commita) | 0007 |
| `SDD: Validar mudança` | Classifica cada requisito | 0008 |
| `SDD: Coletar evidências` | Reúne evidências num `evidence.md` | 0008 |
| `SDD: Métricas da feature` | Métricas locais + exportação MD/JSON | 0009 |

## Configurações

| Chave | Padrão | O quê |
| --- | --- | --- |
| `sddClaudeKit.context.maxTokens` | `200000` | Teto de contexto (RF-012) |
| `sddClaudeKit.context.warningThreshold` | `0.70` | Faixa de atenção |
| `sddClaudeKit.context.riskThreshold` | `0.85` | Faixa de risco |
| `sddClaudeKit.context.blockThreshold` | `0.95` | Faixa de bloqueio |
| `sddClaudeKit.claudeCode.path` | `""` | Caminho do Claude Code (vazio = `PATH`) |
| `sddClaudeKit.scope.sensitiveGlobs` | `.env, *.pem, *.key, id_rsa…` | Arquivos sensíveis (RF-014) |
| `sddClaudeKit.scope.maxLines` | `400` | Limite de linhas do diff |
| `sddClaudeKit.scope.maxFiles` | `20` | Limite de arquivos alterados |
| `sddClaudeKit.scope.dependencyManifests` | `package.json…` | Manifestos de dependência |
| `sddClaudeKit.metrics.enabled` | `true` | Coleta local de métricas (RNF-004) |
| `sddClaudeKit.metrics.telemetry` | `false` | Telemetria (desligada por padrão) |

## Privacidade

Sem telemetria obrigatória. As métricas ficam **locais** (por-workspace) e são desativáveis por
`sddClaudeKit.metrics.enabled`. Nada é enviado para fora; a extensão não faz I/O de rede.

## Desenvolvimento

```bash
npm install
npm run sync-templates   # embute os templates a partir de plugins/sdd-kit
npm run compile          # tsc -p ./ → out/
npm run lint             # eslint src
npm test                 # node --test ./out/test
```

Para depurar: abra a pasta `extensions_vscode/` no VS Code e pressione `F5`.

## Publicação (mantenedor)

O empacotamento e a publicação são preparados na feature 0010. **Passos manuais** do mantenedor:

1. Criar o **ícone PNG** do Marketplace (128×128) em `resources/icon.png` e referenciá-lo no
   campo `"icon"` do `package.json` (o SVG da Activity Bar não serve como ícone de Marketplace).
2. Ter uma conta de **publisher** (`idosreisjunior`) no Marketplace e no Open VSX.
3. Gerar os tokens e cadastrá-los como **segredos do repositório**: `VSCE_PAT` (Marketplace) e
   `OVSX_PAT` (Open VSX).
4. **Publicar um GitHub Release** — o workflow `.github/workflows/publish.yml` empacota e publica
   nos dois registros. Sem os segredos, os passos abortam sem publicar.

Empacotar localmente: `npx @vscode/vsce package`.

## Licença

[Apache 2.0](./LICENSE)
