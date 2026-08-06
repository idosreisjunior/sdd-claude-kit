import { test } from 'node:test'
import assert from 'node:assert/strict'
import { canAdvance, nextStage, advanceTargetStatus } from '../sdd/wizardStepGuards'
import { canTransition } from '../sdd/stateMachine'
import type { ChangeArtifacts } from '../sdd/wizardModel'

/** Retrato base "tudo satisfeito"; cada teste sabota o que precisa. */
function artifacts(over: Partial<ChangeArtifacts> = {}): ChangeArtifacts {
  return {
    sddStatus: 'IN_PROGRESS',
    hasRequest: true,
    requirementCount: 6,
    hasCriticalOpenQuestions: false,
    hasDesign: true,
    adrCount: 3,
    taskTotal: 15,
    taskDone: 15,
    approved: true,
    ...over,
  }
}

test('TEST-WIZ-004 · SCN-WIZ-002 — Especificar não avança sem requisitos', () => {
  const r = canAdvance('spec', artifacts({ requirementCount: 0 }))
  assert.equal(r.ok, false)
  assert.equal(r.to, 'clarify')
  assert.equal(r.reasons.length, 1)
  assert.match(r.reasons[0], /requisito/i)
})

test('TEST-WIZ-004 — Especificar avança com ao menos um requisito', () => {
  const r = canAdvance('spec', artifacts({ requirementCount: 1 }))
  assert.equal(r.ok, true)
  assert.deepEqual(r.reasons, [])
  assert.equal(r.to, 'clarify')
})

test('TEST-WIZ-005 · SCN-WIZ-003 — Clarificar não avança com dúvida crítica em aberto', () => {
  const r = canAdvance('clarify', artifacts({ hasCriticalOpenQuestions: true }))
  assert.equal(r.ok, false)
  assert.equal(r.to, 'design')
  assert.match(r.reasons[0], /crítica/i)
})

test('TEST-WIZ-005 — Clarificar avança sem dúvida crítica', () => {
  const r = canAdvance('clarify', artifacts({ hasCriticalOpenQuestions: false }))
  assert.equal(r.ok, true)
})

test('TEST-WIZ-004 — Desenhar exige design.md e ao menos um ADR (dois motivos)', () => {
  const r = canAdvance('design', artifacts({ hasDesign: false, adrCount: 0 }))
  assert.equal(r.ok, false)
  assert.equal(r.reasons.length, 2)
})

test('TEST-WIZ-004 — Aprovar exige aprovação; Implementar exige ≥1 tarefa concluída', () => {
  assert.equal(canAdvance('approve', artifacts({ approved: false })).ok, false)
  assert.equal(canAdvance('approve', artifacts({ approved: true })).ok, true)
  assert.equal(canAdvance('implement', artifacts({ taskDone: 0 })).ok, false)
  assert.equal(canAdvance('implement', artifacts({ taskDone: 1 })).ok, true)
})

test('TEST-WIZ-004 — Verificar só promove com todas as tarefas concluídas', () => {
  assert.equal(canAdvance('verify', artifacts({ taskTotal: 15, taskDone: 14 })).ok, false)
  assert.equal(canAdvance('verify', artifacts({ taskTotal: 15, taskDone: 15 })).ok, true)
})

test('TEST-WIZ-004 — nextStage percorre o fluxo e termina em null', () => {
  assert.equal(nextStage('request'), 'spec')
  assert.equal(nextStage('tasks'), 'approve')
  assert.equal(nextStage('verify'), null)
})

test('TEST-WIZ-008 — advanceTargetStatus mapeia as etapas para o status do ciclo', () => {
  assert.equal(advanceTargetStatus('request'), null)
  assert.equal(advanceTargetStatus('spec'), null)
  assert.equal(advanceTargetStatus('clarify'), 'CLARIFIED')
  assert.equal(advanceTargetStatus('design'), 'DESIGNED')
  assert.equal(advanceTargetStatus('tasks'), 'PLANNED')
  assert.equal(advanceTargetStatus('approve'), 'APPROVED')
  assert.equal(advanceTargetStatus('implement'), 'IN_PROGRESS')
  assert.equal(advanceTargetStatus('verify'), 'VERIFIED')
})

test('TEST-WIZ-008 — cada alvo de avanço é uma transição válida do estado anterior', () => {
  // Clarificar (DRAFT) -> CLARIFIED, Desenhar (CLARIFIED) -> DESIGNED, etc.
  assert.equal(canTransition('DRAFT', advanceTargetStatus('clarify')!), true)
  assert.equal(canTransition('CLARIFIED', advanceTargetStatus('design')!), true)
  assert.equal(canTransition('DESIGNED', advanceTargetStatus('tasks')!), true)
  assert.equal(canTransition('PLANNED', advanceTargetStatus('approve')!), true)
  assert.equal(canTransition('APPROVED', advanceTargetStatus('implement')!), true)
  assert.equal(canTransition('IN_PROGRESS', advanceTargetStatus('verify')!), true)
})
