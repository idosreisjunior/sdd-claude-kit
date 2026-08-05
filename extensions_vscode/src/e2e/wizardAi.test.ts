// Teste de integração (E2E) — TEST-WIZ-011, feature 0035 (TASK-WIZ-010).
//
// Cobre o EFEITO observável da ação de IA do wizard num VS Code real: o prompt
// `/sdd-kit:<ação> <id>` é composto e COPIADO para a área de transferência. Essa
// asserção vale nos dois caminhos do SCN-WIZ-012 — com a CLI detectada (prompt copiado
// e pronto no terminal) e sem ela (prompt copiado + orientação de instalação) —, porque
// a cópia acontece ANTES da detecção. O clique do webview em si não é dirigível por
// @vscode/test-electron; aqui exercitamos a borda que ele aciona.
//
// O que NÃO se observa daqui: que o prompt não foi enviado. `Terminal.sendText` não é
// inspecionável pela API; a garantia é o `sendText(prompt, false)` de `hybridStep.ts`
// (sem newline) — verificado por leitura e pelo roteiro manual do HANDOFF.
import * as assert from 'assert'
import * as os from 'os'
import * as path from 'path'
import * as vscode from 'vscode'
import { launchClaudeAction } from '../sdd/hybridStep'
import { stageAction } from '../sdd/wizardActions'

suite('E2E: ação de IA do wizard', () => {
  test('TEST-WIZ-011 — a ação da etapa copia /sdd-kit:<ação> <id> (SCN-WIZ-004/012)', async () => {
    const root = vscode.Uri.file(path.join(os.tmpdir(), `sdd-e2e-ai-${Date.now()}`))
    const before = await vscode.env.clipboard.readText()

    try {
      const action = stageAction('spec')
      assert.ok(action, 'a etapa Especificar deve ter ação de IA')

      await launchClaudeAction(root, '0035-wizard-cockpit', action)

      assert.strictEqual(
        await vscode.env.clipboard.readText(),
        '/sdd-kit:spec 0035-wizard-cockpit',
      )
    } finally {
      await vscode.env.clipboard.writeText(before)
    }
  })

  test('TEST-WIZ-011 — cada etapa com IA compõe o prompt do seu próprio skill', async () => {
    const before = await vscode.env.clipboard.readText()
    const root = vscode.Uri.file(path.join(os.tmpdir(), `sdd-e2e-ai-${Date.now()}-b`))

    try {
      for (const stage of ['clarify', 'design', 'tasks', 'verify'] as const) {
        const action = stageAction(stage)
        assert.ok(action, `a etapa ${stage} deve ter ação de IA`)
        await launchClaudeAction(root, '0001-x', action)
        assert.strictEqual(await vscode.env.clipboard.readText(), `/sdd-kit:${action} 0001-x`)
      }
    } finally {
      await vscode.env.clipboard.writeText(before)
    }
  })
})
