import { test } from 'node:test'
import assert from 'node:assert/strict'
import { renderMetricsHtml, esc } from '../sdd/metricsHtml'
import type { MetricsSnapshot } from '../sdd/metrics'

const NONCE = 'abc123DEF456'

const SNAP: MetricsSnapshot = {
  changeId: '0099-x',
  timestamp: '2026-08-05T12:00:00Z',
  status: 'IN_PROGRESS',
  tasksTotal: 6,
  tasksDone: 4,
  requirements: 2,
  requirementsValidated: 1,
  validatedPct: 50,
  scenarios: 3,
  tests: 1,
  files: 2,
  durationDays: 5,
  git: { changedFiles: 3, added: 40, removed: 5 },
  contextTokens: 12000,
}

test('TEST-METR-004 — HTML traz CSP com nonce e as métricas', () => {
  const html = renderMetricsHtml(SNAP, undefined, NONCE)
  assert.match(html, /Content-Security-Policy/)
  assert.match(html, new RegExp(`nonce-${NONCE}`))
  assert.match(html, /default-src 'none'/)
  assert.match(html, /4\/6/)
  assert.match(html, /50%/)
  assert.match(html, /width:50%/) // barra de % validado
})

test('TEST-METR-004 — o delta aparece com sinal quando há medição anterior', () => {
  const html = renderMetricsHtml(SNAP, { tasksDone: 2, requirementsValidated: 1, validatedPct: 50, tests: 1, files: 0 }, NONCE)
  assert.match(html, /\+2/)
  assert.match(html, /delta vs\. medição anterior/)
})

test('TEST-METR-004 — texto vindo dos dados é escapado', () => {
  const html = renderMetricsHtml({ ...SNAP, status: '<script>' }, undefined, NONCE)
  assert.doesNotMatch(html, /<script>/)
  assert.match(html, /&lt;script&gt;/)
})

test('esc — escapa os cinco caracteres perigosos', () => {
  assert.equal(esc(`<a href="x">&'`), '&lt;a href=&quot;x&quot;&gt;&amp;&#39;')
})
