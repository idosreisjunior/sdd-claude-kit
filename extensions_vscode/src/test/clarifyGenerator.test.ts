import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  hasRequirements,
  buildClarificationsSkeleton,
  CLARIFY_CATEGORIES,
} from '../sdd/clarifyGenerator'

// TEST-CLAR-001 — pré-condição: só clarifica com a spec tendo requisitos (D-Q4).
test('TEST-CLAR-001: hasRequirements exige ao menos um REQ-*', () => {
  assert.equal(hasRequirements('### REQ-CLAR-001 — Análise\ntexto'), true)
  assert.equal(hasRequirements('## Objetivo\nUma spec sem requisitos ainda.'), false)
  assert.equal(hasRequirements(''), false)
  // "req-" minúsculo ou texto solto não conta como identificador.
  assert.equal(hasRequirements('requisitos ambíguos, sem REQ formal'), false)
})

// A estrutura vive no template (ADR-015). `npm test` roda de extensions_vscode/,
// então o caminho é relativo à raiz do projeto.
const TEMPLATE = readFileSync('templates/pt-BR/feature/clarifications.md', 'utf8')

// TEST-CLAR-002 — o esqueleto contém as nove categorias do RF-008 como seções.
test('TEST-CLAR-002: buildClarificationsSkeleton traz as nove categorias do RF-008', () => {
  const out = buildClarificationsSkeleton(TEMPLATE, {
    id: '0015-spec-clarify',
    title: 'Clarificação da especificação (RF-008)',
    scope: 'CLAR',
    date: '2026-08-01',
  })

  assert.equal(CLARIFY_CATEGORIES.length, 9)
  for (const category of CLARIFY_CATEGORIES) {
    assert.ok(out.includes(category), `falta a categoria: ${category}`)
  }

  // Nove seções numeradas.
  const headings = out.match(/^## \d+\. /gm) ?? []
  assert.equal(headings.length, 9, 'número de seções de categoria != 9')

  // Variáveis resolvidas e orientações removidas — nada de {{ }} residual.
  assert.ok(!out.includes('{{'), 'sobrou marcador {{ no esqueleto')
  assert.ok(out.includes('# Clarificações: Clarificação da especificação (RF-008)'))
  assert.ok(out.includes('**ID:** 0015-spec-clarify'))
  assert.ok(out.includes('**Escopo dos identificadores:** CLAR'))
})
