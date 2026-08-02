import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  canGenerateDesign,
  extractScope,
  DESIGN_SECTIONS,
  LACUNA_MARK,
} from '../sdd/designGenerator'
import { buildSkeleton } from '../sdd/skeleton'

// TEST-DSGN-001 — pré-condição: só gera com a spec aprovada (D-Q4).
test('TEST-DSGN-001: canGenerateDesign exige approval != null', () => {
  assert.equal(canGenerateDesign(null), false)
  assert.equal(canGenerateDesign(undefined), false)
  assert.equal(canGenerateDesign({ by: 'autor', date: '2026-08-01', revision: 1 }), true)
})

// A estrutura vive no template (ADR-014). `npm test` roda de extensions_vscode/,
// então o caminho é relativo à raiz do projeto.
const TEMPLATE = readFileSync('templates/pt-BR/feature/design.md', 'utf8')

// TEST-DSGN-002 — o esqueleto contém todas as seções do RF-009, cada uma como
// lacuna, sem marcadores residuais.
test('TEST-DSGN-002: buildSkeleton traz as seções do RF-009 com lacunas', () => {
  const out = buildSkeleton(TEMPLATE, {
    id: '0014-design-generation',
    title: 'Geração do design técnico (RF-009)',
    scope: 'DSGN',
    date: '2026-08-01',
  })

  for (const section of DESIGN_SECTIONS) {
    assert.ok(out.includes(`## ${section}`), `falta a seção: ${section}`)
  }

  // Toda seção nasce como lacuna: o marcador aparece exatamente uma vez por seção.
  const lacunas = out.split(LACUNA_MARK).length - 1
  assert.equal(lacunas, DESIGN_SECTIONS.length, 'número de lacunas != número de seções')

  // Variáveis resolvidas e orientações removidas — nada de {{ }} residual.
  assert.ok(!out.includes('{{'), 'sobrou marcador {{ no esqueleto')
  assert.ok(out.includes('# Design técnico: Geração do design técnico (RF-009)'))
  assert.ok(out.includes('**ID:** 0014-design-generation'))
  assert.ok(out.includes('**Escopo dos identificadores:** DSGN'))
})

// TEST-DSGN-003 — o escopo é lido do cabeçalho da spec (preenche {{ID_SCOPE}}).
test('TEST-DSGN-003: extractScope lê o escopo do cabeçalho da spec', () => {
  assert.equal(extractScope('- **Escopo dos identificadores:** DSGN'), 'DSGN')
  assert.equal(
    extractScope('# Feature: x\n- **ID:** 0014-x\n- **Escopo dos identificadores:** CC\n'),
    'CC',
  )
  assert.equal(extractScope('sem cabeçalho de escopo aqui'), undefined)
})
