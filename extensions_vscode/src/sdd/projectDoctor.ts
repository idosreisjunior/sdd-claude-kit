// Núcleo puro do Project Doctor (feature 0006, RF-002) — sem dependência da API do
// VS Code, para ser testável fora do host (standards §6). A borda (leitura do disco,
// publicação na Diagnostics API) fica em extension.ts.
//
// Por ADR-009: o diagnóstico é puro (recebe um retrato estruturado do projeto e
// devolve uma lista tipada); a borda traduz para vscode.Diagnostic e publica no
// painel Problems. O Doctor APONTA, não corrige (arquitetura §2).

export type Severity = 'error' | 'warning' | 'info'

export interface Diagnostic {
  severity: Severity
  code: string
  message: string
  /** Caminho relativo (sob a raiz) a que o diagnóstico se refere; ausente = projeto. */
  path?: string
  suggestion?: string
}

/** Estados válidos de um status.yaml (plugins/sdd-kit/schemas/status.schema.json). */
export const VALID_STATUSES: readonly string[] = [
  'DRAFT',
  'CLARIFIED',
  'DESIGNED',
  'PLANNED',
  'APPROVED',
  'IN_PROGRESS',
  'BLOCKED',
  'VERIFIED',
  'ARCHIVED',
  'CANCELLED',
]

/** Arquivos obrigatórios de um projeto SDD inicializado (relativos à raiz). */
export const REQUIRED_PROJECT_FILES: readonly string[] = [
  '.specs/config.yaml',
  '.specs/index.yaml',
  '.specs/project/constitution.md',
  '.specs/project/architecture.md',
  '.specs/project/standards.md',
  '.specs/project/vision.md',
  '.specs/project/glossary.md',
]

export interface DoctorChange {
  id: string
  /** Caminho relativo sob .specs (ex.: features/0005-context-guardian). */
  path: string
  /** Status declarado no index.yaml. */
  indexStatus: string
  /** status.yaml existe no disco. */
  hasStatusFile: boolean
  /** Status lido do status.yaml (undefined se ausente/ilegível). */
  diskStatus?: string
  /** spec.md existe. */
  hasSpec: boolean
}

export interface DoctorInput {
  /** Presença de cada arquivo de REQUIRED_PROJECT_FILES (rel -> existe). */
  files: Record<string, boolean>
  /** Mudanças declaradas no index.yaml. */
  changes: DoctorChange[]
  /** Diretórios de mudança encontrados no disco (rel sob .specs, ex.: features/0099-x). */
  diskChangeDirs: string[]
  hasGit: boolean
  claudeCodeAvailable: boolean
}

/**
 * Diagnostica a saúde estrutural do projeto (REQ-PD-001). Puro e determinístico:
 * a mesma entrada dá a mesma lista. Nunca lança.
 */
export function diagnose(input: DoctorInput): Diagnostic[] {
  const out: Diagnostic[] = []

  // 1. Arquivos de projeto obrigatórios.
  for (const file of REQUIRED_PROJECT_FILES) {
    if (input.files[file] === false) {
      out.push({
        severity: 'error',
        code: 'missing-project-file',
        message: `Arquivo obrigatório do projeto ausente: ${file}`,
        path: file,
        suggestion: 'Recrie o arquivo a partir do template (SDD: Inicializar projeto preserva os existentes).',
      })
    }
  }

  // 2. Mudanças do índice.
  const indexedPaths = new Set<string>()
  for (const change of input.changes) {
    indexedPaths.add(change.path)
    const base = change.path || change.id

    if (!change.hasStatusFile) {
      out.push({
        severity: 'error',
        code: 'missing-status',
        message: `Mudança ${change.id} sem status.yaml.`,
        path: `.specs/${base}/status.yaml`,
        suggestion: 'Crie status.yaml a partir do template, em DRAFT.',
      })
    } else if (change.diskStatus === undefined || !VALID_STATUSES.includes(change.diskStatus)) {
      out.push({
        severity: 'error',
        code: 'invalid-status',
        message: `Mudança ${change.id} com status inválido: ${String(change.diskStatus)}.`,
        path: `.specs/${base}/status.yaml`,
        suggestion: `Use um dos estados válidos: ${VALID_STATUSES.join(', ')}.`,
      })
    } else if (change.diskStatus !== change.indexStatus) {
      out.push({
        severity: 'warning',
        code: 'status-mismatch',
        message: `Status divergente em ${change.id}: index.yaml diz "${change.indexStatus}", status.yaml diz "${change.diskStatus}".`,
        path: '.specs/index.yaml',
        suggestion: 'Reconcilie o index.yaml com o status.yaml da mudança (a autoridade é o status.yaml).',
      })
    }

    if (!change.hasSpec) {
      out.push({
        severity: 'warning',
        code: 'missing-spec',
        message: `Mudança ${change.id} sem spec.md.`,
        path: `.specs/${base}/spec.md`,
        suggestion: 'Crie a spec (formulário Nova feature ou /sdd-kit:spec).',
      })
    }
  }

  // 3. Diretórios de mudança no disco não registrados no índice.
  for (const dir of input.diskChangeDirs) {
    if (!indexedPaths.has(dir)) {
      out.push({
        severity: 'warning',
        code: 'orphan-change',
        message: `Diretório de mudança não registrado no índice: ${dir}.`,
        path: '.specs/index.yaml',
        suggestion: 'Registre a mudança no index.yaml ou remova o diretório.',
      })
    }
  }

  // 4. Ambiente.
  if (!input.hasGit) {
    out.push({
      severity: 'warning',
      code: 'no-git',
      message: 'Projeto sem repositório Git.',
      path: '.specs/index.yaml',
      suggestion: 'Rode "git init" para versionar as specs junto do código.',
    })
  }
  if (!input.claudeCodeAvailable) {
    out.push({
      severity: 'info',
      code: 'no-claude-code',
      message: 'Claude Code não detectado.',
      path: '.specs/index.yaml',
      suggestion: 'Instale a CLI ou configure "sddClaudeKit.claudeCode.path".',
    })
  }

  return out
}
