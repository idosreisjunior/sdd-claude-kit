// Trilha de etapas do wizard (feature 0035, TASK-WIZ-005). Renderiza as 8 etapas do
// WizardState com o estado concluída/atual/bloqueada e rótulos acessíveis (NFR-WIZ-004).
import type { WizardState } from '../../sdd/wizardModel'

export function Stepper({ state }: { state: WizardState }) {
  return (
    <ol class="sdd-stepper" aria-label="Etapas do fluxo SDD">
      {state.stages.map((s, i) => (
        <li
          key={s.stage}
          class={`sdd-step ${s.status}`}
          aria-current={s.status === 'current' ? 'step' : undefined}
          aria-label={`Etapa ${i + 1}: ${s.label} — ${statusText(s.status)}`}
        >
          <span class="conn" aria-hidden="true" />
          <span class="sdd-node" aria-hidden="true">
            {s.status === 'done' ? '✓' : i + 1}
          </span>
          <span class="lbl">{s.label}</span>
          <span class="sum">{s.summary}</span>
        </li>
      ))}
    </ol>
  )
}

function statusText(status: string): string {
  if (status === 'done') return 'concluída'
  if (status === 'current') return 'em andamento'
  return 'bloqueada'
}
