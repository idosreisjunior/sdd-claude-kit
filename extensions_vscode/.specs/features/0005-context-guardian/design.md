# Design técnico — Context Guardian (incremento RF-012)

- **ID:** 0005-context-guardian
- **Requisitos:** REQ-CTX-001..004, NFR-CTX-001..004
- **Decisões:** ADR-008 (heurística local de tokens)

---

## 1. Contexto

Dar vida ao indicador de contexto (0001 deixou *stub*) e a um comando "Medir contexto". A
config já traz teto e limiares (PRD §23). Este design descreve o núcleo puro (estimar,
classificar, compor) e a borda que coleta os arquivos e pinta a barra de status.

## 2. Solução proposta

Um **módulo puro** (`contextGuardian.ts`) faz estimativa, classificação e composição; a
**borda** (`extension.ts`) coleta os arquivos do fluxo SDD de uma mudança, chama o núcleo e
atualiza a barra de status + uma visão de detalhe. Mesma fronteira do resto da extensão
(standards §6): domínio testável fora do host, API do VS Code na borda.

Fluxo (PRD §13.3, adaptado ao escopo — mede os documentos do fluxo, não a sessão do modelo):

```
1. usuário aciona "Medir contexto" numa feature do painel
2. borda coleta os arquivos: docs de projeto (constitution/architecture/standards)
   + artefatos da mudança (spec/design/tasks que existirem)
3. por arquivo: stat (bytes). Grande (>= limite) → não lê, estima por bytes e sinaliza.
   Pequeno → lê amostra, detecta binário; binário → não conta; texto → estima por chars
4. buildComposition: total, entradas ordenadas (maior→menor), listas de grandes/binários
5. classifyUsage(total, maxTokens, limiares) → faixa
6. barra de status mostra "estimativa + faixa"; visão de detalhe mostra a composição
```

## 3. Componentes afetados

| Arquivo | Papel | Novo/alterado |
| --- | --- | --- |
| `src/sdd/contextGuardian.ts` | Núcleo puro: estimar, classificar, compor, detectar binário | novo |
| `src/test/contextGuardian.test.ts` | Testes (TEST-CTX-001..003) | novo |
| `src/extension.ts` | Comando `measureContext`, coleta de arquivos, barra de status real | alterado |
| `package.json` | Comando + menu de contexto da feature | alterado |

## 4. Contratos (núcleo puro — `contextGuardian.ts`)

```ts
export type Band = 'normal' | 'atencao' | 'risco' | 'bloqueio'
export interface Thresholds { warning: number; risk: number; block: number } // frações
export interface Usage { used: number; max: number; fraction: number; band: Band }

export const LARGE_FILE_BYTES: number                 // limite padrão de "grande"
export function estimateTokens(text: string): number  // ceil(chars/4) (ADR-008)
export function classifyUsage(used: number, max: number, t: Thresholds): Usage
export function isBinary(sample: Uint8Array): boolean  // byte nulo na amostra

export interface ContextFile { path: string; text?: string; bytes: number; binary: boolean }
export interface ContextEntry { path: string; tokens: number; bytes: number; binary: boolean; large: boolean }
export interface Composition { totalTokens: number; entries: ContextEntry[]; large: string[]; binary: string[] }
export function buildComposition(files: ContextFile[], largeBytes?: number): Composition
export function bandLabel(band: Band): string          // rótulo pt-BR
```

- `classifyUsage`: `fraction = max>0 ? used/max : 0`; faixa por `≥` (o valor no limiar entra
  na faixa mais alta). `max<=0` → sem teto → normal.
- `buildComposition`: binário → 0 tokens; texto lido → `estimateTokens(text)`; texto **não
  lido** (grande) → estimativa por bytes (`ceil(bytes/4)`), sem carregar o arquivo. Ordena
  do maior para o menor (tokens, depois bytes, depois path).

## 5. Fluxo de dados

`ChangeEntry.path` → caminhos dos artefatos + docs de projeto → `workspace.fs.stat`/`readFile`
→ `ContextFile[]` → `buildComposition` → `Composition` → `classifyUsage` → `Usage` → barra de
status + visão de detalhe. Nada é gravado.

## 6. Persistência

Nenhuma. A última medição vive em memória (variável de `activate`) só para pintar a barra de
status; não é versionada nem gravada no storage.

## 7. Dependências

Nenhuma nova. Reusa `specsIndex.ts` (`ChangeEntry`) e a config `sddClaudeKit.context.*`. Sem
libs (ADR-008: sem tokenizer nativo).

## 8. Segurança

- **Sem rede, sem telemetria:** a estimativa é local (RNF-003/004; NFR-CTX-001).
- **Arquivos grandes não são carregados por inteiro:** sinalizados por `stat` (NFR-CTX-004) —
  evita puxar binários/artefatos enormes para a memória.
- **Diretórios ignorados** (`config.yaml` / PRD §23) são respeitados na coleta.

## 9. Observabilidade

O valor é sempre exibido como **estimativa** (NFR-CTX-001). A visão de detalhe lista a
composição por arquivo, com grandes/binários marcados. Mensagens em pt-BR (standards §5).

## 10. Estratégia de testes

- **Unitário (fora do host):** `estimateTokens` (SCN-CTX-001), `classifyUsage` nas fronteiras
  (SCN-CTX-002), `buildComposition` com grande/binário e ordenação (SCN-CTX-003), `isBinary`.
  São TEST-CTX-001..003.
- **Host (F5):** "Medir contexto" atualiza a barra e mostra a composição (SCN-CTX-004); leitura
  robusta a arquivo ausente/binário (NFR-CTX-002); arquivo grande sinalizado sem ser lido
  (NFR-CTX-004). Registrado em `evidence.md` e declarado em `gaps`.

## 11. Migração e rollback

Sem migração. Rollback = restaurar o *stub* de `updateContextIndicator` e remover o comando; o
núcleo puro é aditivo e inerte sem a borda.

## 12. Riscos

| # | Risco | Mitigação |
| --- | --- | --- |
| 1 | Estimativa enganar por imprecisão | Rótulo "estimativa" em toda exibição (ADR-008); faixas toleram erro |
| 2 | Ler um binário/enorme e travar a UI | `stat` antes de ler; grande não é lido; binário detectado por amostra (NFR-CTX-004) |
| 3 | Escopo crescer para context packs/sessão real | Cortado na spec; RF-013 e sessão real adiados |

## 13. Alternativas consideradas

| Alternativa | Por que não |
| --- | --- |
| Tokenizer BPE real | ADR-008: dependência pesada, tokenizer do Claude não é público; ainda estimativa |
| Medir a sessão real do Claude Code | Depende de captura (ADR-007, fora de escopo) |
| Estimar sempre lendo o arquivo inteiro | Viola NFR-CTX-004 (arquivo grande não deve ser carregado) |

## 14. Questões fechadas pelo design

- **Q1/A3** → ADR-008 (heurística local rotulada como estimativa).
- **O que é "o contexto"** → os documentos do fluxo SDD da mudança, não a sessão do modelo
  (decisão de escopo, spec §Escopo).

## 15. Ainda em aberto

Nenhuma para este incremento. Context packs (RF-013), sugestão de resumos, separação de
tarefas, limites por modelo e a integração com a sessão real do Claude Code seguem no backlog.
