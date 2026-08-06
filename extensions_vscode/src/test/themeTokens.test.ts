import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  CONTENT_TOKENS,
  BRAND_TOKENS,
  STATUS_TOKENS,
  themeTokensCss,
  statusToken,
} from '../sdd/themeTokens'

test('TEST-WIZ-001 · NFR-WIZ-002 — toda cor de conteúdo deriva de uma variável --vscode-*', () => {
  const values = Object.values(CONTENT_TOKENS)
  assert.ok(values.length > 0, 'deve haver tokens de conteúdo')
  for (const value of values) {
    assert.ok(
      value.startsWith('var(--vscode-'),
      `token de conteúdo com cor fixa: ${value}`,
    )
  }
})

test('TEST-WIZ-001 — o acento de marca é a paleta própria do SDD (ADR-035)', () => {
  assert.equal(BRAND_TOKENS['--sdd-accent'], '#7C6BF0')
  assert.equal(BRAND_TOKENS['--sdd-ai'], '#E08256')
})

test('TEST-WIZ-001 — o CSS emite um :root com todos os tokens das três camadas', () => {
  const css = themeTokensCss()
  assert.ok(css.startsWith(':root {'), 'deve abrir um bloco :root')
  assert.ok(css.trimEnd().endsWith('}'), 'deve fechar o bloco :root')
  const all = [
    ...Object.keys(CONTENT_TOKENS),
    ...Object.keys(BRAND_TOKENS),
    ...Object.keys(STATUS_TOKENS),
  ]
  for (const name of all) {
    assert.ok(css.includes(`${name}:`), `token ausente no CSS: ${name}`)
  }
})

test('TEST-WIZ-001 — statusToken mapeia o ciclo de vida e cai em draft no desconhecido', () => {
  assert.equal(statusToken('IN_PROGRESS'), '--sdd-status-in-progress')
  assert.equal(statusToken('verified'), '--sdd-status-verified')
  assert.equal(statusToken('DESIGNED'), '--sdd-status-designed')
  assert.equal(statusToken('QUALQUER_COISA'), '--sdd-status-draft')
})
