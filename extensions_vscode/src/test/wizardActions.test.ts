// TEST-WIZ-011 (parte pura) — ações de IA por etapa do wizard (REQ-WIZ-003, TASK-WIZ-010).
// A parte de borda (terminal, clipboard, CLI ausente) é exercitada no e2e wizardAi.test.ts.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { stageAction, stageActionLabel, isStageAction } from '../sdd/wizardActions'
import { WIZARD_STAGES } from '../sdd/wizardModel'
import { actionDef, composePrompt } from '../sdd/claudePrompt'

test('SCN-WIZ-004 — a etapa Especificar delega /sdd-kit:spec', () => {
  const action = stageAction('spec')
  assert.equal(action, 'spec')
  assert.equal(composePrompt(action!, '0035-wizard-cockpit'), '/sdd-kit:spec 0035-wizard-cockpit')
  assert.equal(stageActionLabel('spec'), 'Especificar com IA')
})

test('cada etapa do fluxo mapeia para uma ação conhecida do adapter 0004', () => {
  for (const stage of WIZARD_STAGES) {
    const action = stageAction(stage)
    if (action !== undefined) {
      assert.ok(actionDef(action), `ação ${action} da etapa ${stage} fora do conjunto fechado`)
    }
  }
})

test('Solicitar e Aprovar não têm ação de IA (formulário e portão humano)', () => {
  assert.equal(stageAction('request'), undefined)
  assert.equal(stageAction('approve'), undefined)
})

test('as demais etapas têm ação de IA', () => {
  for (const stage of ['spec', 'clarify', 'design', 'tasks', 'implement', 'verify'] as const) {
    assert.ok(stageAction(stage), `etapa ${stage} deveria oferecer ação de IA`)
  }
})

test('isStageAction só aceita a ação da própria etapa', () => {
  assert.ok(isStageAction('design', 'design'))
  // Ação de OUTRA etapa: o webview não escolhe qual comando a borda executa.
  assert.ok(!isStageAction('design', 'implement'))
  // Ação fora do conjunto fechado, ou etapa sem ação (SCN-CC-004).
  assert.ok(!isStageAction('design', 'rm -rf'))
  assert.ok(!isStageAction('approve', 'verify'))
  assert.ok(!isStageAction('request', undefined))
})
