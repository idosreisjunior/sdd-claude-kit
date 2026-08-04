import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  buildChangesBoard,
  parseTaskBoard,
  filterChangesBoard,
  cardMatchesFilter,
  buildActivityFeed,
} from '../sdd/boardModel'
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
