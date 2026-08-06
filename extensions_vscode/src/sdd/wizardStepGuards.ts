// Portões de etapa do wizard SDD (feature 0035, REQ-WIZ-002) — lógica pura, sem a API do
// VS Code. Decide se uma etapa pode avançar para a próxima e, quando não pode, por quê;
// e mapeia a etapa atual para o status do ciclo de vida que o "avançar" grava.
//
// As guardas espelham o fluxo do stateMachine.ts e a tabela de pré-requisitos do design
// (design.md §5). A UI apenas desabilita o avanço e mostra os motivos — a regra vive aqui,
// testável, sem duplicação na borda.

import { WIZARD_STAGES, type WizardStage, type ChangeArtifacts } from './wizardModel'
import type { SddState } from './stateMachine'

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
 * Status do ciclo de vida que "avançar a partir de `stage`" grava. As etapas Solicitar e
 * Especificar não disparam transição de status (o trabalho delas mantém a mudança em
 * DRAFT; ao ganhar requisitos, a etapa atual derivada já anda para Clarificar). Da
 * Clarificar em diante, cada avanço promove o status. A borda ainda valida com
 * `canTransition` antes de gravar (design refinado com feedback do host).
 */
const ADVANCE_TARGET: Partial<Record<WizardStage, SddState>> = {
  clarify: 'CLARIFIED',
  design: 'DESIGNED',
  tasks: 'PLANNED',
  approve: 'APPROVED',
  implement: 'IN_PROGRESS',
  verify: 'VERIFIED',
}

/** O status-alvo do avanço a partir de `stage`, ou null quando não há transição direta. */
export function advanceTargetStatus(stage: WizardStage): SddState | null {
  return ADVANCE_TARGET[stage] ?? null
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
