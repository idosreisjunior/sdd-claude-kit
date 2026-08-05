import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  buildChangeArtifacts,
  countRequirements,
  hasCriticalOpenQuestions,
} from '../sdd/wizardArtifacts'

const SPEC = `# Feature: X
## Requisitos funcionais
### REQ-WIZ-001 — um
### REQ-WIZ-002 — dois
## Requisitos não funcionais
### NFR-WIZ-001 — não conta como requisito funcional
`

const STATUS = `version: 1
status: DESIGNED
approval: null
blocked_by:
  - question: Q2
    severity: medium
tasks:
  total: 15
  pending: 11
  in_progress: 0
  done: 4
`

test('TEST-WIZ-017 — conta só os requisitos funcionais (REQ-*)', () => {
  assert.equal(countRequirements(SPEC), 2)
  assert.equal(countRequirements(''), 0)
})

test('TEST-WIZ-017 — dúvida crítica é detectada em blocked_by', () => {
  assert.equal(hasCriticalOpenQuestions(STATUS), false)
  const critico = STATUS.replace('severity: medium', 'severity: critical')
  assert.equal(hasCriticalOpenQuestions(critico), true)
  assert.equal(hasCriticalOpenQuestions('lixo: ['), false) // YAML inválido não lança
})

test('TEST-WIZ-017 — buildChangeArtifacts extrai status, tarefas e aprovação', () => {
  const a = buildChangeArtifacts({
    statusYaml: STATUS,
    specMd: SPEC,
    hasRequest: true,
    hasDesign: true,
    adrCount: 3,
  })
  assert.equal(a.sddStatus, 'DESIGNED')
  assert.equal(a.requirementCount, 2)
  assert.equal(a.hasCriticalOpenQuestions, false)
  assert.equal(a.taskTotal, 15)
  assert.equal(a.taskDone, 4)
  assert.equal(a.approved, false) // approval: null
  assert.equal(a.hasDesign, true)
  assert.equal(a.adrCount, 3)
})

test('TEST-WIZ-017 — approval preenchido conta como aprovado', () => {
  const aprovado = STATUS.replace(
    'approval: null',
    'approval:\n  date: "2026-08-05"\n  by: alguem\n  revision: 1',
  )
  const a = buildChangeArtifacts({ statusYaml: aprovado, hasRequest: true, hasDesign: true, adrCount: 1 })
  assert.equal(a.approved, true)
})

test('TEST-WIZ-017 — entradas ausentes viram 0/false sem lançar', () => {
  const a = buildChangeArtifacts({ hasRequest: false, hasDesign: false, adrCount: 0 })
  assert.equal(a.sddStatus, 'DRAFT')
  assert.equal(a.requirementCount, 0)
  assert.equal(a.taskTotal, 0)
  assert.equal(a.approved, false)
})
