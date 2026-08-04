// Modelo do Painel SDD (Kanban + Overview) — lógica pura, sem a API do VS Code,
// para ser testável fora do host (standards §6). Feature 0025, ADR-024.
//
// Reusa o parsing e o agrupamento por status do índice (specsIndex): as colunas
// do kanban de mudanças são os mesmos grupos do painel Features (GROUP_ORDER).
import {
  GROUP_ORDER,
  groupFor,
  parseChanges,
  type ChangeEntry,
  type TaskProgress,
} from './specsIndex'

/** Cartão do kanban de mudanças. */
export interface BoardCard {
  id: string
  type: string
  title: string
  status: string
  path: string
  progress: TaskProgress | null
}

/** Coluna do kanban de mudanças (um grupo de status). */
export interface BoardColumn {
  label: string
  cards: BoardCard[]
}

/** Resumo do topo do painel (Overview). */
export interface BoardOverview {
  total: number
  /** Concluídas = VERIFIED + ARCHIVED. */
  done: number
  /** Percentual concluído (0–100), inteiro. */
  donePct: number
  byColumn: Array<{ label: string; count: number }>
}

export interface ChangesBoard {
  overview: BoardOverview
  columns: BoardColumn[]
}

const DONE_STATES = new Set(['VERIFIED', 'ARCHIVED'])

/**
 * Monta o kanban de mudanças a partir das entradas do índice e do progresso de
 * tarefas por id (lido dos status.yaml pela borda). Colunas vazias são omitidas,
 * na ordem de GROUP_ORDER. Robusto: sem entradas → board vazio, nunca exceção.
 */
export function buildChangesBoard(
  changes: ChangeEntry[],
  progressById: ReadonlyMap<string, TaskProgress | undefined>,
): ChangesBoard {
  const buckets = new Map<string, BoardCard[]>()
  for (const change of changes) {
    const label = groupFor(change.status)
    const card: BoardCard = {
      id: change.id,
      type: change.type,
      title: change.title,
      status: change.status,
      path: change.path,
      progress: progressById.get(change.id) ?? null,
    }
    const list = buckets.get(label) ?? []
    list.push(card)
    buckets.set(label, list)
  }

  const columns: BoardColumn[] = []
  const byColumn: Array<{ label: string; count: number }> = []
  for (const label of GROUP_ORDER) {
    const cards = buckets.get(label)
    if (cards && cards.length > 0) {
      columns.push({ label, cards })
      byColumn.push({ label, count: cards.length })
    }
  }

  const total = changes.length
  const done = changes.filter((c) => DONE_STATES.has(c.status)).length
  const donePct = total > 0 ? Math.round((done / total) * 100) : 0

  return { overview: { total, done, donePct, byColumn }, columns }
}

/** Conveniência: monta o board direto do texto do index.yaml. */
export function buildChangesBoardFromIndex(
  indexYaml: string,
  progressById: ReadonlyMap<string, TaskProgress | undefined>,
): ChangesBoard {
  return buildChangesBoard(parseChanges(indexYaml), progressById)
}

// --- Kanban de tarefas (drill-down de uma mudança) ---------------------------

export type TaskState = 'pending' | 'in_progress' | 'done'

export interface TaskCard {
  id: string
  title: string
  state: TaskState
}

export interface TaskColumn {
  label: string
  state: TaskState
  cards: TaskCard[]
}

export interface TaskBoard {
  columns: TaskColumn[]
}

const TASK_COLUMNS: Array<{ label: string; state: TaskState }> = [
  { label: 'Pendente', state: 'pending' },
  { label: 'Em progresso', state: 'in_progress' },
  { label: 'Concluída', state: 'done' },
]

const TASK_HEADER = /^##\s+(TASK-[A-Z0-9]+-\d+)\s*(?:—|-)?\s*(.*)$/
const TASK_STATUS = /^\*\*Status:\*\*\s*(pending|in_progress|done)\b/i

/**
 * Extrai o kanban de tarefas de um `tasks.md`: cada bloco `## TASK-…` vira um
 * cartão, colocado na coluna do seu `**Status:**` (pending/in_progress/done).
 * Um bloco sem status reconhecido cai em "pending". Robusto: texto vazio ou
 * inesperado → colunas vazias, nunca exceção (NFR-BOARD-001).
 */
export function parseTaskBoard(tasksMd: string): TaskBoard {
  const byState = new Map<TaskState, TaskCard[]>()
  for (const { state } of TASK_COLUMNS) {
    byState.set(state, [])
  }

  const lines = tasksMd.split(/\r?\n/)
  let current: { id: string; title: string } | undefined
  let state: TaskState | undefined

  const flush = (): void => {
    if (current) {
      const s = state ?? 'pending'
      byState.get(s)?.push({ id: current.id, title: current.title.trim(), state: s })
    }
    current = undefined
    state = undefined
  }

  for (const line of lines) {
    const header = TASK_HEADER.exec(line)
    if (header) {
      flush()
      current = { id: header[1], title: header[2] ?? '' }
      continue
    }
    if (current && state === undefined) {
      const st = TASK_STATUS.exec(line.trim())
      if (st) {
        state = st[1].toLowerCase() as TaskState
      }
    }
  }
  flush()

  return {
    columns: TASK_COLUMNS.map(({ label, state: s }) => ({
      label,
      state: s,
      cards: byState.get(s) ?? [],
    })),
  }
}
