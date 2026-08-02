import { test } from 'node:test'
import assert from 'node:assert/strict'
import { analyzeTasks } from '../sdd/taskAnalysis'

/** Um bloco de tarefa completo (10 campos do formato), com a complexidade dada. */
function task(id: string, title: string, complexity: string): string {
  return `## ${id} — ${title}

**Requisitos:** REQ-X-001
**Dependências:** —
**Complexidade:** ${complexity}
**Status:** pending

### Descrição

Faz algo.

### Arquivos prováveis

- src/x.ts

### Testes esperados

- TEST-X-001

### Critério de conclusão

- ok
`
}

const HEADER = '# Tarefas — Exemplo\n\n## Ordem de execução\n\n```\nx\n```\n\n'
const FOOTER = '\n## Resumo\n\nTotal: 1 tarefa.\n'

// TEST-TGEN-001 — detecção de tarefas de complexidade G (com a linha).
test('TEST-TGEN-001: analyzeTasks sinaliza tarefas G e ignora seções não-tarefa', () => {
  const md = HEADER + task('TASK-X-001', 'Grande', 'G') + '\n' + task('TASK-X-002', 'Pequena', 'P') + FOOTER
  const findings = analyzeTasks(md)

  const oversized = findings.filter((f) => f.kind === 'oversized')
  assert.equal(oversized.length, 1)
  assert.equal(oversized[0].taskId, 'TASK-X-001')
  // A linha aponta o cabeçalho da tarefa G (não a seção Resumo/Ordem de execução).
  assert.equal(md.split('\n')[oversized[0].line].includes('TASK-X-001'), true)

  // A tarefa P completa não gera nenhum achado.
  assert.equal(findings.some((f) => f.taskId === 'TASK-X-002'), false)
})

// TEST-TGEN-002 — detecção de campo obrigatório ausente; tudo completo → sem achado.
test('TEST-TGEN-002: analyzeTasks sinaliza campo ausente e nada quando completo', () => {
  // Tarefa sem "### Testes esperados".
  const semTestes = `## TASK-X-003 — Incompleta

**Requisitos:** REQ-X-001
**Dependências:** —
**Complexidade:** M
**Status:** pending

### Descrição

y

### Arquivos prováveis

- src/y.ts

### Critério de conclusão

- ok
`
  const findings = analyzeTasks(HEADER + semTestes + FOOTER)
  const missing = findings.filter((f) => f.kind === 'missing-field' && f.taskId === 'TASK-X-003')
  assert.ok(missing.some((f) => f.message.includes('testes esperados')), 'não sinalizou testes esperados')

  // Uma tarefa completa não gera missing-field.
  const complete = analyzeTasks(HEADER + task('TASK-X-004', 'Completa', 'M') + FOOTER)
  assert.equal(complete.length, 0)

  // tasks.md vazio/sem tarefas: nenhum achado, sem lançar.
  assert.equal(analyzeTasks('').length, 0)
  assert.equal(analyzeTasks(HEADER + FOOTER).length, 0)
})
