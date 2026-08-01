// Núcleo puro do relatório de validação (feature 0008, RF-017, REQ-EVID-001) — sem a
// API do VS Code (standards §6, NFR-EVID-001). Lê o traceability.yaml e classifica cada
// requisito quanto ao atendimento, pela heurística D-Q3. Robusto: YAML inválido → relatório
// vazio, nunca lança (NFR-EVID-002). Deriva da cobertura DECLARADA (matriz), não da execução
// de testes.
import { load } from 'js-yaml'

export type Verdict = 'atendido' | 'parcial' | 'nao-testado' | 'nao-atendido' | 'nao-aplicavel'

export const VERDICTS: readonly Verdict[] = [
  'atendido',
  'parcial',
  'nao-testado',
  'nao-atendido',
  'nao-aplicavel',
]

export interface RequirementVerdict {
  id: string
  title: string
  verdict: Verdict
  hasTasks: boolean
  hasTests: boolean
  hasImplementation: boolean
  isGap: boolean
  note?: string
}

export interface ValidationReport {
  changeId: string
  requirements: RequirementVerdict[]
  summary: Record<Verdict, number>
}

/**
 * Classifica um requisito pela cobertura declarada (D-Q3):
 * - gap                          → não aplicável (à cobertura automatizada)
 * - sem implementação            → não atendido
 * - implementação sem teste      → não testado
 * - implementação + teste, sem tarefa → parcial (rastreio incompleto)
 * - tarefa + teste + implementação → atendido
 */
export function classify(input: {
  hasTasks: boolean
  hasTests: boolean
  hasImplementation: boolean
  isGap: boolean
}): Verdict {
  if (input.isGap) {
    return 'nao-aplicavel'
  }
  if (!input.hasImplementation) {
    return 'nao-atendido'
  }
  if (!input.hasTests) {
    return 'nao-testado'
  }
  if (!input.hasTasks) {
    return 'parcial'
  }
  return 'atendido'
}

/** Monta o relatório de validação a partir de um traceability.yaml. Puro e robusto. */
export function buildValidationReport(traceabilityYaml: string, changeId: string): ValidationReport {
  let doc: unknown
  try {
    doc = load(traceabilityYaml)
  } catch {
    doc = undefined
  }
  const reqs = isRecord(doc) ? doc['requirements'] : undefined
  const gaps = isRecord(doc) ? doc['gaps'] : undefined
  const gapIds = new Set<string>(
    Array.isArray(gaps)
      ? gaps.map((g) => (isRecord(g) ? asString(g['id']) : undefined)).filter((v): v is string => !!v)
      : [],
  )
  const gapReason = new Map<string, string>()
  if (Array.isArray(gaps)) {
    for (const g of gaps) {
      if (isRecord(g)) {
        const id = asString(g['id'])
        const reason = asString(g['reason'])
        if (id && reason) {
          gapReason.set(id, reason.replace(/\s+/g, ' ').trim())
        }
      }
    }
  }

  const requirements: RequirementVerdict[] = []
  const seen = new Set<string>()
  if (isRecord(reqs)) {
    for (const [id, raw] of Object.entries(reqs)) {
      if (!isRecord(raw)) {
        continue
      }
      seen.add(id)
      const hasTasks = nonEmptyArray(raw['tasks'])
      const hasTests = nonEmptyArray(raw['tests'])
      const hasImplementation = nonEmptyArray(raw['implementation'])
      const isGap = gapIds.has(id)
      requirements.push({
        id,
        title: asString(raw['title']) ?? id,
        verdict: classify({ hasTasks, hasTests, hasImplementation, isGap }),
        hasTasks,
        hasTests,
        hasImplementation,
        isGap,
        note: isGap ? gapReason.get(id) : undefined,
      })
    }
  }
  // Requisitos que só aparecem em `gaps` (declarados, não cobertos na matriz).
  for (const id of gapIds) {
    if (!seen.has(id)) {
      requirements.push({
        id,
        title: id,
        verdict: 'nao-aplicavel',
        hasTasks: false,
        hasTests: false,
        hasImplementation: false,
        isGap: true,
        note: gapReason.get(id),
      })
    }
  }

  return { changeId, requirements, summary: summarize(requirements) }
}

function summarize(requirements: RequirementVerdict[]): Record<Verdict, number> {
  const summary = { atendido: 0, parcial: 0, 'nao-testado': 0, 'nao-atendido': 0, 'nao-aplicavel': 0 }
  for (const r of requirements) {
    summary[r.verdict]++
  }
  return summary
}

/** Rótulo pt-BR de um veredito, para exibição. */
export function verdictLabel(verdict: Verdict): string {
  switch (verdict) {
    case 'atendido':
      return 'atendido'
    case 'parcial':
      return 'parcialmente atendido'
    case 'nao-testado':
      return 'não testado'
    case 'nao-atendido':
      return 'não atendido'
    case 'nao-aplicavel':
      return 'não aplicável'
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined
}

function nonEmptyArray(value: unknown): boolean {
  return Array.isArray(value) && value.length > 0
}
