// Botão de ação de IA da etapa (feature 0035, TASK-WIZ-010, REQ-WIZ-003). Envia
// {type:'ai', action} ao host, que abre o Claude Code com o prompt PRONTO — sem enviar.
// Etapas sem ação de IA (Solicitar, Aprovar) não renderizam botão nenhum.
import type { WizardStage } from '../../sdd/wizardModel'
import { stageAction, stageActionLabel } from '../../sdd/wizardActions'
import { vscodeApi } from './vscodeApi'

export function AiAction({ stage }: { stage: WizardStage }) {
  const action = stageAction(stage)
  if (!action) {
    return null
  }
  return (
    <div class="sdd-actions">
      <button
        class="sdd-btn ai"
        onClick={() => vscodeApi.postMessage({ type: 'ai', action })}
        title={`Abre o Claude Code com /sdd-kit:${action} — você revisa e envia`}
      >
        ✦ {stageActionLabel(stage)}
      </button>
      <span class="sdd-hint">Abre o prompt no Claude Code; nada é enviado sem você.</span>
    </div>
  )
}
