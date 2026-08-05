// TEST-COCK-007 (parte pura) — teclado da sidebar (REQ-COCK-006, SCN-COCK-007,
// NFR-COCK-004, TASK-COCK-017).
//
// O `addEventListener` não é testável sem DOM; o MAPEAMENTO tecla → intenção é, e é ele
// que erra. O e2e cobre o efeito no host.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { intentForKey, moveFocus, focusEdge, type NavState } from '../sdd/sidebarNav'

const LIST = {
  items: [
    { kind: 'group' as const, key: 'g1' },
    { kind: 'change' as const, key: 'a' },
    { kind: 'change' as const, key: 'b' },
    { kind: 'change' as const, key: 'c' },
  ],
  focusedKey: 'g1',
}

test('TEST-COCK-007 — as setas movem uma posição', () => {
  assert.deepEqual(intentForKey('ArrowDown'), { kind: 'move', delta: 1 })
  assert.deepEqual(intentForKey('ArrowUp'), { kind: 'move', delta: -1 })
})

test('TEST-COCK-007 — PageUp/PageDown movem em bloco', () => {
  assert.deepEqual(intentForKey('PageDown'), { kind: 'move', delta: 10 })
  assert.deepEqual(intentForKey('PageUp'), { kind: 'move', delta: -10 })
})

test('TEST-COCK-007 — Home e End vão às pontas', () => {
  assert.deepEqual(intentForKey('Home'), { kind: 'edge', edge: 'first' })
  assert.deepEqual(intentForKey('End'), { kind: 'edge', edge: 'last' })
})

test('TEST-COCK-007 · SCN-COCK-007 — Enter e espaço acionam a ação padrão sem mouse', () => {
  assert.deepEqual(intentForKey('Enter'), { kind: 'activate' })
  assert.deepEqual(intentForKey(' '), { kind: 'activate' })
})

test('TEST-COCK-007 · SCN-COCK-008 — a tecla de menu pede as ações do item', () => {
  assert.deepEqual(intentForKey('ContextMenu'), { kind: 'actions' })
})

test('TEST-COCK-007 — tecla que não é nossa devolve null, para não sequestrar atalho', () => {
  // Se a sidebar tratasse tudo, engoliria atalhos do VS Code que o usuário espera usar.
  for (const key of ['a', 'Tab', 'Escape', 'F1', 'ArrowLeft', 'ArrowRight', 'Control']) {
    assert.equal(intentForKey(key), null, `${key} não deveria ser capturada`)
  }
})

test('TEST-COCK-007 — PageDown para no último item, sem estourar a lista', () => {
  const after = moveFocus(LIST, 10)
  assert.equal(after.focusedKey, 'c')
})

test('TEST-COCK-007 — as funções de navegação não dependem de nada além do estado', () => {
  // Este teste existe por causa do bundle: sidebarNav não importa nada, e é isso que
  // permite o cliente do webview usá-lo sem arrastar js-yaml (teto do esbuild.mjs).
  const solto: NavState = { items: [{ kind: 'change', key: 'x' }] }
  assert.equal(focusEdge(solto, 'last').focusedKey, 'x')
  assert.equal(moveFocus(solto, 1).focusedKey, 'x')
})
