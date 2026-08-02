// Núcleo puro da análise de tarefas (feature 0018, RF-010) — sem a API do VS Code,
// testável fora do host (standards §6, NFR-TGEN-003). Somente leitura
// (NFR-TGEN-001): recebe o texto do tasks.md e devolve os achados; a borda os
// publica como diagnósticos (ADR-018, Q1). Parser próprio (ADR-018, Q3): divide o
// tasks.md em blocos por cabeçalho de tarefa e checa complexidade e campos.

export type TaskFindingKind = 'oversized' | 'missing-field'

export interface TaskFinding {
  kind: TaskFindingKind
  /** Identificador da tarefa (ex.: `TASK-TGEN-001`). */
  taskId: string
  /** Linha (base 0) do cabeçalho da tarefa — âncora do diagnóstico. */
  line: number
  message: string
}

/**
 * Campos obrigatórios do RF-010 verificáveis no formato `tasks.md` (10 dos 11).
 * Cada um: o rótulo e o detector sobre o texto do bloco da tarefa.
 *
 * "Evidências necessárias" (o 11º campo do RF-010) fica DE FORA: o template
 * `_shared/tasks.md` do framework não a carrega — checá-la sinalizaria toda tarefa
 * existente. É um gap framework→template (D-Q2b), a resolver num change próprio, não
 * uma falha da tarefa analisada. Identificador e título são checados pelo cabeçalho.
 */
const REQUIRED_FIELDS: { label: string; present: (block: string) => boolean }[] = [
  { label: 'requisitos relacionados', present: (b) => /^\*\*Requisitos:\*\*/m.test(b) },
  { label: 'dependências', present: (b) => /^\*\*Dependências:\*\*/m.test(b) },
  { label: 'complexidade', present: (b) => /^\*\*Complexidade:\*\*/m.test(b) },
  { label: 'status', present: (b) => /^\*\*Status:\*\*/m.test(b) },
  { label: 'descrição', present: (b) => /^###\s+Descrição\s*$/m.test(b) },
  { label: 'arquivos prováveis', present: (b) => /^###\s+Arquivos prováveis\s*$/m.test(b) },
  { label: 'testes esperados', present: (b) => /^###\s+Testes esperados\s*$/m.test(b) },
  { label: 'critérios de conclusão', present: (b) => /^###\s+Critério de conclusão\s*$/m.test(b) },
]

interface TaskHead {
  id: string
  title: string
  line: number
}

/**
 * Analisa o `tasks.md`: sinaliza tarefas de complexidade G (excessivamente grandes,
 * RF-010) e tarefas sem algum campo obrigatório (D-Q2/D-Q2b). Tarefas marcadas
 * `REMOVIDA`/`REMOVIDO` são ignoradas. Nunca lança.
 */
export function analyzeTasks(tasksMd: string): TaskFinding[] {
  const lines = tasksMd.split('\n')

  const heads: TaskHead[] = []
  for (let i = 0; i < lines.length; i++) {
    const m = /^##\s+(TASK-[A-Z][A-Z0-9]*-\d+)\s*(?:—\s*(.*))?$/.exec(lines[i])
    if (m && !/REMOVID[AO]/.test(lines[i])) {
      heads.push({ id: m[1], title: (m[2] ?? '').trim(), line: i })
    }
  }

  const findings: TaskFinding[] = []
  for (let h = 0; h < heads.length; h++) {
    const { id, title, line } = heads[h]
    const end = blockEnd(lines, line)
    const block = lines.slice(line + 1, end).join('\n')

    if (title.length === 0) {
      findings.push({ kind: 'missing-field', taskId: id, line, message: message(id, 'título') })
    }
    for (const field of REQUIRED_FIELDS) {
      if (!field.present(block)) {
        findings.push({ kind: 'missing-field', taskId: id, line, message: message(id, field.label) })
      }
    }

    const complexity = /^\*\*Complexidade:\*\*\s*([PMG])\b/m.exec(block)?.[1]
    if (complexity === 'G') {
      findings.push({
        kind: 'oversized',
        taskId: id,
        line,
        message: `Tarefa ${id} tem complexidade G (excessivamente grande) — divida antes de implementar (RF-010).`,
      })
    }
  }
  return findings
}

/** Linha (exclusiva) onde o bloco da tarefa termina: o próximo cabeçalho `## `, ou o fim. */
function blockEnd(lines: string[], start: number): number {
  for (let i = start + 1; i < lines.length; i++) {
    if (/^##\s/.test(lines[i])) {
      return i
    }
  }
  return lines.length
}

function message(id: string, field: string): string {
  return `Tarefa ${id} sem o campo obrigatório: ${field} (RF-010).`
}
