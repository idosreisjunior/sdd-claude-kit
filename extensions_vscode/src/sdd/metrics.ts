// Núcleo puro das métricas locais (feature 0009, RF-021/RF-022) — sem a API do VS Code
// (standards §6, NFR-METR-001). Calcula o subconjunto viável de métricas de uma mudança a
// partir de .specs/+Git (D-Q3), compara com a medição anterior (D-Q2) e exporta MD/JSON
// (D-Q4). Robusto: artefatos ausentes → métricas parciais, nunca lança (NFR-METR-002).
// Sem rede, sem telemetria (RNF-004). O timestamp é injetado pela borda (determinismo).
import { load } from 'js-yaml'
import { parseTaskProgress } from './specsIndex'
import { buildValidationReport } from './validationReport'
import { parseTraceabilityNav } from './traceabilityNav'

export interface MetricsInput {
  changeId: string
  type: string
  title: string
  status: string
  /** ISO 8601, injetado pela borda. */
  timestamp: string
  statusYaml?: string
  traceabilityYaml?: string
  git?: { changedFiles: number; added: number; removed: number }
  /** Tokens estimados do contexto da feature (0005), quando disponível. */
  contextTokens?: number
}

export interface MetricsSnapshot {
  changeId: string
  timestamp: string
  status: string
  tasksTotal: number
  tasksDone: number
  requirements: number
  requirementsValidated: number
  validatedPct: number
  scenarios: number
  tests: number
  files: number
  durationDays?: number
  git?: { changedFiles: number; added: number; removed: number }
  contextTokens?: number
}

/** Calcula o snapshot de métricas. Puro e robusto. */
export function computeMetrics(input: MetricsInput): MetricsSnapshot {
  const progress = input.statusYaml ? parseTaskProgress(input.statusYaml) : undefined

  let requirements = 0
  let requirementsValidated = 0
  let scenarios = 0
  let tests = 0
  let files = 0
  if (input.traceabilityYaml) {
    const report = buildValidationReport(input.traceabilityYaml, input.changeId)
    requirements = report.requirements.length
    requirementsValidated = report.summary.atendido
    const nav = parseTraceabilityNav(input.traceabilityYaml)
    scenarios = nav.requirements.reduce((s, r) => s + r.scenarios.length, 0)
    tests = unique(nav.requirements.flatMap((r) => r.tests)).length
    files = unique(nav.requirements.flatMap((r) => r.files)).length
  }
  const validatedPct = requirements > 0 ? Math.round((requirementsValidated / requirements) * 100) : 0

  return {
    changeId: input.changeId,
    timestamp: input.timestamp,
    status: input.status,
    tasksTotal: progress?.total ?? 0,
    tasksDone: progress?.done ?? 0,
    requirements,
    requirementsValidated,
    validatedPct,
    scenarios,
    tests,
    files,
    durationDays: input.statusYaml ? durationDays(input.statusYaml) : undefined,
    git: input.git,
    contextTokens: input.contextTokens,
  }
}

export interface MetricsDelta {
  tasksDone: number
  requirementsValidated: number
  validatedPct: number
  tests: number
  files: number
}

/** Diferença numérica de `curr` em relação a `prev`. Puro. */
export function compareSnapshots(prev: MetricsSnapshot, curr: MetricsSnapshot): MetricsDelta {
  return {
    tasksDone: curr.tasksDone - prev.tasksDone,
    requirementsValidated: curr.requirementsValidated - prev.requirementsValidated,
    validatedPct: curr.validatedPct - prev.validatedPct,
    tests: curr.tests - prev.tests,
    files: curr.files - prev.files,
  }
}

/** Exporta o snapshot em Markdown (RF-022). Puro. */
export function renderMetricsMarkdown(s: MetricsSnapshot): string {
  const lines: string[] = []
  lines.push(`# Métricas — ${s.changeId}`)
  lines.push('')
  lines.push(`- Medido em: ${s.timestamp} · Status: ${s.status}`)
  lines.push(`- Tarefas: ${s.tasksDone}/${s.tasksTotal}`)
  lines.push(`- Requisitos: ${s.requirements} · validados: ${s.requirementsValidated} (${s.validatedPct}%)`)
  lines.push(`- Cenários: ${s.scenarios} · Testes: ${s.tests} · Arquivos rastreados: ${s.files}`)
  if (s.durationDays !== undefined) {
    lines.push(`- Duração desde a criação: ${s.durationDays} dia(s)`)
  }
  if (s.git) {
    lines.push(`- Git: ${s.git.changedFiles} arquivo(s) alterado(s) (+${s.git.added} / -${s.git.removed})`)
  }
  if (s.contextTokens !== undefined) {
    lines.push(`- Contexto estimado: ~${s.contextTokens} tokens (estimativa, ~4 caracteres/token)`)
  }
  lines.push('')
  lines.push('> Métricas locais (sem telemetria). Valores de contexto/tokens são estimativa.')
  lines.push('')
  return lines.join('\n')
}

/** Exporta o snapshot em JSON (RF-022). Puro. */
export function toMetricsJson(s: MetricsSnapshot): string {
  return JSON.stringify(s, null, 2)
}

/** Duração em dias entre a menor e a maior data do histórico do status.yaml. */
function durationDays(statusYaml: string): number | undefined {
  let doc: unknown
  try {
    doc = load(statusYaml)
  } catch {
    return undefined
  }
  if (!isRecord(doc)) {
    return undefined
  }
  const dates: number[] = []
  const push = (value: unknown): void => {
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const t = new Date(value + 'T00:00:00Z').getTime()
      if (!Number.isNaN(t)) {
        dates.push(t)
      }
    }
  }
  push(doc['created'])
  push(doc['updated'])
  if (Array.isArray(doc['history'])) {
    for (const h of doc['history']) {
      if (isRecord(h)) {
        push(h['date'])
      }
    }
  }
  if (dates.length === 0) {
    return undefined
  }
  return Math.round((Math.max(...dates) - Math.min(...dates)) / 86400000)
}

function unique(values: string[]): string[] {
  return [...new Set(values)]
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
