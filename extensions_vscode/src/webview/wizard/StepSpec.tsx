// View da etapa Especificar (feature 0035, TASK-WIZ-011, REQ-WIZ-001/002).
// Mostra os requisitos já escritos e quantos cenários os cobrem. O VEREDITO do portão
// fica no rodapé (Footer); aqui aparece a matéria-prima dele — sem requisito, a lista
// vazia é a própria explicação do bloqueio (SCN-WIZ-002).
import type { WizardDetails } from '../../sdd/wizardContent'

export function StepSpec({ details }: { details: WizardDetails }) {
  const { requirements, scenarioCount } = details

  if (requirements.length === 0) {
    return (
      <p class="sdd-empty">
        Nenhum requisito <code>REQ-*</code> escrito ainda. É preciso ao menos um para
        avançar para Clarificar.
      </p>
    )
  }

  return (
    <>
      <p class="sdd-stat">
        <strong>{requirements.length}</strong> requisitos ·{' '}
        <strong>{scenarioCount}</strong> cenários de aceite
      </p>
      <ul class="sdd-list" aria-label="Requisitos funcionais">
        {requirements.map((req) => (
          <li key={req.id}>
            <code>{req.id}</code> {req.title}
          </li>
        ))}
      </ul>
      {scenarioCount === 0 && (
        <p class="sdd-warn">
          Nenhum cenário <code>SCN-*</code>: um requisito sem cenário não é verificável.
        </p>
      )}
    </>
  )
}
