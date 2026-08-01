// Núcleo puro do painel Projeto (feature 0013, REQ-PROJ-001..004) — sem dependência
// da API do VS Code, para ser testável fora do host (standards §6). A borda (leitura
// do disco, webview) fica no provider e em extension.ts.
//
// Por ADR-010: o painel é um webview; este módulo monta um modelo estruturado a
// partir de entradas já coletadas (último resultado do Doctor, última medição do
// contexto, índice, presença dos docs) e o render puro vive em projectOverviewHtml.ts.
// Robustez (NFR-PROJ-002): entrada ausente/inválida vira estado informativo, nunca
// exceção. Este módulo nunca lança.
import type { Severity } from './projectDoctor'
import type { Usage } from './contextGuardian'
import type { ChangeEntry } from './specsIndex'

/** Resumo do último diagnóstico do Doctor. */
export interface DoctorHealth {
  errors: number
  warnings: number
  info: number
}

/** Documentos de projeto, na ordem de exibição (espelha o painel anterior). */
export const PROJECT_DOCS: ReadonlyArray<{ label: string; relPath: string }> = [
  { label: 'Visão geral', relPath: '.specs/project/vision.md' },
  { label: 'Constituição', relPath: '.specs/project/constitution.md' },
  { label: 'Arquitetura', relPath: '.specs/project/architecture.md' },
  { label: 'Padrões', relPath: '.specs/project/standards.md' },
  { label: 'Configurações', relPath: '.specs/config.yaml' },
]

/**
 * Ordem dos status no painel = fluxo SDD (D-Q4). Espelha o enum de estados de
 * status.schema.json. Status desconhecidos são exibidos ao final, preservando o
 * dado sem quebrar a ordem.
 */
export const STATUS_ORDER: readonly string[] = [
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

export type HealthCard =
  | { kind: 'not-run' }
  | { kind: 'clean' }
  | { kind: 'problems'; errors: number; warnings: number; info: number }

export type ContextCard =
  | { kind: 'not-measured'; max: number }
  | { kind: 'measured'; used: number; max: number; fraction: number; band: Usage['band'] }

export type CountsCard =
  | { kind: 'no-index' }
  | { kind: 'counts'; total: number; byStatus: ReadonlyArray<{ status: string; count: number }> }

export interface DocLink {
  label: string
  relPath: string
  exists: boolean
}

export interface ProjectOverview {
  health: HealthCard
  context: ContextCard
  counts: CountsCard
  docs: DocLink[]
}

export interface OverviewInput {
  /** Último resumo do Doctor; ausente = diagnóstico ainda não executado. */
  doctor?: DoctorHealth
  /** Última medição do contexto; ausente = ainda não medido. */
  context?: Usage
  /** Teto de tokens configurado (para mostrar "— / teto" quando não medido). */
  contextMax: number
  /** Mudanças do índice; ausente = index.yaml ausente ou ilegível. */
  changes?: ChangeEntry[]
  /** Presença de cada documento de PROJECT_DOCS (relPath -> existe). */
  docExists: Record<string, boolean>
}

/** Soma as severidades de uma lista de diagnósticos do Doctor. Puro, nunca lança. */
export function summarizeDiagnostics(diagnostics: ReadonlyArray<{ severity: Severity }>): DoctorHealth {
  const health: DoctorHealth = { errors: 0, warnings: 0, info: 0 }
  for (const d of diagnostics) {
    if (d.severity === 'error') {
      health.errors++
    } else if (d.severity === 'warning') {
      health.warnings++
    } else {
      health.info++
    }
  }
  return health
}

/**
 * Monta o modelo do painel Projeto (REQ-PROJ-001..004). Determinístico e robusto:
 * a mesma entrada dá o mesmo modelo, e qualquer campo ausente vira estado
 * informativo. Nunca lança.
 */
export function buildOverview(input: OverviewInput): ProjectOverview {
  return {
    health: healthCard(input.doctor),
    context: contextCard(input.context, input.contextMax),
    counts: countsCard(input.changes),
    docs: docLinks(input.docExists),
  }
}

function healthCard(doctor: DoctorHealth | undefined): HealthCard {
  if (!doctor) {
    return { kind: 'not-run' } // não executado é distinto de "0 erros" (REQ-PROJ-001)
  }
  if (doctor.errors === 0 && doctor.warnings === 0 && doctor.info === 0) {
    return { kind: 'clean' }
  }
  return { kind: 'problems', errors: doctor.errors, warnings: doctor.warnings, info: doctor.info }
}

function contextCard(context: Usage | undefined, max: number): ContextCard {
  if (!context) {
    return { kind: 'not-measured', max } // não medido: mostra "— / teto" (REQ-PROJ-002)
  }
  return {
    kind: 'measured',
    used: context.used,
    max: context.max,
    fraction: context.fraction,
    band: context.band,
  }
}

function countsCard(changes: ChangeEntry[] | undefined): CountsCard {
  if (changes === undefined) {
    return { kind: 'no-index' } // índice ausente/ilegível (REQ-PROJ-003, SCN-PROJ-007)
  }
  const tally = new Map<string, number>()
  for (const change of changes) {
    tally.set(change.status, (tally.get(change.status) ?? 0) + 1)
  }
  // Ordena pelo fluxo SDD; status desconhecidos vão ao final, em ordem alfabética.
  const known = STATUS_ORDER.filter((s) => tally.has(s))
  const unknown = [...tally.keys()].filter((s) => !STATUS_ORDER.includes(s)).sort()
  const byStatus = [...known, ...unknown].map((status) => ({ status, count: tally.get(status) as number }))
  const total = changes.length
  return { kind: 'counts', total, byStatus }
}

function docLinks(docExists: Record<string, boolean>): DocLink[] {
  return PROJECT_DOCS.map((doc) => ({
    label: doc.label,
    relPath: doc.relPath,
    exists: docExists[doc.relPath] === true,
  }))
}
