# Design técnico — Claude Code Adapter (incremento RF-011)

- **ID:** 0004-claude-code-adapter
- **Requisitos:** REQ-CC-001..003, NFR-CC-001..003
- **Decisões:** ADR-007 (captura de resultado fora do incremento); reusa ADR-002 (detecção)

---

## 1. Contexto

Ligar o painel Features ao Claude Code. A detecção da CLI já existe (`claudeCode.ts`,
ADR-002) e o comando `sddClaudeKit.openInClaudeCode` já está registrado como *stub*. Este
design descreve o núcleo puro (compor prompt, citar caminho) e a borda (clipboard,
terminal, detecção) que substitui o *stub*.

## 2. Solução proposta

Uma **função pura** compõe o prompt e cita o caminho da CLI; a **borda** (`extension.ts`)
coleta a mudança do nó do painel, pergunta a ação, copia o prompt e abre o terminal. Segue
a fronteira já usada em toda a extensão (standards §6): domínio testável fora do host, API
do VS Code confinada à borda.

Fluxo (PRD §13.2, adaptado ao escopo enxuto — sem a prévia de tamanho, que é 0005):

```
1. usuário aciona "Abrir no Claude Code" numa feature do painel
2. extensão resolve a mudança do nó (featureChangeOf)
3. usuário escolhe uma ação SDD (QuickPick: rótulo + objetivo)
4. extensão compõe o prompt: /sdd-kit:<ação> <id>   (claudePrompt, puro)
5. extensão copia o prompt para a área de transferência
6. detecção da CLI (claudeCode.ts, com env do host):
   - detectada  → abre/reutiliza terminal, inicia a CLI, digita o prompt (sem enviar)
   - ausente    → mantém o prompt copiado e orienta a configurar/instalar
```

## 3. Componentes afetados

| Arquivo | Papel | Novo/alterado |
| --- | --- | --- |
| `src/sdd/claudePrompt.ts` | Núcleo puro: ações, `composePrompt`, `quoteCliPath`, `buildLaunchCommand` | novo |
| `src/test/claudePrompt.test.ts` | Testes do núcleo (TEST-CC-001, TEST-CC-002) | novo |
| `src/extension.ts` | `openInClaudeCode` real: QuickPick, clipboard, detecção, terminal | alterado |
| `src/sdd/claudeCode.ts` | Detecção (reuso; sem alteração) | — |
| `package.json` | Ação `openInClaudeCode` no menu de contexto da feature | alterado |

## 4. Contratos (núcleo puro — `claudePrompt.ts`)

```ts
export type SddAction =
  | 'spec' | 'clarify' | 'design' | 'tasks' | 'implement' | 'verify'

export interface ActionDef {
  id: SddAction
  label: string       // pt-BR, para o QuickPick
  objective: string   // pt-BR, o "objetivo" do §13.2
}

export const ACTIONS: readonly ActionDef[]

export function actionDef(id: string): ActionDef | undefined
export function composePrompt(action: SddAction, changeId: string): string  // `/sdd-kit:<action> <id>`
export function quoteCliPath(path: string): string      // cita se tiver espaço; escapa aspas
export function buildLaunchCommand(cliPath: string): string  // comando para iniciar a CLI no terminal
```

- `composePrompt` não valida o id (o id vem do índice, já validado por 0002); apenas monta o
  texto. Ação fora de `ACTIONS` não é oferecida (o QuickPick lista `ACTIONS`) — e
  `actionDef` devolve `undefined` para entrada desconhecida (SCN-CC-004).
- `quoteCliPath`: envolve em aspas duplas quando há espaço ou aspa; escapa `"` embutida. É a
  citação do **caminho** — não montamos outra sintaxe de shell (NFR-CC-002).

## 5. Fluxo de dados

`ChangeEntry` (de `specsIndex`, já lido pelo painel) → `change.id` → `composePrompt`. O
prompt é string; vai ao clipboard (`vscode.env.clipboard.writeText`) e ao terminal
(`terminal.sendText(prompt, false)` — sem `\n`, para revisão). A CLI é iniciada com
`terminal.sendText(buildLaunchCommand(path))` (com `\n`), na raiz do workspace
(`createTerminal({ cwd })`).

## 6. Persistência

Nenhuma. Nada é gravado em `.specs/` nem no storage do VS Code neste incremento. O terminal
é efêmero; o clipboard é do SO.

## 7. Dependências

Nenhuma nova. Reusa `claudeCode.ts` (detecção) e `specsIndex.ts` (`ChangeEntry`). Sem libs.

## 8. Segurança

- **Nada executado sem ação humana:** a CLI é iniciada; a **ação SDD** é apenas digitada,
  nunca enviada (NFR-CC-001; ADR-007). Iniciar a CLI é o que o usuário pediu ao acionar a
  ação; disparar a ação de conteúdo, não.
- **Config como não confiável:** `claudeCode.path` é tratado como caminho e citado
  (`quoteCliPath`); não montamos linha de shell a partir de config (Art. 9; NFR-CC-002).
- **Sem rede:** nenhum dado sai da máquina além do que o usuário enviar no seu terminal.

## 9. Observabilidade

Mensagens de usuário (pt-BR) informam o que foi copiado e o estado da detecção. Erros seguem
o padrão de mensagem (standards §6): ação, resultado, correção sugerida.

## 10. Estratégia de testes

- **Unitário (fora do host):** `composePrompt` (SCN-CC-001), conjunto fechado de ações
  (SCN-CC-004), `quoteCliPath`/`buildLaunchCommand` (NFR-CC-002). São TEST-CC-001/002.
- **Host (F5):** copiar prompt (SCN-CC-002), abrir terminal com a CLI (SCN-CC-003),
  degradação sem CLI (SCN-CC-005), e a garantia de que a ação **não** é enviada
  (NFR-CC-001). Registrado em `evidence.md`. Integração com terminal/clipboard/detecção não
  é testável fora do host — declarado em `gaps`.

## 11. Migração e rollback

Sem migração. Rollback = restaurar o *stub* de `openInClaudeCode`; o núcleo puro é aditivo e
inerte sem a borda.

## 12. Riscos

| # | Risco | Mitigação |
| --- | --- | --- |
| 1 | `sendText` pré-digitado ser enviado sem querer (usuário aperta Enter achando ser outra coisa) | O prompt copiado é a fonte de verdade; a mensagem diz "revise e pressione Enter para enviar". A ação SDD, se enviada, ainda passa pelo próprio fluxo do Claude Code (que pede aprovação onde exige) |
| 2 | Caminho da CLI com espaço/aspas quebrar o start | `quoteCliPath` + teste de citação (TEST-CC-002) |
| 3 | Escopo crescer para captura de resultado | Cortado por ADR-007; A2 resolvida e adiada a 0008 |

## 13. Alternativas consideradas

| Alternativa | Por que não |
| --- | --- |
| Montar o "prompt da feature" com o contexto/arquivos já aqui | É o Context Guardian (0005); traria estimativa de tokens e seleção — fora do incremento |
| Enviar a ação automaticamente | Viola "humano no controle" (Art. 9); ver ADR-007 |
| Capturar stdout do terminal | A2 → ADR-007: API estável não expõe; adiado a 0008 |

## 14. Questões fechadas pelo design

- **Q1/A2** → ADR-007 (captura fora do incremento; fire-and-forget + humano no controle).
- **Prompt = comando da ação** (não o contexto montado) → decisão de escopo (spec §Escopo).

## 15. Ainda em aberto

Nenhuma para este incremento. A prévia de tamanho de contexto (0005), a captura de resultado
(0008) e as demais ações do RF-011 (research, review, evidências) seguem no backlog.
