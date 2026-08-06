// Modelo do Painel SDD (Kanban + Overview) — lógica pura, sem a API do VS Code,
// para ser testável fora do host (standards §6). Feature 0025, ADR-024.
//
// Reusa o parsing e o agrupamento por status do índice (specsIndex): as colunas
// do kanban de mudanças são os mesmos grupos do painel Features (GROUP_ORDER).
import { load } from 'js-yaml'
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
  /** Cartões visíveis após filtro. Ausente/igual a `total` quando não filtrado. */
  shown?: number
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

/** Filtro do painel: busca textual (id/título) e tipos incluídos (vazio = todos). */
export interface BoardFilter {
  query: string
  types: string[]
}

/** Um cartão passa no filtro? Busca casa id OU título (case-insensitive). */
export function cardMatchesFilter(card: BoardCard, filter: BoardFilter): boolean {
  const q = filter.query.trim().toLowerCase()
  const okType = filter.types.length === 0 || filter.types.includes(card.type)
  const okQuery =
    q === '' ||
    card.id.toLowerCase().includes(q) ||
    card.title.toLowerCase().includes(q)
  return okType && okQuery
}

/**
 * Aplica busca + filtro de tipo ao board. Colunas que ficam sem cartão são
 * omitidas. `overview.total`/`done`/`donePct` seguem do board completo (o usuário
 * vê "N de total"); `overview.shown` é a contagem após o filtro. É a lógica
 * canônica — o cliente do webview a espelha (ADR-026).
 */
export function filterChangesBoard(board: ChangesBoard, filter: BoardFilter): ChangesBoard {
  const columns: BoardColumn[] = board.columns
    .map((col) => ({ label: col.label, cards: col.cards.filter((c) => cardMatchesFilter(c, filter)) }))
    .filter((col) => col.cards.length > 0)
  const shown = columns.reduce((n, col) => n + col.cards.length, 0)
  return {
    overview: {
      ...board.overview,
      byColumn: columns.map((col) => ({ label: col.label, count: col.cards.length })),
      shown,
    },
    columns,
  }
}

// --- Ordenação (quadro e feed) ----------------------------------------------

/** Critério de ordenação dos cartões do quadro. */
export type BoardSort = 'id-asc' | 'id-desc' | 'title' | 'progress'

function progressPct(card: BoardCard): number {
  return card.progress && card.progress.total > 0 ? card.progress.done / card.progress.total : -1
}

/**
 * Ordena os cartões de uma coluna. `id-asc`/`id-desc` por id; `title` por título
 * (pt-BR); `progress` por percentual concluído desc (sem tarefas por último, e
 * empate por id). Não muta a entrada. É a lógica canônica que o cliente espelha.
 */
export function sortBoardCards(cards: readonly BoardCard[], key: BoardSort): BoardCard[] {
  const arr = cards.slice()
  arr.sort((a, b) => {
    switch (key) {
      case 'id-desc':
        return a.id < b.id ? 1 : a.id > b.id ? -1 : 0
      case 'title':
        return a.title.localeCompare(b.title, 'pt-BR')
      case 'progress': {
        const d = progressPct(b) - progressPct(a)
        return d !== 0 ? d : a.id < b.id ? -1 : a.id > b.id ? 1 : 0
      }
      case 'id-asc':
      default:
        return a.id < b.id ? -1 : a.id > b.id ? 1 : 0
    }
  })
  return arr
}

/**
 * Reordena as colunas por uma lista de rótulos (`order`). As colunas cujos
 * rótulos aparecem em `order` vêm primeiro, nessa ordem; as demais seguem na
 * ordem original ao final. Rótulos de `order` ausentes são ignorados. Não muta.
 * É a lógica canônica que o cliente espelha.
 */
export function orderColumns(columns: readonly BoardColumn[], order: readonly string[]): BoardColumn[] {
  const byLabel = new Map(columns.map((c) => [c.label, c]))
  const out: BoardColumn[] = []
  for (const label of order) {
    const col = byLabel.get(label)
    if (col) {
      out.push(col)
      byLabel.delete(label)
    }
  }
  for (const col of columns) {
    if (byLabel.has(col.label)) {
      out.push(col)
    }
  }
  return out
}

/** Alterna a presença de `label` numa lista (adiciona se ausente, remove se presente). Não muta. */
export function toggleLabel(labels: readonly string[], label: string): string[] {
  return labels.includes(label) ? labels.filter((l) => l !== label) : [...labels, label]
}

/** Move `label` uma posição na lista (`dir` -1 esquerda, +1 direita). Não muta. */
export function moveColumn(labels: readonly string[], label: string, dir: -1 | 1): string[] {
  const i = labels.indexOf(label)
  const j = i + dir
  if (i < 0 || j < 0 || j >= labels.length) {
    return labels.slice()
  }
  const arr = labels.slice()
  arr[i] = labels[j]
  arr[j] = label
  return arr
}

/** Ordem do feed: `desc` = mais recente primeiro (padrão); `asc` = mais antigo. */
export type FeedOrder = 'desc' | 'asc'

/** Aplica a ordem ao feed já ordenado desc por buildActivityFeed. Não muta. */
export function orderFeed(items: readonly FeedItem[], order: FeedOrder): FeedItem[] {
  return order === 'asc' ? items.slice().reverse() : items.slice()
}

/** Filtro do feed: busca textual (id/título) e estados incluídos (vazio = todos). */
export interface FeedFilter {
  query: string
  statuses: string[]
}

/** Um item do feed passa no filtro? Busca casa id OU título (case-insensitive). */
export function feedItemMatches(item: FeedItem, filter: FeedFilter): boolean {
  const q = filter.query.trim().toLowerCase()
  const okStatus = filter.statuses.length === 0 || filter.statuses.includes(item.status)
  const okQuery =
    q === '' ||
    item.id.toLowerCase().includes(q) ||
    item.title.toLowerCase().includes(q)
  return okStatus && okQuery
}

/** Aplica busca + estados ao feed. É a lógica canônica que o cliente espelha. */
export function filterFeed(items: readonly FeedItem[], filter: FeedFilter): FeedItem[] {
  return items.filter((i) => feedItemMatches(i, filter))
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

// --- Feed de atividade (transições de todas as mudanças) ---------------------

/** Um item do feed: uma transição de estado de uma mudança. */
export interface FeedItem {
  id: string
  title: string
  status: string
  date: string
  reason: string
}

/** Fonte do feed: id/título da mudança + o texto do seu status.yaml. */
export interface FeedSource {
  id: string
  title: string
  statusYaml: string
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined
}

/** Extrai as transições do `history:` de um status.yaml. Robusto a inválido. */
function parseHistory(statusYaml: string): Array<{ status: string; date: string; reason: string }> {
  let doc: unknown
  try {
    doc = load(statusYaml)
  } catch {
    return []
  }
  const history = isRecord(doc) ? doc['history'] : undefined
  if (!Array.isArray(history)) {
    return []
  }
  const out: Array<{ status: string; date: string; reason: string }> = []
  for (const raw of history) {
    if (!isRecord(raw)) {
      continue
    }
    const status = asString(raw['status'])
    const date = asString(raw['date'])
    if (status && date) {
      out.push({ status, date, reason: asString(raw['reason']) ?? '' })
    }
  }
  return out
}

/**
 * Feed de atividade do projeto: todas as transições de estado (do `history:` de
 * cada status.yaml), do mais recente para o mais antigo, limitado a `limit`.
 * Datas "YYYY-MM-DD" ordenam lexicograficamente = cronologicamente.
 */
export function buildActivityFeed(sources: readonly FeedSource[], limit = 50): FeedItem[] {
  const items: FeedItem[] = []
  for (const source of sources) {
    for (const entry of parseHistory(source.statusYaml)) {
      items.push({
        id: source.id,
        title: source.title,
        status: entry.status,
        date: entry.date,
        reason: entry.reason,
      })
    }
  }
  items.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
  return items.slice(0, limit)
}

const TASK_HEADER = /^##\s+(TASK-[A-Z0-9]+-\d+)\s*(?:—|-)?\s*(.*)$/
// Linha de status de uma tarefa. Duas partes de propósito (bug 0037): primeiro reconhece
// a LINHA, depois procura a palavra dentro do valor.
//
// A versão anterior exigia a palavra colada em `**Status:**` e não casava com
// `**Status:** **done** — 2026-07-29`, forma usada por 17 tarefas deste repositório — que
// caíam no fallback e apareciam como pendentes, contradizendo SCN-BOARD-002. O valor
// depois dos dois-pontos tem forma livre na prática: negrito, data, nota entre parênteses.
//
// `KNOWN_TASK_STATUS` sem `g` e usado com `exec` devolve a PRIMEIRA ocorrência, então
// `pending (o done vem depois)` continua sendo pendente.
const TASK_STATUS_LINE = /^\*\*Status:\*\*\s*(.*)$/i
const KNOWN_TASK_STATUS = /\b(pending|in_progress|done)\b/i

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
      const st = TASK_STATUS_LINE.exec(line.trim())
      if (st) {
        // Linha de status encontrada. Se o valor não contiver palavra conhecida, `state`
        // permanece indefinido e o bloco cai em "pendente" — a ressalva do SCN-BOARD-002,
        // que vale para status IRRECONHECÍVEL, não para status escrito de outra forma.
        const known = KNOWN_TASK_STATUS.exec(st[1])
        if (known) {
          state = known[1].toLowerCase() as TaskState
        }
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
