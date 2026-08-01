import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  parseTraceabilityNav,
  classifyArtifact,
  artifactsOf,
} from '../sdd/traceabilityNav'

const YAML = `
version: 1
feature: "0007-git-traceability"
requirements:
  "REQ-TRACE-001":
    title: "Estado do Git"
    scenarios: ["SCN-TRACE-001", "SCN-TRACE-002"]
    tasks: ["TASK-TRACE-002"]
    implementation: ["src/sdd/gitParse.ts"]
    tests: ["TEST-TRACE-001"]
  "NFR-TRACE-002":
    title: "Núcleo puro"
    scenarios: []
    tasks: ["TASK-TRACE-002"]
    implementation: ["src/sdd/gitParse.ts", "src/sdd/scopeCheck.ts"]
    tests: ["TEST-TRACE-003"]
`

test('TEST-TRACE-010 — parseTraceabilityNav monta o modelo navegável (SCN-TRACE-007)', () => {
  const nav = parseTraceabilityNav(YAML)
  assert.equal(nav.requirements.length, 2)
  const req = nav.requirements[0]
  assert.equal(req.id, 'REQ-TRACE-001')
  assert.equal(req.title, 'Estado do Git')
  assert.deepEqual(req.scenarios, ['SCN-TRACE-001', 'SCN-TRACE-002'])
  assert.deepEqual(req.tasks, ['TASK-TRACE-002'])
  assert.deepEqual(req.files, ['src/sdd/gitParse.ts'])
  assert.deepEqual(req.tests, ['TEST-TRACE-001'])
})

test('TEST-TRACE-010 — artifactsOf achata na ordem cenário→tarefa→arquivo→teste', () => {
  const nav = parseTraceabilityNav(YAML)
  const arts = artifactsOf(nav.requirements[0])
  assert.deepEqual(
    arts.map((a) => `${a.kind}:${a.id}`),
    [
      'scenario:SCN-TRACE-001',
      'scenario:SCN-TRACE-002',
      'task:TASK-TRACE-002',
      'file:src/sdd/gitParse.ts',
      'test:TEST-TRACE-001',
    ],
  )
})

test('TEST-TRACE-011 — classifyArtifact reconhece cada tipo pelo identificador', () => {
  assert.equal(classifyArtifact('SCN-X-001'), 'scenario')
  assert.equal(classifyArtifact('TASK-X-001'), 'task')
  assert.equal(classifyArtifact('TEST-X-001'), 'test')
  assert.equal(classifyArtifact('REQ-X-001'), 'requirement')
  assert.equal(classifyArtifact('NFR-X-001'), 'requirement')
  assert.equal(classifyArtifact('src/sdd/gitParse.ts'), 'file')
  assert.equal(classifyArtifact('package.json'), 'file')
})

test('TEST-TRACE-011 — YAML inválido/sem requisitos vira modelo vazio, sem lançar', () => {
  assert.deepEqual(parseTraceabilityNav('').requirements, [])
  assert.deepEqual(parseTraceabilityNav(': : : inválido').requirements, [])
  assert.deepEqual(parseTraceabilityNav('version: 1').requirements, [])
})
