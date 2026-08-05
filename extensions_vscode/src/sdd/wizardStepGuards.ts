// Portões de etapa do wizard SDD (feature 0035, REQ-WIZ-002) — lógica pura, sem a API do
// VS Code. Decide se uma etapa pode avançar para a próxima e, quando não pode, por quê.
//
// As guardas espelham o fluxo do stateMachine.ts e a tabela de pré-requisitos do design
// (design.md §5 / seção "Guardas por etapa"). A UI apenas desabilita o avanço e mostra os
// motivos — a regra vive aqui, testável, sem duplicação na borda.

import { WIZARD_STAGES, type WizardStage, type ChangeArtifacts } from './wizardModel'

export interface AdvanceResult {
  /** Pode avançar a partir de `from`? */
  ok: boolean
  /** Próxima etapa (null quando `from` é a última — avançar = promover a VERIFIED). */
  to: WizardStage | null
  /** Motivos do bloqueio (vazio quando `ok`). */
  reasons: string[]
}

/** A etapa seguinte a `from` no fluxo, ou null se `from` for a última. */
export function nextStage(from: WizardStage): WizardStage | null {
  const i = WIZARD_STAGES.indexOf(from)
  if (i < 0 || i >= WIZARD_STAGES.length - 1) {
    return null
  }
  return WIZARD_STAGES[i + 1]
}

/**
 * Avalia o portão para avançar a partir de `from`, dado o retrato dos artefatos. Puro e
 * total: nunca lança. `reasons` lista tudo que falta (pode haver mais de um motivo).
 */
export function canAdvance(from: WizardStage, a: ChangeArtifacts): AdvanceResult {
  const reasons: string[] = []

  switch (from) {
    case 'request':
      if (!a.hasRequest) {
        reasons.push('A solicitação ainda não foi registrada.')
      }
      break
    case 'spec':
      if (a.requirementCount <= 0) {
        reasons.push('É preciso ao menos um requisito (REQ-*) para avançar.')
      }
      break
    case 'clarify':
      if (a.hasCriticalOpenQuestions) {
        reasons.push('Há dúvidas críticas em aberto — resolva-as para avançar.')
      }
      break
    case 'design':
      if (!a.hasDesign) {
        reasons.push('O design técnico ainda não foi gerado.')
      }
      if (a.adrCount <= 0) {
        reasons.push('Registre ao menos um ADR com a decisão arquitetural.')
      }
      break
    case 'tasks':
      if (a.taskTotal <= 0) {
        reasons.push('Não há tarefas planejadas.')
      }
      break
    case 'approve':
      if (!a.approved) {
        reasons.push('A mudança ainda não foi aprovada.')
      }
      break
    case 'implement':
      if (a.taskDone <= 0) {
        reasons.push('Conclua ao menos uma tarefa para avançar para a verificação.')
      }
      break
    case 'verify':
      if (!(a.taskTotal > 0 && a.taskDone === a.taskTotal)) {
        reasons.push('Ainda há tarefas pendentes ou critérios não avaliados.')
      }
      break
  }

  return { ok: reasons.length === 0, to: nextStage(from), reasons }
}
