// TEST-COCK-002/010 — documento da sidebar (REQ-COCK-006, REQ-COCK-005, NFR-COCK-002,
// TASK-COCK-016/018, ADR-036).
//
// O DOM renderizado não é alcançável daqui (lacuna registrada). O que dá para verificar é
// o documento: CSP, tokens, componentes compartilhados e o payload escapado.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { renderSidebarHtml, sidebarCss } from '../sdd/sidebarHtml'
import { buildSidebarState } from '../sdd/sidebarModel'
import type { ChangeEntry } from '../sdd/specsIndex'

const CHANGES: ChangeEntry[] = [
  { id: '0036-ui', type: 'feature', title: 'Identidade visual', status: 'IN_PROGRESS', path: 'features/0036-ui' },
]

test('TEST-COCK-002 · NFR-COCK-002 — a sidebar aplica CSP com nonce e carrega o bundle', () => {
  const html = renderSidebarHtml(buildSidebarState(CHANGES, true), 'abc123', 'https://w/sidebar.js')
  assert.match(html, /default-src 'none'/)
  assert.match(html, /style-src 'nonce-abc123'/)
  assert.match(html, /script-src 'nonce-abc123'/)
  assert.match(html, /<script nonce="abc123" src="https:\/\/w\/sidebar\.js">/)
})

test('TEST-COCK-002 — o título da mudança entra escapado no payload', () => {
  const state = buildSidebarState(
    [{ ...CHANGES[0], title: '</script><img src=x onerror=alert(1)>' }],
    true,
  )
  const html = renderSidebarHtml(state, 'n', 'u')
  assert.ok(!html.includes('</script><img src=x'), 'o título não aparece cru')
  assert.match(html, /\\u003c\/script>/)
  assert.equal((html.match(/<\/script>/g) || []).length, 2, 'bloco de dados + bundle')
})

test('TEST-COCK-010 · REQ-COCK-002 — a sidebar usa os componentes compartilhados', () => {
  const html = renderSidebarHtml(buildSidebarState(CHANGES, true), 'n', 'u')
  assert.ok(html.includes('.ui-card'), 'cartão compartilhado')
  assert.ok(html.includes('.ui-badge'), 'badge de status compartilhado')
  assert.ok(html.includes('--sdd-accent'), 'tokens de marca')
})

test('TEST-COCK-006 · SCN-COCK-006 — projeto sem .specs embute o modo de boas-vindas', () => {
  const html = renderSidebarHtml(buildSidebarState(CHANGES, false), 'n', 'u')
  assert.ok(html.includes('"mode":"welcome"'), 'o host decide o modo, não o cliente')
})

test('TEST-COCK-006 · SCN-COCK-010 — projeto inicializado embute o modo de lista', () => {
  const html = renderSidebarHtml(buildSidebarState(CHANGES, true), 'n', 'u')
  assert.ok(html.includes('"mode":"list"'))
  assert.ok(html.includes('0036-ui'), 'a mudança chega ao cliente')
})

test('REQ-COCK-001 — o CSS da sidebar não declara cor literal', () => {
  const css = sidebarCss()
  assert.equal(css.match(/#[0-9a-fA-F]{3,8}\b/g), null, 'sem hex fixo')
  assert.equal(css.match(/\b(?:rgba?|hsla?)\(/g), null, 'sem rgb/hsl literal')
})
