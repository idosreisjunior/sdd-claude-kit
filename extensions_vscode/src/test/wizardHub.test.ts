// TEST-WIZ-010 (parte pura) — estado do hub do wizard (REQ-WIZ-006, TASK-WIZ-009).
// A retomada em si (clicar e abrir na etapa atual) é efeito de borda, coberta no e2e.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildHubState } from '../sdd/wizardHub'
import type { ChangeEntry } from '../sdd/specsIndex'

function change(over: Partial<ChangeEntry> = {}): ChangeEntry {
  return {
    id: '0001-x',
    type: 'feature',
    title: 'X',
    status: 'DRAFT',
    path: 'features/0001-x',
    ...over,
  }
}

test('SCN-WIZ-011 — projeto sem mudanças produz hub vazio (dispara as boas-vindas)', () => {
  const hub = buildHubState([])
  assert.equal(hub.total, 0)
  assert.deepEqual(hub.groups, [])
})

test('agrupa pelo ciclo de vida, na ordem do painel, omitindo grupo vazio', () => {
  const hub = buildHubState([
    change({ id: '0001-a', status: 'IN_PROGRESS' }),
    change({ id: '0002-b', status: 'DRAFT' }),
    change({ id: '0003-c', status: 'ARCHIVED' }),
    change({ id: '0004-d', status: 'APPROVED' }),
  ])
  assert.equal(hub.total, 4)
  assert.deepEqual(
    hub.groups.map((g) => g.label),
    ['Rascunho', 'Em desenvolvimento', 'Concluídas'],
  )
  // 'Em desenvolvimento' reúne APPROVED e IN_PROGRESS, na ordem de entrada.
  assert.deepEqual(
    hub.groups[1].changes.map((c) => c.id),
    ['0001-a', '0004-d'],
  )
})

test('SCN-WIZ-010 — cada item carrega o que a lista mostra e o id para retomar', () => {
  const hub = buildHubState([
    change({ id: '0035-wizard-cockpit', title: 'Wizard Cockpit', status: 'DESIGNED' }),
  ])
  assert.deepEqual(hub.groups[0].changes[0], {
    id: '0035-wizard-cockpit',
    type: 'feature',
    title: 'Wizard Cockpit',
    status: 'DESIGNED',
  })
})

test('descarta mudança sem id ou sem path — uma linha que não abre nada', () => {
  const hub = buildHubState([
    change({ id: '' }),
    change({ id: '0002-b', path: '' }),
    change({ id: '0003-c' }),
  ])
  assert.equal(hub.total, 1)
  assert.equal(hub.groups[0].changes[0].id, '0003-c')
})

test('status desconhecido cai em Rascunho, sem perder a mudança', () => {
  const hub = buildHubState([change({ id: '0009-z', status: 'INVENTADO' })])
  assert.equal(hub.total, 1)
  assert.equal(hub.groups[0].label, 'Rascunho')
})
