import { test } from 'node:test'
import assert from 'node:assert/strict'
import { renderSpecEditorHtml } from '../sdd/specEditorHtml'

test('TEST-EDIT-002 — CSP com nonce em style e script (NFR-EDIT-002)', () => {
  const html = renderSpecEditorHtml('# X\n', 'n0nce')
  assert.match(html, /http-equiv="Content-Security-Policy"/)
  assert.match(html, /default-src 'none'/)
  assert.match(html, /style-src 'nonce-n0nce'/)
  assert.match(html, /script-src 'nonce-n0nce'/)
  assert.match(html, /<style nonce="n0nce">/)
  assert.match(html, /<script nonce="n0nce">/)
})

test('TEST-EDIT-002 — o conteúdo do textarea é escapado (sem quebrar o textarea)', () => {
  const md = 'texto </textarea><script>alert(1)</script> & "x"'
  const html = renderSpecEditorHtml(md, 'n')
  // a sequência que fecharia o textarea não entra crua
  assert.ok(!html.includes('</textarea><script>'), 'não fecha o textarea nem injeta')
  assert.match(html, /&lt;\/textarea&gt;&lt;script&gt;/)
  assert.match(html, /&amp; &quot;x&quot;/)
})

test('TEST-EDIT-002 — inclui o textarea de edição e o painel de visualização', () => {
  const html = renderSpecEditorHtml('## Requisitos\n\nREQ-EDIT-001 exige X.\n', 'n')
  assert.match(html, /<textarea id="editor"/)
  assert.match(html, /<div id="view">/)
  // o painel renderizado destaca o id
  assert.match(html, /<span class="id">REQ-EDIT-001<\/span>/)
})
