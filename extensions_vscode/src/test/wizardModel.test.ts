import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  deriveWizardState,
  WIZARD_STAGES,
  type ChangeArtifacts,
  type WizardStage,
  type StageStatus,
  type WizardState,
} from '../sdd/wizardModel'

const CHANGE = { id: '0035-wizard-cockpit', title: 'Wizard Cockpit', type: 'feature' }

/** Retrato base "tudo presente"; cada teste sobrescreve o que precisa. */
function artifacts(over: Partial<ChangeArtifacts> = {}): ChangeArtifacts {
  return {
    sddStatus: 'DRAFT',
    hasRequest: true,
    requirementCount: 0,
    hasCriticalOpenQuestions: false,
    hasDesign: false,
    adrCount: 0,
    taskTotal: 0,
    taskDone: 0,
    approved: false,
    ...over,
  }
}

/** Mapa etapa → status de um estado derivado, para asserções legíveis. */
function statusMap(st: WizardState): Record<WizardStage, StageStatus> {
  const out = {} as Record<WizardStage, StageStatus>
  for (const s of st.stages) {
    out[s.stage] = s.status
  }
  return out
}

test('TEST-WIZ-002 · SCN-WIZ-001 — mudança em DESIGNED: design concluído, tarefas é a atual', () => {
  const st = deriveWizardState(
    CHANGE,
    artifacts({ sddStatus: 'DESIGNED', requirementCount: 6, hasDesign: true, adrCount: 3 }),
  )
  const s = statusMap(st)
  assert.equal(s.request, 'done')
  assert.equal(s.spec, 'done')
  assert.equal(s.clarify, 'done')
  assert.equal(s.design, 'done')
  assert.equal(s.tasks, 'current')
  assert.equal(s.approve, 'locked')
  assert.equal(s.verify, 'locked')
  assert.equal(st.currentStage, 'tasks')
  assert.equal(st.progressPct, 50)
})

test('TEST-WIZ-002 — IN_PROGRESS: implementar é a etapa atual', () => {
  const st = deriveWizardState(
    CHANGE,
    artifacts({
      sddStatus: 'IN_PROGRESS',
      requirementCount: 6,
      hasDesign: true,
      adrCount: 3,
      taskTotal: 15,
      taskDone: 1,
    }),
  )
  const s = statusMap(st)
  assert.equal(st.currentStage, 'implement')
  assert.equal(s.approve, 'done')
  assert.equal(s.implement, 'current')
  assert.equal(s.verify, 'locked')
})

test('TEST-WIZ-002 — ARCHIVED com tudo presente: todas concluídas, progresso 100', () => {
  const st = deriveWizardState(
    CHANGE,
    artifacts({
      sddStatus: 'ARCHIVED',
      requirementCount: 6,
      hasDesign: true,
      adrCount: 3,
      taskTotal: 5,
      taskDone: 5,
      approved: true,
    }),
  )
  assert.ok(st.stages.every((s) => s.status === 'done'))
  assert.equal(st.progressPct, 100)
  assert.equal(st.currentStage, 'verify')
})

test('TEST-WIZ-002 — o modelo expõe as 8 etapas na ordem do fluxo', () => {
  const st = deriveWizardState(CHANGE, artifacts())
  assert.deepEqual(
    st.stages.map((s) => s.stage),
    WIZARD_STAGES,
  )
})

test('TEST-WIZ-003 · SCN-WIZ-007 — artefato ausente vira etapa pendente, sem lançar', () => {
  // status diz PLANNED, mas o spec.md está ilegível (0 requisitos) e não há design.
  const run = () =>
    deriveWizardState(
      CHANGE,
      artifacts({ sddStatus: 'PLANNED', requirementCount: 0, hasDesign: false, taskTotal: 0 }),
    )
  assert.doesNotThrow(run)
  const s = statusMap(run())
  assert.equal(s.request, 'done')
  assert.equal(s.spec, 'current') // primeira não concluída, apesar do status adiantado
  assert.equal(s.design, 'locked')
  assert.equal(run().currentStage, 'spec')
})

test('TEST-WIZ-003 — status desconhecido é tratado como DRAFT, sem lançar', () => {
  const run = () => deriveWizardState(CHANGE, artifacts({ sddStatus: 'FOO_BAR' }))
  assert.doesNotThrow(run)
  assert.equal(run().currentStage, 'spec') // request done, spec pendente
})

test('TEST-WIZ-003 — dúvida crítica em aberto trava em Clarificar', () => {
  const s = statusMap(
    deriveWizardState(
      CHANGE,
      artifacts({ sddStatus: 'CLARIFIED', requirementCount: 4, hasCriticalOpenQuestions: true }),
    ),
  )
  assert.equal(s.spec, 'done')
  assert.equal(s.clarify, 'current')
  assert.equal(s.design, 'locked')
})
