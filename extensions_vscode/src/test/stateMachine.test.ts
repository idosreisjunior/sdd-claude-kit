import { test } from 'node:test'
import assert from 'node:assert/strict'
import { candidateTargets, canTransition, validTransitions, TRANSITIONS } from '../sdd/stateMachine'

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

test('TEST-DND-007 — o grafo embutido espelha workflow.json por completo (10 estados)', () => {
  // Protege a cópia embutida contra divergência silenciosa do workflow.json.
  const expected: Record<string, string[]> = {
    DRAFT: ['CLARIFIED', 'CANCELLED'],
    CLARIFIED: ['DESIGNED', 'DRAFT', 'CANCELLED'],
    DESIGNED: ['PLANNED', 'CLARIFIED', 'CANCELLED'],
    PLANNED: ['APPROVED', 'IN_PROGRESS', 'DESIGNED', 'CANCELLED'],
    APPROVED: ['IN_PROGRESS', 'PLANNED', 'CANCELLED'],
    IN_PROGRESS: ['BLOCKED', 'VERIFIED', 'CANCELLED'],
    BLOCKED: ['IN_PROGRESS', 'PLANNED', 'CANCELLED'],
    VERIFIED: ['ARCHIVED', 'IN_PROGRESS', 'CANCELLED'],
    ARCHIVED: [],
    CANCELLED: [],
  }
  assert.equal(Object.keys(TRANSITIONS).length, 10)
  for (const [state, targets] of Object.entries(expected)) {
    assert.deepEqual([...(TRANSITIONS as Record<string, readonly string[]>)[state]], targets, state)
  }
  // estados terminais não saem
  assert.deepEqual([...validTransitions('ARCHIVED')], [])
  assert.deepEqual([...validTransitions('CANCELLED')], [])
  // estado desconhecido não transiciona
  assert.deepEqual(candidateTargets('DESCONHECIDO', 'Rascunho'), [])
  assert.equal(canTransition('DESCONHECIDO', 'DRAFT'), false)
})
