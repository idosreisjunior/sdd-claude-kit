// Seletor da view da etapa atual (feature 0035, TASK-WIZ-011). Um único ponto decide
// qual conteúdo a área central mostra; a casca não conhece as etapas.
//
// Entregues aqui as etapas 2–5 (Especificar, Clarificar, Desenhar, Tarefas). As demais
// mostram o placeholder até suas tarefas: Solicitar (WIZ-008), Aprovar (WIZ-012),
// Implementar (WIZ-013) e Verificar (WIZ-014).
import type { WizardStage } from '../../sdd/wizardModel'
import type { WizardDetails } from '../../sdd/wizardContent'
import { StepSpec } from './StepSpec'
import { StepClarify } from './StepClarify'
import { StepDesign } from './StepDesign'
import { StepTasks } from './StepTasks'

const PENDING_TASK: Partial<Record<WizardStage, string>> = {
  request: 'TASK-WIZ-008',
  approve: 'TASK-WIZ-012',
  implement: 'TASK-WIZ-013',
  verify: 'TASK-WIZ-014',
}

export function StageView({
  stage,
  details,
  hasDesign,
}: {
  stage: WizardStage
  details: WizardDetails
  hasDesign: boolean
}) {
  switch (stage) {
    case 'spec':
      return <StepSpec details={details} />
    case 'clarify':
      return <StepClarify details={details} />
    case 'design':
      return <StepDesign details={details} hasDesign={hasDesign} />
    case 'tasks':
      return <StepTasks details={details} />
    default:
      return <p class="muted">A view desta etapa chega na {PENDING_TASK[stage]}.</p>
  }
}
