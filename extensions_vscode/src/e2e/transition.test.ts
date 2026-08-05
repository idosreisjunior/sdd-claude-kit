// Teste de integração (E2E) — feature 0032. Cobre o EFEITO do arrastar-para-
// transicionar (0026): a aplicação da transição no disco, num VS Code real. O
// gesto de DOM em si não é dirigível por @vscode/test-electron; aqui exercitamos
// applyTransition (a escrita all-or-nothing) contra um workspace temporário.
import * as assert from 'assert'
import * as os from 'os'
import * as path from 'path'
import * as vscode from 'vscode'
import { load } from 'js-yaml'
import { applyTransition } from '../sdd/boardPanel'

const STATUS_YAML =
  'version: 1\n' +
  'id: "0001-x"\n' +
  'type: "feature"\n' +
  'title: "X"\n' +
  '# comentário preservado\n' +
  'status: IN_PROGRESS\n' +
  'created: "2026-08-04"\n' +
  'updated: "2026-08-04"\n' +
  'history:\n' +
  '  - status: DRAFT\n    date: "2026-08-04"\n    reason: >-\n      Criada.\n' +
  '  - status: IN_PROGRESS\n    date: "2026-08-04"\n    reason: >-\n      Em curso.\n' +
  'approval: null\n'

const INDEX_YAML =
  'version: 1\n' +
  'next_id: 2\n' +
  'changes:\n' +
  '  - id: 0001-x\n    type: feature\n    title: X\n    status: IN_PROGRESS\n    path: features/0001-x\n' +
  'archive: []\n'

function enc(text: string): Uint8Array {
  return Buffer.from(text, 'utf8')
}

async function readUtf8(uri: vscode.Uri): Promise<string> {
  return Buffer.from(await vscode.workspace.fs.readFile(uri)).toString('utf8')
}

suite('E2E: transição do painel (efeito do arrastar)', () => {
  test('SCN-TRANS-001 — applyTransition escreve a transição no host real (TEST-TRANS-001)', async () => {
    const root = vscode.Uri.file(path.join(os.tmpdir(), `sdd-e2e-${Date.now()}`))
    const changeDir = vscode.Uri.joinPath(root, '.specs', 'features', '0001-x')
    await vscode.workspace.fs.createDirectory(changeDir)
    await vscode.workspace.fs.writeFile(vscode.Uri.joinPath(changeDir, 'status.yaml'), enc(STATUS_YAML))
    await vscode.workspace.fs.writeFile(vscode.Uri.joinPath(root, '.specs', 'index.yaml'), enc(INDEX_YAML))

    try {
      const result = await applyTransition(root, '0001-x', 'features/0001-x', 'VERIFIED', 'transição E2E')
      assert.strictEqual(result, 'ok')

      const statusDoc = load(await readUtf8(vscode.Uri.joinPath(changeDir, 'status.yaml'))) as {
        status: string
        history: Array<{ status: string; reason: string }>
      }
      assert.strictEqual(statusDoc.status, 'VERIFIED')
      const last = statusDoc.history[statusDoc.history.length - 1]
      assert.strictEqual(last.status, 'VERIFIED')
      assert.strictEqual(last.reason, 'transição E2E')
      // comentário preservado (escrita não destrutiva)
      const statusText = await readUtf8(vscode.Uri.joinPath(changeDir, 'status.yaml'))
      assert.ok(statusText.includes('# comentário preservado'))

      const indexDoc = load(await readUtf8(vscode.Uri.joinPath(root, '.specs', 'index.yaml'))) as {
        changes: Array<{ id: string; status: string }>
      }
      assert.strictEqual(indexDoc.changes.find((c) => c.id === '0001-x')?.status, 'VERIFIED')
    } finally {
      await vscode.workspace.fs.delete(root, { recursive: true, useTrash: false })
    }
  })

  test('SCN-TRANS-002 — sem os arquivos, applyTransition não altera nada (TEST-TRANS-002)', async () => {
    const root = vscode.Uri.file(path.join(os.tmpdir(), `sdd-e2e-missing-${Date.now()}`))
    const result = await applyTransition(root, '0001-x', 'features/0001-x', 'VERIFIED', 'x')
    assert.strictEqual(result, 'missing')
  })
})
