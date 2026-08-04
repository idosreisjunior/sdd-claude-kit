import { test } from 'node:test'
import assert from 'node:assert/strict'
import { candidateTargets, canTransition, validTransitions } from '../sdd/stateMachine'

test('TEST-DND-001 — candidateTargets resolve os estados do grupo alcançáveis (SCN-DND-001)', () => {
  // De PLANNED, a coluna "Em desenvolvimento" oferece APPROVED e IN_PROGRESS.
  assert.deepEqual(candidateTargets('PLANNED', 'Em desenvolvimento'), ['APPROVED', 'IN_PROGRESS'])
  // De IN_PROGRESS, "Em validação" oferece VERIFIED (único).
  assert.deepEqual(candidateTargets('IN_PROGRESS', 'Em validação'), ['VERIFIED'])
  // De VERIFIED, "Concluídas" oferece ARCHIVED.
  assert.deepEqual(candidateTargets('VERIFIED', 'Concluídas'), ['ARCHIVED'])
})

test('TEST-DND-002 — coluna sem transição válida devolve lista vazia (SCN-DND-002)', () => {
  // De DRAFT não se alcança VERIFIED (nem nenhum estado de "Em validação").
  assert.deepEqual(candidateTargets('DRAFT', 'Em validação'), [])
  // Estado terminal não transiciona.
  assert.deepEqual(candidateTargets('ARCHIVED', 'Em desenvolvimento'), [])
})

test('TEST-DND-003 — canTransition e validTransitions seguem o grafo', () => {
  assert.equal(canTransition('IN_PROGRESS', 'VERIFIED'), true)
  assert.equal(canTransition('DRAFT', 'VERIFIED'), false)
  assert.equal(canTransition('VERIFIED', 'ARCHIVED'), true)
  assert.deepEqual(validTransitions('ARCHIVED'), [])
  assert.deepEqual([...validTransitions('DRAFT')], ['CLARIFIED', 'CANCELLED'])
})
