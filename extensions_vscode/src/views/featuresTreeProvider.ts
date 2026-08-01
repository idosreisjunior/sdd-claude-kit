import * as vscode from 'vscode'
import {
  parseChanges,
  groupByStatus,
  parseTaskProgress,
  type ChangeEntry,
  type TaskProgress,
} from '../sdd/specsIndex'

/**
 * Árvore da seção "Features" da Activity Bar (PRD §13.1, RF-004).
 *
 * Lê `.specs/index.yaml`, agrupa as mudanças por status e lista cada uma; clicar
 * abre o `spec.md` da feature. A leitura é robusta: índice ausente ou inválido
 * mostra um nó informativo, nunca quebra o painel (NFR-FEAT-001).
 */
export class FeaturesTreeProvider implements vscode.TreeDataProvider<FeatureNode> {
  private readonly _onDidChangeTreeData = new vscode.EventEmitter<void>()
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event

  refresh(): void {
    this._onDidChangeTreeData.fire()
  }

  getTreeItem(node: FeatureNode): vscode.TreeItem {
    if (node.kind === 'info') {
      const item = new vscode.TreeItem(node.label, vscode.TreeItemCollapsibleState.None)
      item.iconPath = new vscode.ThemeIcon('info')
      return item
    }
    if (node.kind === 'group') {
      const item = new vscode.TreeItem(
        `${node.label} (${node.changes.length})`,
        vscode.TreeItemCollapsibleState.Expanded,
      )
      item.iconPath = new vscode.ThemeIcon('folder')
      item.contextValue = 'sddGroup'
      return item
    }
    const item = new vscode.TreeItem(node.change.title, vscode.TreeItemCollapsibleState.None)
    const progress = node.progress
      ? `${node.progress.done}/${node.progress.total}`
      : undefined
    item.description = progress ? `${node.change.id} · ${progress}` : node.change.id
    item.tooltip = progress
      ? `${node.change.id} · ${node.change.type} · ${node.change.status} · ${progress} tarefas`
      : `${node.change.id} · ${node.change.type} · ${node.change.status}`
    item.iconPath = new vscode.ThemeIcon('file-symlink-file')
    item.contextValue = 'sddFeature'
    // Clicar na feature abre o dashboard visual (RF-005), não o spec.md em texto:
    // é a visão que resume a mudança. O `spec.md` continua a um clique — pela ação
    // inline "Editar spec" (editor visual) ou abrindo o arquivo no explorador.
    item.command = {
      command: 'sddClaudeKit.openDashboard',
      title: 'Abrir dashboard',
      arguments: [node],
    }
    return item
  }

  async getChildren(node?: FeatureNode): Promise<FeatureNode[]> {
    const root = vscode.workspace.workspaceFolders?.[0]?.uri
    if (!root) {
      return [info('Nenhuma pasta aberta.')]
    }

    if (node?.kind === 'group') {
      return Promise.all(
        node.changes.map(async (change) => ({
          kind: 'feature' as const,
          change,
          progress: await this.readProgress(root, change),
        })),
      )
    }
    if (node) {
      return []
    }

    const text = await this.readIndex(root)
    if (text === undefined) {
      return [] // sem índice → o viewsWelcome "Inicializar SDD" assume (package.json)
    }
    const groups = groupByStatus(parseChanges(text))
    if (groups.length === 0) {
      return [] // sem mudanças → o viewsWelcome "Nova feature" assume (package.json)
    }
    return groups.map((group) => ({ kind: 'group', label: group.label, changes: group.changes }))
  }

  private async readIndex(root: vscode.Uri): Promise<string | undefined> {
    try {
      const bytes = await vscode.workspace.fs.readFile(
        vscode.Uri.joinPath(root, '.specs', 'index.yaml'),
      )
      return Buffer.from(bytes).toString('utf8')
    } catch {
      return undefined
    }
  }

  /**
   * Lê o `status.yaml` da mudança e extrai o progresso de tarefas (REQ-FEAT-005).
   * Ausência ou leitura falha resultam em `undefined` — o item apenas não exibe
   * progresso, sem quebrar o painel (NFR-FEAT-001).
   */
  private async readProgress(
    root: vscode.Uri,
    change: ChangeEntry,
  ): Promise<TaskProgress | undefined> {
    if (!change.path) {
      return undefined
    }
    try {
      const bytes = await vscode.workspace.fs.readFile(
        vscode.Uri.joinPath(root, '.specs', ...change.path.split('/'), 'status.yaml'),
      )
      return parseTaskProgress(Buffer.from(bytes).toString('utf8'))
    } catch {
      return undefined
    }
  }
}

type FeatureNode =
  | { kind: 'info'; label: string }
  | { kind: 'group'; label: string; changes: ChangeEntry[] }
  | { kind: 'feature'; change: ChangeEntry; progress?: TaskProgress }

function info(label: string): FeatureNode {
  return { kind: 'info', label }
}

/**
 * Extrai a mudança de um nó de feature, quando o nó vem do painel (ex.: o comando
 * "Abrir dashboard" no menu de contexto). Retorna `undefined` para grupos, nós
 * informativos ou quando o comando é acionado sem nó (paleta).
 */
export function featureChangeOf(node: unknown): ChangeEntry | undefined {
  if (node && typeof node === 'object' && (node as { kind?: unknown }).kind === 'feature') {
    return (node as { change: ChangeEntry }).change
  }
  return undefined
}
