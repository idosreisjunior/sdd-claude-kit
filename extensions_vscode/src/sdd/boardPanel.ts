import * as vscode from 'vscode'
import { randomBytes } from 'node:crypto'
import { parseChanges, parseTaskProgress, type ChangeEntry, type TaskProgress } from './specsIndex'
import { buildChangesBoard, parseTaskBoard, type ChangesBoard } from './boardModel'
import { renderBoardHtml } from './boardHtml'

/**
 * Painel SDD (Kanban + Overview) — feature 0025, ADR-024. Um WebviewPanel único
 * (reutilizado ao reabrir). Diferente do dashboard, USA script (com nonce) para
 * render client-side e atualização ao vivo: o watcher de `.specs/*.yaml` chama
 * `refresh`, que reenvia o board por mensagem — sem recarregar o HTML.
 *
 * Somente leitura (incremento 1): clicar num cartão abre o dashboard; "Tarefas"
 * mostra o kanban de tarefas da mudança. Arrastar para transicionar é incremento 2.
 */
export class BoardPanel {
  private panel?: vscode.WebviewPanel
  private changes: ChangeEntry[] = []

  async open(): Promise<void> {
    const root = workspaceRoot()
    if (!root) {
      vscode.window.showWarningMessage('SDD: abra uma pasta para ver o painel.')
      return
    }
    if (this.panel) {
      this.panel.reveal()
      return
    }
    this.panel = vscode.window.createWebviewPanel(
      'sddBoard',
      'Painel SDD',
      vscode.ViewColumn.Active,
      { enableScripts: true, retainContextWhenHidden: true, localResourceRoots: [] },
    )
    this.panel.onDidDispose(() => {
      this.panel = undefined
    })
    this.panel.webview.onDidReceiveMessage((message) => {
      void this.onMessage(root, message)
    })
    const board = await this.buildBoard(root)
    this.panel.webview.html = renderBoardHtml(board, nonce())
  }

  /** Reenvia o board ao webview quando os `.specs` mudam (atualização ao vivo). */
  async refresh(): Promise<void> {
    const root = workspaceRoot()
    if (!this.panel || !root) {
      return
    }
    const board = await this.buildBoard(root)
    await this.panel.webview.postMessage({ type: 'board', board })
  }

  private async buildBoard(root: vscode.Uri): Promise<ChangesBoard> {
    const indexText = (await readText(vscode.Uri.joinPath(root, '.specs', 'index.yaml'))) ?? ''
    const changes = parseChanges(indexText)
    this.changes = changes
    const progress = new Map<string, TaskProgress | undefined>()
    await Promise.all(
      changes.map(async (change) => {
        if (!change.path) {
          return
        }
        const status = await readText(
          vscode.Uri.joinPath(root, '.specs', ...change.path.split('/'), 'status.yaml'),
        )
        progress.set(change.id, status ? parseTaskProgress(status) : undefined)
      }),
    )
    return buildChangesBoard(changes, progress)
  }

  private async onMessage(root: vscode.Uri, message: unknown): Promise<void> {
    if (!isRecord(message)) {
      return
    }
    const id = typeof message['id'] === 'string' ? message['id'] : undefined
    if (!id) {
      return
    }
    const change = this.changes.find((c) => c.id === id)
    if (!change) {
      return
    }

    if (message['type'] === 'open') {
      // Reusa o comando do dashboard com o nó sintético que os handlers resolvem.
      await vscode.commands.executeCommand('sddClaudeKit.openDashboard', {
        kind: 'feature',
        change,
      })
      return
    }

    if (message['type'] === 'tasks') {
      if (!change.path) {
        return
      }
      const tasksMd =
        (await readText(
          vscode.Uri.joinPath(root, '.specs', ...change.path.split('/'), 'tasks.md'),
        )) ?? ''
      const board = parseTaskBoard(tasksMd)
      const title = typeof message['title'] === 'string' ? message['title'] : change.title
      await this.panel?.webview.postMessage({ type: 'tasks', board, title })
    }
  }
}

function workspaceRoot(): vscode.Uri | undefined {
  return vscode.workspace.workspaceFolders?.[0]?.uri
}

async function readText(uri: vscode.Uri): Promise<string | undefined> {
  try {
    const bytes = await vscode.workspace.fs.readFile(uri)
    return Buffer.from(bytes).toString('utf8')
  } catch {
    return undefined
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function nonce(): string {
  return randomBytes(16).toString('base64').replace(/[^a-zA-Z0-9]/g, '')
}
