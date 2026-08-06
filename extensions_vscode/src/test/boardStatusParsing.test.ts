// TEST-BSTAT-001 — regressão do bug 0037: o kanban de tarefas contava `**done**` como
// pendente (SCN-BSTAT-001/002/003, viola SCN-BOARD-002).
//
// Arquivo separado de `boardModel.test.ts` de propósito: os testes de lá cobrem o
// comportamento especificado na feature 0025 e não podem ser tocados por esta correção —
// alterar um teste que passava para acomodar uma "correção" é o alarme do template de bug.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parseTaskBoard } from '../sdd/boardModel'

/** Coluna em que uma tarefa caiu, por id. Facilita afirmar sobre o efeito, não a estrutura. */
function columnOf(tasksMd: string, taskId: string): string | undefined {
  const board = parseTaskBoard(tasksMd)
  for (const col of board.columns) {
    if (col.cards.some((c) => c.id === taskId)) {
      return col.state
    }
  }
  return undefined
}

test('TEST-BSTAT-001 · SCN-BSTAT-001 — status em negrito com data é lido como concluído', () => {
  // A forma exata usada por 17 tarefas de .specs/features/0001-plugin-foundation/tasks.md.
  const md = ['## TASK-PF-001 — Fundação', '**Status:** **done** — 2026-07-29', ''].join('\n')
  assert.equal(
    columnOf(md, 'TASK-PF-001'),
    'done',
    'tarefa marcada **done** deve cair em Concluída, não no fallback de Pendente',
  )
})

test('TEST-BSTAT-001 · SCN-BSTAT-002 — as formas já suportadas continuam funcionando', () => {
  const md = [
    '## TASK-X-001 — Simples',
    '**Status:** done',
    '## TASK-X-002 — Pendente',
    '**Status:** pending',
    '## TASK-X-003 — Em progresso',
    '**Status:** in_progress',
    '## TASK-X-004 — Pendente com nota',
    '**Status:** pending (código pronto; falta a verificação no host — TASK-PD-005)',
    '',
  ].join('\n')
  assert.equal(columnOf(md, 'TASK-X-001'), 'done')
  assert.equal(columnOf(md, 'TASK-X-002'), 'pending')
  assert.equal(columnOf(md, 'TASK-X-003'), 'in_progress')
  assert.equal(columnOf(md, 'TASK-X-004'), 'pending', 'a nota entre parênteses não muda o status')
})

test('TEST-BSTAT-001 · SCN-BSTAT-003 — status irreconhecível continua caindo em Pendente', () => {
  // A ressalva do SCN-BOARD-002 permanece: SEM status reconhecido → Pendente.
  const md = ['## TASK-X-005 — Inventado', '**Status:** quase-lá', ''].join('\n')
  assert.equal(columnOf(md, 'TASK-X-005'), 'pending')
})

test('TEST-BSTAT-001 — bloco sem linha de status algum continua em Pendente', () => {
  const md = ['## TASK-X-006 — Sem status', 'Descrição solta, nenhuma linha de status.', ''].join('\n')
  assert.equal(columnOf(md, 'TASK-X-006'), 'pending')
})

test('TEST-BSTAT-001 — o negrito não faz um status virar outro', () => {
  // Guarda contra uma correção preguiçosa: aceitar a palavra em qualquer lugar da linha
  // poderia casar `done` dentro de uma nota de uma tarefa pendente.
  const md = ['## TASK-X-007 — Pendente citando done', '**Status:** pending (o done vem depois)', ''].join('\n')
  assert.equal(
    columnOf(md, 'TASK-X-007'),
    'pending',
    'a primeira palavra de status da linha é a que vale',
  )
})
