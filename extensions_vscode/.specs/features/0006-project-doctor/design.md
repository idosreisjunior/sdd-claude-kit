# Design técnico — Project Doctor (incremento RF-002)

- **ID:** 0006-project-doctor
- **Requisitos:** REQ-PD-001..002, NFR-PD-001..003
- **Decisões:** ADR-009 (superfície = Diagnostics API / Problems)

---

## 1. Contexto

Verificar a saúde estrutural de `.specs` e apontar no painel Problems. A fundação já sabe se
há `.specs`/Git/Claude Code (0001) e a leitura do índice existe (0002). Este design descreve o
núcleo puro de diagnóstico e a borda que coleta o retrato do disco e publica na Diagnostics API.

## 2. Solução proposta

Um **módulo puro** (`projectDoctor.ts`) recebe um retrato estruturado do projeto e devolve
`Diagnostic[]` tipados; a **borda** (`extension.ts`) monta o retrato (fs), traduz para
`vscode.Diagnostic` e publica numa `DiagnosticCollection`. Mesma fronteira do resto da
extensão (standards §6): domínio testável fora do host, API do VS Code na borda.

```
1. usuário aciona "Diagnosticar projeto" (painel Projeto / paleta)
2. borda coleta: arquivos obrigatórios (stat), mudanças do index (parseChanges),
   status em disco de cada mudança (parseStatusField), spec.md (stat),
   diretórios de mudança no disco, hasGit, claudeCodeAvailable
3. diagnose(retrato) → Diagnostic[]  (puro)
4. borda limpa a coleção e a repovoa, ancorando cada diagnóstico a um arquivo
5. revela o painel Problems
```

## 3. Componentes afetados

| Arquivo | Papel | Novo/alterado |
| --- | --- | --- |
| `src/sdd/projectDoctor.ts` | Núcleo puro: `diagnose`, constantes, tipos | novo |
| `src/sdd/specsIndex.ts` | `parseStatusField` (lê o `status:` de um status.yaml) | alterado (aditivo) |
| `src/test/projectDoctor.test.ts` | Testes (TEST-PD-001..003) | novo |
| `src/test/specsIndex.test.ts` | Casos de `parseStatusField` | alterado (aditivo) |
| `src/extension.ts` | Comando `runDoctor`, DiagnosticCollection, coleta do retrato | alterado |
| `package.json` | Comando + menu (painel Projeto) | alterado |

## 4. Contratos (núcleo puro — `projectDoctor.ts`)

```ts
export type Severity = 'error' | 'warning' | 'info'
export interface Diagnostic {
  severity: Severity
  code: string        // ex.: 'missing-status'
  message: string     // pt-BR
  path?: string       // rel sob a raiz; ausente = projeto (âncora no index.yaml)
  suggestion?: string
}

export const VALID_STATUSES: readonly string[]         // os 10 estados de status.schema.json
export const REQUIRED_PROJECT_FILES: readonly string[] // config, index, constitution, ...

export interface DoctorChange {
  id: string
  path: string          // rel sob .specs (ex.: features/0005-context-guardian)
  indexStatus: string
  hasStatusFile: boolean
  diskStatus?: string
  hasSpec: boolean
}
export interface DoctorInput {
  files: Record<string, boolean>   // REQUIRED_PROJECT_FILES → existe
  changes: DoctorChange[]
  diskChangeDirs: string[]         // rel sob .specs
  hasGit: boolean
  claudeCodeAvailable: boolean
}
export function diagnose(input: DoctorInput): Diagnostic[]
```

Regras de `diagnose` (em ordem):

1. arquivo obrigatório com `files[f] === false` → **error** `missing-project-file`.
2. por mudança: sem `status.yaml` → **error** `missing-status`; senão status ∉ válidos →
   **error** `invalid-status`; senão `diskStatus !== indexStatus` → **warning**
   `status-mismatch`; `!hasSpec` → **warning** `missing-spec`.
3. diretório em `diskChangeDirs` fora dos `path` do índice → **warning** `orphan-change`.
4. `!hasGit` → **warning** `no-git`. `!claudeCodeAvailable` → **info** `no-claude-code`.

## 5. Fluxo de dados

`index.yaml` → `parseChanges` → para cada mudança: `status.yaml` → `parseStatusField`,
`spec.md` → `stat`; `REQUIRED_PROJECT_FILES` → `stat`; diretórios de `.specs/{features,bugs,
refactors,changes,archive}` → nomes `NNNN-*` → `DoctorInput` → `diagnose` → `Diagnostic[]` →
`vscode.Diagnostic` por arquivo → `DiagnosticCollection`. Nada é gravado.

## 6. Persistência

Nenhuma no disco. A `DiagnosticCollection` vive no host e é limpa/repovoada a cada execução.

## 7. Dependências

Nenhuma nova. Reusa `specsIndex` (parse), `detection`/`detectProject` (Git), `claudeCode`
(detecção). Sem libs além do js-yaml já presente (ADR-003).

## 8. Segurança

- **Somente leitura** (NFR-PD-001): nenhum arquivo é alterado.
- **Sem rede, sem telemetria.** A detecção do Claude Code não executa processo (ADR-002).
- Diretórios ignorados (`config.yaml`) não são varridos como mudanças.

## 9. Observabilidade

Cada diagnóstico traz ação/arquivo/correção (standards §6, mensagens de erro). A coleção usa
`source: 'SDD Doctor'` para distinguir dos linters no Problems.

## 10. Estratégia de testes

- **Unitário (fora do host):** `diagnose` — saudável → vazio/só info (SCN-PD-001); sem status,
  status inválido, divergência (SCN-PD-002/003); órfão e arquivo ausente (SCN-PD-004/005);
  no-git/no-claude. `parseStatusField` — lê o status, robusto a YAML inválido. São
  TEST-PD-001..003.
- **Host (F5):** os diagnósticos aparecem no Problems ancorados aos arquivos, e rodar de novo
  não duplica (SCN-PD-006). Registrado em `evidence.md` e declarado em `gaps`.

## 11. Migração e rollback

Sem migração. Rollback = remover o comando e a coleção; o núcleo puro é aditivo e inerte.

## 12. Riscos

| # | Risco | Mitigação |
| --- | --- | --- |
| 1 | Diagnóstico "de projeto" sem arquivo natural | Ancorar ao `index.yaml` (ADR-009) |
| 2 | Falso positivo por leitura frouxa de status | `parseStatusField` robusto; status ausente vira `missing-status`, não exceção |
| 3 | Escopo crescer para semântico/Git | Cortado na spec; 0007/0008 nomeados |

## 13. Alternativas consideradas

| Alternativa | Por que não |
| --- | --- |
| TreeView/webview próprios | ADR-009: menos idiomático que o Problems, mais trabalho |
| Diagnóstico contínuo (no watcher) | Fora do escopo; o comando sob demanda basta e é previsível |
| Auto-corrigir problemas | Arquitetura §2: o Doctor aponta, não corrige |

## 14. Questões fechadas pelo design

- **Q1** → ADR-009 (Diagnostics API / Problems).
- **Recorte estrutural** (semântico → 0008, Git → 0007) → decisão de escopo (spec).

## 15. Ainda em aberto

Nenhuma para este incremento. Checagens semânticas (0008), riscos de Git (0007) e verificação
de links Markdown seguem no backlog.
