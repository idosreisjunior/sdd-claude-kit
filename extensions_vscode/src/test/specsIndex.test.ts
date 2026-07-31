import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parseChanges, groupByStatus, groupFor, parseTaskProgress } from '../sdd/specsIndex'

const INDEX = `version: 1
next_id: 4
changes:
  - id: 0001-foundation
    type: feature
    title: Fundação
    status: DRAFT
    path: features/0001-foundation
  - id: 0002-management
    type: feature
    title: Gerenciamento
    status: IN_PROGRESS
    path: features/0002-management
  - id: 0003-fix
    type: bug
    title: Corrige algo
    status: BLOCKED
    path: bugs/0003-fix
archive: []
`

test('TEST-FEAT-001 — parseChanges lê os campos de cada mudança', () => {
  const changes = parseChanges(INDEX)
  assert.equal(changes.length, 3)
  assert.deepEqual(changes[0], {
    id: '0001-foundation',
    type: 'feature',
    title: 'Fundação',
    status: 'DRAFT',
    path: 'features/0001-foundation',
  })
})

test('TEST-FEAT-001 — groupByStatus agrupa na ordem do painel, sem grupos vazios', () => {
  const groups = groupByStatus(parseChanges(INDEX))
  assert.deepEqual(
    groups.map((g) => g.label),
    ['Rascunho', 'Em desenvolvimento', 'Bloqueadas'],
  )
  assert.equal(groups[0].changes[0].id, '0001-foundation')
})

test('TEST-FEAT-001 — mapeamento estado SDD → grupo do painel', () => {
  assert.equal(groupFor('DRAFT'), 'Rascunho')
  assert.equal(groupFor('PLANNED'), 'Rascunho')
  assert.equal(groupFor('IN_PROGRESS'), 'Em desenvolvimento')
  assert.equal(groupFor('APPROVED'), 'Em desenvolvimento')
  assert.equal(groupFor('BLOCKED'), 'Bloqueadas')
  assert.equal(groupFor('VERIFIED'), 'Em validação')
  assert.equal(groupFor('ARCHIVED'), 'Concluídas')
  assert.equal(groupFor('CANCELLED'), 'Canceladas')
  assert.equal(groupFor('DESCONHECIDO'), 'Rascunho')
})

test('TEST-FEAT-001 — YAML inválido não lança: retorna lista vazia (NFR-FEAT-001)', () => {
  assert.deepEqual(parseChanges(':\n  - [inválido'), [])
  assert.deepEqual(parseChanges('changes: não-é-lista'), [])
  assert.deepEqual(parseChanges(''), [])
})

test('TEST-FEAT-003 — parseTaskProgress lê done/total do bloco tasks', () => {
  const progress = parseTaskProgress(`version: 1
id: "0002-feature-management"
tasks:
  total: 9
  pending: 3
  in_progress: 0
  done: 6
`)
  assert.deepEqual(progress, { done: 6, total: 9 })
})

test('TEST-FEAT-003 — status inválido/incompleto → undefined, sem lançar (NFR-FEAT-001)', () => {
  assert.equal(parseTaskProgress(':\n  - [inválido'), undefined) // YAML inválido
  assert.equal(parseTaskProgress('id: 0001'), undefined) // sem bloco tasks
  assert.equal(parseTaskProgress('tasks: não-é-mapa'), undefined) // tasks não é objeto
  assert.equal(parseTaskProgress('tasks:\n  done: 6'), undefined) // sem total
  assert.equal(parseTaskProgress('tasks:\n  total: nove\n  done: 6'), undefined) // total não numérico
})

test('TEST-FEAT-001 — entradas sem id são descartadas; defaults aplicados', () => {
  const changes = parseChanges(`changes:
  - type: feature
    title: sem id
  - id: 0009-x
`)
  assert.equal(changes.length, 1)
  assert.equal(changes[0].id, '0009-x')
  assert.equal(changes[0].status, 'DRAFT')
  assert.equal(changes[0].title, '0009-x')
})
