import * as vscode from 'vscode'
import { randomBytes } from 'node:crypto'
import {
  buildOverview,
  PROJECT_DOCS,
  type DoctorHealth,
} from '../sdd/projectOverview'
import { renderNotInitializedHtml, renderProjectOverviewHtml } from '../sdd/projectOverviewHtml'
import { parseChanges } from '../sdd/specsIndex'
import type { Usage } from '../sdd/contextGuardian'

/**
 * Painel Projeto como WebviewView (feature 0013, ADR-010). Substitui o antigo
 * TreeDataProvider: projeta um resumo vivo (saúde do Doctor, contexto, contadores,
 * documentos) montado pelo núcleo puro `buildOverview` e renderizado por
 * `renderProjectOverviewHtml`. A borda apenas lê o disco e injeta o último estado
 * já mantido em memória (contexto e Doctor) — não recalcula nada ao abrir
 * (NFR-PROJ-003). Somente leitura (NFR-PROJ-001): as ações são command: URIs.
 */
export class ProjectViewProvider implements vscode.WebviewViewProvider {
  static readonly viewType = 'sddProject'
  private view?: vscode.WebviewView

  constructor(
    private readonly deps: {
      getContext: () => Usage | undefined
      getDoctor: () => DoctorHealth | undefined
    },
  ) {}

  resolveWebviewView(view: vscode.WebviewView): void {
    this.view = view
    // Sem scripts; ações por command: URI (ADR-010, NFR-PROJ-004). localResourceRoots
    // vazio e sem rede — CSP com nonce vem do HTML.
    view.webview.options = {
      enableScripts: false,
      enableCommandUris: true,
      localResourceRoots: [],
    }
    view.onDidDispose(() => {
      if (this.view === view) {
        this.view = undefined
      }
    })
    void this.render()
  }

  /** Reprojeta o painel com o estado atual. Chamado pelo refresh da extensão. */
  async refresh(): Promise<void> {
    if (this.view) {
      await this.render()
    }
  }

  private async render(): Promise<void> {
    if (this.view) {
      this.view.webview.html = await this.html()
    }
  }

  private async html(): Promise<string> {
    const root = vscode.workspace.workspaceFolders?.[0]?.uri
    if (!root || !(await exists(vscode.Uri.joinPath(root, '.specs', 'config.yaml')))) {
      return renderNotInitializedHtml(nonce())
    }

    // Índice ausente/ilegível → changes undefined (estado "no-index"); presente mas
    // vazio/ inválido → parseChanges devolve [] (robusto, NFR-PROJ-002).
    const indexText = await readText(vscode.Uri.joinPath(root, '.specs', 'index.yaml'))
    const changes = indexText === undefined ? undefined : parseChanges(indexText)

    const docExists: Record<string, boolean> = {}
    for (const doc of PROJECT_DOCS) {
      docExists[doc.relPath] = await exists(vscode.Uri.joinPath(root, ...doc.relPath.split('/')))
    }

    const max = vscode.workspace
      .getConfiguration('sddClaudeKit')
      .get<number>('context.maxTokens', 200000)

    const overview = buildOverview({
      doctor: this.deps.getDoctor(),
      context: this.deps.getContext(),
      contextMax: max,
      changes,
      docExists,
    })
    return renderProjectOverviewHtml(overview, nonce())
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

async function readText(uri: vscode.Uri): Promise<string | undefined> {
  try {
    const bytes = await vscode.workspace.fs.readFile(uri)
    return Buffer.from(bytes).toString('utf8')
  } catch {
    return undefined
  }
}

function nonce(): string {
  return randomBytes(16).toString('base64').replace(/[^a-zA-Z0-9]/g, '')
}
