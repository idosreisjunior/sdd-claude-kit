// Núcleo puro do histórico da mudança (feature 0016, RF-020, REQ-HIST-001) — sem
// a API do VS Code, testável fora do host (standards §6, NFR-HIST-003). Somente
// leitura (NFR-HIST-001), sem rede (NFR-HIST-002).
//
// Por D-Q1/D-Q3 (spec) e ADR-016: agrega apenas o subconjunto já persistido —
// transições de status e aprovação (status.yaml), ADRs (decisions/) e commits
// (0007) — num timeline cronológico, marcando como indisponíveis as categorias
// sem fonte. A borda coleta as fontes; aqui só agrega. Nunca lança.
import { parseYaml, get, isRecord, str } from './yamlUtils'
import { padAdr } from './adrCreator'

export type HistoryEventKind = 'status' | 'approval' | 'adr' | 'commit'

export interface HistoryEvent {
  date: string
  kind: HistoryEventKind
  title: string
  detail?: string
}

export interface AdrRef {
  number: number
  title: string
  date?: string
}

export interface CommitRef {
  hash: string
  date: string
  subject: string
}

export interface HistorySources {
  statusYaml?: string
  adrs?: AdrRef[]
  commits?: CommitRef[]
  tasks?: { done: number; total: number }
  validation?: { atendido: number; pendentes: number }
}

export interface HistoryModel {
  events: HistoryEvent[]
  currentState: {
    tasks?: { done: number; total: number }
    validation?: { atendido: number; pendentes: number }
  }
  unavailable: string[]
}

/** Categorias do RF-020 sem fonte persistida hoje (D-Q1/D-Q3). */
export const UNAVAILABLE_CATEGORIES = [
  'Execuções do Claude Code',
  'Contexto utilizado ao longo do tempo',
  'Erros',
  'Ações manuais',
] as const

/**
 * Agrega o histórico persistido de uma mudança num timeline cronológico. Fonte
 * ausente ou inválida simplesmente não contribui eventos — nunca lança.
 */
export function aggregateHistory(sources: HistorySources): HistoryModel {
  const events: HistoryEvent[] = []
  const status = parseYaml(sources.statusYaml)

  const history = get(status, 'history')
  if (Array.isArray(history)) {
    for (const h of history) {
      if (isRecord(h)) {
        events.push({
          date: str(h['date']) ?? '',
          kind: 'status',
          title: `Status: ${str(h['status']) ?? '—'}`,
          detail: str(h['reason']),
        })
      }
    }
  }

  const approval = get(status, 'approval')
  if (isRecord(approval)) {
    const by = str(approval['by'])
    const rev = approval['revision']
    const detail = [by, typeof rev === 'number' ? `rev ${rev}` : undefined]
      .filter((x): x is string => x !== undefined)
      .join(' · ')
    events.push({
      date: str(approval['date']) ?? '',
      kind: 'approval',
      title: 'Aprovada',
      detail: detail.length > 0 ? detail : undefined,
    })
  }

  for (const adr of sources.adrs ?? []) {
    events.push({
      date: adr.date ?? '',
      kind: 'adr',
      title: `ADR-${padAdr(adr.number)} — ${adr.title}`,
    })
  }

  for (const c of sources.commits ?? []) {
    events.push({ date: c.date, kind: 'commit', title: c.subject, detail: c.hash })
  }

  events.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))

  return {
    events,
    currentState: { tasks: sources.tasks, validation: sources.validation },
    unavailable: [...UNAVAILABLE_CATEGORIES],
  }
}
