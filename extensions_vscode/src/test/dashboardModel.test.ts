import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildDashboardModel, type DashboardSources } from '../sdd/dashboardModel'

const STATUS = `version: 1
id: "0002-x"
type: "feature"
title: "Gerenciamento"
status: VERIFIED
history:
  - status: DRAFT
    date: "2026-07-31"
    reason: criada
  - status: VERIFIED
    date: "2026-07-31"
    reason: verificada
blocked_by:
  - question: Q1
    description: Como serializar?
    severity: high
tasks:
  total: 9
  pending: 0
  in_progress: 0
  done: 9
`

const TRACE = `version: 1
feature: "0002-x"
requirements:
  "REQ-X-001":
    scenarios: ["SCN-X-001"]
    tasks: ["TASK-X-001"]
    implementation: ["src/a.ts"]
    tests: ["TEST-X-001"]
  "REQ-X-002":
    scenarios: ["SCN-X-002", "SCN-X-001"]
    implementation: ["src/a.ts", "src/b.ts"]
    tests: ["TEST-X-002"]
`

const SPEC = `# Feature: X

## Objetivo

Dar função ao painel.

## Critérios de aceite

- [x] um
- [ ] dois
- [x] três
`

test('TEST-UI-001 — modelo completo a partir dos artefatos', () => {
  const model = buildDashboardModel({
    indexEntry: { id: '0002-x', type: 'feature', title: 'Gerenciamento', status: 'VERIFIED' },
    statusYaml: STATUS,
    traceabilityYaml: TRACE,
    specMd: SPEC,
    hasEvidence: true,
  })
  assert.equal(model.id, '0002-x')
  assert.equal(model.status, 'VERIFIED')
  assert.equal(model.objective, 'Dar função ao painel.')
  assert.deepEqual(model.progress, { done: 9, total: 9 })
  // contagens de fontes estruturadas (ADR-005/Q2)
  assert.deepEqual(model.counts.requirements, { available: true, value: 2 })
  assert.deepEqual(model.counts.scenarios, { available: true, value: 2 }) // únicos: 001, 002
  assert.deepEqual(model.counts.files, { available: true, value: 2 }) // únicos: a, b
  assert.deepEqual(model.counts.tests, { available: true, value: 2 })
  assert.deepEqual(model.counts.tasks, { available: true, value: 9 })
  assert.deepEqual(model.counts.acceptanceCriteria, { available: true, value: 3 })
  assert.equal(model.blockers.length, 1)
  assert.equal(model.blockers[0].question, 'Q1')
  assert.equal(model.history.length, 2)
  // evidências apontam o arquivo quando existe
  assert.ok(model.deferred.some((d) => d.label === 'Evidências' && d.note === 'ver evidence.md'))
})

test('TEST-UI-001 — traceability ausente marca contagens como indisponíveis (SCN-UI-003)', () => {
  const model = buildDashboardModel({ statusYaml: STATUS, specMd: SPEC })
  assert.deepEqual(model.counts.requirements, { available: false, note: 'sem traceability.yaml' })
  assert.deepEqual(model.counts.scenarios, { available: false, note: 'sem traceability.yaml' })
  // status ainda é lido
  assert.deepEqual(model.counts.tasks, { available: true, value: 9 })
  assert.deepEqual(model.counts.acceptanceCriteria, { available: true, value: 3 })
})

test('TEST-UI-001 — YAML/entrada inválidos não lançam, degradam (NFR-UI-001)', () => {
  const bad: DashboardSources = {
    statusYaml: ':\n  - [inválido',
    traceabilityYaml: 'requirements: não-é-mapa',
    specMd: undefined,
  }
  const model = buildDashboardModel(bad)
  assert.equal(model.id, '(sem id)')
  assert.equal(model.progress, null)
  assert.equal(model.objective, null)
  assert.deepEqual(model.counts.tasks, { available: false, note: 'sem status.yaml' })
  assert.deepEqual(model.counts.requirements, { available: false, note: 'sem traceability.yaml' })
  assert.deepEqual(model.counts.acceptanceCriteria, { available: false, note: 'sem spec.md' })
  assert.deepEqual(model.blockers, [])
  assert.deepEqual(model.history, [])
})

test('TEST-UI-001 — sem objetivo na spec → null; sem entrada de índice usa status.yaml', () => {
  const model = buildDashboardModel({ statusYaml: STATUS, specMd: '# X\n\nsem secao objetivo\n' })
  assert.equal(model.objective, null)
  assert.equal(model.title, 'Gerenciamento') // veio do status.yaml
  assert.equal(model.type, 'feature')
})
