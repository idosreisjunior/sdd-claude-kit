// TEST-COCK-005 e TEST-COCK-006 — estado puro da sidebar (REQ-COCK-006, REQ-COCK-005,
// TASK-COCK-015, ADR-036).
//
// Estes testes existem porque a `TreeView` some: foco, seleção e navegação por teclado
// deixam de vir da plataforma e passam a ser nossos. É a parte de NFR-COCK-004 que dá para
// verificar sem o host — o resto vira e2e.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  buildSidebarState,
  moveFocus,
  focusEdge,
  select,
  focusedItem,
  rehydrate,
} from '../sdd/sidebarModel'
import type { ChangeEntry } from '../sdd/specsIndex'

function change(over: Partial<ChangeEntry> = {}): ChangeEntry {
  return {
    id: '0001-a',
    type: 'feature',
    title: 'A',
    status: 'DRAFT',
    path: 'features/0001-a',
    ...over,
  }
}

const CHANGES = [
  change({ id: '0001-a', title: 'A', status: 'DRAFT' }),
  change({ id: '0002-b', title: 'B', status: 'IN_PROGRESS' }),
  change({ id: '0003-c', title: 'C', status: 'VERIFIED' }),
]

test('TEST-COCK-006 — projeto sem .specs entra no modo de boas-vindas', () => {
  const state = buildSidebarState(CHANGES, false)
  assert.equal(state.mode, 'welcome')
  assert.deepEqual(state.items, [], 'boas-vindas não listam mudanças')
})

test('TEST-COCK-006 — projeto inicializado lista as mudanças agrupadas', () => {
  const state = buildSidebarState(CHANGES, true)
  assert.equal(state.mode, 'list')
  const groups = state.items.filter((i) => i.kind === 'group').map((i) => i.label)
  assert.deepEqual(groups, ['Rascunho', 'Em desenvolvimento', 'Em validação'])
  assert.equal(state.items.filter((i) => i.kind === 'change').length, 3)
})

test('TEST-COCK-005 — o foco começa no primeiro item', () => {
  const state = buildSidebarState(CHANGES, true)
  assert.equal(focusedItem(state)?.kind, 'group')
  assert.equal(focusedItem(state)?.label, 'Rascunho')
})

test('TEST-COCK-005 · SCN-COCK-007 — o foco caminha item a item', () => {
  let state = buildSidebarState(CHANGES, true)
  const keys: string[] = []
  for (let i = 0; i < 3; i += 1) {
    state = moveFocus(state, 1)
    keys.push(state.focusedKey ?? '')
  }
  assert.deepEqual(keys, ['0001-a', 'group:Em desenvolvimento', '0002-b'])
})

test('TEST-COCK-005 — o foco não circula nas pontas', () => {
  // Deliberado: saltar do fim para o começo desorienta numa lista longa, e a TreeView
  // que estamos substituindo também não circula.
  let state = buildSidebarState(CHANGES, true)
  for (let i = 0; i < 50; i += 1) {
    state = moveFocus(state, -1)
  }
  assert.equal(state.focusedKey, state.items[0].key, 'para no primeiro')

  for (let i = 0; i < 50; i += 1) {
    state = moveFocus(state, 1)
  }
  assert.equal(state.focusedKey, state.items[state.items.length - 1].key, 'para no último')
})

test('TEST-COCK-005 — Home e End vão às pontas', () => {
  const state = buildSidebarState(CHANGES, true)
  assert.equal(focusEdge(state, 'last').focusedKey, state.items[state.items.length - 1].key)
  assert.equal(focusEdge(state, 'first').focusedKey, state.items[0].key)
})

test('TEST-COCK-005 — selecionar move o foco junto', () => {
  const state = select(buildSidebarState(CHANGES, true), '0003-c')
  assert.equal(state.selectedKey, '0003-c')
  assert.equal(state.focusedKey, '0003-c', 'foco acompanha a seleção')
})

test('TEST-COCK-005 — chave desconhecida vinda do webview não altera a seleção', () => {
  // O webview manda a chave; confiar cegamente deixaria a sidebar num estado que a lista
  // não contém.
  const base = buildSidebarState(CHANGES, true)
  assert.equal(select(base, 'nao-existe'), base, 'estado devolvido intacto')
})

test('TEST-COCK-005 — reidratar preserva foco e seleção que sobreviveram', () => {
  const before = select(buildSidebarState(CHANGES, true), '0002-b')
  const fresh = buildSidebarState([...CHANGES, change({ id: '0004-d', title: 'D' })], true)
  const after = rehydrate(before, fresh)
  assert.equal(after.selectedKey, '0002-b')
  assert.equal(after.focusedKey, '0002-b')
  assert.equal(after.items.filter((i) => i.kind === 'change').length, 4, 'a lista é a nova')
})

test('TEST-COCK-005 — reidratar solta a seleção de uma mudança que sumiu', () => {
  const before = select(buildSidebarState(CHANGES, true), '0003-c')
  const fresh = buildSidebarState(CHANGES.slice(0, 2), true)
  const after = rehydrate(before, fresh)
  assert.equal(after.selectedKey, undefined, 'não aponta para item inexistente')
  assert.ok(after.focusedKey, 'o foco cai num item que existe')
  assert.ok(after.items.some((i) => i.key === after.focusedKey))
})

test('TEST-COCK-005 — lista vazia não quebra a navegação', () => {
  const state = buildSidebarState([], true)
  assert.equal(state.focusedKey, undefined)
  assert.equal(moveFocus(state, 1), state)
  assert.equal(focusEdge(state, 'last'), state)
  assert.equal(focusedItem(state), undefined)
})

test('TEST-COCK-005 — mudança sem id ou path é descartada da navegação', () => {
  const state = buildSidebarState([change({ id: '' }), change({ id: '0002-b', path: '' })], true)
  assert.equal(state.items.filter((i) => i.kind === 'change').length, 0)
})

test('TEST-COCK-005 — o progresso acompanha a mudança quando conhecido', () => {
  const state = buildSidebarState(CHANGES, true, new Map([['0002-b', { done: 3, total: 7 }]]))
  const item = state.items.find((i) => i.key === '0002-b')
  assert.deepEqual(item?.progress, { done: 3, total: 7 })
  assert.equal(state.items.find((i) => i.key === '0001-a')?.progress, undefined)
})
