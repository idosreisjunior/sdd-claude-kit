// Modelo do dashboard da feature (RF-005, TASK-UI-002) — lógica pura, sem a API do
// VS Code, para ser testável fora do host (standards §6). Recebe o conteúdo dos
// artefatos e monta um modelo tipado; a camada do editor cuida do IO e do webview.
//
// Por ADR-005 (Q2): contagens vêm de fontes estruturadas — tarefas do status.yaml,
// requisitos/cenários/testes/arquivos do traceability.yaml — e do spec.md apenas
// por extração simples (seção Objetivo, contagem de checkbox). Nunca parseia a
// estrutura do Markdown. Robusto por contrato (NFR-UI-001): fonte ausente ou
// inválida vira um campo indisponível, nunca uma exceção.
import { load } from 'js-yaml'

/** Um valor derivado que pode não estar disponível (fonte ausente/ inválida). */
export type Count = { available: true; value: number } | { available: false; note: string }

export interface Blocker {
  question: string
  description: string
  severity: string
}

export interface HistoryEntry {
  status: string
  date: string
  reason: string
}

export interface DeferredField {
  label: string
  note: string
}

export interface DashboardCounts {
  requirements: Count
  scenarios: Count
  acceptanceCriteria: Count
  tasks: Count
  tests: Count
  files: Count
}

export interface DashboardModel {
  id: string
  type: string
  title: string
  status: string
  objective: string | null
  progress: { done: number; total: number } | null
  counts: DashboardCounts
  blockers: Blocker[]
  history: HistoryEntry[]
  /** Campos que dependem de features futuras — sempre pendentes neste incremento. */
  deferred: DeferredField[]
}

export interface DashboardSources {
  /** Entrada do `index.yaml` da mudança (id/tipo/título/status), quando conhecida. */
  indexEntry?: { id?: string; type?: string; title?: string; status?: string } | null
  statusYaml?: string
  traceabilityYaml?: string
  specMd?: string
  /** Verdadeiro quando existe `evidence.md` na pasta da mudança. */
  hasEvidence?: boolean
}

/** Monta o modelo do dashboard a partir dos artefatos. Nunca lança (NFR-UI-001). */
export function buildDashboardModel(sources: DashboardSources): DashboardModel {
  const status = parseYaml(sources.statusYaml)
  const trace = parseYaml(sources.traceabilityYaml)
  const spec = sources.specMd ?? ''
  const entry = sources.indexEntry ?? {}

  const id = str(entry.id) ?? str(get(status, 'id')) ?? '(sem id)'
  const type = str(entry.type) ?? str(get(status, 'type')) ?? 'feature'
  const title = str(entry.title) ?? str(get(status, 'title')) ?? id
  const stt = str(entry.status) ?? str(get(status, 'status')) ?? 'DRAFT'

  return {
    id,
    type,
    title,
    status: stt,
    objective: extractObjective(spec),
    progress: taskProgress(status),
    counts: {
      requirements: countKeys(trace),
      scenarios: countUnique(trace, 'scenarios'),
      acceptanceCriteria: countCriteria(spec, sources.specMd !== undefined),
      tasks: taskTotal(status),
      tests: countUnique(trace, 'tests'),
      files: countUnique(trace, 'implementation'),
    },
    blockers: extractBlockers(status),
    history: extractHistory(status),
    deferred: [
      { label: 'Consumo de tokens', note: 'feature 0005' },
      { label: 'Tempo estimado / utilizado', note: 'feature 0005' },
      { label: 'Commits relacionados', note: 'feature 0007' },
      { label: 'Evidências', note: sources.hasEvidence ? 'ver evidence.md' : 'feature 0008' },
      { label: 'Validação', note: 'feature 0008' },
    ],
  }
}

function extractObjective(spec: string): string | null {
  const lines = spec.split('\n')
  const start = lines.findIndex((l) => /^##\s+Objetivo\s*$/.test(l))
  if (start === -1) {
    return null
  }
  const collected: string[] = []
  for (let i = start + 1; i < lines.length; i++) {
    const line = lines[i]
    if (/^##\s/.test(line) || /^---\s*$/.test(line)) {
      break
    }
    if (line.trim().startsWith('{{') || line.trim().startsWith('>')) {
      continue // marcadores de guia do template, não conteúdo
    }
    collected.push(line)
  }
  const text = collected.join('\n').trim()
  return text.length > 0 ? text : null
}

function countCriteria(spec: string, specPresent: boolean): Count {
  if (!specPresent) {
    return { available: false, note: 'sem spec.md' }
  }
  const matches = spec.match(/^-\s+\[[ xX]\]/gm)
  return { available: true, value: matches ? matches.length : 0 }
}

function countKeys(trace: unknown): Count {
  const reqs = get(trace, 'requirements')
  if (!isRecord(reqs)) {
    return { available: false, note: 'sem traceability.yaml' }
  }
  return { available: true, value: Object.keys(reqs).length }
}

function countUnique(trace: unknown, field: string): Count {
  const reqs = get(trace, 'requirements')
  if (!isRecord(reqs)) {
    return { available: false, note: 'sem traceability.yaml' }
  }
  const set = new Set<string>()
  for (const key of Object.keys(reqs)) {
    const req = reqs[key]
    const arr = isRecord(req) ? req[field] : undefined
    if (Array.isArray(arr)) {
      for (const item of arr) {
        if (typeof item === 'string') {
          set.add(item)
        }
      }
    }
  }
  return { available: true, value: set.size }
}

function taskProgress(status: unknown): { done: number; total: number } | null {
  const tasks = get(status, 'tasks')
  const total = num(get(tasks, 'total'))
  const done = num(get(tasks, 'done'))
  return total === undefined || done === undefined ? null : { done, total }
}

function taskTotal(status: unknown): Count {
  const total = num(get(get(status, 'tasks'), 'total'))
  return total === undefined ? { available: false, note: 'sem status.yaml' } : { available: true, value: total }
}

function extractBlockers(status: unknown): Blocker[] {
  const raw = get(status, 'blocked_by')
  if (!Array.isArray(raw)) {
    return []
  }
  const out: Blocker[] = []
  for (const item of raw) {
    if (isRecord(item)) {
      out.push({
        question: str(item['question']) ?? '',
        description: str(item['description']) ?? '',
        severity: str(item['severity']) ?? '',
      })
    }
  }
  return out
}

function extractHistory(status: unknown): HistoryEntry[] {
  const raw = get(status, 'history')
  if (!Array.isArray(raw)) {
    return []
  }
  const out: HistoryEntry[] = []
  for (const item of raw) {
    if (isRecord(item)) {
      out.push({
        status: str(item['status']) ?? '',
        date: str(item['date']) ?? '',
        reason: str(item['reason']) ?? '',
      })
    }
  }
  return out
}

function parseYaml(text: string | undefined): unknown {
  if (text === undefined) {
    return undefined
  }
  try {
    return load(text)
  } catch {
    return undefined
  }
}

function get(obj: unknown, key: string): unknown {
  return isRecord(obj) ? obj[key] : undefined
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function str(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined
}

function num(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}
