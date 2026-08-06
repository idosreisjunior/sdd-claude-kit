// TEST-COCK-003 e TEST-COCK-004 — decisões dos componentes compartilhados
// (REQ-COCK-002, NFR-COCK-001, TASK-COCK-003).
//
// Testa o que o componente DECIDE, não o que ele renderiza: o DOM de um webview não é
// alcançável pelo host (gap registrado na rastreabilidade). O `.tsx` fica com a marcação.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { statTileDisplay, statusBadge, progressPct } from '../sdd/uiModel'
import { componentsCss } from '../sdd/uiCss'
import { BRAND_TOKENS } from '../sdd/themeTokens'

test('TEST-COCK-003 · SCN-COCK-005 — valor indisponível nunca vira 0', () => {
  const semFonte = statTileDisplay(undefined)
  assert.equal(semFonte.text, '—')
  assert.equal(semFonte.available, false)
  assert.ok(semFonte.note, 'deve explicar por que não há número')

  const indisponivel = statTileDisplay({ available: false, note: 'traceability.yaml ausente' })
  assert.equal(indisponivel.text, '—')
  assert.equal(indisponivel.available, false)
  assert.equal(indisponivel.note, 'traceability.yaml ausente')
})

test('TEST-COCK-003 — zero de verdade é mostrado como zero', () => {
  // A distinção que o requisito protege: "são zero" ≠ "não sei quantos são".
  const zero = statTileDisplay({ available: true, value: 0 })
  assert.equal(zero.text, '0')
  assert.equal(zero.available, true)
  assert.equal(zero.note, undefined)
})

test('TEST-COCK-003 — valor disponível vira o número', () => {
  assert.equal(statTileDisplay({ available: true, value: 12 }).text, '12')
})

test('TEST-COCK-004 — status desconhecido cai no token de rascunho, sem sumir', () => {
  const desconhecido = statusBadge('INVENTADO')
  assert.equal(desconhecido.tokenName, '--sdd-status-draft')
  assert.equal(desconhecido.label, 'INVENTADO', 'o texto original é preservado')
})

test('TEST-COCK-004 — cada status do ciclo tem o seu token', () => {
  assert.equal(statusBadge('IN_PROGRESS').tokenName, '--sdd-status-in-progress')
  assert.equal(statusBadge('verified').tokenName, '--sdd-status-verified')
  assert.equal(statusBadge('verified').label, 'VERIFIED')
})

test('TEST-COCK-004 — status vazio não produz badge sem texto', () => {
  const vazio = statusBadge('   ')
  assert.equal(vazio.label, 'SEM STATUS')
  assert.equal(vazio.tokenName, '--sdd-status-draft')
})

test('progressPct é limitado a 0–100 e nunca devolve NaN', () => {
  assert.equal(progressPct(3, 6), 50)
  assert.equal(progressPct(0, 0), 0, 'total zero não vira NaN')
  assert.equal(progressPct(9, 4), 100, 'não passa de 100')
  assert.equal(progressPct(-1, 4), 0, 'não fica negativo')
  assert.equal(progressPct(Number.NaN, 4), 0)
})

test('REQ-COCK-001 — o CSS dos componentes só usa tokens --sdd-*', () => {
  const css = componentsCss()
  const vscodeColors = css.match(/(?:color|background|border)\s*:[^;]*--vscode-/g)
  assert.equal(vscodeColors, null, 'sem --vscode-* para cor de conteúdo')

  // Hex é permitido APENAS quando vem da camada de marca. A primeira versão deste teste
  // proibia hex de qualquer origem, o que era grosseiro demais: a regra de REQ-COCK-001 é
  // sobre cor de CONTEÚDO, e o ADR-035 reserva a paleta de marca como exceção declarada.
  // `readableOn` passou a emitir essas tintas, e a asserção precisou virar precisa em vez
  // de ampla — mais estrita no que importa, não mais frouxa.
  const brandInks = new Set(Object.values(BRAND_TOKENS).map((v) => v.toUpperCase()))
  for (const hex of css.match(/#[0-9a-fA-F]{3,8}\b/g) ?? []) {
    assert.ok(
      brandInks.has(hex.toUpperCase()),
      `hex ${hex} não pertence à camada de marca (themeTokens.BRAND_TOKENS)`,
    )
  }
})
