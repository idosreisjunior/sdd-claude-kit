// TEST-COCK-002 — documento de painel: CSP, nonce e escape do payload (REQ-COCK-001,
// NFR-COCK-002, TASK-COCK-002).
//
// Este teste cobre TODAS as superfícies de webview, porque todas passam por
// renderPanelHtml. É o ganho de ter um ponto único: um teste em vez de N que divergem.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { renderPanelHtml, escapeHtml, baseCss } from '../sdd/panelHtml'

function html(over: Partial<Parameters<typeof renderPanelHtml>[0]> = {}) {
  return renderPanelHtml({
    title: 'Painel SDD',
    payload: { items: [] },
    nonce: 'abc123',
    scriptUri: 'https://webview/board.js',
    ...over,
  })
}

test('TEST-COCK-002 · NFR-COCK-002 — CSP proíbe tudo e libera só o nonce', () => {
  const h = html()
  assert.match(h, /http-equiv="Content-Security-Policy"/)
  assert.match(h, /default-src 'none'/)
  assert.match(h, /style-src 'nonce-abc123'/)
  assert.match(h, /script-src 'nonce-abc123'/)
  assert.match(h, /<style nonce="abc123">/)
  assert.match(h, /<script nonce="abc123" src="https:\/\/webview\/board\.js">/)
})

test('TEST-COCK-002 · REQ-COCK-001 — o documento emite os tokens --sdd-*', () => {
  const h = html()
  assert.ok(h.includes('--sdd-accent'), 'a camada de marca entra no <style>')
  assert.ok(h.includes('--sdd-surface'), 'os tokens de superfície entram no <style>')
  assert.ok(h.includes('var(--vscode-editorWidget-background'), 'derivados do tema')
})

test('TEST-COCK-002 · NFR-COCK-002 — o payload não pode fechar a tag script', () => {
  const h = html({ payload: { title: '</script><img src=x onerror=alert(1)>' } })
  assert.ok(!h.includes('</script><img src=x'), 'o dado não aparece cru')
  assert.match(h, /\\u003c\/script>/)
  // Apenas as duas tags </script> reais: bloco de dados e bundle.
  assert.equal((h.match(/<\/script>/g) || []).length, 2)
})

test('TEST-COCK-002 — o título é escapado como texto, não interpretado', () => {
  const h = html({ title: '<img src=x onerror=alert(1)>' })
  assert.ok(!h.includes('<img src=x'), 'o título não vira marcação')
  assert.match(h, /<title>&lt;img src=x onerror=alert\(1\)&gt;<\/title>/)
})

test('TEST-COCK-002 — o CSS da superfície entra depois do base, para poder sobrepor', () => {
  const h = html({ css: '.board { display: grid; }' })
  assert.ok(h.indexOf('.board { display: grid; }') > h.indexOf('--sdd-accent'))
})

test('escapeHtml neutraliza os cinco caracteres que importam', () => {
  assert.equal(escapeHtml('<a href="x">&</a>'), '&lt;a href=&quot;x&quot;&gt;&amp;&lt;/a&gt;')
})

test('REQ-COCK-001 — o CSS base não declara cor de conteúdo fixa', () => {
  const css = baseCss()
  const hex = css.match(/#[0-9a-fA-F]{3,8}\b/g)
  assert.equal(hex, null, `o CSS base não deve ter hex fixo, achei: ${hex?.join(', ')}`)
})
