// Casca do wizard (feature 0035, TASK-WIZ-005/007/010/011). Cabeçalho + trilha de etapas
// + área de conteúdo + rodapé de navegação. A área central delega à view da etapa atual
// (StageView); a casca não conhece as etapas.
import type { WizardState } from '../../sdd/wizardModel'
import type { AdvanceResult } from '../../sdd/wizardStepGuards'
import type { WizardDetails } from '../../sdd/wizardContent'
import { Stepper } from './Stepper'
import { Footer } from './Footer'
import { AiAction } from './AiAction'
import { StageView } from './StageView'
import { vscodeApi } from './vscodeApi'

export function Shell({
  state,
  advance,
  details,
  hasDesign,
}: {
  state: WizardState
  advance: AdvanceResult
  details: WizardDetails
  hasDesign: boolean
}) {
  const current = state.stages.find((s) => s.status === 'current')
  return (
    <div class="sdd-wizard">
      <button class="sdd-backlink" onClick={() => vscodeApi.postMessage({ type: 'hub' })}>
        ◂ Todas as mudanças
      </button>
      <header class="sdd-topbar">
        <h1>{state.title}</h1>
        <span class="sub">
          {state.id} · {state.type} · {state.progressPct}%
        </span>
      </header>
      <Stepper state={state} />
      <section class="sdd-content" aria-live="polite">
        <h2>{current ? current.label : 'Concluído'}</h2>
        <p class="muted">{current ? current.summary : 'Todas as etapas concluídas.'}</p>
        {current && (
          <>
            <StageView stage={current.stage} details={details} hasDesign={hasDesign} />
            <AiAction stage={current.stage} />
          </>
        )}
      </section>
      <Footer state={state} advance={advance} />
    </div>
  )
}
