// Sidebar como WebviewView (feature 0036, TASK-COCK-016, ADR-036). Substitui a
// `FeaturesTreeProvider`, que não podia seguir o mockup 01 porque a `TreeView` não aceita
// CSS.
//
// Duas decisões de implementação que valem ser ditas, porque reduzem muito o risco que o
// ADR-036 assumiu:
//
// 1. **Os comandos não são tocados.** `featureChangeOf` aceita qualquer objeto com
//    `kind: 'feature'` e um `change`, então a borda monta esse nó e chama o MESMO comando
//    de sempre. As 18 ações continuam sendo o código que já era exercitado.
//
// 2. **O menu de 18 ações não é reimplementado no webview.** O cliente só avisa "mais ações
//    para este item"; quem apresenta é um QuickPick NATIVO, construído a partir do próprio
//    `package.json`. Assim a lista não pode divergir do manifesto, e navegação por teclado,
//    busca e leitor de tela continuam sendo da plataforma — exatamente o que se perderia
//    desenhando um menu à mão (SCN-COCK-008, NFR-COCK-004).
import * as vscode from 'vscode'
import { randomBytes } from 'node:crypto'
import { parseChanges, parseTaskProgress, type ChangeEntry } from '../sdd/specsIndex'
import {
  buildSidebarState,
  rehydrate,
  select,
  type SidebarState,
} from '../sdd/sidebarModel'
import { renderSidebarHtml } from '../sdd/sidebarHtml'

const EXTENSION_ID = 'idosreisjunior.sdd-claude-kit-vscode'
const ACTIONS_SUBMENU = 'sddClaudeKit.featureActions'

export class SidebarViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'sddFeatures'

  private view?: vscode.WebviewView
  private state: SidebarState = { mode: 'list', items: [] }

  constructor(private readonly extensionUri: vscode.Uri) {}

  resolveWebviewView(view: vscode.WebviewView): void {
    this.view = view
    view.webview.options = {
      enableScripts: true,
      localResourceRoots: [vscode.Uri.joinPath(this.extensionUri, 'out', 'webview')],
    }
    view.webview.onDidReceiveMessage((message) => {
      void this.onMessage(message)
    })
    void this.refresh()
  }

  /** Relê o disco e reprojeta, preservando foco e seleção que sobreviverem. */
  async refresh(): Promise<void> {
    if (!this.view) {
      return
    }
    const root = vscode.workspace.workspaceFolders?.[0]?.uri
    const fresh = root ? await this.readState(root) : { mode: 'welcome' as const, items: [] }
    this.state = rehydrate(this.state, fresh)
    this.render()
  }

  private render(): void {
    if (!this.view) {
      return
    }
    const scriptUri = this.view.webview
      .asWebviewUri(vscode.Uri.joinPath(this.extensionUri, 'out', 'webview', 'sidebar.js'))
      .toString()
    this.view.webview.html = renderSidebarHtml(this.state, nonce(), scriptUri)
  }

  /** Lê `index.yaml` e o progresso de cada mudança. Ausência vira boas-vindas. */
  private async readState(root: vscode.Uri): Promise<SidebarState> {
    const indexText = await readText(vscode.Uri.joinPath(root, '.specs', 'index.yaml'))
    if (indexText === undefined) {
      return { mode: 'welcome', items: [] }
    }
    const changes = parseChanges(indexText)
    const progress = new Map<string, { done: number; total: number }>()
    await Promise.all(
      changes.map(async (change) => {
        if (!change.path) {
          return
        }
        const status = await readText(
          vscode.Uri.joinPath(root, '.specs', ...change.path.split('/'), 'status.yaml'),
        )
        const parsed = status ? parseTaskProgress(status) : undefined
        if (parsed) {
          progress.set(change.id, { done: parsed.done, total: parsed.total })
        }
      }),
    )
    return buildSidebarState(changes, true, progress)
  }

  private async onMessage(message: unknown): Promise<void> {
    if (!isRecord(message)) {
      return
    }
    switch (message['type']) {
      case 'select': {
        const key = message['key']
        if (typeof key === 'string') {
          this.state = select(this.state, key)
          this.render()
        }
        return
      }
      case 'invoke':
        await this.invoke(message['id'], message['command'])
        return
      case 'menu':
        await this.showActions(message['id'])
        return
      case 'init':
        await vscode.commands.executeCommand('sddClaudeKit.initProject')
        return
    }
  }

  /** Nó compatível com `featureChangeOf`, para chamar os comandos existentes sem alterá-los. */
  private nodeFor(id: unknown): { kind: 'feature'; change: ChangeEntry } | undefined {
    if (typeof id !== 'string') {
      return undefined
    }
    const item = this.state.items.find((i) => i.kind === 'change' && i.key === id)
    return item?.change ? { kind: 'feature', change: item.change } : undefined
  }

  /**
   * Executa um comando sobre um item. O comando vem do webview, então é validado contra o
   * conjunto declarado no manifesto — o cliente não escolhe qualquer comando da extensão.
   */
  private async invoke(id: unknown, command: unknown): Promise<void> {
    const node = this.nodeFor(id)
    if (!node || typeof command !== 'string' || !declaredItemCommands().includes(command)) {
      return
    }
    await vscode.commands.executeCommand(command, node)
  }

  /**
   * Apresenta as ações do item num QuickPick nativo, montado a partir do `package.json`.
   * Ler do manifesto em vez de manter uma lista aqui é o que impede a sidebar de divergir
   * do que a extensão realmente oferece.
   */
  private async showActions(id: unknown): Promise<void> {
    const node = this.nodeFor(id)
    if (!node) {
      return
    }
    const actions = submenuActions()
    if (actions.length === 0) {
      return
    }
    const pick = await vscode.window.showQuickPick(
      actions.map((a) => ({ label: a.title, description: a.command, command: a.command })),
      { title: `SDD — ${node.change.id}`, placeHolder: 'Ação para esta mudança' },
    )
    if (pick) {
      await vscode.commands.executeCommand(pick.command, node)
    }
  }
}

/** Uma ação apresentável: comando e rótulo já resolvidos. */
interface ItemAction {
  command: string
  title: string
}

/** Contribuições do manifesto da própria extensão. Vazio se algo não estiver como esperado. */
function contributes(): Record<string, unknown> | undefined {
  const pkg = vscode.extensions.getExtension(EXTENSION_ID)?.packageJSON as
    | { contributes?: Record<string, unknown> }
    | undefined
  return pkg?.contributes
}

/** Ações do submenu de feature, com o título vindo de `contributes.commands`. */
export function submenuActions(): ItemAction[] {
  const c = contributes()
  const menus = c?.['menus'] as Record<string, Array<{ command?: string }>> | undefined
  const commands = (c?.['commands'] as Array<{ command?: string; title?: string }>) ?? []
  const titles = new Map<string, string>()
  for (const cmd of commands) {
    if (cmd.command) {
      titles.set(cmd.command, cmd.title ?? cmd.command)
    }
  }
  const out: ItemAction[] = []
  for (const entry of menus?.[ACTIONS_SUBMENU] ?? []) {
    if (typeof entry.command === 'string') {
      out.push({ command: entry.command, title: titles.get(entry.command) ?? entry.command })
    }
  }
  return out
}

/** Comandos que o webview pode acionar: os do submenu mais os dois de ação direta. */
function declaredItemCommands(): string[] {
  return [
    'sddClaudeKit.openDashboard',
    'sddClaudeKit.editSpec',
    ...submenuActions().map((a) => a.command),
  ]
}

async function readText(uri: vscode.Uri): Promise<string | undefined> {
  try {
    return Buffer.from(await vscode.workspace.fs.readFile(uri)).toString('utf8')
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
