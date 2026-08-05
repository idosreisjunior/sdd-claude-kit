import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  buildChangesBoard,
  parseTaskBoard,
  filterChangesBoard,
  cardMatchesFilter,
  buildActivityFeed,
  sortBoardCards,
  orderFeed,
  filterFeed,
  feedItemMatches,
  orderColumns,
  moveColumn,
  toggleLabel,
} from '../sdd/boardModel'
import type { BoardCard } from '../sdd/boardModel'
import type { ChangeEntry, TaskProgress } from '../sdd/specsIndex'

function change(id: string, status: string, type = 'feature', title?: string): ChangeEntry {
  return { id, type, title: title ?? `Título ${id}`, status, path: `${type}s/${id}` }
}

test('TEST-BOARD-001 — buildChangesBoard agrupa por status e resume o overview (SCN-BOARD-001)', () => {
  const changes = [
    change('0001-a', 'DRAFT'),
    change('0002-b', 'IN_PROGRESS'),
    change('0003-c', 'VERIFIED'),
    change('0004-d', 'ARCHIVED'),
  ]
  const progress = new Map<string, TaskProgress | undefined>([
    ['0002-b', { done: 1, total: 4 }],
  ])
  const board = buildChangesBoard(changes, progress)

  // colunas na ordem dos grupos, sem grupos vazios
  assert.deepEqual(
    board.columns.map((c) => c.label),
    ['Rascunho', 'Em desenvolvimento', 'Em validação', 'Concluídas'],
  )
  // o cartão carrega o progresso quando há
  const emDev = board.columns.find((c) => c.label === 'Em desenvolvimento')
  assert.equal(emDev?.cards[0].id, '0002-b')
  assert.deepEqual(emDev?.cards[0].progress, { done: 1, total: 4 })

  // overview: 4 total, 2 concluídas (VERIFIED+ARCHIVED), 50%
  assert.equal(board.overview.total, 4)
  assert.equal(board.overview.done, 2)
  assert.equal(board.overview.donePct, 50)
})

test('TEST-BOARD-001b — board vazio não lança e zera o overview', () => {
  const board = buildChangesBoard([], new Map())
  assert.equal(board.columns.length, 0)
  assert.equal(board.overview.total, 0)
  assert.equal(board.overview.donePct, 0)
})

test('TEST-BOARD-002 — parseTaskBoard separa as tarefas por status (SCN-BOARD-002)', () => {
  const md = [
    '# Tarefas',
    '',
    '## TASK-X-001 — Primeira',
    '**Requisitos:** REQ-X-001',
    '**Status:** done',
    '',
    '## TASK-X-002 — Segunda',
    '**Status:** in_progress',
    '',
    '## TASK-X-003 — Terceira',
    '**Status:** pending',
    '',
    '## TASK-X-004 — Sem status reconhecido',
    '**Requisitos:** REQ-X-002',
  ].join('\n')

  const board = parseTaskBoard(md)
  const col = (state: string) => board.columns.find((c) => c.state === state)

  assert.deepEqual(
    board.columns.map((c) => c.label),
    ['Pendente', 'Em progresso', 'Concluída'],
  )
  assert.equal(col('done')?.cards[0].id, 'TASK-X-001')
  assert.equal(col('done')?.cards[0].title, 'Primeira')
  assert.equal(col('in_progress')?.cards[0].id, 'TASK-X-002')
  // pending recebe a explícita E a sem-status-reconhecido
  assert.deepEqual(
    col('pending')?.cards.map((c) => c.id),
    ['TASK-X-003', 'TASK-X-004'],
  )
})

test('TEST-BOARD-002b — parseTaskBoard robusto a texto vazio', () => {
  const board = parseTaskBoard('')
  assert.equal(board.columns.length, 3)
  assert.ok(board.columns.every((c) => c.cards.length === 0))
})

test('TEST-FILTER-001 — busca casa id ou título; colunas sem match são omitidas (SCN-FILTER-001)', () => {
  const board = buildChangesBoard(
    [
      change('0007-git', 'VERIFIED', 'feature', 'Git e rastreabilidade'),
      change('0009-metrics', 'VERIFIED', 'feature', 'Métricas locais'),
      change('0011-bug', 'IN_PROGRESS', 'bug', 'Corrige algo'),
    ],
    new Map(),
  )
  // por id
  const byId = filterChangesBoard(board, { query: '0009', types: [] })
  assert.equal(byId.overview.shown, 1)
  assert.equal(byId.columns.flatMap((c) => c.cards)[0].id, '0009-metrics')
  // por título (case-insensitive)
  const byTitle = filterChangesBoard(board, { query: 'git', types: [] })
  assert.equal(byTitle.overview.shown, 1)
  // total no overview segue do board completo
  assert.equal(byTitle.overview.total, 3)
  // sem match → nenhuma coluna
  assert.deepEqual(filterChangesBoard(board, { query: 'zzz', types: [] }).columns, [])
})

test('TEST-FILTER-002 — filtro por tipo; vazio = todos (SCN-FILTER-002)', () => {
  const board = buildChangesBoard(
    [
      change('0007-git', 'VERIFIED', 'feature'),
      change('0011-bug', 'IN_PROGRESS', 'bug'),
    ],
    new Map(),
  )
  assert.equal(filterChangesBoard(board, { query: '', types: ['bug'] }).overview.shown, 1)
  assert.equal(filterChangesBoard(board, { query: '', types: ['feature', 'bug'] }).overview.shown, 2)
  assert.equal(filterChangesBoard(board, { query: '', types: [] }).overview.shown, 2)
})

test('TEST-FILTER-003 — cardMatchesFilter combina busca e tipo', () => {
  const card = { id: '0007-git', type: 'feature', title: 'Git', status: 'VERIFIED', path: 'x', progress: null }
  assert.equal(cardMatchesFilter(card, { query: 'git', types: ['feature'] }), true)
  assert.equal(cardMatchesFilter(card, { query: 'git', types: ['bug'] }), false)
  assert.equal(cardMatchesFilter(card, { query: 'xyz', types: [] }), false)
})

const S1 =
  'history:\n  - status: DRAFT\n    date: "2026-08-01"\n    reason: >-\n      Criada.\n' +
  '  - status: VERIFIED\n    date: "2026-08-03"\n    reason: >-\n      Feita.\n'
const S2 = 'history:\n  - status: DRAFT\n    date: "2026-08-02"\n    reason: >-\n      Outra.\n'

test('TEST-FEED-001 — buildActivityFeed agrega as transições, mais recente primeiro (SCN-FEED-001)', () => {
  const feed = buildActivityFeed([
    { id: '0001-a', title: 'A', statusYaml: S1 },
    { id: '0002-b', title: 'B', statusYaml: S2 },
  ])
  assert.deepEqual(feed.map((i) => i.date), ['2026-08-03', '2026-08-02', '2026-08-01'])
  assert.equal(feed[0].id, '0001-a')
  assert.equal(feed[0].status, 'VERIFIED')
  assert.equal(feed[0].reason, 'Feita.')
})

test('TEST-FEED-002 — respeita o limite e é robusto a YAML inválido', () => {
  assert.equal(buildActivityFeed([{ id: '0001-a', title: 'A', statusYaml: S1 }], 1).length, 1)
  // yaml inválido / sem history → ignorado, nunca lança
  assert.deepEqual(buildActivityFeed([{ id: 'x', title: 'X', statusYaml: ': : :' }]), [])
  assert.deepEqual(buildActivityFeed([{ id: 'x', title: 'X', statusYaml: 'foo: bar' }]), [])
})

function card(id: string, title: string, done?: number, total?: number): BoardCard {
  return {
    id,
    type: 'feature',
    title,
    status: 'DRAFT',
    path: `features/${id}`,
    progress: total === undefined ? null : { done: done ?? 0, total },
  }
}

test('TEST-SORT-001 — sortBoardCards ordena por id, título e progresso (SCN-SORT-001)', () => {
  const cards = [card('0003-c', 'Beta', 1, 2), card('0001-a', 'Alfa'), card('0002-b', 'Gama', 3, 3)]
  assert.deepEqual(sortBoardCards(cards, 'id-asc').map((c) => c.id), ['0001-a', '0002-b', '0003-c'])
  assert.deepEqual(sortBoardCards(cards, 'id-desc').map((c) => c.id), ['0003-c', '0002-b', '0001-a'])
  assert.deepEqual(sortBoardCards(cards, 'title').map((c) => c.title), ['Alfa', 'Beta', 'Gama'])
  // progresso desc: 100% (0002), 50% (0003), sem tarefas (0001) por último
  assert.deepEqual(sortBoardCards(cards, 'progress').map((c) => c.id), ['0002-b', '0003-c', '0001-a'])
  // não muta a entrada
  assert.equal(cards[0].id, '0003-c')
})

test('TEST-SORT-002 — orderFeed inverte para asc, preserva desc (SCN-SORT-002)', () => {
  const feed = buildActivityFeed([
    { id: '0001-a', title: 'A', statusYaml: S1 },
    { id: '0002-b', title: 'B', statusYaml: S2 },
  ])
  assert.deepEqual(orderFeed(feed, 'desc').map((i) => i.date), ['2026-08-03', '2026-08-02', '2026-08-01'])
  assert.deepEqual(orderFeed(feed, 'asc').map((i) => i.date), ['2026-08-01', '2026-08-02', '2026-08-03'])
})

test('TEST-FEEDFILTER-001 — filterFeed por busca e status (SCN-FEEDF-001)', () => {
  const feed = buildActivityFeed([
    { id: '0001-git', title: 'Git', statusYaml: S1 },
    { id: '0002-metrics', title: 'Métricas', statusYaml: S2 },
  ])
  // busca por id (só itens de 0001-git)
  assert.ok(filterFeed(feed, { query: 'git', statuses: [] }).every((i) => i.id === '0001-git'))
  // filtro por status
  const onlyVerified = filterFeed(feed, { query: '', statuses: ['VERIFIED'] })
  assert.ok(onlyVerified.length >= 1 && onlyVerified.every((i) => i.status === 'VERIFIED'))
  // status vazio = todos
  assert.equal(filterFeed(feed, { query: '', statuses: [] }).length, feed.length)
})

test('TEST-FEEDFILTER-002 — feedItemMatches combina busca e status', () => {
  const item = { id: '0001-git', title: 'Git', status: 'VERIFIED', date: '2026-08-03', reason: 'x' }
  assert.equal(feedItemMatches(item, { query: 'git', statuses: ['VERIFIED'] }), true)
  assert.equal(feedItemMatches(item, { query: 'git', statuses: ['DRAFT'] }), false)
  assert.equal(feedItemMatches(item, { query: 'zzz', statuses: [] }), false)
})

test('TEST-COLORD-001 — orderColumns respeita a ordem e anexa o resto (SCN-COLORD-001)', () => {
  const board = buildChangesBoard(
    [change('0001-a', 'DRAFT'), change('0002-b', 'IN_PROGRESS'), change('0003-c', 'VERIFIED')],
    new Map(),
  )
  // labels padrão: Rascunho, Em desenvolvimento, Em validação
  const ordered = orderColumns(board.columns, ['Em validação', 'Rascunho'])
  assert.deepEqual(ordered.map((c) => c.label), ['Em validação', 'Rascunho', 'Em desenvolvimento'])
  // rótulo inexistente é ignorado; ordem vazia = ordem original
  assert.deepEqual(orderColumns(board.columns, ['Inexistente']).map((c) => c.label), board.columns.map((c) => c.label))
  assert.deepEqual(orderColumns(board.columns, []).map((c) => c.label), board.columns.map((c) => c.label))
})

test('TEST-COLORD-002 — moveColumn move o rótulo e respeita as bordas (SCN-COLORD-002)', () => {
  const labels = ['A', 'B', 'C']
  assert.deepEqual(moveColumn(labels, 'B', -1), ['B', 'A', 'C'])
  assert.deepEqual(moveColumn(labels, 'B', 1), ['A', 'C', 'B'])
  assert.deepEqual(moveColumn(labels, 'A', -1), ['A', 'B', 'C']) // já é o primeiro
  assert.deepEqual(moveColumn(labels, 'C', 1), ['A', 'B', 'C']) // já é o último
  assert.deepEqual(labels, ['A', 'B', 'C']) // não muta
})

test('TEST-COLLAPSE-001 — toggleLabel adiciona/remove sem mutar (SCN-COLLAPSE-001)', () => {
  const a = ['Rascunho']
  assert.deepEqual(toggleLabel(a, 'Concluídas'), ['Rascunho', 'Concluídas'])
  assert.deepEqual(toggleLabel(a, 'Rascunho'), [])
  assert.deepEqual(a, ['Rascunho']) // não muta
})
