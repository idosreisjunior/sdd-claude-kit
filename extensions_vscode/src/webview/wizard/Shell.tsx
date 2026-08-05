// Casca do wizard (feature 0035, TASK-WIZ-005). Cabeçalho + trilha de etapas + área de
// conteúdo. As views de cada etapa (Especificar, Clarificar, …) chegam na TASK-WIZ-011;
// aqui a área mostra a etapa atual como placeholder.
import type { WizardState } from '../../sdd/wizardModel'
import { Stepper } from './Stepper'

export function Shell({ state }: { state: WizardState }) {
  const current = state.stages.find((s) => s.status === 'current')
  return (
    <div class="sdd-wizard">
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
        <p class="muted">A view desta etapa chega na TASK-WIZ-011.</p>
      </section>
    </div>
  )
}
