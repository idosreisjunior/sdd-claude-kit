import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  buildOverview,
  summarizeDiagnostics,
  PROJECT_DOCS,
  type OverviewInput,
} from '../sdd/projectOverview'
import type { ChangeEntry } from '../sdd/specsIndex'
import type { Usage } from '../sdd/contextGuardian'

function change(status: string, id = status.toLowerCase()): ChangeEntry {
  return { id, type: 'feature', title: id, status, path: `features/${id}` }
}

function allDocsPresent(): Record<string, boolean> {
  const out: Record<string, boolean> = {}
  for (const d of PROJECT_DOCS) {
    out[d.relPath] = true
  }
  return out
}

function input(over: Partial<OverviewInput> = {}): OverviewInput {
  return {
    doctor: { errors: 0, warnings: 0, info: 0 },
    context: undefined,
    contextMax: 200000,
    changes: [],
    docExists: allDocsPresent(),
    ...over,
  }
}

test('TEST-PROJ-001 — contadores por status na ordem do fluxo SDD (SCN-PROJ-006)', () => {
  // Entrada fora de ordem: VERIFIED, DRAFT, IN_PROGRESS, DRAFT.
  const changes = [change('VERIFIED'), change('DRAFT', 'a'), change('IN_PROGRESS'), change('DRAFT', 'b')]
  const model = buildOverview(input({ changes }))
  assert.equal(model.counts.kind, 'counts')
  if (model.counts.kind !== 'counts') {
    return
  }
  assert.equal(model.counts.total, 4)
  // DRAFT (2) antes de IN_PROGRESS (1) antes de VERIFIED (1), como no fluxo SDD.
  assert.deepEqual(model.counts.byStatus, [
    { status: 'DRAFT', count: 2 },
    { status: 'IN_PROGRESS', count: 1 },
    { status: 'VERIFIED', count: 1 },
  ])
})

test('TEST-PROJ-001 — status desconhecido é preservado e vai ao final', () => {
  const changes = [change('WEIRD'), change('DRAFT')]
  const model = buildOverview(input({ changes }))
  if (model.counts.kind !== 'counts') {
    assert.fail('esperava counts')
  }
  assert.deepEqual(model.counts.byStatus, [
    { status: 'DRAFT', count: 1 },
    { status: 'WEIRD', count: 1 },
  ])
})

test('TEST-PROJ-002 — índice ausente/ilegível vira estado no-index (SCN-PROJ-007)', () => {
  const model = buildOverview(input({ changes: undefined }))
  assert.equal(model.counts.kind, 'no-index')
})

test('TEST-PROJ-002 — documento ausente é marcado exists:false, sem lançar (SCN-PROJ-008)', () => {
  const docExists = allDocsPresent()
  docExists['.specs/project/vision.md'] = false
  const model = buildOverview(input({ docExists }))
  const vision = model.docs.find((d) => d.relPath === '.specs/project/vision.md')
  assert.ok(vision)
  assert.equal(vision?.exists, false)
  // Os demais continuam presentes.
  assert.equal(model.docs.filter((d) => d.exists).length, PROJECT_DOCS.length - 1)
})

test('TEST-PROJ-002 — docExists vazio não lança e marca tudo ausente', () => {
  const model = buildOverview(input({ docExists: {} }))
  assert.equal(model.docs.length, PROJECT_DOCS.length)
  assert.ok(model.docs.every((d) => d.exists === false))
})

test('TEST-PROJ-003 — Doctor não executado é distinto de "0 erros" (SCN-PROJ-003)', () => {
  const notRun = buildOverview(input({ doctor: undefined }))
  assert.equal(notRun.health.kind, 'not-run')

  const clean = buildOverview(input({ doctor: { errors: 0, warnings: 0, info: 0 } }))
  assert.equal(clean.health.kind, 'clean')

  const problems = buildOverview(input({ doctor: { errors: 2, warnings: 3, info: 0 } }))
  assert.equal(problems.health.kind, 'problems')
  if (problems.health.kind === 'problems') {
    assert.equal(problems.health.errors, 2)
    assert.equal(problems.health.warnings, 3)
  }
})

test('TEST-PROJ-003 — contexto não medido mostra o teto; medido reflete a faixa (SCN-PROJ-004/005)', () => {
  const notMeasured = buildOverview(input({ context: undefined, contextMax: 200000 }))
  assert.equal(notMeasured.context.kind, 'not-measured')
  if (notMeasured.context.kind === 'not-measured') {
    assert.equal(notMeasured.context.max, 200000)
  }

  const usage: Usage = { used: 140000, max: 200000, fraction: 0.7, band: 'atencao' }
  const measured = buildOverview(input({ context: usage }))
  assert.equal(measured.context.kind, 'measured')
  if (measured.context.kind === 'measured') {
    assert.equal(measured.context.used, 140000)
    assert.equal(measured.context.band, 'atencao')
  }
})

test('TEST-PROJ-003 — summarizeDiagnostics conta severidades', () => {
  const health = summarizeDiagnostics([
    { severity: 'error' },
    { severity: 'error' },
    { severity: 'warning' },
    { severity: 'info' },
  ])
  assert.deepEqual(health, { errors: 2, warnings: 1, info: 1 })
})
