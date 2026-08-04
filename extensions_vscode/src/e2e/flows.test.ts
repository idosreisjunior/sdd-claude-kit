// Testes de integração (E2E) — feature 0023. Exercita fluxos não-interativos
// de ponta a ponta, com saída observável, sem gh/Claude Code/rede. Ver ADR-022.
import * as assert from 'assert'
import * as vscode from 'vscode'

const EXT_ID = 'idosreisjunior.sdd-claude-kit-vscode'

async function waitForDiagnostics(
  uri: vscode.Uri,
  timeoutMs: number
): Promise<readonly vscode.Diagnostic[]> {
  const start = Date.now()
  for (;;) {
    const diags = vscode.languages.getDiagnostics(uri)
    if (diags.length > 0 || Date.now() - start >= timeoutMs) {
      return diags
    }
    await new Promise((resolve) => setTimeout(resolve, 100))
  }
}

suite('E2E: fluxos não-interativos', () => {
  suiteSetup(async () => {
    await vscode.extensions.getExtension(EXT_ID)?.activate()
  })

  test('SCN-E2E-004 — SQL Guard publica diagnóstico para DELETE sem WHERE (TEST-E2E-003)', async () => {
    const doc = await vscode.workspace.openTextDocument({
      language: 'sql',
      content: 'DELETE FROM t;\n'
    })
    await vscode.window.showTextDocument(doc)

    await vscode.commands.executeCommand('sddClaudeKit.sqlGuard')

    const diags = await waitForDiagnostics(doc.uri, 3000)
    assert.ok(diags.length >= 1, 'esperava ao menos um diagnóstico do SQL Guard para DELETE sem WHERE')
  })

  test('SCN-E2E-005 — Project Doctor executa sem lançar (TEST-E2E-004)', async () => {
    await vscode.commands.executeCommand('sddClaudeKit.runDoctor')
    assert.ok(true, 'runDoctor concluiu sem lançar exceção')
  })
})
