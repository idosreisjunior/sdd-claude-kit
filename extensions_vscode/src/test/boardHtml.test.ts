import { test } from 'node:test'
import assert from 'node:assert/strict'
import { renderBoardHtml } from '../sdd/boardHtml'
import { buildChangesBoard } from '../sdd/boardModel'
import type { ChangeEntry } from '../sdd/specsIndex'

function board(title = 'Título') {
  const changes: ChangeEntry[] = [
    { id: '0007-git', type: 'feature', title, status: 'VERIFIED', path: 'features/0007-git' },
  ]
  return buildChangesBoard(changes, new Map())
}

test('TEST-BOARD-003 — o painel aplica CSP com nonce em style e script (NFR-BOARD-002)', () => {
  const html = renderBoardHtml(board(), 'abc123')
  assert.match(html, /http-equiv="Content-Security-Policy"/)
  assert.match(html, /default-src 'none'/)
  assert.match(html, /style-src 'nonce-abc123'/)
  assert.match(html, /script-src 'nonce-abc123'/)
  assert.match(html, /<script nonce="abc123">/)
  assert.match(html, /<style nonce="abc123">/)
})

test('TEST-BOARD-003b — embute o board inicial e usa a API do webview', () => {
  const html = renderBoardHtml(board(), 'n')
  assert.match(html, /<div id="app"><\/div>/)
  assert.match(html, /const INITIAL = /)
  assert.match(html, /acquireVsCodeApi\(\)/)
  // o id da mudança está no board embutido
  assert.ok(html.includes('0007-git'), 'o board inicial embute a mudança')
})

test('TEST-BOARD-003c — o `<` do dado é neutralizado (não fecha a tag script)', () => {
  const html = renderBoardHtml(board('</script><img src=x>'), 'n')
  // o payload não entra cru; o `<` vira < dentro do JSON embutido
  assert.ok(!html.includes('</script><img src=x>'), 'o dado não aparece cru')
  assert.match(html, /\\u003c\/script>/)
  // continua havendo exatamente uma tag </script> real (a de fechamento)
  assert.equal((html.match(/<\/script>/g) || []).length, 1)
})
