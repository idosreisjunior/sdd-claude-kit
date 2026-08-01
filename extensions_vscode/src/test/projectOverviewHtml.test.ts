import { test } from 'node:test'
import assert from 'node:assert/strict'
import { renderProjectOverviewHtml, esc } from '../sdd/projectOverviewHtml'
import type { ProjectOverview } from '../sdd/projectOverview'

const NONCE = 'abc123DEF456'
const CSP = 'vscode-webview://test'

function model(over: Partial<ProjectOverview> = {}): ProjectOverview {
  return {
    health: { kind: 'clean' },
    context: { kind: 'not-measured', max: 200000 },
    counts: { kind: 'no-index' },
    docs: [{ label: 'Visão geral', relPath: '.specs/project/vision.md', exists: true }],
    ...over,
  }
}

test('TEST-PROJ-004 — HTML traz CSP com nonce e barra proporcional ao uso (SCN-PROJ-009)', () => {
  const html = renderProjectOverviewHtml(
    model({ context: { kind: 'measured', used: 140000, max: 200000, fraction: 0.7, band: 'atencao' } }),
    NONCE,
    CSP,
  )
  assert.match(html, /Content-Security-Policy/)
  assert.match(html, new RegExp(`nonce-${NONCE}`))
  assert.match(html, /default-src 'none'/)
  // O cspSource entra no style-src para as variáveis de tema do VS Code aplicarem
  // num WebviewView (senão os cartões ficam sem borda/cor).
  assert.match(html, new RegExp(`style-src ${CSP} 'nonce-${NONCE}'`))
  // Barra proporcional: 0.7 -> 70%.
  assert.match(html, /width:70%/)
  // Faixa exibida.
  assert.match(html, /atenção/)
})

test('TEST-PROJ-004 — texto vindo dos dados é escapado (NFR-PROJ-004)', () => {
  const html = renderProjectOverviewHtml(
    model({ counts: { kind: 'counts', total: 1, byStatus: [{ status: '<script>', count: 1 }] } }),
    NONCE,
    CSP,
  )
  assert.doesNotMatch(html, /<script>/)
  assert.match(html, /&lt;script&gt;/)
})

test('TEST-PROJ-004 — a barra nunca passa de 100% mesmo acima do teto', () => {
  const html = renderProjectOverviewHtml(
    model({ context: { kind: 'measured', used: 300000, max: 200000, fraction: 1.5, band: 'bloqueio' } }),
    NONCE,
    CSP,
  )
  assert.match(html, /width:100%/)
  assert.doesNotMatch(html, /width:150%/)
})

test('TEST-PROJ-005 — estados vazios renderizam rótulos informativos', () => {
  const html = renderProjectOverviewHtml(
    model({
      health: { kind: 'not-run' },
      context: { kind: 'not-measured', max: 200000 },
      counts: { kind: 'no-index' },
      docs: [{ label: 'Visão geral', relPath: '.specs/project/vision.md', exists: false }],
    }),
    NONCE,
    CSP,
  )
  assert.match(html, /não executado/)
  assert.match(html, /— \/ 200k/)
  assert.match(html, /ausente ou ilegível/)
  assert.match(html, /\(ausente\)/)
})

test('TEST-PROJ-005 — saúde com problemas mostra a contagem de erros e avisos', () => {
  const html = renderProjectOverviewHtml(
    model({ health: { kind: 'problems', errors: 2, warnings: 3, info: 0 } }),
    NONCE,
    CSP,
  )
  assert.match(html, /2 erros/)
  assert.match(html, /3 avisos/)
})

test('esc — escapa os cinco caracteres perigosos', () => {
  assert.equal(esc(`<a href="x">&'`), '&lt;a href=&quot;x&quot;&gt;&amp;&#39;')
})
