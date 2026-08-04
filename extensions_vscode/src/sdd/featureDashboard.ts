import * as vscode from 'vscode'
import { randomBytes } from 'node:crypto'
import { buildDashboardModel, type DashboardSources } from './dashboardModel'
import { renderDashboardHtml, FEATURE_ACTION_COMMANDS } from './dashboardHtml'
import type { ChangeEntry } from './specsIndex'

/**
 * Dashboard da feature (RF-005, TASK-UI-004). Um WebviewPanel por mudança,
 * reutilizado por `id` (reabrir a mesma feature revela o painel existente). A
 * lógica de modelo e render é pura (dashboardModel/dashboardHtml); aqui fica o IO
 * (`workspace.fs`) e o ciclo de vida do painel. Por ADR-005: webview seguro — sem
 * scripts, `localResourceRoots` vazio, CSP com nonce no HTML.
 */
export class FeatureDashboard {
  private readonly panels = new Map<string, vscode.WebviewPanel>()

  async open(root: vscode.Uri, change: ChangeEntry): Promise<void> {
    const existing = this.panels.get(change.id)
    if (existing) {
      existing.reveal()
      return
    }
    const panel = vscode.window.createWebviewPanel(
      'sddDashboard',
      change.title || change.id,
      vscode.ViewColumn.Active,
      // Sem scripts (ADR-005). enableCommandUris libera os `command:` URIs dos
      // botões de Ações (feature 0024, ADR-023), restrito à lista de comandos da
      // extensão — não a qualquer comando do VS Code.
      {
        enableScripts: false,
        enableCommandUris: [...FEATURE_ACTION_COMMANDS],
        localResourceRoots: [],
      },
    )
    this.panels.set(change.id, panel)
    panel.onDidDispose(() => this.panels.delete(change.id))
    panel.webview.html = await this.render(root, change)
  }

  private async render(root: vscode.Uri, change: ChangeEntry): Promise<string> {
    const sources = await readSources(root, change)
    const model = buildDashboardModel(sources)
    return renderDashboardHtml(model, nonce(), change)
  }
}

async function readSources(root: vscode.Uri, change: ChangeEntry): Promise<DashboardSources> {
  const dir = vscode.Uri.joinPath(root, '.specs', ...change.path.split('/'))
  return {
    indexEntry: { id: change.id, type: change.type, title: change.title, status: change.status },
    statusYaml: await readText(vscode.Uri.joinPath(dir, 'status.yaml')),
    traceabilityYaml: await readText(vscode.Uri.joinPath(dir, 'traceability.yaml')),
    specMd: await readText(vscode.Uri.joinPath(dir, 'spec.md')),
    hasEvidence: await exists(vscode.Uri.joinPath(dir, 'evidence.md')),
  }
}

async function readText(uri: vscode.Uri): Promise<string | undefined> {
  try {
    const bytes = await vscode.workspace.fs.readFile(uri)
    return Buffer.from(bytes).toString('utf8')
  } catch {
    return undefined
  }
}

async function exists(uri: vscode.Uri): Promise<boolean> {
  try {
    await vscode.workspace.fs.stat(uri)
    return true
  } catch {
    return false
  }
}

function nonce(): string {
  return randomBytes(16).toString('base64').replace(/[^a-zA-Z0-9]/g, '')
}
