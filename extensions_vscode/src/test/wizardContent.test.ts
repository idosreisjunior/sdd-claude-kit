// TEST-WIZ-012 (parte pura) — conteúdo das views de etapa (REQ-WIZ-001, TASK-WIZ-011).
// O render das views no WebviewPanel é coberto pelo e2e; aqui, a extração.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  buildWizardDetails,
  parseRequirements,
  countScenarios,
  parseOpenQuestions,
  countResolvedQuestions,
  parseAdrs,
  taskCounts,
} from '../sdd/wizardContent'

const SPEC = [
  '# Feature: X',
  '## Requisitos funcionais',
  '### REQ-WIZ-001 — Stepper das 8 etapas',
  'texto',
  '#### SCN-WIZ-001 — Abrir o wizard',
  'DADO ... QUANDO ... ENTÃO ...',
  '#### SCN-WIZ-007 — Artefato ausente',
  '### REQ-WIZ-002 — Portões de qualidade',
  '#### SCN-WIZ-002 — Avançar sem requisitos',
  '## Requisitos não funcionais',
  '### NFR-WIZ-001 — Segurança do webview',
].join('\n')

const STATUS = [
  'version: 1',
  'id: "0035-x"',
  'status: DRAFT',
  'blocked_by:',
  '  - question: Q7',
  '    description: Qual stack do webview?',
  '    severity: critical',
  '  - question: Q8',
  '    description: Tema claro agora?',
  '    severity: low',
  'resolved_questions:',
  '  - question: Q1',
  '    date: "2026-08-05"',
  '    resolved_by: clarify',
  '    summary: Resolvida.',
].join('\n')

const TASKS = [
  '## TASK-WIZ-001 — Tokens',
  '**Status:** done',
  '## TASK-WIZ-002 — Pipeline',
  '**Status:** in_progress',
  '## TASK-WIZ-003 — Modelo',
  '**Status:** pending',
].join('\n')

test('extrai os requisitos com id e título, ignorando NFR e cenários', () => {
  const reqs = parseRequirements(SPEC)
  assert.deepEqual(reqs, [
    { id: 'REQ-WIZ-001', title: 'Stepper das 8 etapas' },
    { id: 'REQ-WIZ-002', title: 'Portões de qualidade' },
  ])
})

test('conta os cenários de aceite', () => {
  assert.equal(countScenarios(SPEC), 3)
})

test('SCN-WIZ-003 — a dúvida crítica em aberto é exposta com severidade', () => {
  const questions = parseOpenQuestions(STATUS)
  assert.equal(questions.length, 2)
  assert.deepEqual(questions[0], {
    question: 'Q7',
    description: 'Qual stack do webview?',
    severity: 'critical',
  })
  assert.ok(questions.some((q) => q.severity === 'critical'))
})

test('conta as questões já resolvidas', () => {
  assert.equal(countResolvedQuestions(STATUS), 1)
})

test('lista os ADRs pelo nome do arquivo, ordenados, ignorando o que não é ADR', () => {
  const adrs = parseAdrs(['ADR-034-esbuild-preact.md', 'README.md', 'ADR-033-webview.md'])
  assert.deepEqual(adrs, [
    { number: '033', title: 'webview' },
    { number: '034', title: 'esbuild preact' },
  ])
})

test('SCN-WIZ-007 — artefatos ausentes produzem listas vazias, sem lançar', () => {
  const details = buildWizardDetails({})
  assert.deepEqual(details.requirements, [])
  assert.deepEqual(details.openQuestions, [])
  assert.deepEqual(details.adrs, [])
  assert.deepEqual(details.tasks, [])
  assert.equal(details.scenarioCount, 0)
  assert.equal(details.resolvedQuestionCount, 0)
})

test('texto ilegível (YAML quebrado) não derruba a montagem', () => {
  const details = buildWizardDetails({ statusYaml: 'isto: [não\n  é: yaml válido' })
  assert.deepEqual(details.openQuestions, [])
  assert.equal(details.resolvedQuestionCount, 0)
})

test('monta o retrato completo das etapas 2–5', () => {
  const details = buildWizardDetails({
    specMd: SPEC,
    statusYaml: STATUS,
    tasksMd: TASKS,
    adrFiles: ['ADR-033-webview.md'],
  })
  assert.equal(details.requirements.length, 2)
  assert.equal(details.scenarioCount, 3)
  assert.equal(details.openQuestions.length, 2)
  assert.equal(details.adrs.length, 1)
  assert.deepEqual(details.tasks, [
    { id: 'TASK-WIZ-001', status: 'done' },
    { id: 'TASK-WIZ-002', status: 'in_progress' },
    { id: 'TASK-WIZ-003', status: 'pending' },
  ])
})

test('agrupa as tarefas por status', () => {
  const counts = taskCounts([
    { id: 'A', status: 'done' },
    { id: 'B', status: 'done' },
    { id: 'C', status: 'pending' },
    { id: 'D', status: '' },
  ])
  assert.deepEqual(counts, { done: 2, pending: 1, 'sem status': 1 })
})
