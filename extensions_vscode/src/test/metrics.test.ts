import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  computeMetrics,
  compareSnapshots,
  renderMetricsMarkdown,
  toMetricsJson,
  type MetricsInput,
  type MetricsSnapshot,
} from '../sdd/metrics'

const STATUS = `
version: 1
id: "0099-x"
status: IN_PROGRESS
created: "2026-07-31"
updated: "2026-08-05"
history:
  - status: DRAFT
    date: "2026-07-31"
    reason: criada
  - status: IN_PROGRESS
    date: "2026-08-05"
    reason: implementada
tasks:
  total: 6
  pending: 2
  in_progress: 0
  done: 4
`

const TRACE = `
requirements:
  "REQ-X-001":
    scenarios: ["SCN-X-001", "SCN-X-002"]
    tasks: ["TASK-X-001"]
    implementation: ["src/a.ts", "src/b.ts"]
    tests: ["TEST-X-001"]
  "REQ-X-002":
    scenarios: ["SCN-X-003"]
    tasks: ["TASK-X-002"]
    implementation: ["src/b.ts"]
    tests: []
`

function input(over: Partial<MetricsInput> = {}): MetricsInput {
  return {
    changeId: '0099-x',
    type: 'feature',
    title: 'Exemplo',
    status: 'IN_PROGRESS',
    timestamp: '2026-08-05T12:00:00Z',
    statusYaml: STATUS,
    traceabilityYaml: TRACE,
    git: { changedFiles: 3, added: 40, removed: 5 },
    contextTokens: 12000,
    ...over,
  }
}

test('TEST-METR-001 — computeMetrics calcula o subconjunto viável (SCN-METR-001)', () => {
  const m = computeMetrics(input())
  assert.equal(m.tasksDone, 4)
  assert.equal(m.tasksTotal, 6)
  assert.equal(m.requirements, 2)
  assert.equal(m.requirementsValidated, 1) // REQ-X-001 tem tarefa+teste+impl; REQ-X-002 sem teste
  assert.equal(m.validatedPct, 50)
  assert.equal(m.scenarios, 3)
  assert.equal(m.tests, 1)
  assert.equal(m.files, 2) // src/a.ts, src/b.ts (únicos)
  assert.equal(m.durationDays, 5) // 2026-07-31 → 2026-08-05
  assert.deepEqual(m.git, { changedFiles: 3, added: 40, removed: 5 })
  assert.equal(m.contextTokens, 12000)
})

test('TEST-METR-002 — artefatos ausentes produzem métricas parciais, sem lançar (SCN-METR-002)', () => {
  const m = computeMetrics(input({ statusYaml: undefined, traceabilityYaml: undefined, git: undefined, contextTokens: undefined }))
  assert.equal(m.tasksTotal, 0)
  assert.equal(m.requirements, 0)
  assert.equal(m.validatedPct, 0)
  assert.equal(m.durationDays, undefined)
  assert.doesNotThrow(() => computeMetrics(input({ traceabilityYaml: ': : inválido' })))
})

test('TEST-METR-003 — compareSnapshots e exportações (SCN-METR-003)', () => {
  const curr = computeMetrics(input())
  const prev: MetricsSnapshot = { ...curr, tasksDone: 2, requirementsValidated: 0, validatedPct: 0, tests: 0 }
  const delta = compareSnapshots(prev, curr)
  assert.equal(delta.tasksDone, 2)
  assert.equal(delta.requirementsValidated, 1)
  assert.equal(delta.validatedPct, 50)
  assert.equal(delta.tests, 1)

  const md = renderMetricsMarkdown(curr)
  assert.match(md, /^# Métricas — 0099-x/m)
  assert.match(md, /Tarefas: 4\/6/)
  assert.match(md, /validados: 1 \(50%\)/)

  const json = JSON.parse(toMetricsJson(curr))
  assert.equal(json.changeId, '0099-x')
  assert.equal(json.validatedPct, 50)
})
