// Testes de integração (E2E) — feature 0023. Paridade entre os comandos
// declarados no package.json e os registrados em runtime. Ver ADR-022.
import * as assert from 'assert'
import * as vscode from 'vscode'

const EXT_ID = 'idosreisjunior.sdd-claude-kit-vscode'

interface DeclaredCommand {
  command: string
}

suite('E2E: paridade de comandos', () => {
  test('SCN-E2E-003 — todo comando sddClaudeKit.* declarado está registrado (TEST-E2E-002)', async () => {
    const ext = vscode.extensions.getExtension(EXT_ID)
    assert.ok(ext, `extensão ${EXT_ID} não encontrada no host`)
    await ext.activate()

    const declared: string[] = ((ext.packageJSON?.contributes?.commands ?? []) as DeclaredCommand[])
      .map((c) => c.command)
      .filter((c) => c.startsWith('sddClaudeKit.'))

    assert.ok(
      declared.length >= 20,
      `esperava >= 20 comandos sddClaudeKit.* declarados, encontrei ${declared.length}`
    )

    const registered = new Set(await vscode.commands.getCommands(true))
    const missing = declared.filter((c) => !registered.has(c))
    assert.deepStrictEqual(missing, [], `declarados mas não registrados: ${missing.join(', ')}`)
  })
})
