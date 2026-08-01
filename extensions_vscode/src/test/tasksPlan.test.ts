import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parseTasksPlan, inProgressPlan } from '../sdd/tasksPlan'

const TASKS = [
  '# Tarefas — Exemplo',
  '',
  '## TASK-EX-001 — Primeira',
  '**Requisitos:** REQ-EX-001',
  '**Status:** done',
  '',
  '### Arquivos prováveis',
  '',
  '- `src/a.ts`',
  '',
  '## TASK-EX-002 — Segunda',
  '**Status:** in_progress',
  '',
  '### Arquivos prováveis',
  '',
  '- `src/b.ts`',
  '- `src/c.ts`',
  '',
  '### Testes esperados',
  '',
  '- TEST-EX-001',
].join('\n')

test('TEST-TRACE-008 — extrai status e arquivos prováveis; acha a in_progress', () => {
  const plans = parseTasksPlan(TASKS)
  assert.equal(plans.length, 2)
  assert.deepEqual(plans[0], { id: 'TASK-EX-001', status: 'done', plannedFiles: ['src/a.ts'] })
  assert.deepEqual(plans[1], { id: 'TASK-EX-002', status: 'in_progress', plannedFiles: ['src/b.ts', 'src/c.ts'] })

  const current = inProgressPlan(plans)
  assert.ok(current)
  assert.equal(current?.id, 'TASK-EX-002')
  assert.deepEqual(current?.plannedFiles, ['src/b.ts', 'src/c.ts'])
})

test('TEST-TRACE-008 — a seção "Testes esperados" não entra nos arquivos prováveis', () => {
  const plans = parseTasksPlan(TASKS)
  assert.ok(!plans[1].plannedFiles.some((f) => f.includes('TEST-EX')))
})

test('TEST-TRACE-009 — markdown vazio/sem tarefas resulta em lista vazia, sem lançar', () => {
  assert.deepEqual(parseTasksPlan(''), [])
  assert.deepEqual(parseTasksPlan('# só um título\ntexto solto'), [])
  assert.equal(inProgressPlan([]), undefined)
})
