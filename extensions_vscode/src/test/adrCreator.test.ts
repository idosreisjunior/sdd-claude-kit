import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { nextAdrNumber, adrSlug, padAdr, buildAdr } from '../sdd/adrCreator'

// TEST-HIST-003 — numeração global (max+1, sem reutilizar) e slug determinístico.
test('TEST-HIST-003: nextAdrNumber e adrSlug', () => {
  assert.equal(nextAdrNumber([]), 1)
  assert.equal(nextAdrNumber([1, 2, 5]), 6) // buraco (3, 4) não é reutilizado
  assert.equal(nextAdrNumber([16, 15, 14]), 17)
  assert.equal(padAdr(7), '007')
  assert.equal(padAdr(17), '017')
  assert.equal(adrSlug('Novo ADR de Teste'), 'novo-adr-de-teste')
  assert.match(adrSlug('Histórico & Decisões'), /^[a-z0-9]+(-[a-z0-9]+)*$/)
})

// O template de ADR vive no pacote sincronizado. `npm test` roda de extensions_vscode/.
const TEMPLATE = readFileSync('templates/pt-BR/adr/ADR-template.md', 'utf8')

// TEST-HIST-004 — buildAdr resolve o cabeçalho e deixa lacunas, sem {{ residual.
test('TEST-HIST-004: buildAdr resolve o cabeçalho e não deixa marcadores', () => {
  const out = buildAdr(TEMPLATE, { number: 17, title: 'Teste de ADR', date: '2026-08-01' })
  assert.ok(out.includes('# ADR-017 — Teste de ADR'), 'cabeçalho não resolvido')
  assert.ok(out.includes('Proposto'), 'status não resolvido')
  assert.ok(out.includes('2026-08-01'), 'data não resolvida')
  assert.ok(!out.includes('{{'), 'sobrou marcador {{ no esqueleto')
})
