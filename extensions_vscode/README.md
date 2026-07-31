# SDD Claude Kit — Extensão VS Code

> Cockpit visual de **Spec-Driven Development** para o Claude Code, dentro do VS Code.

Camada de organização, controle, visualização e automação sobre o Claude Code,
o terminal, os arquivos `.specs`, o Git e o código do projeto. **Não** substitui
o Claude Code — o fluxo continua funcionando pela CLI, sem a extensão (PRD §7.6).

A fonte da verdade do produto é [`PRD.md`](./PRD.md). O próprio desenvolvimento
desta extensão é organizado com o método SDD, em [`.specs/`](./.specs/).

---

## Estado atual

**Fundação (feature `0001-project-foundation`).** O esqueleto ativa, registra a
Activity Bar (Projeto e Features), o indicador de contexto na status bar e os
comandos base. Os comportamentos ricos são features próprias, ainda em `DRAFT` —
ver o backlog em [`.specs/index.yaml`](./.specs/index.yaml).

## Desenvolvimento

```bash
npm install          # instala @types/vscode, typescript, eslint…
npm run sync-templates  # embute os templates a partir de plugins/sdd-kit
npm run compile      # tsc -p ./  → out/
npm run lint         # eslint src
npm test             # node --test ./out/test
npm run check-templates # falha se os templates embutidos divergirem da fonte
```

Para depurar: abra esta pasta no VS Code e pressione `F5` (Extension
Development Host).

> Estado da validação: após `npm install`, `compile`, `lint`, `test` e
> `check-templates` passam (exit 0). `node_modules` é ignorado no Git; um clone
> novo precisa de `npm install`.

## Comandos

| Comando | Descrição | Feature |
| --- | --- | --- |
| `SDD: Inicializar projeto` | Cria a estrutura `.specs` (RF-001) | 0001 |
| `SDD: Recarregar` | Recarrega o diagnóstico e as árvores | 0001 |
| `SDD: Nova feature` | Formulário de criação de feature (RF-003) | 0003 |
| `SDD: Abrir no Claude Code` | Integra com o Claude Code (RF-011) | 0004 |

Comandos marcados com features `> 0001` estão registrados mas exibem apenas um
aviso: sua implementação está especificada, não construída. Isso é deliberado —
ver a constituição do projeto, Artigo 1 (spec antes do código).

## Configurações

| Chave | Padrão | O quê |
| --- | --- | --- |
| `sddClaudeKit.context.maxTokens` | `200000` | Teto operacional de contexto (RF-012) |
| `sddClaudeKit.context.warningThreshold` | `0.70` | Faixa de atenção |
| `sddClaudeKit.context.riskThreshold` | `0.85` | Faixa de risco |
| `sddClaudeKit.context.blockThreshold` | `0.95` | Faixa de bloqueio |
| `sddClaudeKit.metrics.telemetry` | `false` | Telemetria (desligada por padrão) |
| `sddClaudeKit.claudeCode.path` | `""` | Caminho do executável do Claude Code (vazio = detectar pelo `PATH`) |

## Licença

[Apache 2.0](./LICENSE)
