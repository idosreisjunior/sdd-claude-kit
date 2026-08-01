// Núcleo puro do plano de tarefas (feature 0007, RF-014) — sem a API do VS Code
// (standards §6, NFR-TRACE-002). Extrai de um tasks.md, por tarefa, o identificador, o
// status e os "arquivos prováveis", e acha a tarefa em andamento (D-Q5). Robusto:
// markdown fora do formato produz lista vazia, nunca lança (NFR-TRACE-003).

export interface TaskPlan {
  id: string
  status: string
  plannedFiles: string[]
}

const TASK_HEADING = /^##\s+(TASK-[A-Z0-9]+-\d+)\b/
const STATUS_LINE = /^\*\*Status:\*\*\s*(.+?)\s*$/
const FILES_HEADING = /^###\s+Arquivos prováveis\s*$/
const LIST_ITEM = /^[-*]\s+(.+?)\s*$/

/** Extrai o plano de cada tarefa de um tasks.md. Puro e robusto. */
export function parseTasksPlan(tasksMd: string): TaskPlan[] {
  const plans: TaskPlan[] = []
  let current: TaskPlan | undefined
  let inFiles = false

  for (const raw of tasksMd.split('\n')) {
    const line = raw.replace(/\r$/, '')

    const heading = TASK_HEADING.exec(line)
    if (heading) {
      current = { id: heading[1], status: '', plannedFiles: [] }
      plans.push(current)
      inFiles = false
      continue
    }
    if (!current) {
      continue // texto antes da primeira tarefa
    }

    const status = STATUS_LINE.exec(line)
    if (status) {
      current.status = status[1].toLowerCase()
      continue
    }

    if (FILES_HEADING.test(line)) {
      inFiles = true
      continue
    }
    // Qualquer outro heading encerra a coleta de arquivos.
    if (line.startsWith('#')) {
      inFiles = false
      continue
    }
    if (inFiles) {
      const item = LIST_ITEM.exec(line)
      if (item) {
        const path = stripCode(item[1])
        if (path) {
          current.plannedFiles.push(path)
        }
      } else if (line.trim().length > 0 && !line.startsWith('>')) {
        inFiles = false // parágrafo (ex.: guia) encerra a lista
      }
    }
  }

  return plans
}

/** A tarefa em andamento (D-Q5). Undefined se nenhuma estiver in_progress. */
export function inProgressPlan(plans: TaskPlan[]): TaskPlan | undefined {
  return plans.find((p) => p.status === 'in_progress')
}

/** Remove crases e um sufixo de comentário do item de lista. */
function stripCode(value: string): string {
  return value.replace(/`/g, '').trim()
}
