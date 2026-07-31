import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  estimateTokens,
  classifyUsage,
  buildComposition,
  isBinary,
  bandLabel,
  LARGE_FILE_BYTES,
  type Thresholds,
  type ContextFile,
} from '../sdd/contextGuardian'

const T: Thresholds = { warning: 0.7, risk: 0.85, block: 0.95 }

test('TEST-CTX-001 — estimateTokens: determinística, proporcional, zero para vazio (SCN-CTX-001)', () => {
  assert.equal(estimateTokens(''), 0)
  const small = estimateTokens('abcd')
  const big = estimateTokens('abcd'.repeat(100))
  assert.ok(big > small, 'maior texto, maior estimativa')
  assert.equal(estimateTokens('abcd'), estimateTokens('abcd'), 'determinística')
  assert.equal(estimateTokens('abcd'), 1) // ceil(4/4)
})

test('TEST-CTX-002 — classifyUsage: faixas nas fronteiras, ≥ na faixa mais alta (SCN-CTX-002)', () => {
  const max = 200_000
  assert.equal(classifyUsage(100_000, max, T).band, 'normal')
  assert.equal(classifyUsage(150_000, max, T).band, 'atencao')
  assert.equal(classifyUsage(180_000, max, T).band, 'risco')
  assert.equal(classifyUsage(195_000, max, T).band, 'bloqueio')
  // exatamente no limiar entra na faixa mais alta (≥)
  assert.equal(classifyUsage(140_000, max, T).band, 'atencao') // 0.70
  assert.equal(classifyUsage(170_000, max, T).band, 'risco') // 0.85
  assert.equal(classifyUsage(190_000, max, T).band, 'bloqueio') // 0.95
})

test('TEST-CTX-002 — classifyUsage: sem teto (max<=0) → normal, fração 0', () => {
  const u = classifyUsage(999_999, 0, T)
  assert.equal(u.band, 'normal')
  assert.equal(u.fraction, 0)
})

test('TEST-CTX-003 — buildComposition: soma contáveis, sinaliza grande/binário, ordena (SCN-CTX-003)', () => {
  const files: ContextFile[] = [
    { path: 'a.md', text: 'x'.repeat(40), bytes: 40, binary: false },
    { path: 'big.md', bytes: 200 * 1024, binary: false }, // grande, não lido → estima por bytes
    { path: 'img.png', bytes: 5000, binary: true }, // binário → 0 tokens
    { path: 'small.md', text: 'yy', bytes: 2, binary: false },
  ]
  const c = buildComposition(files)
  assert.equal(c.totalTokens, 10 + Math.ceil((200 * 1024) / 4) + 0 + 1)
  assert.equal(c.entries[0].path, 'big.md') // maior primeiro
  assert.equal(c.entries[c.entries.length - 1].path, 'img.png') // 0 tokens por último
  assert.deepEqual(c.large, ['big.md'])
  assert.deepEqual(c.binary, ['img.png'])
  assert.ok(200 * 1024 >= LARGE_FILE_BYTES)
})

test('TEST-CTX-003 — isBinary detecta byte nulo; bandLabel em pt-BR', () => {
  assert.equal(isBinary(new Uint8Array([104, 105])), false)
  assert.equal(isBinary(new Uint8Array([104, 0, 105])), true)
  assert.equal(isBinary(new Uint8Array([])), false)
  assert.equal(bandLabel('atencao'), 'atenção')
  assert.equal(bandLabel('bloqueio'), 'bloqueio')
})
