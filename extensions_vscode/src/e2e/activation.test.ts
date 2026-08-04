// Testes de integração (E2E) — feature 0023. Rodam no Extension Development Host
// via @vscode/test-cli (ui: tdd). Ver .vscode-test.mjs e ADR-022.
import * as assert from 'assert'
import * as vscode from 'vscode'

const EXT_ID = 'idosreisjunior.sdd-claude-kit-vscode'

suite('E2E: ativação da extensão', () => {
  test('SCN-E2E-002 — a extensão ativa sem erro (TEST-E2E-001)', async () => {
    const ext = vscode.extensions.getExtension(EXT_ID)
    assert.ok(ext, `extensão ${EXT_ID} não encontrada no host`)
    await ext.activate()
    assert.strictEqual(ext.isActive, true, 'a extensão deveria estar ativa após activate()')
  })
})
