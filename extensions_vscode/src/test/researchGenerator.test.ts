import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { RESEARCH_TOPICS } from '../sdd/researchGenerator'
import { buildSkeleton } from '../sdd/skeleton'
import { ACTIONS, composePrompt } from '../sdd/claudePrompt'

// A estrutura vive no template (ADR-017). `npm test` roda de extensions_vscode/.
const TEMPLATE = readFileSync('templates/pt-BR/feature/research.md', 'utf8')

// TEST-RES-001 — o esqueleto traz as oito frentes do RF-007 como seções.
test('TEST-RES-001: buildResearchSkeleton traz as oito frentes do RF-007', () => {
  const out = buildSkeleton(TEMPLATE, {
    id: '0017-research',
    title: 'Research assistido (RF-007)',
    scope: 'RES',
    date: '2026-08-01',
  })

  assert.equal(RESEARCH_TOPICS.length, 8)
  for (const topic of RESEARCH_TOPICS) {
    assert.ok(out.includes(topic), `falta a frente: ${topic}`)
  }
  // Oito seções numeradas.
  const headings = out.match(/^## \d+\. /gm) ?? []
  assert.equal(headings.length, 8, 'número de seções != 8')

  assert.ok(!out.includes('{{'), 'sobrou marcador {{ no esqueleto')
  assert.ok(out.includes('# Research: Research assistido (RF-007)'))
  assert.ok(out.includes('**ID:** 0017-research'))
  assert.ok(out.includes('**Escopo dos identificadores:** RES'))
})

// TEST-RES-002 — a ação `research` foi acrescentada ao adapter 0004 (ADR-017).
test('TEST-RES-002: a ação research existe no 0004 e compõe /sdd-kit:research', () => {
  assert.ok(
    ACTIONS.some((a) => a.id === 'research'),
    'ação research ausente em ACTIONS',
  )
  assert.equal(composePrompt('research', '0017-research'), '/sdd-kit:research 0017-research')
})
