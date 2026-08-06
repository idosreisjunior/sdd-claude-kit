// Ações de IA por etapa do wizard (feature 0035, REQ-WIZ-003) — lógica pura, sem a API
// do VS Code, para ser testável fora do host e para o cliente Preact poder importá-la.
//
// O mapa é o CONTRATO entre a etapa em foco e a ação do adapter 0004 (`SddAction`):
// a borda (wizardPanel) só aceita uma ação vinda daqui, e o conjunto de `SddAction` é
// fechado (SCN-CC-004) — uma etapa sem ação de IA simplesmente não oferece o botão.
import type { SddAction } from './claudePrompt'
import { STAGE_LABELS, type WizardStage } from './wizardModel'

/**
 * Ação do Claude Code que cada etapa delega, ou `undefined` quando a etapa não tem
 * ação de IA. Duas etapas não têm, por natureza e não por omissão:
 *
 * - `request`: criar a mudança é um formulário do próprio wizard (REQ-WIZ-005), não
 *   um prompt — o trabalho é do humano e da borda, não do modelo.
 * - `approve`: aprovar é o portão humano do fluxo (a decisão não se delega).
 */
const STAGE_ACTIONS: Readonly<Record<WizardStage, SddAction | undefined>> = {
  request: undefined,
  spec: 'spec',
  clarify: 'clarify',
  design: 'design',
  tasks: 'tasks',
  approve: undefined,
  implement: 'implement',
  verify: 'verify',
}

/** Ação de IA da etapa, ou `undefined` se a etapa não delega ao Claude Code. */
export function stageAction(stage: WizardStage): SddAction | undefined {
  return STAGE_ACTIONS[stage]
}

/** Rótulo do botão de IA da etapa (SCN-WIZ-004: "Especificar com IA"). */
export function stageActionLabel(stage: WizardStage): string {
  return `${STAGE_LABELS[stage]} com IA`
}

/**
 * Verdadeiro se `action` é a ação de IA legítima de `stage`. A borda valida por aqui
 * antes de abrir o terminal: uma mensagem do webview com uma ação de outra etapa (ou
 * fora do conjunto fechado) não produz comando.
 */
export function isStageAction(stage: WizardStage, action: unknown): action is SddAction {
  const expected = STAGE_ACTIONS[stage]
  return expected !== undefined && action === expected
}
