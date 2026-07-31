import * as vscode from 'vscode'
import { detectProject } from './sdd/projectDetector'
import { isInitialized, planFiles, runInitialization } from './sdd/initializer'
import {
  DIR_FOR,
  dirNameFor,
  insertChangeEntry,
  isValidScope,
  isValidSlug,
  numericIdOf,
  reconcileNextId,
  sanitizeSlug,
  substituteChange,
  suggestScope,
  yamlDquote,
  type ChangeType,
  type ChangeVars,
} from './sdd/featureCreator'
import { FeatureDashboard } from './sdd/featureDashboard'
import { SpecEditorProvider } from './sdd/specEditor'
import { ProjectTreeProvider } from './views/projectTreeProvider'
import { FeaturesTreeProvider, featureChangeOf } from './views/featuresTreeProvider'

/**
 * Ponto de entrada da extensão (feature 0001-project-foundation).
 *
 * A fundação: ativa a extensão, diagnostica o workspace, registra a Activity
 * Bar (Projeto e Features), o indicador de contexto na status bar e os
 * comandos base. Comportamentos ricos (criação de feature, adapter do Claude
 * Code, Context Guardian…) são features próprias no backlog — ver
 * .specs/index.yaml.
 */
export async function activate(context: vscode.ExtensionContext): Promise<void> {
  const projectProvider = new ProjectTreeProvider()
  const featuresProvider = new FeaturesTreeProvider()
  const dashboard = new FeatureDashboard()

  context.subscriptions.push(
    vscode.window.registerTreeDataProvider('sddProject', projectProvider),
    vscode.window.registerTreeDataProvider('sddFeatures', featuresProvider),
    vscode.window.registerCustomEditorProvider(
      SpecEditorProvider.viewType,
      new SpecEditorProvider(),
      { webviewOptions: { retainContextWhenHidden: true } },
    ),
  )

  const contextIndicator = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    100,
  )
  context.subscriptions.push(contextIndicator)

  const refresh = async (): Promise<void> => {
    const detection = await detectProject()
    await vscode.commands.executeCommand(
      'setContext',
      'sddClaudeKit.initialized',
      detection.hasSpecs,
    )
    projectProvider.refresh()
    featuresProvider.refresh()
    updateContextIndicator(contextIndicator, detection.hasSpecs)
  }

  context.subscriptions.push(
    vscode.commands.registerCommand('sddClaudeKit.refresh', refresh),
    vscode.commands.registerCommand('sddClaudeKit.initProject', () => initProject(context, refresh)),
    vscode.commands.registerCommand('sddClaudeKit.newFeature', () => newFeature(context, refresh)),
    vscode.commands.registerCommand('sddClaudeKit.openDashboard', (node?: unknown) => openDashboard(dashboard, node)),
    vscode.commands.registerCommand('sddClaudeKit.editSpec', (node?: unknown) => editSpec(node)),
    vscode.commands.registerCommand('sddClaudeKit.openInClaudeCode', openInClaudeCode),
  )

  // Reage a mudanças nos YAML de .specs (config.yaml, index.yaml) sem reload:
  // atualiza o diagnóstico e a lista de features.
  const watcher = vscode.workspace.createFileSystemWatcher('**/.specs/*.yaml')
  context.subscriptions.push(
    watcher,
    watcher.onDidCreate(refresh),
    watcher.onDidChange(refresh),
    watcher.onDidDelete(refresh),
  )

  await refresh()
}

export function deactivate(): void {
  // Nada a liberar: tudo vive em context.subscriptions.
}

function updateContextIndicator(item: vscode.StatusBarItem, hasSpecs: boolean): void {
  if (!hasSpecs) {
    item.hide()
    return
  }
  const max = vscode.workspace
    .getConfiguration('sddClaudeKit')
    .get<number>('context.maxTokens', 200000)
  // TODO(0005-context-guardian): estimar o uso real. Por ora, só o teto.
  item.text = `$(dashboard) SDD Context: — / ${formatTokens(max)}`
  item.tooltip = 'Context Guardian — estimativa de contexto (feature 0005).'
  item.show()
}

function formatTokens(n: number): string {
  return n >= 1000 ? `${Math.round(n / 1000)}k` : String(n)
}

async function initProject(
  context: vscode.ExtensionContext,
  refresh: () => Promise<void>,
): Promise<void> {
  const root = vscode.workspace.workspaceFolders?.[0]?.uri
  if (!root) {
    vscode.window.showWarningMessage('SDD: abra uma pasta para inicializar o projeto.')
    return
  }

  // SCN-FOUND-005 — nunca sobrescreve um projeto já inicializado.
  if (await isInitialized(root)) {
    vscode.window.showInformationMessage(
      'SDD: este projeto já está inicializado (.specs/config.yaml existe). Nada foi alterado.',
    )
    return
  }

  // SCN-FOUND-004 — mostra a prévia dos arquivos e pede confirmação.
  const files = planFiles()
  const preview = files.map((f) => `  • ${f.relPath}  (${f.origin})`).join('\n')
  const choice = await vscode.window.showInformationMessage(
    `SDD: serão criados ${files.length} arquivos em .specs/. Nenhum arquivo existente será alterado.`,
    { modal: true, detail: preview },
    'Criar',
  )
  if (choice !== 'Criar') {
    return
  }

  const { created, skipped } = await runInitialization(context, root)
  await refresh()

  const parts = [`SDD inicializado: ${created.length} arquivos criados em .specs/.`]
  if (skipped.length > 0) {
    parts.push(`${skipped.length} preservados (já existiam).`)
  }
  parts.push('Revise os documentos de projeto — trazem seções a preencher.')
  vscode.window.showInformationMessage(parts.join(' '))
}

/**
 * Criação de mudança pelo formulário (RF-003, TASK-FEAT-006). Por ADR-004, é um
 * scaffolder determinístico: coleta tipo/título/slug/escopo, aloca o id
 * reconciliando com o disco, e escreve os arquivos por substituição de template.
 * O rascunho inteligente da spec é delegado a `/sdd-kit:spec` (Claude Code).
 */
async function newFeature(
  context: vscode.ExtensionContext,
  refresh: () => Promise<void>,
): Promise<void> {
  const root = vscode.workspace.workspaceFolders?.[0]?.uri
  if (!root) {
    vscode.window.showWarningMessage('SDD: abra uma pasta para criar uma feature.')
    return
  }
  if (!(await isInitialized(root))) {
    vscode.window.showWarningMessage('SDD: projeto não inicializado. Use "SDD: Inicializar projeto".')
    return
  }

  const type = await pickType()
  if (!type) {
    return
  }

  const title = await vscode.window.showInputBox({
    title: 'Nova mudança — título',
    prompt: 'Título em pt-BR (aparece no painel e no índice).',
    validateInput: (v) => (v.trim().length > 0 ? undefined : 'Informe um título.'),
  })
  if (title === undefined) {
    return
  }

  const slug = await vscode.window.showInputBox({
    title: 'Nova mudança — slug',
    prompt: 'Slug em inglês (permanente; dele deriva o escopo). Ex.: customer-registration.',
    value: sanitizeSlug(title),
    validateInput: (v) => {
      const s = sanitizeSlug(v)
      return isValidSlug(s) ? undefined : 'Slug inválido: use letras minúsculas, números e hífens.'
    },
  })
  if (slug === undefined) {
    return
  }
  const cleanSlug = sanitizeSlug(slug)

  const scope = await vscode.window.showInputBox({
    title: 'Nova mudança — escopo de identificadores',
    prompt: 'Escopo em MAIÚSCULAS. Ex.: CUST → REQ-CUST-001, TASK-CUST-001.',
    value: suggestScope(cleanSlug),
    validateInput: (v) =>
      isValidScope(v.trim().toUpperCase()) ? undefined : 'Escopo inválido: letra inicial, depois A–Z/0–9.',
  })
  if (scope === undefined) {
    return
  }
  const cleanScope = scope.trim().toUpperCase()

  // Aloca o id reconciliando o índice com o disco (ADR-004; skill `new` §5).
  const indexUri = vscode.Uri.joinPath(root, '.specs', 'index.yaml')
  const indexText = await readText(indexUri)
  if (indexText === undefined) {
    vscode.window.showErrorMessage('SDD: .specs/index.yaml não encontrado.')
    return
  }
  const nextId = parseNextId(indexText)
  if (nextId === undefined) {
    vscode.window.showErrorMessage('SDD: index.yaml sem next_id válido.')
    return
  }
  const existingIds = await collectExistingIds(root)
  const reconciliation = reconcileNextId(nextId, existingIds)
  if (!reconciliation.ok) {
    vscode.window.showErrorMessage(
      `SDD: índice defasado — o disco já usa o id ${reconciliation.conflictId} (>= next_id ${nextId}). ` +
        'Reconcilie .specs/index.yaml antes de criar. Identificadores não são renumerados.',
    )
    return
  }

  const dir = dirNameFor(nextId, cleanSlug)
  const relDir = `${DIR_FOR[type]}/${dir}`
  const changeDir = vscode.Uri.joinPath(root, '.specs', DIR_FOR[type], dir)
  if (await exists(changeDir)) {
    vscode.window.showErrorMessage(`SDD: ${relDir} já existe. Nada foi alterado.`)
    return
  }

  const changeId = dir // o id da mudança é o próprio nome do diretório
  const files = [`${relDir}/request.md`, `${relDir}/status.yaml`, `${relDir}/spec.md`, `${relDir}/decisions/`]
  const confirm = await vscode.window.showInformationMessage(
    `SDD: criar ${type} "${title}" como ${changeId}?`,
    {
      modal: true,
      detail:
        files.map((f) => `  • .specs/${f}`).join('\n') +
        '\n\nA spec nasce como template — detalhe com /sdd-kit:spec no Claude Code.',
    },
    'Criar',
  )
  if (confirm !== 'Criar') {
    return
  }

  const vars: ChangeVars = {
    CHANGE_ID: changeId,
    CHANGE_TYPE: type,
    CHANGE_TITLE: title,
    DATE: today(),
    CREATION_REASON:
      'Mudança criada pelo formulário Nova feature da extensão VS Code, a partir da solicitação do usuário.',
    ID_SCOPE: cleanScope,
    REQUEST_ORIGIN: 'Extensão VS Code (formulário Nova feature)',
    ORIGINAL_REQUEST: title,
  }

  // Escreve os arquivos por substituição de template (ADR-004). decisions/ nasce
  // vazio; tasks.md e traceability.yaml vêm de /sdd-kit:tasks, não daqui.
  await vscode.workspace.fs.createDirectory(vscode.Uri.joinPath(changeDir, 'decisions'))
  await writeTemplate(context, changeDir, 'request.md', '_shared/request.md', vars)
  // status.yaml traz o título dentro de um escalar YAML entre aspas; escapa para
  // não quebrar com aspas no título (bug 0011). spec.md/request.md usam o texto
  // cru (markdown), então recebem `vars` sem escape.
  await writeTemplate(context, changeDir, 'status.yaml', '_shared/status.yaml', {
    ...vars,
    CHANGE_TITLE: yamlDquote(vars.CHANGE_TITLE),
  })
  await writeTemplate(context, changeDir, 'spec.md', `${type}/spec.md`, vars)

  // Atualiza o índice por edição textual, preservando comentários (ADR-004).
  const updatedIndex = insertChangeEntry(indexText, {
    id: changeId,
    type,
    title,
    path: relDir,
    date: vars.DATE,
  })
  await vscode.workspace.fs.writeFile(indexUri, Buffer.from(updatedIndex, 'utf8'))

  await refresh()

  const open = await vscode.window.showInformationMessage(
    `SDD: ${changeId} criada (escopo ${cleanScope}). Próximo: /sdd-kit:spec no Claude Code.`,
    'Abrir spec',
  )
  if (open === 'Abrir spec') {
    await vscode.commands.executeCommand('vscode.open', vscode.Uri.joinPath(changeDir, 'spec.md'))
  }
}

async function pickType(): Promise<ChangeType | undefined> {
  const pick = await vscode.window.showQuickPick(
    [
      { label: 'feature', description: 'comportamento novo' },
      { label: 'bug', description: 'algo especificado que não funciona' },
      { label: 'refactor', description: 'reorganizar sem mudar comportamento' },
      { label: 'change', description: 'migração ou mudança de contrato' },
    ],
    { title: 'Nova mudança — tipo', placeHolder: 'Escolha o tipo da mudança' },
  )
  return pick?.label as ChangeType | undefined
}

function parseNextId(indexText: string): number | undefined {
  const m = indexText.match(/^\s*next_id:\s*(\d+)/m)
  if (!m) {
    return undefined
  }
  const n = Number(m[1])
  return Number.isInteger(n) ? n : undefined
}

/** Reúne os ids numéricos já usados nos diretórios de mudança (skill `new` §5). */
async function collectExistingIds(root: vscode.Uri): Promise<number[]> {
  const dirs = ['features', 'bugs', 'refactors', 'changes', 'archive']
  const ids: number[] = []
  for (const d of dirs) {
    let entries: [string, vscode.FileType][]
    try {
      entries = await vscode.workspace.fs.readDirectory(vscode.Uri.joinPath(root, '.specs', d))
    } catch {
      continue // diretório ainda não existe
    }
    for (const [name, kind] of entries) {
      if (kind === vscode.FileType.Directory) {
        const id = numericIdOf(name)
        if (id !== undefined) {
          ids.push(id)
        }
      }
    }
  }
  return ids
}

async function writeTemplate(
  context: vscode.ExtensionContext,
  changeDir: vscode.Uri,
  destName: string,
  templateRel: string,
  vars: ChangeVars,
): Promise<void> {
  const templateUri = vscode.Uri.joinPath(
    context.extensionUri,
    'templates',
    'pt-BR',
    ...templateRel.split('/'),
  )
  const bytes = await vscode.workspace.fs.readFile(templateUri)
  const content = substituteChange(Buffer.from(bytes).toString('utf8'), vars)
  await vscode.workspace.fs.writeFile(
    vscode.Uri.joinPath(changeDir, destName),
    Buffer.from(content, 'utf8'),
  )
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

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

/**
 * Abre o dashboard da feature (RF-005, TASK-UI-004/005). Acionado pela ação no
 * painel Features (recebe o nó da mudança); pela paleta (sem nó), orienta o uso.
 */
async function openDashboard(dashboard: FeatureDashboard, node: unknown): Promise<void> {
  const root = vscode.workspace.workspaceFolders?.[0]?.uri
  if (!root) {
    vscode.window.showWarningMessage('SDD: abra uma pasta para ver o dashboard.')
    return
  }
  const change = featureChangeOf(node)
  if (!change) {
    vscode.window.showInformationMessage(
      'SDD: abra o dashboard pela ação de uma feature no painel Features.',
    )
    return
  }
  await dashboard.open(root, change)
}

/**
 * Abre o `spec.md` da mudança no editor SDD (RF-006, TASK-EDIT-005). Acionado pela
 * ação no painel Features; pela paleta (sem nó), orienta o uso.
 */
async function editSpec(node: unknown): Promise<void> {
  const root = vscode.workspace.workspaceFolders?.[0]?.uri
  if (!root) {
    vscode.window.showWarningMessage('SDD: abra uma pasta para editar a spec.')
    return
  }
  const change = featureChangeOf(node)
  if (!change || !change.path) {
    vscode.window.showInformationMessage(
      'SDD: use a ação "Editar spec" de uma feature no painel Features.',
    )
    return
  }
  const uri = vscode.Uri.joinPath(root, '.specs', ...change.path.split('/'), 'spec.md')
  await vscode.commands.executeCommand('vscode.openWith', uri, SpecEditorProvider.viewType)
}

async function openInClaudeCode(): Promise<void> {
  // TODO(0004-claude-code-adapter): abrir a feature no Claude Code (RF-011).
  vscode.window.showInformationMessage(
    'SDD: integração com o Claude Code é a feature 0004-claude-code-adapter.',
  )
}
