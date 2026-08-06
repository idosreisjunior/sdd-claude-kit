// View da etapa Tarefas (feature 0035, TASK-WIZ-011, REQ-WIZ-001).
// Lista as tarefas planejadas com o status e publica os achados do `analyzeTasks`
// (tarefa grande demais, campo obrigatório ausente) — os mesmos que vão ao painel
// Problems pelo comando 0018, aqui no contexto da etapa.
// Só TIPOS do wizardContent: um import de valor traria o js-yaml para o bundle (ver a
// nota em buildWizardDetails). As contagens vêm prontas no payload.
import type { WizardDetails } from '../../sdd/wizardContent'

const STATUS_LABEL: Readonly<Record<string, string>> = {
  done: 'concluída',
  in_progress: 'em andamento',
  pending: 'pendente',
  blocked: 'bloqueada',
}

export function StepTasks({ details }: { details: WizardDetails }) {
  const { tasks, taskFindings } = details

  if (tasks.length === 0) {
    return (
      <p class="sdd-empty">
        Nenhuma tarefa planejada ainda. Decomponha a mudança em tarefas pequenas e
        verificáveis para avançar.
      </p>
    )
  }

  const counts = details.taskCountsByStatus
  return (
    <>
      <p class="sdd-stat">
        <strong>{tasks.length}</strong> tarefas ·{' '}
        {Object.entries(counts)
          .map(([status, n]) => `${n} ${STATUS_LABEL[status] ?? status}`)
          .join(' · ')}
      </p>

      <ul class="sdd-list compact" aria-label="Tarefas planejadas">
        {tasks.map((task) => (
          <li key={task.id}>
            <code>{task.id}</code>
            <span class={`sdd-task-status ${task.status}`}>
              {STATUS_LABEL[task.status] ?? task.status ?? 'sem status'}
            </span>
          </li>
        ))}
      </ul>

      {taskFindings.length > 0 && (
        <>
          <p class="sdd-warn">
            {taskFindings.length}{' '}
            {taskFindings.length === 1 ? 'achado no plano' : 'achados no plano'}:
          </p>
          <ul class="sdd-list findings" aria-label="Achados do plano de tarefas">
            {taskFindings.map((finding, i) => (
              <li key={`${finding.taskId}-${i}`}>
                <code>{finding.taskId}</code> {finding.message}
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  )
}
