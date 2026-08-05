import { test } from 'node:test'
import assert from 'node:assert/strict'
import { planAllocation, parseNextId } from '../sdd/changePlanner'

const INDEX = `version: 1
next_id: 35
changes:
  - id: 0034-board-collapse-columns
`

test('TEST-WIZ-009 — parseNextId lê o next_id, ou undefined se ausente', () => {
  assert.equal(parseNextId(INDEX), 35)
  assert.equal(parseNextId('version: 1'), undefined)
})

test('TEST-WIZ-009 — aloca o próximo id e o diretório do tipo', () => {
  const r = planAllocation(INDEX, ['0034-board-collapse-columns'], 'feature', 'wizard-cockpit')
  assert.deepEqual(r, {
    ok: true,
    changeId: '0035-wizard-cockpit',
    relDir: 'features/0035-wizard-cockpit',
    nextId: 35,
  })
})

test('TEST-WIZ-009 · SCN-WIZ-009 — diretório com o id alocado já existe → índice defasado, não sobrescreve', () => {
  const r = planAllocation(INDEX, ['0035-wizard-cockpit'], 'feature', 'wizard-cockpit')
  assert.equal(r.ok, false)
  assert.equal(r.ok === false && r.error, 'index-stale')
  assert.equal(r.ok === false && r.error === 'index-stale' && r.conflictId, 35)
})

test('TEST-WIZ-009 — índice defasado (disco já usa id >= next_id) é reportado', () => {
  const r = planAllocation(INDEX, ['0035-outra-coisa'], 'feature', 'nova')
  assert.equal(r.ok, false)
  assert.equal(r.ok === false && r.error, 'index-stale')
})

test('TEST-WIZ-009 — índice sem next_id é reportado', () => {
  const r = planAllocation('version: 1', [], 'feature', 'nova')
  assert.equal(r.ok, false)
  assert.equal(r.ok === false && r.error, 'no-next-id')
})

test('TEST-WIZ-009 — o tipo escolhe o diretório', () => {
  const bug = planAllocation(INDEX, [], 'bug', 'corrige-x')
  assert.equal(bug.ok === true && bug.relDir, 'bugs/0035-corrige-x')
})
