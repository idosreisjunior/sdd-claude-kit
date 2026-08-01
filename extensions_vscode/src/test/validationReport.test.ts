import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildValidationReport, classify } from '../sdd/validationReport'

test('TEST-EVID-001 — classify aplica a heurística D-Q3 em cada categoria', () => {
  assert.equal(classify({ hasTasks: true, hasTests: true, hasImplementation: true, isGap: true }), 'nao-aplicavel')
  assert.equal(classify({ hasTasks: true, hasTests: true, hasImplementation: false, isGap: false }), 'nao-atendido')
  assert.equal(classify({ hasTasks: true, hasTests: false, hasImplementation: true, isGap: false }), 'nao-testado')
  assert.equal(classify({ hasTasks: false, hasTests: true, hasImplementation: true, isGap: false }), 'parcial')
  assert.equal(classify({ hasTasks: true, hasTests: true, hasImplementation: true, isGap: false }), 'atendido')
})

const YAML = `
requirements:
  "REQ-X-001":
    title: "Pleno"
    tasks: ["TASK-X-001"]
    tests: ["TEST-X-001"]
    implementation: ["src/x.ts"]
  "REQ-X-002":
    title: "Sem teste"
    tasks: ["TASK-X-002"]
    tests: []
    implementation: ["src/y.ts"]
  "REQ-X-003":
    title: "Sem impl"
    tasks: ["TASK-X-003"]
    tests: []
    implementation: []
  "NFR-X-001":
    title: "Só revisão manual"
    tasks: ["TASK-X-004"]
    tests: []
    implementation: ["src/z.ts"]
gaps:
  - id: "NFR-X-001"
    reason: "propriedade de integração, revisão manual"
  - id: "REQ-X-009"
    reason: "incremento futuro"
`

test('TEST-EVID-002 — buildValidationReport classifica e resume (SCN-EVID-001..004)', () => {
  const report = buildValidationReport(YAML, '0099-x')
  assert.equal(report.changeId, '0099-x')
  const by = (id: string) => report.requirements.find((r) => r.id === id)

  assert.equal(by('REQ-X-001')?.verdict, 'atendido')
  assert.equal(by('REQ-X-002')?.verdict, 'nao-testado')
  assert.equal(by('REQ-X-003')?.verdict, 'nao-atendido')
  // Em gaps → não aplicável, mesmo com implementação (SCN-EVID-004).
  assert.equal(by('NFR-X-001')?.verdict, 'nao-aplicavel')
  assert.equal(by('NFR-X-001')?.note, 'propriedade de integração, revisão manual')
  // Requisito só em gaps é incluído como não aplicável.
  assert.equal(by('REQ-X-009')?.verdict, 'nao-aplicavel')

  assert.deepEqual(report.summary, {
    atendido: 1,
    parcial: 0,
    'nao-testado': 1,
    'nao-atendido': 1,
    'nao-aplicavel': 2,
  })
})

test('TEST-EVID-002 — YAML inválido/ausente vira relatório vazio, sem lançar', () => {
  const empty = buildValidationReport('', '0099-x')
  assert.deepEqual(empty.requirements, [])
  assert.equal(empty.summary.atendido, 0)
  assert.doesNotThrow(() => buildValidationReport(': : inválido', '0099-x'))
})
