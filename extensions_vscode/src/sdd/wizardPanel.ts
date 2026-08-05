import * as vscode from 'vscode'
import { randomBytes } from 'node:crypto'
import { parseChanges, type ChangeEntry } from './specsIndex'
import { featureChangeOf } from '../views/featuresTreeProvider'
import { buildChangeArtifacts } from './wizardArtifacts'
import { buildWizardDetails, type WizardDetails } from './wizardContent'
import { deriveWizardState, type ChangeArtifacts, type WizardState } from './wizardModel'
import { canAdvance, advanceTargetStatus, type AdvanceResult } from './wizardStepGuards'
import { canTransition } from './stateMachine'
import { applyTransition } from './boardPanel'
import { renderWizardHtml } from './wizardHtml'
import { isStageAction } from './wizardActions'
import { launchClaudeAction } from './hybridStep'

/**
 * Assistente SDD (Wizard Cockpit) — feature 0035, ADR-033. Um WebviewPanel interativo
 * (script + nonce, como o Board) que projeta o estado das 8 etapas de UMA mudança a
 * partir do disco (status.yaml é a fonte da verdade) e carrega o cliente Preact
 * empacotado (out/webview/wizard.js). Reidrata ao vivo quando os `.specs` mudam.
 *
 * Incremento atual (TASK-WIZ-006/007/010): abre, projeta, reidrata, executa a transição de
 * etapa (avançar) validada pelas guardas + stateMachine gravando via applyTransition, e
 * delega a ação de IA da etapa ao Claude Code pelo `hybridStep`. As views de conteúdo de
 * cada etapa chegam na TASK-WIZ-011.
 */
export class WizardPanel {
  private panel?: vscode.WebviewPanel
  private current?: ChangeEntry

  constructor(private readonly extensionUri: vscode.Uri) {}

  /** Abre o assistente para a mudança do nó (dashboard/árvore) ou escolhida no QuickPick. */
  async open(node?: unknown): Promise<void> {
    const root = workspaceRoot()
    if (!root) {
      vscode.window.showWarningMessage('SDD: abra uma pasta para usar o assistente.')
      return
    }
    const change = await this.resolveChange(root, node)
    if (!change) {
      return
    }
    this.current = change

    if (this.panel) {
      this.panel.reveal()
    } else {
      this.panel = vscode.window.createWebviewPanel(
        'sddWizard',
        'Assistente SDD',
        vscode.ViewColumn.Active,
        {
          enableScripts: true,
          retainContextWhenHidden: true,
          localResourceRoots: [vscode.Uri.joinPath(this.extensionUri, 'out', 'webview')],
        },
      )
      this.panel.onDidDispose(() => {
        this.panel = undefined
        this.current = undefined
      })
      this.panel.webview.onDidReceiveMessage((message) => {
        void this.onMessage(root, message)
      })
    }
    await this.render(root)
  }

  /** Reprojeta a mudança atual a partir do disco (SCN-WIZ-008), chamado pelo refresh. */
  async refresh(): Promise<void> {
    const root = workspaceRoot()
    if (!this.panel || !root || !this.current) {
      return
    }
    const indexText = (await readText(vscode.Uri.joinPath(root, '.specs', 'index.yaml'))) ?? ''
    const fresh = parseChanges(indexText).find((c) => c.id === this.current?.id)
    if (fresh) {
      this.current = fresh
    }
    await this.render(root)
  }

  /** Projeta o estado + o portão de avanço + o conteúdo da mudança atual, do disco. */
  private async project(root: vscode.Uri, change: ChangeEntry): Promise<{
    state: WizardState
    advance: AdvanceResult
    artifacts: ChangeArtifacts
    details: WizardDetails
  }> {
    const { artifacts, details } = await this.readArtifacts(root, change)
    const state = deriveWizardState(
      { id: change.id, title: change.title, type: change.type },
      artifacts,
    )
    return { state, advance: canAdvance(state.currentStage, artifacts), artifacts, details }
  }

  private async render(root: vscode.Uri): Promise<void> {
    if (!this.panel || !this.current) {
      return
    }
    const { state, advance, artifacts, details } = await this.project(root, this.current)
    const scriptUri = this.panel.webview
      .asWebviewUri(vscode.Uri.joinPath(this.extensionUri, 'out', 'webview', 'wizard.js'))
      .toString()
    this.panel.webview.html = renderWizardHtml({
      state,
      advance,
      details,
      hasDesign: artifacts.hasDesign,
      nonce: nonce(),
      scriptUri,
    })
    this.panel.title = `Assistente SDD — ${this.current.id}`
  }

  /** Trata as mensagens do webview: `advance` (transição de etapa) e `ai` (Claude Code). */
  private async onMessage(root: vscode.Uri, message: unknown): Promise<void> {
    if (!isRecord(message) || !this.current || !this.current.path) {
      return
    }
    if (message['type'] === 'ai') {
      await this.onAiAction(root, this.current, message['action'])
      return
    }
    if (message['type'] !== 'advance') {
      return
    }
    const change = this.current
    const { state, advance, artifacts } = await this.project(root, change)

    if (!advance.ok) {
      vscode.window.showWarningMessage(`SDD: ${advance.reasons.join(' ')}`)
      return
    }
    const target = advanceTargetStatus(state.currentStage)
    if (!target || !canTransition(artifacts.sddStatus, target)) {
      vscode.window.showInformationMessage(
        'SDD: conclua o trabalho desta etapa antes de avançar.',
      )
      return
    }
    const reason = await vscode.window.showInputBox({
      prompt: `Motivo da transição ${artifacts.sddStatus} → ${target} (${change.id})`,
      placeHolder: 'Por que esta mudança de estado?',
      validateInput: (value) => (value.trim() ? undefined : 'Informe um motivo (obrigatório).'),
    })
    if (!reason || !reason.trim()) {
      return
    }
    const result = await applyTransition(root, change.id, change.path, target, reason)
    if (result !== 'ok') {
      vscode.window.showErrorMessage(
        `SDD: falha ao gravar a transição de ${change.id}; nada foi alterado.`,
      )
      return
    }
    vscode.window.showInformationMessage(`SDD: ${change.id} → ${target}.`)
    await this.refresh()
  }

  /**
   * Ação de IA da etapa (REQ-WIZ-003): abre o Claude Code com `/sdd-kit:<ação> <id>`
   * PRONTO — sem enviar (SCN-WIZ-004); sem a CLI, o prompt é copiado com a orientação
   * de instalação (SCN-WIZ-012). A ação vinda do webview é validada contra a etapa
   * ATUAL projetada do disco: o cliente não escolhe qual comando a borda executa.
   */
  private async onAiAction(
    root: vscode.Uri,
    change: ChangeEntry,
    action: unknown,
  ): Promise<void> {
    const { state } = await this.project(root, change)
    if (!isStageAction(state.currentStage, action)) {
      return
    }
    await launchClaudeAction(root, change.id, action)
  }

  /**
   * Lê os artefatos da mudança do disco (robusto) e monta os dois retratos puros: o do
   * ESTADO (wizardModel/guardas) e o do CONTEÚDO das views (wizardContent). Uma leitura
   * só, dois consumidores — a leitura nunca lança (SCN-WIZ-007).
   */
  private async readArtifacts(
    root: vscode.Uri,
    change: ChangeEntry,
  ): Promise<{ artifacts: ChangeArtifacts; details: WizardDetails }> {
    if (!change.path) {
      return {
        artifacts: buildChangeArtifacts({ hasRequest: false, hasDesign: false, adrCount: 0 }),
        details: buildWizardDetails({}),
      }
    }
    const base = ['.specs', ...change.path.split('/')]
    const [statusYaml, specMd, tasksMd, hasRequest, hasDesign, adrFiles] = await Promise.all([
      readText(vscode.Uri.joinPath(root, ...base, 'status.yaml')),
      readText(vscode.Uri.joinPath(root, ...base, 'spec.md')),
      readText(vscode.Uri.joinPath(root, ...base, 'tasks.md')),
      exists(vscode.Uri.joinPath(root, ...base, 'request.md')),
      exists(vscode.Uri.joinPath(root, ...base, 'design.md')),
      listAdrs(vscode.Uri.joinPath(root, ...base, 'decisions')),
    ])
    return {
      artifacts: buildChangeArtifacts({
        statusYaml,
        specMd,
        hasRequest,
        hasDesign,
        adrCount: adrFiles.length,
      }),
      details: buildWizardDetails({ specMd, statusYaml, tasksMd, adrFiles }),
    }
  }

  private async resolveChange(root: vscode.Uri, node: unknown): Promise<ChangeEntry | undefined> {
    const fromNode = featureChangeOf(node)
    if (fromNode) {
      return fromNode
    }
    const indexText = (await readText(vscode.Uri.joinPath(root, '.specs', 'index.yaml'))) ?? ''
    const changes = parseChanges(indexText)
    if (changes.length === 0) {
      vscode.window.showInformationMessage(
        'SDD: nenhuma mudança ainda. Crie uma com "SDD: Nova feature".',
      )
      return undefined
    }
    const pick = await vscode.window.showQuickPick(
      changes.map((c) => ({
        label: c.id,
        description: `${c.type} · ${c.status}`,
        detail: c.title,
        change: c,
      })),
      { placeHolder: 'Abrir qual mudança no assistente?' },
    )
    return pick?.change
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

async function exists(uri: vscode.Uri): Promise<boolean> {
  try {
    await vscode.workspace.fs.stat(uri)
    return true
  } catch {
    return false
  }
}

/** Nomes dos arquivos `ADR-*.md` no diretório de decisões (vazio se ausente). */
async function listAdrs(dir: vscode.Uri): Promise<string[]> {
  try {
    const entries = await vscode.workspace.fs.readDirectory(dir)
    return entries
      .filter(([name, type]) => type === vscode.FileType.File && /^ADR-.*\.md$/i.test(name))
      .map(([name]) => name)
  } catch {
    return []
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function nonce(): string {
  return randomBytes(16).toString('base64').replace(/[^a-zA-Z0-9]/g, '')
}
