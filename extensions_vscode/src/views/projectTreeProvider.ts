import * as vscode from 'vscode'

/**
 * Árvore da seção "Projeto" da Activity Bar (PRD §13.1).
 *
 * Fundação: expõe os documentos de projeto de .specs/project. O conteúdo rico
 * (edição visual, dashboard) é escopo de features posteriores — ver o backlog
 * em .specs/index.yaml.
 */
export class ProjectTreeProvider implements vscode.TreeDataProvider<ProjectNode> {
  private readonly _onDidChangeTreeData = new vscode.EventEmitter<void>()
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event

  refresh(): void {
    this._onDidChangeTreeData.fire()
  }

  getTreeItem(node: ProjectNode): vscode.TreeItem {
    const item = new vscode.TreeItem(node.label, vscode.TreeItemCollapsibleState.None)
    item.iconPath = new vscode.ThemeIcon(node.icon)
    if (node.relativePath) {
      item.command = {
        command: 'vscode.open',
        title: 'Abrir',
        arguments: [vscode.Uri.joinPath(node.root, node.relativePath)],
      }
    }
    return item
  }

  getChildren(): ProjectNode[] {
    const root = vscode.workspace.workspaceFolders?.[0]?.uri
    if (!root) {
      return []
    }
    return [
      { label: 'Visão geral', icon: 'book', root, relativePath: '.specs/project/vision.md' },
      { label: 'Constituição', icon: 'law', root, relativePath: '.specs/project/constitution.md' },
      { label: 'Arquitetura', icon: 'type-hierarchy', root, relativePath: '.specs/project/architecture.md' },
      { label: 'Padrões', icon: 'checklist', root, relativePath: '.specs/project/standards.md' },
      { label: 'Configurações', icon: 'settings-gear', root, relativePath: '.specs/config.yaml' },
    ]
  }
}

interface ProjectNode {
  label: string
  icon: string
  root: vscode.Uri
  relativePath?: string
}
