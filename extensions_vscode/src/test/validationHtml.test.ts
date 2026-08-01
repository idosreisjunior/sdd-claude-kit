import { test } from 'node:test'
import assert from 'node:assert/strict'
import { renderValidationHtml, esc } from '../sdd/validationHtml'
import type { ValidationReport } from '../sdd/validationReport'

const NONCE = 'abc123DEF456'

function report(over: Partial<ValidationReport> = {}): ValidationReport {
  return {
    changeId: '0099-x',
    requirements: [
      { id: 'REQ-X-001', title: 'Pleno', verdict: 'atendido', hasTasks: true, hasTests: true, hasImplementation: true, isGap: false },
      { id: 'REQ-X-002', title: '<script>', verdict: 'nao-testado', hasTasks: true, hasTests: false, hasImplementation: true, isGap: false },
    ],
    summary: { atendido: 1, parcial: 0, 'nao-testado': 1, 'nao-atendido': 0, 'nao-aplicavel': 0 },
    ...over,
  }
}

test('TEST-EVID-003 — HTML traz CSP com nonce e os vereditos', () => {
  const html = renderValidationHtml(report(), NONCE)
  assert.match(html, /Content-Security-Policy/)
  assert.match(html, new RegExp(`nonce-${NONCE}`))
  assert.match(html, /default-src 'none'/)
  assert.match(html, /atendido/)
  assert.match(html, /não testado/)
})

test('TEST-EVID-003 — texto vindo dos dados é escapado', () => {
  const html = renderValidationHtml(report(), NONCE)
  assert.doesNotMatch(html, /<script>/)
  assert.match(html, /&lt;script&gt;/)
})

test('TEST-EVID-003 — relatório vazio mostra aviso, sem quebrar', () => {
  const html = renderValidationHtml(
    report({ requirements: [], summary: { atendido: 0, parcial: 0, 'nao-testado': 0, 'nao-atendido': 0, 'nao-aplicavel': 0 } }),
    NONCE,
  )
  assert.match(html, /vazia ou ausente/)
})

test('esc — escapa os cinco caracteres perigosos', () => {
  assert.equal(esc(`<a href="x">&'`), '&lt;a href=&quot;x&quot;&gt;&amp;&#39;')
})
