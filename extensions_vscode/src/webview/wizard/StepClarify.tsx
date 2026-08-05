// View da etapa Clarificar (feature 0035, TASK-WIZ-011, REQ-WIZ-002).
// Lista as dúvidas em aberto com a severidade. As críticas são o que bloqueia o avanço
// para Desenhar (SCN-WIZ-003) — por isso vêm primeiro e marcadas: o motivo do bloqueio
// que o rodapé enuncia fica visível aqui, item a item.
import type { OpenQuestion, WizardDetails } from '../../sdd/wizardContent'

const SEVERITY_ORDER: Readonly<Record<string, number>> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
}

const SEVERITY_LABEL: Readonly<Record<string, string>> = {
  critical: 'crítica',
  high: 'alta',
  medium: 'média',
  low: 'baixa',
}

function bySeverity(a: OpenQuestion, b: OpenQuestion): number {
  return (SEVERITY_ORDER[a.severity] ?? 9) - (SEVERITY_ORDER[b.severity] ?? 9)
}

export function StepClarify({ details }: { details: WizardDetails }) {
  const { openQuestions, resolvedQuestionCount } = details
  const sorted = [...openQuestions].sort(bySeverity)
  const criticals = sorted.filter((q) => q.severity === 'critical').length

  return (
    <>
      <p class="sdd-stat">
        <strong>{openQuestions.length}</strong> em aberto ·{' '}
        <strong>{resolvedQuestionCount}</strong> resolvidas
        {criticals > 0 && (
          <span class="sdd-badge critical">
            {criticals} {criticals === 1 ? 'crítica' : 'críticas'} bloqueia
            {criticals === 1 ? '' : 'm'} o design
          </span>
        )}
      </p>

      {openQuestions.length === 0 ? (
        <p class="sdd-empty">
          Nenhuma dúvida em aberto. {resolvedQuestionCount > 0 ? 'Tudo resolvido — ' : ''}
          pode seguir para o design.
        </p>
      ) : (
        <ul class="sdd-list" aria-label="Dúvidas em aberto">
          {sorted.map((q) => (
            <li key={q.question} class={q.severity === 'critical' ? 'critical' : undefined}>
              <code>{q.question}</code>
              <span class="sdd-sev">{SEVERITY_LABEL[q.severity] ?? q.severity}</span>
              {q.description && <span class="sdd-desc">{q.description}</span>}
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
