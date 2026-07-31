import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  detectFrom,
  SPECS_MARKER,
  GIT_MARKER,
  type ExistsProbe,
} from '../sdd/detection'

/** Probe falso: existe apenas o que estiver no conjunto; registra o que sondou. */
function fakeProbe(present: string[]): { exists: ExistsProbe; asked: string[] } {
  const set = new Set(present)
  const asked: string[] = []
  const exists: ExistsProbe = async (rel) => {
    asked.push(rel)
    return set.has(rel)
  }
  return { exists, asked }
}

test('TEST-FOUND-001 · SCN-FOUND-002 — projeto inicializado (.specs + git)', async () => {
  const { exists } = fakeProbe([SPECS_MARKER, GIT_MARKER])
  const d = await detectFrom(true, exists)
  assert.deepEqual(d, { hasWorkspace: true, hasSpecs: true, hasGit: true })
})

test('TEST-FOUND-001 · SCN-FOUND-003 — workspace sem .specs', async () => {
  const { exists } = fakeProbe([GIT_MARKER])
  const d = await detectFrom(true, exists)
  assert.equal(d.hasWorkspace, true)
  assert.equal(d.hasSpecs, false)
  assert.equal(d.hasGit, true)
})

test('TEST-FOUND-001 — projeto sem Git nem .specs', async () => {
  const { exists } = fakeProbe([])
  const d = await detectFrom(true, exists)
  assert.deepEqual(d, { hasWorkspace: true, hasSpecs: false, hasGit: false })
})

test('TEST-FOUND-001 — sem pasta aberta: tudo falso e nada é sondado', async () => {
  const { exists, asked } = fakeProbe([SPECS_MARKER, GIT_MARKER])
  const d = await detectFrom(false, exists)
  assert.deepEqual(d, { hasWorkspace: false, hasSpecs: false, hasGit: false })
  assert.equal(asked.length, 0, 'sem workspace, não deve sondar o disco')
})

test('TEST-FOUND-001 — sonda exatamente os marcadores esperados', async () => {
  const { exists, asked } = fakeProbe([SPECS_MARKER])
  await detectFrom(true, exists)
  assert.deepEqual([...asked].sort(), [GIT_MARKER, SPECS_MARKER].sort())
})
