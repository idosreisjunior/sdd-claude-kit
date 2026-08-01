import { test } from 'node:test'
import assert from 'node:assert/strict'
import { checkScope, DEFAULT_SCOPE_CONFIG, type ScopeInput } from '../sdd/scopeCheck'

function input(over: Partial<ScopeInput> = {}): ScopeInput {
  return {
    changedFiles: [],
    plannedFiles: [],
    diffStats: [],
    config: DEFAULT_SCOPE_CONFIG,
    ...over,
  }
}

const kinds = (alerts: { kind: string }[]) => alerts.map((a) => a.kind)

test('TEST-TRACE-004 — arquivo fora dos prováveis vira alerta unplanned (SCN-TRACE-004)', () => {
  const alerts = checkScope(input({ changedFiles: ['src/a.ts', 'src/b.ts', 'src/c.ts'], plannedFiles: ['src/a.ts', 'src/b.ts'] }))
  const unplanned = alerts.filter((a) => a.kind === 'unplanned')
  assert.equal(unplanned.length, 1)
  assert.equal(unplanned[0].path, 'src/c.ts')
})

test('TEST-TRACE-004 — casa por sufixo com o prefixo do subprojeto (não alerta)', () => {
  const alerts = checkScope(input({ changedFiles: ['extensions_vscode/src/a.ts'], plannedFiles: ['src/a.ts'] }))
  assert.equal(alerts.filter((a) => a.kind === 'unplanned').length, 0)
})

test('TEST-TRACE-005 — arquivo sensível gera alerta, independente do previsto (SCN-TRACE-005)', () => {
  const alerts = checkScope(input({
    changedFiles: ['.env', 'src/keys/server.pem'],
    plannedFiles: ['.env', 'src/keys/server.pem'], // previstos: sem unplanned
  }))
  assert.deepEqual(kinds(alerts).sort(), ['sensitive', 'sensitive'])
})

test('TEST-TRACE-006 — limite, remoção e dependência geram alertas', () => {
  const alerts = checkScope(input({
    changedFiles: ['package.json', 'src/x.ts'],
    plannedFiles: ['package.json', 'src/x.ts'],
    diffStats: [
      { path: 'src/x.ts', added: 0, removed: 10 }, // remoção sem adição
      { path: 'package.json', added: 3, removed: 1 },
    ],
    config: { sensitiveGlobs: [], maxLines: 5, maxFiles: 20, dependencyManifests: ['package.json'] },
  }))
  const ks = kinds(alerts)
  assert.ok(ks.includes('dependency'), 'esperava dependency')
  assert.ok(ks.includes('removal'), 'esperava removal')
  assert.ok(ks.includes('diff-limit'), 'esperava diff-limit (14 linhas > 5)')
})

test('TEST-TRACE-007 — diff dentro do escopo não gera alertas (SCN-TRACE-006)', () => {
  const alerts = checkScope(input({
    changedFiles: ['src/a.ts', 'src/b.ts'],
    plannedFiles: ['src/a.ts', 'src/b.ts'],
    diffStats: [{ path: 'src/a.ts', added: 3, removed: 1 }],
  }))
  assert.deepEqual(alerts, [])
})
