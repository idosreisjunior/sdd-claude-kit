import * as vscode from 'vscode'
import { randomBytes } from 'node:crypto'
import {
  groupFor,
  parseChanges,
  parseTaskProgress,
  type ChangeEntry,
  type TaskProgress,
} from './specsIndex'
import {
  buildChangesBoard,
  buildActivityFeed,
  parseTaskBoard,
  type ChangesBoard,
  type FeedItem,
  type FeedSource,
} from './boardModel'
import { renderBoardHtml } from './boardHtml'
import { candidateTargets, type SddState } from './stateMachine'
import { appendHistoryAndSetStatus, setIndexStatus } from './statusWriter'

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
    const { board, feed } = await this.buildBoardAndFeed(root)
    this.panel.webview.html = renderBoardHtml(board, nonce(), feed)
  }

  /** Reenvia o board e o feed ao webview quando os `.specs` mudam (ao vivo). */
  async refresh(): Promise<void> {
    const root = workspaceRoot()
    if (!this.panel || !root) {
      return
    }
    const { board, feed } = await this.buildBoardAndFeed(root)
    await this.panel.webview.postMessage({ type: 'board', board, feed })
  }

  private async buildBoardAndFeed(
    root: vscode.Uri,
  ): Promise<{ board: ChangesBoard; feed: FeedItem[] }> {
    const indexText = (await readText(vscode.Uri.joinPath(root, '.specs', 'index.yaml'))) ?? ''
    const changes = parseChanges(indexText)
    this.changes = changes

    // Lê os status.yaml em paralelo, mas monta na ordem do índice (determinístico).
    const statusById = new Map<string, string>()
    await Promise.all(
      changes.map(async (change) => {
        if (!change.path) {
          return
        }
        const text = await readText(
          vscode.Uri.joinPath(root, '.specs', ...change.path.split('/'), 'status.yaml'),
        )
        if (text !== undefined) {
          statusById.set(change.id, text)
        }
      }),
    )

    const progress = new Map<string, TaskProgress | undefined>()
    const feedSources: FeedSource[] = []
    for (const change of changes) {
      const text = statusById.get(change.id)
      progress.set(change.id, text ? parseTaskProgress(text) : undefined)
      if (text) {
        feedSources.push({ id: change.id, title: change.title, statusYaml: text })
      }
    }
    // Teto alto: o feed é paginado no cliente (feature 0031).
    return { board: buildChangesBoard(changes, progress), feed: buildActivityFeed(feedSources, 500) }
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
      return
    }

    if (message['type'] === 'move') {
      const toLabel = typeof message['toLabel'] === 'string' ? message['toLabel'] : undefined
      if (!toLabel || !change.path) {
        return
      }
      await this.moveChange(root, change.id, change.path, change.status, toLabel)
    }
  }

  /**
   * Transição de estado por arrastar (incremento 2, ADR-025). Resolve os estados
   * candidatos da coluna alvo alcançáveis do estado atual; escolhe (QuickPick se
   * ambíguo); exige um motivo; e escreve status.yaml (history + status) e o
   * index.yaml. O watcher reflete a mudança no board.
   */
  private async moveChange(
    root: vscode.Uri,
    id: string,
    path: string,
    from: string,
    toLabel: string,
  ): Promise<void> {
    if (groupFor(from) === toLabel) {
      return // solto na mesma coluna do estado atual: sem transição
    }
    const candidates = candidateTargets(from, toLabel)
    if (candidates.length === 0) {
      vscode.window.showWarningMessage(
        `SDD: transição inválida — de ${from} não se alcança a coluna "${toLabel}".`,
      )
      return
    }
    let target: SddState = candidates[0]
    if (candidates.length > 1) {
      const pick = await vscode.window.showQuickPick([...candidates], {
        placeHolder: `Novo estado de ${id} (atual: ${from})`,
      })
      if (!pick) {
        return
      }
      target = pick as SddState
    }

    const reason = await vscode.window.showInputBox({
      prompt: `Motivo da transição ${from} → ${target} (${id})`,
      placeHolder: 'Por que esta mudança de estado?',
      validateInput: (value) => (value.trim() ? undefined : 'Informe um motivo (obrigatório).'),
    })
    if (!reason || !reason.trim()) {
      return
    }

    const result = await applyTransition(root, id, path, target, reason)
    if (result === 'missing') {
      vscode.window.showErrorMessage(
        `SDD: status.yaml ou index.yaml de ${id} não encontrado; nada foi alterado.`,
      )
      return
    }
    if (result === 'index-failed') {
      vscode.window.showErrorMessage(
        `SDD: falha ao atualizar index.yaml; status.yaml de ${id} restaurado.`,
      )
      return
    }
    vscode.window.showInformationMessage(`SDD: ${id} → ${target}.`)
    await this.refresh() // além do watcher, atualiza já
  }
}

/**
 * Aplica uma transição de estado no disco — a "escrita" do arrastar (feature 0026),
 * extraída e exportada para o teste E2E (feature 0032). Exige `status.yaml` e
 * `index.yaml`; escrita all-or-nothing: se a do índice falhar, restaura o
 * `status.yaml`. Não mostra diálogos (a resolução do alvo/motivo fica na borda).
 */
export async function applyTransition(
  root: vscode.Uri,
  id: string,
  path: string,
  target: string,
  reason: string,
): Promise<'ok' | 'missing' | 'index-failed'> {
  const statusUri = vscode.Uri.joinPath(root, '.specs', ...path.split('/'), 'status.yaml')
  const indexUri = vscode.Uri.joinPath(root, '.specs', 'index.yaml')
  const statusText = await readText(statusUri)
  const indexText = await readText(indexUri)
  if (statusText === undefined || indexText === undefined) {
    return 'missing'
  }
  const date = new Date().toISOString().slice(0, 10)
  await writeText(statusUri, appendHistoryAndSetStatus(statusText, { status: target, date, reason }))
  try {
    await writeText(indexUri, setIndexStatus(indexText, id, target))
  } catch {
    await writeText(statusUri, statusText) // restaura
    return 'index-failed'
  }
  return 'ok'
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

async function writeText(uri: vscode.Uri, content: string): Promise<void> {
  await vscode.workspace.fs.writeFile(uri, Buffer.from(content, 'utf8'))
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function nonce(): string {
  return randomBytes(16).toString('base64').replace(/[^a-zA-Z0-9]/g, '')
}
