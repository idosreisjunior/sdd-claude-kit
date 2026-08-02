import { test } from 'node:test'
import assert from 'node:assert/strict'
import { aggregateHistory, UNAVAILABLE_CATEGORIES } from '../sdd/historyModel'
import { renderHistoryHtml } from '../sdd/historyHtml'

const STATUS = `
version: 1
status: PLANNED
history:
  - status: DRAFT
    date: "2026-07-31"
    reason: criada
  - status: PLANNED
    date: "2026-08-01"
    reason: planejada
approval:
  date: "2026-08-02"
  by: autor
  revision: 1
`

// TEST-HIST-001 — agregação cronológica do subconjunto persistido.
test('TEST-HIST-001: aggregateHistory monta timeline cronológico', () => {
  const model = aggregateHistory({
    statusYaml: STATUS,
    adrs: [{ number: 16, title: 'Histórico', date: '2026-08-01' }],
    commits: [{ hash: 'abc123', date: '2026-08-03', subject: 'feat: y' }],
    tasks: { done: 1, total: 4 },
    validation: { atendido: 2, pendentes: 3 },
  })

  // Ordenado por data ascendente.
  const dates = model.events.map((e) => e.date)
  assert.deepEqual(dates, [...dates].sort())

  // Os quatro tipos de evento presentes.
  const kinds = new Set(model.events.map((e) => e.kind))
  assert.ok(kinds.has('status') && kinds.has('approval') && kinds.has('adr') && kinds.has('commit'))

  assert.equal(model.currentState.tasks?.done, 1)
  assert.equal(model.currentState.validation?.pendentes, 3)
  assert.equal(model.unavailable.length, UNAVAILABLE_CATEGORIES.length)
})

// TEST-HIST-002 — robusto a fontes ausentes; render escapa e usa nonce.
test('TEST-HIST-002: aggregateHistory robusto; renderHistoryHtml escapa e usa nonce', () => {
  const empty = aggregateHistory({})
  assert.equal(empty.events.length, 0)
  assert.ok(empty.unavailable.length > 0)

  const model = aggregateHistory({
    statusYaml:
      'history:\n  - status: DRAFT\n    date: "2026-08-01"\n    reason: "<script>x</script>"\n',
  })
  const html = renderHistoryHtml('0016-history-decisions', model, 'NONCE123')
  assert.ok(html.includes('nonce-NONCE123'), 'nonce ausente na CSP')
  assert.ok(html.includes('&lt;script&gt;x&lt;/script&gt;'), 'texto não escapado')
  assert.ok(!html.includes('<script>x'), 'HTML injetado não escapado')
})
