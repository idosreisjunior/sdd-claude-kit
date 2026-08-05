// TEST-COCK-010 (parte do Board) — o Painel SDD consome a identidade compartilhada
// (REQ-COCK-002, SCN-COCK-003, TASK-COCK-006, ADR-039).
//
// Arquivo novo, separado de `boardHtml.test.ts`: aquele afirma o mecanismo de entrega e
// não pode ser tocado (design §11, o conflito que gerou o ADR-039). Aqui só se acrescenta
// o que o redesenho introduziu.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { renderBoardHtml } from '../sdd/boardHtml'
import { buildChangesBoard } from '../sdd/boardModel'
import { componentsCss } from '../sdd/uiCss'
import type { ChangeEntry } from '../sdd/specsIndex'

function board() {
  const changes: ChangeEntry[] = [
    { id: '0007-git', type: 'feature', title: 'Git', status: 'VERIFIED', path: 'features/0007-git' },
    { id: '0036-ui', type: 'feature', title: 'UI', status: 'IN_PROGRESS', path: 'features/0036-ui' },
  ]
  return buildChangesBoard(changes, new Map())
}

test('TEST-COCK-010 · REQ-COCK-002 — o Board emite o CSS dos componentes compartilhados', () => {
  const html = renderBoardHtml(board(), 'abc123')
  assert.ok(html.includes('.ui-card'), 'a classe de cartão compartilhada está no documento')
  assert.ok(html.includes('.ui-badge'), 'o badge compartilhado está no documento')
  // O mesmo CSS que os demais painéis emitem, não uma cópia parecida.
  const shared = componentsCss().trim().split('\n')[0]
  assert.ok(html.includes(shared), 'é o CSS de uiCss, não uma reimplementação')
})

test('TEST-COCK-010 · SCN-COCK-003 — o cartão usa o cartão e o badge compartilhados', () => {
  const html = renderBoardHtml(board(), 'n')
  // O cliente é inline (ADR-039): a marcação nasce no script, então é lá que se verifica.
  assert.ok(html.includes("h('div', 'ui-card card')"), 'o cartão carrega a classe compartilhada')
  assert.ok(html.includes('statusBadge(card.status)'), 'o status vira badge do ciclo de vida')
})

test('TEST-COCK-010 — o badge do Board deriva a classe do status como o resto da extensão', () => {
  const html = renderBoardHtml(board(), 'n')
  // Espelha statusToken(): minúsculas e `_` → `-`. IN_PROGRESS deve virar s-in-progress,
  // que é a classe emitida por uiCss a partir de STATUS_TOKENS.
  assert.ok(html.includes("replace(/_/g, '-')"), 'a normalização de status está no cliente')
  assert.ok(componentsCss().includes('.ui-badge.s-in-progress'), 'e a classe existe no CSS')
  assert.ok(componentsCss().includes('.ui-badge.s-verified'))
})

test('TEST-COCK-010 — status desconhecido não produz badge invisível', () => {
  // Sem classe .s-* correspondente, o fundo padrão de .ui-badge tem de existir; senão o
  // texto branco ficaria sobre transparente.
  const css = componentsCss()
  // A regra base é a que não tem modificador de status: `.ui-badge { … }`, e não
  // `.ui-badge.s-designed { … }`.
  const base = /^\s*\.ui-badge \{([^}]*)\}/m.exec(css)
  assert.ok(base, '.ui-badge precisa ter uma regra base')
  assert.match(base[1], /background:/, 'a regra base precisa declarar um background padrão')
  assert.match(base[1], /--sdd-status-draft/, 'o padrão é a cor de rascunho')
})

test('TEST-COCK-010 · NFR-COCK-003 — o Board não perdeu nada do que já fazia', () => {
  const html = renderBoardHtml(board(), 'n')
  // As seis funcionalidades entregues antes desta feature continuam presentes no cliente.
  for (const marker of [
    'dragstart', // arrastar para transicionar (0026)
    'cardMatches', // filtro e busca (0028)
    'renderFeed', // feed de atividade (0029)
    'sortCards', // ordenação (0030)
    'moveDisplayedCol', // ordem das colunas (0033)
    'toggleCollapse', // recolhimento (0034)
  ]) {
    assert.ok(html.includes(marker), `o Board perdeu "${marker}" no redesenho`)
  }
})
