// View da etapa Desenhar (feature 0035, TASK-WIZ-011, REQ-WIZ-001/002).
// Mostra se o design técnico existe e quais ADRs foram registrados. O portão exige as
// duas coisas: um design.md e ao menos um ADR — uma decisão arquitetural sem registro é
// indistinguível de uma suposição (constituição Art. 5).
import type { WizardDetails } from '../../sdd/wizardContent'

export function StepDesign({
  details,
  hasDesign,
}: {
  details: WizardDetails
  hasDesign: boolean
}) {
  const { adrs } = details

  return (
    <>
      <p class="sdd-stat">
        {hasDesign ? '✓ design.md presente' : '— sem design.md'} ·{' '}
        <strong>{adrs.length}</strong> {adrs.length === 1 ? 'ADR' : 'ADRs'}
      </p>

      {!hasDesign && (
        <p class="sdd-empty">
          O design técnico ainda não foi gerado. Ele descreve o <em>como</em> — o{' '}
          <em>o quê</em> e o <em>porquê</em> ficam na spec.
        </p>
      )}

      {adrs.length === 0 ? (
        <p class="sdd-warn">
          Nenhum ADR em <code>decisions/</code>: registre ao menos a decisão arquitetural
          principal antes de planejar as tarefas.
        </p>
      ) : (
        <ul class="sdd-list" aria-label="Decisões arquiteturais">
          {adrs.map((adr) => (
            <li key={adr.number}>
              <code>ADR-{adr.number}</code> {adr.title}
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
