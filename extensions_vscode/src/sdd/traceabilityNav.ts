// Núcleo puro da navegação de rastreabilidade (feature 0007, RF-015, REQ-TRACE-004) —
// sem a API do VS Code (standards §6, NFR-TRACE-002). Lê o traceability.yaml e monta um
// modelo navegável requisito → cenário/tarefa/arquivo/teste, e classifica cada artefato
// pelo identificador. Robusto: YAML inválido → modelo vazio, nunca lança (NFR-TRACE-003).
import { load } from 'js-yaml'

export type ArtifactKind = 'requirement' | 'scenario' | 'task' | 'test' | 'file'

export interface Artifact {
  id: string
  kind: ArtifactKind
}

export interface RequirementNav {
  id: string
  title: string
  scenarios: string[]
  tasks: string[]
  files: string[]
  tests: string[]
}

export interface TraceabilityNav {
  requirements: RequirementNav[]
}

/** Classifica um artefato pelo identificador/caminho. */
export function classifyArtifact(id: string): ArtifactKind {
  if (/^SCN-/.test(id)) {
    return 'scenario'
  }
  if (/^TASK-/.test(id)) {
    return 'task'
  }
  if (/^TEST-/.test(id)) {
    return 'test'
  }
  if (/^(REQ|NFR)-/.test(id)) {
    return 'requirement'
  }
  return 'file'
}

/**
 * Monta o modelo navegável a partir de um traceability.yaml. Preserva a ordem dos
 * requisitos. Puro e robusto: entrada inválida → { requirements: [] }.
 */
export function parseTraceabilityNav(yamlText: string): TraceabilityNav {
  let doc: unknown
  try {
    doc = load(yamlText)
  } catch {
    return { requirements: [] }
  }
  const reqs = isRecord(doc) ? doc['requirements'] : undefined
  if (!isRecord(reqs)) {
    return { requirements: [] }
  }
  const requirements: RequirementNav[] = []
  for (const [id, raw] of Object.entries(reqs)) {
    if (!isRecord(raw)) {
      continue
    }
    requirements.push({
      id,
      title: asString(raw['title']) ?? id,
      scenarios: asStringArray(raw['scenarios']),
      tasks: asStringArray(raw['tasks']),
      files: asStringArray(raw['implementation']),
      tests: asStringArray(raw['tests']),
    })
  }
  return { requirements }
}

/** Achata os artefatos ligados a um requisito, na ordem cenário → tarefa → arquivo → teste. */
export function artifactsOf(req: RequirementNav): Artifact[] {
  return [
    ...req.scenarios.map((id) => ({ id, kind: 'scenario' as const })),
    ...req.tasks.map((id) => ({ id, kind: 'task' as const })),
    ...req.files.map((id) => ({ id, kind: 'file' as const })),
    ...req.tests.map((id) => ({ id, kind: 'test' as const })),
  ]
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string' && v.length > 0) : []
}
