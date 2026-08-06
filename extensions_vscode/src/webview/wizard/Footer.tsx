// Rodapé de navegação do wizard (feature 0035, TASK-WIZ-007). O botão "avançar" envia
// {type:'advance'} ao host, que valida o portão e grava a transição em status.yaml. Quando
// o portão bloqueia, o botão fica desabilitado e os motivos aparecem (REQ-WIZ-002).
import type { WizardState } from '../../sdd/wizardModel'
import type { AdvanceResult } from '../../sdd/wizardStepGuards'
import { vscodeApi } from './vscodeApi'

export function Footer({ state, advance }: { state: WizardState; advance: AdvanceResult }) {
  const label = advance.to ? `Avançar para ${labelOf(state, advance.to)}` : 'Promover para VERIFIED'
  const onAdvance = () => vscodeApi.postMessage({ type: 'advance' })
  return (
    <footer class="sdd-footer">
      <button
        class="sdd-btn primary"
        disabled={!advance.ok}
        aria-disabled={!advance.ok}
        onClick={advance.ok ? onAdvance : undefined}
      >
        {label} ▸
      </button>
      {!advance.ok && advance.reasons.length > 0 && (
        <ul class="sdd-reasons">
          {advance.reasons.map((reason) => (
            <li key={reason}>{reason}</li>
          ))}
        </ul>
      )}
    </footer>
  )
}

function labelOf(state: WizardState, stage: string): string {
  const found = state.stages.find((s) => s.stage === stage)
  return found ? found.label : ''
}
