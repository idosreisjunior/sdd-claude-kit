// Leitura e agrupamento do índice de mudanças (.specs/index.yaml) — lógica pura,
// sem dependência da API do VS Code, para ser testável fora do host
// (standards §6, TASK-FEAT-002). O parsing usa js-yaml (ADR-003).
import { load } from 'js-yaml'

export interface ChangeEntry {
  id: string
  type: string
  title: string
  status: string
  path: string
}

export interface FeatureGroup {
  label: string
  changes: ChangeEntry[]
}

/** Progresso de tarefas de uma mudança, derivado do bloco `tasks` do status.yaml. */
export interface TaskProgress {
  done: number
  total: number
}

/** Ordem de exibição dos grupos no painel (PRD §13.1). */
export const GROUP_ORDER = [
  'Rascunho',
  'Em desenvolvimento',
  'Bloqueadas',
  'Em validação',
  'Concluídas',
  'Canceladas',
] as const

/**
 * Mapa estado SDD → grupo do painel. O PRD usa rótulos próprios (§10); os
 * estados canônicos vivem em status.yaml. Este é o mapeamento que o glossário
 * reservou para esta feature.
 */
export function groupFor(status: string): string {
  switch (status) {
    case 'APPROVED':
    case 'IN_PROGRESS':
      return 'Em desenvolvimento'
    case 'BLOCKED':
      return 'Bloqueadas'
    case 'VERIFIED':
      return 'Em validação'
    case 'ARCHIVED':
      return 'Concluídas'
    case 'CANCELLED':
      return 'Canceladas'
    default:
      // DRAFT, CLARIFIED, DESIGNED, PLANNED e qualquer valor desconhecido.
      return 'Rascunho'
  }
}

/**
 * Extrai as mudanças de um `index.yaml`. Robusto: YAML inválido ou estrutura
 * inesperada resultam em lista vazia, nunca em exceção (NFR-FEAT-001).
 */
export function parseChanges(yamlText: string): ChangeEntry[] {
  let doc: unknown
  try {
    doc = load(yamlText)
  } catch {
    return []
  }
  const changes = isRecord(doc) ? doc['changes'] : undefined
  if (!Array.isArray(changes)) {
    return []
  }
  const out: ChangeEntry[] = []
  for (const raw of changes) {
    const entry = normalize(raw)
    if (entry) {
      out.push(entry)
    }
  }
  return out
}

/** Agrupa as mudanças por status, na ordem do painel, omitindo grupos vazios. */
export function groupByStatus(changes: ChangeEntry[]): FeatureGroup[] {
  const buckets = new Map<string, ChangeEntry[]>()
  for (const change of changes) {
    const label = groupFor(change.status)
    const list = buckets.get(label) ?? []
    list.push(change)
    buckets.set(label, list)
  }
  const groups: FeatureGroup[] = []
  for (const label of GROUP_ORDER) {
    const list = buckets.get(label)
    if (list && list.length > 0) {
      groups.push({ label, changes: list })
    }
  }
  return groups
}

/**
 * Extrai os contadores de tarefas do bloco `tasks` de um `status.yaml`
 * (REQ-FEAT-005). Robusto: YAML inválido, bloco ausente ou `total`/`done` não
 * numéricos resultam em `undefined`, nunca em exceção (NFR-FEAT-001).
 */
export function parseTaskProgress(yamlText: string): TaskProgress | undefined {
  let doc: unknown
  try {
    doc = load(yamlText)
  } catch {
    return undefined
  }
  const tasks = isRecord(doc) ? doc['tasks'] : undefined
  if (!isRecord(tasks)) {
    return undefined
  }
  const total = asNumber(tasks['total'])
  const done = asNumber(tasks['done'])
  if (total === undefined || done === undefined) {
    return undefined
  }
  return { done, total }
}

function normalize(raw: unknown): ChangeEntry | undefined {
  if (!isRecord(raw)) {
    return undefined
  }
  const id = asString(raw['id'])
  if (!id) {
    return undefined
  }
  return {
    id,
    type: asString(raw['type']) ?? 'feature',
    title: asString(raw['title']) ?? id,
    status: asString(raw['status']) ?? 'DRAFT',
    path: asString(raw['path']) ?? '',
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined
}

function asNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}
