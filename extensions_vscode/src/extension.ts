import * as vscode from 'vscode'
import { randomBytes } from 'node:crypto'
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
import { detectClaudeCode, type ClaudeCodeEnv } from './sdd/claudeCode'
import { ACTIONS, buildLaunchCommand, composePrompt, type SddAction } from './sdd/claudePrompt'
import { buildDesignSkeleton, canGenerateDesign, extractScope } from './sdd/designGenerator'
import { buildClarificationsSkeleton, hasRequirements } from './sdd/clarifyGenerator'
import { buildResearchSkeleton } from './sdd/researchGenerator'
import { aggregateHistory } from './sdd/historyModel'
import { renderHistoryHtml } from './sdd/historyHtml'
import { nextAdrNumber, adrSlug, padAdr, buildAdr } from './sdd/adrCreator'
import { load } from 'js-yaml'
import {
  LARGE_FILE_BYTES,
  bandLabel,
  buildComposition,
  classifyUsage,
  estimateTokens,
  isBinary,
  type Composition,
  type ContextFile,
  type Usage,
} from './sdd/contextGuardian'
import { parseChanges, parseStatusField, parseTaskProgress } from './sdd/specsIndex'
import {
  REQUIRED_PROJECT_FILES,
  diagnose,
  type Diagnostic as DoctorDiagnostic,
  type DoctorChange,
} from './sdd/projectDoctor'
import { ProjectViewProvider } from './views/projectViewProvider'
import { summarizeDiagnostics, type DoctorHealth } from './sdd/projectOverview'
import { readGit, readCommits } from './sdd/gitAdapter'
import { parseStatus, parseNumstat, parseLog, type GitStatus } from './sdd/gitParse'
import {
  checkScope as evaluateScope,
  DEFAULT_SCOPE_CONFIG,
  type ScopeConfig,
  type ScopeAlert,
} from './sdd/scopeCheck'
import { parseTasksPlan, inProgressPlan, type TaskPlan } from './sdd/tasksPlan'
import {
  parseTraceabilityNav,
  artifactsOf,
  type Artifact,
  type ArtifactKind,
} from './sdd/traceabilityNav'
import { buildCommitSuggestion } from './sdd/commitSuggest'
import { buildValidationReport } from './sdd/validationReport'
import { renderValidationHtml } from './sdd/validationHtml'
import { buildEvidenceMarkdown } from './sdd/evidenceDoc'
import {
  computeMetrics,
  compareSnapshots,
  renderMetricsMarkdown,
  toMetricsJson,
  type MetricsSnapshot,
} from './sdd/metrics'
import { renderMetricsHtml } from './sdd/metricsHtml'
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
  // Estado em memória: última medição do contexto (feature 0005) e último resumo do
  // Doctor (feature 0013). Pintam a UI e sobrevivem a refresh(); não são versionados
  // (arquitetura §5). Alimentam o painel Projeto (webview) por injeção.
  let lastUsage: Usage | undefined
  let lastDoctorHealth: DoctorHealth | undefined

  const projectProvider = new ProjectViewProvider({
    getContext: () => lastUsage,
    getDoctor: () => lastDoctorHealth,
  })
  const featuresProvider = new FeaturesTreeProvider()
  const dashboard = new FeatureDashboard()

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(ProjectViewProvider.viewType, projectProvider),
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
  contextIndicator.command = 'sddClaudeKit.measureContext'
  const contextChannel = vscode.window.createOutputChannel('SDD · Context Guardian')
  const scopeChannel = vscode.window.createOutputChannel('SDD · Escopo')
  const doctorDiagnostics = vscode.languages.createDiagnosticCollection('SDD Doctor')
  context.subscriptions.push(contextIndicator, contextChannel, scopeChannel, doctorDiagnostics)

  const refresh = async (): Promise<void> => {
    const detection = await detectProject()
    await vscode.commands.executeCommand(
      'setContext',
      'sddClaudeKit.initialized',
      detection.hasSpecs,
    )
    await projectProvider.refresh()
    featuresProvider.refresh()
    updateContextIndicator(contextIndicator, detection.hasSpecs, lastUsage)
  }

  const measure = async (node?: unknown): Promise<void> => {
    const usage = await measureContext(node, contextChannel)
    if (usage) {
      lastUsage = usage
      updateContextIndicator(contextIndicator, true, usage)
      await projectProvider.refresh() // reflete a nova medição no painel Projeto (0013)
    }
  }

  // Roda o Doctor, guarda o resumo em memória (feature 0013) e repinta o painel.
  const runDoctorAndRefresh = async (): Promise<void> => {
    const diagnostics = await runDoctor(doctorDiagnostics)
    lastDoctorHealth = summarizeDiagnostics(diagnostics)
    await projectProvider.refresh()
  }

  context.subscriptions.push(
    vscode.commands.registerCommand('sddClaudeKit.refresh', refresh),
    vscode.commands.registerCommand('sddClaudeKit.initProject', () => initProject(context, refresh)),
    vscode.commands.registerCommand('sddClaudeKit.newFeature', () => newFeature(context, refresh)),
    vscode.commands.registerCommand('sddClaudeKit.openDashboard', (node?: unknown) => openDashboard(dashboard, node)),
    vscode.commands.registerCommand('sddClaudeKit.editSpec', (node?: unknown) => editSpec(node)),
    vscode.commands.registerCommand('sddClaudeKit.openInClaudeCode', (node?: unknown) => openInClaudeCode(node)),
    vscode.commands.registerCommand('sddClaudeKit.measureContext', (node?: unknown) => measure(node)),
    vscode.commands.registerCommand('sddClaudeKit.runDoctor', () => runDoctorAndRefresh()),
    vscode.commands.registerCommand('sddClaudeKit.openProjectDoc', (relPath?: unknown) => openProjectDoc(relPath)),
    vscode.commands.registerCommand('sddClaudeKit.checkScope', (node?: unknown) => checkScope(node, scopeChannel)),
    vscode.commands.registerCommand('sddClaudeKit.navigateTraceability', (node?: unknown) => navigateTraceability(node)),
    vscode.commands.registerCommand('sddClaudeKit.suggestCommit', (node?: unknown) => suggestCommit(node)),
    vscode.commands.registerCommand('sddClaudeKit.validateChange', (node?: unknown) => validateChange(node)),
    vscode.commands.registerCommand('sddClaudeKit.collectEvidence', (node?: unknown) => collectEvidence(node)),
    vscode.commands.registerCommand('sddClaudeKit.metricsFeature', (node?: unknown) => metricsFeature(node, context)),
    vscode.commands.registerCommand('sddClaudeKit.generateDesign', (node?: unknown) => generateDesign(context, node)),
    vscode.commands.registerCommand('sddClaudeKit.clarify', (node?: unknown) => clarify(context, node)),
    vscode.commands.registerCommand('sddClaudeKit.history', (node?: unknown) => showHistory(node)),
    vscode.commands.registerCommand('sddClaudeKit.newAdr', (node?: unknown) => newAdr(context, node)),
    vscode.commands.registerCommand('sddClaudeKit.research', (node?: unknown) => research(context, node)),
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

function updateContextIndicator(
  item: vscode.StatusBarItem,
  hasSpecs: boolean,
  usage?: Usage,
): void {
  if (!hasSpecs) {
    item.hide()
    return
  }
  if (usage) {
    // Estimativa da última medição (feature 0005, ADR-008) — sempre "~".
    item.text = `$(dashboard) SDD Context: ~${formatTokens(usage.used)} / ${formatTokens(usage.max)} (${bandLabel(usage.band)})`
    item.tooltip = `Context Guardian — estimativa (~4 caracteres/token; ADR-008). Faixa: ${bandLabel(usage.band)}. Clique/aja numa feature para medir.`
  } else {
    const max = vscode.workspace
      .getConfiguration('sddClaudeKit')
      .get<number>('context.maxTokens', 200000)
    item.text = `$(dashboard) SDD Context: — / ${formatTokens(max)}`
    item.tooltip = 'Context Guardian — meça o contexto de uma feature no painel (feature 0005).'
  }
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

const CLAUDE_TERMINAL_NAME = 'SDD · Claude Code'

/**
 * Abre a mudança no Claude Code (RF-011, feature 0004). Do nó da feature no painel:
 * pergunta a ação do fluxo SDD (QuickPick), compõe o prompt (`/sdd-kit:<ação> <id>`),
 * copia-o, e abre/reutiliza o terminal com a CLI detectada, deixando o prompt PRONTO
 * para revisão — sem enviar (ADR-007, NFR-CC-001). CLI ausente: prompt copiado + orientação.
 */
async function openInClaudeCode(node: unknown): Promise<void> {
  const root = vscode.workspace.workspaceFolders?.[0]?.uri
  if (!root) {
    vscode.window.showWarningMessage('SDD: abra uma pasta para usar o Claude Code.')
    return
  }
  const change = featureChangeOf(node)
  if (!change) {
    vscode.window.showInformationMessage(
      'SDD: use a ação "Abrir no Claude Code" de uma feature no painel Features.',
    )
    return
  }

  const pick = await vscode.window.showQuickPick(
    ACTIONS.map((a) => ({ label: a.label, description: `/sdd-kit:${a.id}`, detail: a.objective, id: a.id })),
    { title: `Claude Code — ${change.id}`, placeHolder: 'Escolha a ação do fluxo SDD' },
  )
  if (!pick) {
    return
  }
  await launchClaudeAction(root, change.id, pick.id)
}

/**
 * Compõe o prompt de uma ação SDD, copia-o (RF-011) e deixa-o PRONTO num terminal
 * com a CLI detectada — sem enviar (ADR-007, NFR-CC-001). CLI ausente: prompt
 * copiado + orientação. Reusado por "Abrir no Claude Code" (0004) e por "Gerar
 * design" para preencher o conteúdo (0014, ADR-014).
 */
async function launchClaudeAction(
  root: vscode.Uri,
  changeId: string,
  action: SddAction,
): Promise<void> {
  const prompt = composePrompt(action, changeId)

  // Copia sempre (RF-011 "copiar prompt"; funciona mesmo sem a CLI e sem a UI).
  await vscode.env.clipboard.writeText(prompt)

  const detection = await detectClaudeCode(hostClaudeEnv())
  if (!detection.available || !detection.path) {
    vscode.window.showWarningMessage(
      `SDD: Claude Code não detectado. Prompt copiado (${prompt}). ` +
        'Configure "sddClaudeKit.claudeCode.path" ou instale a CLI, cole o prompt e envie você mesmo.',
    )
    return
  }

  // Abre/reutiliza o terminal e deixa o prompt PRONTO — não envia a ação (ADR-007,
  // NFR-CC-001). Terminal novo inicia a CLI; reutilizado assume a CLI já em uso.
  const existing = vscode.window.terminals.find(
    (t) => t.name === CLAUDE_TERMINAL_NAME && t.exitStatus === undefined,
  )
  const terminal = existing ?? vscode.window.createTerminal({ name: CLAUDE_TERMINAL_NAME, cwd: root })
  terminal.show()
  if (!existing) {
    terminal.sendText(buildLaunchCommand(detection.path), true)
  }
  terminal.sendText(prompt, false) // sem newline: o usuário revisa e pressiona Enter para enviar

  vscode.window.showInformationMessage(
    `SDD: prompt copiado e pronto no Claude Code (${prompt}). Revise e pressione Enter para enviar.`,
  )
}

/**
 * Gera o design técnico de uma mudança (RF-009, feature 0014). Pré-condição: spec
 * aprovada — `approval != null` no status.yaml (D-Q4, SCN-DSGN-002). Escreve o
 * `design.md`-esqueleto a partir do template `feature/design.md` (seções do RF-009 com
 * lacunas, D-Q6), sem sobrescrever sem confirmação (D-Q5, SCN-DSGN-004), e oferece
 * preencher o conteúdo com o Claude Code (reuso da ação `design` do 0004, ADR-014).
 */
async function generateDesign(context: vscode.ExtensionContext, node: unknown): Promise<void> {
  const root = vscode.workspace.workspaceFolders?.[0]?.uri
  if (!root) {
    vscode.window.showWarningMessage('SDD: abra uma pasta para gerar o design.')
    return
  }
  const change = featureChangeOf(node)
  if (!change || !change.path) {
    vscode.window.showInformationMessage(
      'SDD: use a ação "Gerar design" de uma feature no painel Features.',
    )
    return
  }
  const changeDir = ['.specs', ...change.path.split('/')]

  // Pré-condição (D-Q4): a etapa de design só é oferecida com a spec aprovada.
  const statusText = await readText(vscode.Uri.joinPath(root, ...changeDir, 'status.yaml'))
  if (!canGenerateDesign({ approval: readApproval(statusText) })) {
    vscode.window.showInformationMessage(
      `SDD: a etapa de design exige a spec aprovada (campo approval no status.yaml). ` +
        `Aprove ${change.id} antes — /sdd-kit:approve no Claude Code.`,
    )
    return
  }

  // A estrutura vem do template (ADR-014, Q2), embutido e sincronizado no pacote.
  const templateUri = vscode.Uri.joinPath(
    context.extensionUri,
    'templates',
    'pt-BR',
    'feature',
    'design.md',
  )
  const template = await readText(templateUri)
  if (template === undefined) {
    vscode.window.showErrorMessage('SDD: template feature/design.md não encontrado no pacote da extensão.')
    return
  }
  const specMd = await readText(vscode.Uri.joinPath(root, ...changeDir, 'spec.md'))
  const skeleton = buildDesignSkeleton(template, {
    id: change.id,
    title: change.title,
    scope: extractScope(specMd ?? '') ?? '',
    date: today(),
  })

  const designUri = vscode.Uri.joinPath(root, ...changeDir, 'design.md')
  if (await exists(designUri)) {
    // Não sobrescreve sem confirmação (D-Q5, SCN-DSGN-004): recusada, o arquivo fica intacto.
    const overwrite = await vscode.window.showWarningMessage(
      `SDD: ${change.id} já tem design.md. Sobrescrever com um novo esqueleto? O conteúdo atual será perdido.`,
      { modal: true },
      'Sobrescrever',
    )
    if (overwrite !== 'Sobrescrever') {
      return
    }
  }
  await vscode.workspace.fs.writeFile(designUri, Buffer.from(skeleton, 'utf8'))
  await vscode.commands.executeCommand('vscode.open', designUri)

  // Oferece preencher o conteúdo com o Claude Code (ADR-014: reuso da ação `design` do 0004).
  const FILL = 'Preencher com o Claude Code'
  const choice = await vscode.window.showInformationMessage(
    `SDD: design.md-esqueleto criado em .specs/${change.path}. Preencha as lacunas — ou peça ao Claude Code.`,
    FILL,
  )
  if (choice === FILL) {
    await launchClaudeAction(root, change.id, 'design')
  }
}

/**
 * Clarifica a spec de uma mudança (RF-008, feature 0015). Pré-condição: a spec tem
 * requisitos — `REQ-*` presentes (D-Q4, SCN-CLAR-002); a ação NÃO promove o estado.
 * Escreve o `clarifications.md`-esqueleto a partir do template `feature/clarifications.md`
 * (nove categorias do RF-008, D-Q5), sem sobrescrever sem confirmação (SCN-CLAR-004), e
 * oferece analisar o conteúdo com o Claude Code (reuso da ação `clarify` do 0004, ADR-015).
 */
async function clarify(context: vscode.ExtensionContext, node: unknown): Promise<void> {
  const root = vscode.workspace.workspaceFolders?.[0]?.uri
  if (!root) {
    vscode.window.showWarningMessage('SDD: abra uma pasta para clarificar a spec.')
    return
  }
  const change = featureChangeOf(node)
  if (!change || !change.path) {
    vscode.window.showInformationMessage(
      'SDD: use a ação "Clarificar" de uma feature no painel Features.',
    )
    return
  }
  const changeDir = ['.specs', ...change.path.split('/')]

  // Pré-condição (D-Q4): só clarifica quando a spec tem requisitos. Não promove estado.
  const specMd = await readText(vscode.Uri.joinPath(root, ...changeDir, 'spec.md'))
  if (!hasRequirements(specMd ?? '')) {
    vscode.window.showInformationMessage(
      `SDD: a clarificação exige uma spec com requisitos (REQ-*). Detalhe ${change.id} antes — /sdd-kit:spec.`,
    )
    return
  }

  // A estrutura vem do template (ADR-015, Q2), embutido e sincronizado no pacote.
  const templateUri = vscode.Uri.joinPath(
    context.extensionUri,
    'templates',
    'pt-BR',
    'feature',
    'clarifications.md',
  )
  const template = await readText(templateUri)
  if (template === undefined) {
    vscode.window.showErrorMessage('SDD: template feature/clarifications.md não encontrado no pacote da extensão.')
    return
  }
  const skeleton = buildClarificationsSkeleton(template, {
    id: change.id,
    title: change.title,
    scope: extractScope(specMd ?? '') ?? '',
    date: today(),
  })

  const clarifyUri = vscode.Uri.joinPath(root, ...changeDir, 'clarifications.md')
  if (await exists(clarifyUri)) {
    // Não sobrescreve sem confirmação (SCN-CLAR-004): recusada, o arquivo fica intacto.
    const overwrite = await vscode.window.showWarningMessage(
      `SDD: ${change.id} já tem clarifications.md. Sobrescrever com um novo esqueleto? O conteúdo atual será perdido.`,
      { modal: true },
      'Sobrescrever',
    )
    if (overwrite !== 'Sobrescrever') {
      return
    }
  }
  await vscode.workspace.fs.writeFile(clarifyUri, Buffer.from(skeleton, 'utf8'))
  await vscode.commands.executeCommand('vscode.open', clarifyUri)

  // Oferece analisar o conteúdo com o Claude Code (ADR-015: reuso da ação `clarify` do 0004).
  const ANALYZE = 'Analisar com o Claude Code'
  const choice = await vscode.window.showInformationMessage(
    `SDD: clarifications.md-esqueleto criado em .specs/${change.path}. Preencha as categorias — ou peça a análise ao Claude Code.`,
    ANALYZE,
  )
  if (choice === ANALYZE) {
    await launchClaudeAction(root, change.id, 'clarify')
  }
}

/**
 * Inicia o research de uma mudança (RF-007, feature 0017). Roda ANTES da spec:
 * a pré-condição é apenas a mudança existir (D-Q4), sem exigir REQ-* nem aprovação.
 * Escreve o `research.md`-esqueleto a partir do template `feature/research.md` (oito
 * frentes do RF-007, D-Q6), sem sobrescrever sem confirmação (SCN-RES-003), e oferece
 * analisar o conteúdo com o Claude Code (reuso da nova ação `research` do 0004, ADR-017).
 * A incorporação à spec é manual (D-Q5).
 */
async function research(context: vscode.ExtensionContext, node: unknown): Promise<void> {
  const root = vscode.workspace.workspaceFolders?.[0]?.uri
  if (!root) {
    vscode.window.showWarningMessage('SDD: abra uma pasta para fazer o research.')
    return
  }
  const change = featureChangeOf(node)
  if (!change || !change.path) {
    vscode.window.showInformationMessage(
      'SDD: use a ação "Research" de uma feature no painel Features.',
    )
    return
  }
  const changeDir = ['.specs', ...change.path.split('/')]

  // A estrutura vem do template (ADR-017, Q2), embutido e sincronizado no pacote.
  const templateUri = vscode.Uri.joinPath(
    context.extensionUri,
    'templates',
    'pt-BR',
    'feature',
    'research.md',
  )
  const template = await readText(templateUri)
  if (template === undefined) {
    vscode.window.showErrorMessage('SDD: template feature/research.md não encontrado no pacote da extensão.')
    return
  }
  const specMd = await readText(vscode.Uri.joinPath(root, ...changeDir, 'spec.md'))
  const skeleton = buildResearchSkeleton(template, {
    id: change.id,
    title: change.title,
    scope: extractScope(specMd ?? '') ?? '',
    date: today(),
  })

  const researchUri = vscode.Uri.joinPath(root, ...changeDir, 'research.md')
  if (await exists(researchUri)) {
    // Não sobrescreve sem confirmação (SCN-RES-003): recusada, o arquivo fica intacto.
    const overwrite = await vscode.window.showWarningMessage(
      `SDD: ${change.id} já tem research.md. Sobrescrever com um novo esqueleto? O conteúdo atual será perdido.`,
      { modal: true },
      'Sobrescrever',
    )
    if (overwrite !== 'Sobrescrever') {
      return
    }
  }
  await vscode.workspace.fs.writeFile(researchUri, Buffer.from(skeleton, 'utf8'))
  await vscode.commands.executeCommand('vscode.open', researchUri)

  // Oferece analisar o conteúdo com o Claude Code (ADR-017: nova ação `research` do 0004).
  const ANALYZE = 'Analisar com o Claude Code'
  const choice = await vscode.window.showInformationMessage(
    `SDD: research.md-esqueleto criado em .specs/${change.path}. Preencha as frentes — ou peça a análise ao Claude Code. Depois incorpore à spec com /sdd-kit:spec.`,
    ANALYZE,
  )
  if (choice === ANALYZE) {
    await launchClaudeAction(root, change.id, 'research')
  }
}

/**
 * Mostra o histórico de uma mudança (RF-020, feature 0016). Agrega o subconjunto
 * persistido (D-Q1): transições de status/aprovação (status.yaml), ADRs
 * (decisions/), commits (0007) e o estado atual de tarefas/validação (0008), e
 * apresenta num WebviewPanel read-only (ADR-016). Somente leitura (NFR-HIST-001).
 */
async function showHistory(node: unknown): Promise<void> {
  const root = vscode.workspace.workspaceFolders?.[0]?.uri
  if (!root) {
    vscode.window.showWarningMessage('SDD: abra uma pasta para ver o histórico.')
    return
  }
  const change = featureChangeOf(node)
  if (!change || !change.path) {
    vscode.window.showInformationMessage(
      'SDD: use a ação "Histórico" de uma feature no painel Features.',
    )
    return
  }
  const changeDir = ['.specs', ...change.path.split('/')]

  const statusYaml = await readText(vscode.Uri.joinPath(root, ...changeDir, 'status.yaml'))
  const adrs = await readChangeAdrs(root, changeDir)

  // Commits do 0007: `git log --oneline` não traz data, então entram sem data.
  const numeric = /^(\d+)/.exec(change.id)?.[1] ?? change.id
  const commits = parseLog(await readCommits(root.fsPath, numeric)).map((c) => ({
    hash: c.hash,
    date: '',
    subject: c.subject,
  }))

  const tasks = statusYaml ? parseTaskProgress(statusYaml) : undefined
  const traceText = await readText(vscode.Uri.joinPath(root, ...changeDir, 'traceability.yaml'))
  let validation: { atendido: number; pendentes: number } | undefined
  if (traceText) {
    const s = buildValidationReport(traceText, change.id).summary
    validation = { atendido: s.atendido, pendentes: s['nao-atendido'] + s['nao-testado'] + s.parcial }
  }

  const model = aggregateHistory({
    statusYaml,
    adrs,
    commits,
    tasks: tasks ? { done: tasks.done, total: tasks.total } : undefined,
    validation,
  })

  const panel = vscode.window.createWebviewPanel(
    'sddHistory',
    `Histórico — ${change.id}`,
    vscode.ViewColumn.Active,
    { enableScripts: false, localResourceRoots: [] },
  )
  panel.webview.html = renderHistoryHtml(change.id, model, nonce())
}

/**
 * Cria um novo ADR na mudança (RF-020, feature 0016, REQ-HIST-002). Aloca o número
 * reconciliando com TODOS os `decisions/` do projeto (numeração global, ADR-016),
 * deriva o slug do título e monta o esqueleto do template. Não sobrescreve um ADR
 * existente (SCN-HIST-004).
 */
async function newAdr(context: vscode.ExtensionContext, node: unknown): Promise<void> {
  const root = vscode.workspace.workspaceFolders?.[0]?.uri
  if (!root) {
    vscode.window.showWarningMessage('SDD: abra uma pasta para criar um ADR.')
    return
  }
  const change = featureChangeOf(node)
  if (!change || !change.path) {
    vscode.window.showInformationMessage(
      'SDD: use a ação "Novo ADR" de uma feature no painel Features.',
    )
    return
  }

  const title = await vscode.window.showInputBox({
    title: 'Novo ADR — título',
    prompt: 'Título da decisão (pt-BR). Ex.: Estratégia de cache do relatório.',
    validateInput: (v) => (v.trim().length > 0 ? undefined : 'Informe um título.'),
  })
  if (title === undefined) {
    return
  }

  const slug = adrSlug(title)
  if (slug.length === 0) {
    vscode.window.showErrorMessage('SDD: título sem caracteres válidos para o slug do ADR.')
    return
  }
  const number = nextAdrNumber(await collectAdrNumbers(root))

  const templateUri = vscode.Uri.joinPath(context.extensionUri, 'templates', 'pt-BR', 'adr', 'ADR-template.md')
  const template = await readText(templateUri)
  if (template === undefined) {
    vscode.window.showErrorMessage('SDD: template adr/ADR-template.md não encontrado no pacote da extensão.')
    return
  }
  const content = buildAdr(template, {
    number,
    title: title.trim(),
    date: today(),
    origin: `criado pela extensão SDD para a mudança ${change.id}`,
  })

  const fileName = `ADR-${padAdr(number)}-${slug}.md`
  const decisionsDir = vscode.Uri.joinPath(root, '.specs', ...change.path.split('/'), 'decisions')
  const adrUri = vscode.Uri.joinPath(decisionsDir, fileName)
  if (await exists(adrUri)) {
    // Não sobrescreve (SCN-HIST-004).
    vscode.window.showErrorMessage(`SDD: ${fileName} já existe — não sobrescrevo. Ajuste o título.`)
    return
  }
  await vscode.workspace.fs.createDirectory(decisionsDir)
  await vscode.workspace.fs.writeFile(adrUri, Buffer.from(content, 'utf8'))
  await vscode.commands.executeCommand('vscode.open', adrUri)
  vscode.window.showInformationMessage(
    `SDD: ${fileName} criado em .specs/${change.path}/decisions/. Preencha as seções.`,
  )
}

/** Lê os ADRs da pasta decisions/ de uma mudança, para o timeline (RF-020). */
async function readChangeAdrs(
  root: vscode.Uri,
  changeDir: string[],
): Promise<{ number: number; title: string; date?: string }[]> {
  const dir = vscode.Uri.joinPath(root, ...changeDir, 'decisions')
  let entries: [string, vscode.FileType][]
  try {
    entries = await vscode.workspace.fs.readDirectory(dir)
  } catch {
    return []
  }
  const adrs: { number: number; title: string; date?: string }[] = []
  for (const [name, kind] of entries) {
    const m = /^ADR-(\d+)/.exec(name)
    if (kind === vscode.FileType.File && m) {
      const content = (await readText(vscode.Uri.joinPath(dir, name))) ?? ''
      adrs.push({
        number: Number(m[1]),
        title: /^#\s*ADR-\d+\s*—\s*(.+)$/m.exec(content)?.[1]?.trim() ?? name,
        date: /\*\*Data:\*\*\s*"?([0-9][0-9-]+)"?/.exec(content)?.[1],
      })
    }
  }
  return adrs
}

/** Coleta os números de ADR de TODOS os `decisions/` do projeto (numeração global). */
async function collectAdrNumbers(root: vscode.Uri): Promise<number[]> {
  const dirs = (await collectChangeDirs(root)).map((d) => ['.specs', ...d.split('/'), 'decisions'])
  dirs.push(['.specs', 'project', 'decisions'])
  const numbers: number[] = []
  for (const rel of dirs) {
    let entries: [string, vscode.FileType][]
    try {
      entries = await vscode.workspace.fs.readDirectory(vscode.Uri.joinPath(root, ...rel))
    } catch {
      continue
    }
    for (const [name, kind] of entries) {
      const m = /^ADR-(\d+)/.exec(name)
      if (kind === vscode.FileType.File && m) {
        numbers.push(Number(m[1]))
      }
    }
  }
  return numbers
}

/** Lê o campo `approval` do status.yaml (null/ausente/ilegível = não aprovado). */
function readApproval(statusText: string | undefined): unknown {
  if (statusText === undefined) {
    return null
  }
  try {
    const doc = load(statusText)
    return doc !== null && typeof doc === 'object'
      ? (doc as Record<string, unknown>)['approval']
      : null
  } catch {
    return null
  }
}

/**
 * Mede o contexto de uma mudança (RF-012, feature 0005). Coleta os documentos que o
 * fluxo SDD carrega (docs de projeto + artefatos da mudança), estima os tokens
 * (heurística local, ADR-008), classifica contra o teto e mostra a composição num
 * canal de saída. Devolve o uso para pintar a barra de status, ou `undefined` quando
 * não há o que medir. Arquivo grande é sinalizado por tamanho, sem ser lido (NFR-CTX-004).
 */
async function measureContext(
  node: unknown,
  channel: vscode.OutputChannel,
): Promise<Usage | undefined> {
  const root = vscode.workspace.workspaceFolders?.[0]?.uri
  if (!root) {
    vscode.window.showWarningMessage('SDD: abra uma pasta para medir o contexto.')
    return undefined
  }
  const change = featureChangeOf(node)
  if (!change || !change.path) {
    vscode.window.showInformationMessage(
      'SDD: use a ação "Medir contexto" de uma feature no painel Features.',
    )
    return undefined
  }

  // Os documentos que o fluxo SDD carrega para a mudança (Art. 7, contexto sob demanda):
  // docs de projeto + artefatos da própria mudança que existirem.
  const rels = [
    'project/constitution.md',
    'project/architecture.md',
    'project/standards.md',
    ...['spec.md', 'design.md', 'tasks.md'].map((f) => `${change.path}/${f}`),
  ]
  const files: ContextFile[] = []
  for (const rel of rels) {
    const file = await readContextFile(vscode.Uri.joinPath(root, '.specs', ...rel.split('/')), rel)
    if (file) {
      files.push(file)
    }
  }

  const cfg = vscode.workspace.getConfiguration('sddClaudeKit')
  const max = cfg.get<number>('context.maxTokens', 200000)
  const thresholds = {
    warning: cfg.get<number>('context.warningThreshold', 0.7),
    risk: cfg.get<number>('context.riskThreshold', 0.85),
    block: cfg.get<number>('context.blockThreshold', 0.95),
  }
  const composition = buildComposition(files)
  const usage = classifyUsage(composition.totalTokens, max, thresholds)

  renderComposition(channel, change.id, composition, usage)
  channel.show(true)
  vscode.window.showInformationMessage(
    `SDD: contexto de ${change.id} ≈ ${formatTokens(usage.used)} tokens (${bandLabel(usage.band)}). ` +
      'Estimativa local — ver o canal "SDD · Context Guardian".',
  )
  return usage
}

/**
 * Lê um arquivo candidato ao contexto. Robusto (NFR-CTX-002): ausente → ignorado;
 * grande → sinalizado por tamanho sem ler (NFR-CTX-004); binário → não contado.
 */
async function readContextFile(uri: vscode.Uri, rel: string): Promise<ContextFile | undefined> {
  let stat: vscode.FileStat
  try {
    stat = await vscode.workspace.fs.stat(uri)
  } catch {
    return undefined // ausente: simplesmente não entra na composição
  }
  const bytes = stat.size
  if (bytes >= LARGE_FILE_BYTES) {
    return { path: rel, bytes, binary: false } // grande: não lê (NFR-CTX-004)
  }
  try {
    const data = await vscode.workspace.fs.readFile(uri)
    if (isBinary(data.subarray(0, 4096))) {
      return { path: rel, bytes, binary: true }
    }
    return { path: rel, text: Buffer.from(data).toString('utf8'), bytes, binary: false }
  } catch {
    return { path: rel, bytes, binary: false } // ilegível: conta como não-texto
  }
}

/** Escreve a composição do contexto no canal de saída, sempre como estimativa. */
function renderComposition(
  channel: vscode.OutputChannel,
  changeId: string,
  composition: Composition,
  usage: Usage,
): void {
  channel.clear()
  channel.appendLine(`Context Guardian — ${changeId}`)
  channel.appendLine(
    `Estimativa (~4 caracteres/token; ADR-008): ~${usage.used} tokens / ${usage.max} ` +
      `(${bandLabel(usage.band)}, ${Math.round(usage.fraction * 100)}% do teto)`,
  )
  channel.appendLine('')
  channel.appendLine('Composição (maior → menor):')
  for (const e of composition.entries) {
    const flags = [e.large ? 'GRANDE' : '', e.binary ? 'BINÁRIO' : ''].filter(Boolean).join(' ')
    channel.appendLine(`  ~${String(e.tokens).padStart(7)} tok  ${e.path}${flags ? `  [${flags}]` : ''}`)
  }
  if (composition.binary.length > 0) {
    channel.appendLine('')
    channel.appendLine(`Binários (não contados): ${composition.binary.join(', ')}`)
  }
  if (composition.large.length > 0) {
    channel.appendLine(`Grandes (estimados por tamanho, não lidos): ${composition.large.join(', ')}`)
  }
}

/**
 * Project Doctor (RF-002, feature 0006). Coleta o retrato estrutural do projeto,
 * chama o núcleo puro `diagnose` e publica os problemas na Diagnostics API — painel
 * Problems (ADR-009). Somente leitura: nada é alterado (NFR-PD-001). Limpa e repovoa
 * a coleção, sem duplicar (SCN-PD-006).
 */
async function runDoctor(collection: vscode.DiagnosticCollection): Promise<DoctorDiagnostic[]> {
  const root = vscode.workspace.workspaceFolders?.[0]?.uri
  if (!root) {
    vscode.window.showWarningMessage('SDD: abra uma pasta para diagnosticar o projeto.')
    return []
  }

  // Arquivos de projeto obrigatórios.
  const files: Record<string, boolean> = {}
  for (const rel of REQUIRED_PROJECT_FILES) {
    files[rel] = await exists(vscode.Uri.joinPath(root, ...rel.split('/')))
  }

  // Mudanças do índice + status/spec em disco.
  const indexText = (await readText(vscode.Uri.joinPath(root, '.specs', 'index.yaml'))) ?? ''
  const changes: DoctorChange[] = []
  for (const entry of parseChanges(indexText)) {
    const base = entry.path || entry.id
    const statusText = await readText(vscode.Uri.joinPath(root, '.specs', ...base.split('/'), 'status.yaml'))
    const hasSpec = await exists(vscode.Uri.joinPath(root, '.specs', ...base.split('/'), 'spec.md'))
    changes.push({
      id: entry.id,
      path: entry.path,
      indexStatus: entry.status,
      hasStatusFile: statusText !== undefined,
      diskStatus: statusText !== undefined ? parseStatusField(statusText) : undefined,
      hasSpec,
    })
  }

  const diskChangeDirs = await collectChangeDirs(root)
  const detection = await detectProject()
  const claude = await detectClaudeCode(hostClaudeEnv())

  const diagnostics = diagnose({
    files,
    changes,
    diskChangeDirs,
    hasGit: detection.hasGit,
    claudeCodeAvailable: claude.available,
  })

  publishDoctor(collection, root, diagnostics)

  const errors = diagnostics.filter((d) => d.severity === 'error').length
  const warnings = diagnostics.filter((d) => d.severity === 'warning').length
  if (diagnostics.length === 0) {
    vscode.window.showInformationMessage('SDD Project Doctor: nenhum problema estrutural encontrado.')
    return diagnostics
  }
  await vscode.commands.executeCommand('workbench.actions.view.problems')
  vscode.window.showInformationMessage(
    `SDD Project Doctor: ${errors} erro(s), ${warnings} aviso(s). Ver o painel Problems.`,
  )
  return diagnostics
}

/**
 * Abre um documento de projeto pelo caminho relativo (ação do painel Projeto, RF-005,
 * feature 0013). Acionada por command: URI do webview; ignora entrada inválida.
 */
async function openProjectDoc(relPath: unknown): Promise<void> {
  const root = vscode.workspace.workspaceFolders?.[0]?.uri
  if (!root || typeof relPath !== 'string' || relPath.length === 0) {
    return
  }
  const uri = vscode.Uri.joinPath(root, ...relPath.split('/'))
  await vscode.commands.executeCommand('vscode.open', uri)
}

/**
 * Verifica mudanças fora do escopo de uma mudança (RF-014, feature 0007). Lê o estado do
 * Git (somente leitura, ADR-011), compara os arquivos alterados com os arquivos prováveis da
 * tarefa em andamento (D-Q5) e apresenta os alertas num canal. Nada é escrito (NFR-TRACE-001).
 */
async function checkScope(node: unknown, channel: vscode.OutputChannel): Promise<void> {
  const root = vscode.workspace.workspaceFolders?.[0]?.uri
  if (!root) {
    vscode.window.showWarningMessage('SDD: abra uma pasta para verificar o escopo.')
    return
  }
  const change = featureChangeOf(node)
  if (!change || !change.path) {
    vscode.window.showInformationMessage(
      'SDD: use a ação "Verificar escopo" de uma feature no painel Features.',
    )
    return
  }

  const raw = await readGit(root.fsPath)
  if (!raw) {
    vscode.window.showInformationMessage('SDD: sem repositório Git neste workspace — nada a verificar.')
    return
  }
  const status = parseStatus(raw.statusV2)
  const diffStats = parseNumstat(raw.numstat)
  const changedFiles = status.files.map((f) => f.path)

  const tasksMd = await readText(
    vscode.Uri.joinPath(root, '.specs', ...change.path.split('/'), 'tasks.md'),
  )
  const current = tasksMd ? inProgressPlan(parseTasksPlan(tasksMd)) : undefined

  const alerts = evaluateScope({
    changedFiles,
    plannedFiles: current?.plannedFiles ?? [],
    diffStats,
    config: scopeConfig(),
  })

  renderScope(channel, change.id, status, current, changedFiles.length, alerts)
  channel.show(true)
  vscode.window.showInformationMessage(
    alerts.length === 0
      ? `SDD: escopo de ${change.id} sem alertas (branch ${status.branch ?? '—'}, ${changedFiles.length} arquivo(s)).`
      : `SDD: ${alerts.length} alerta(s) de escopo em ${change.id}. Ver o canal "SDD · Escopo".`,
  )
}

/** Config de escopo (D-Q3): defaults mesclados com sddClaudeKit.scope.*. */
function scopeConfig(): ScopeConfig {
  const cfg = vscode.workspace.getConfiguration('sddClaudeKit')
  return {
    sensitiveGlobs: cfg.get<string[]>('scope.sensitiveGlobs', DEFAULT_SCOPE_CONFIG.sensitiveGlobs),
    maxLines: cfg.get<number>('scope.maxLines', DEFAULT_SCOPE_CONFIG.maxLines),
    maxFiles: cfg.get<number>('scope.maxFiles', DEFAULT_SCOPE_CONFIG.maxFiles),
    dependencyManifests: cfg.get<string[]>(
      'scope.dependencyManifests',
      DEFAULT_SCOPE_CONFIG.dependencyManifests,
    ),
  }
}

/** Escreve o resultado da verificação de escopo no canal de saída. */
function renderScope(
  channel: vscode.OutputChannel,
  changeId: string,
  status: GitStatus,
  current: TaskPlan | undefined,
  changedCount: number,
  alerts: ScopeAlert[],
): void {
  channel.clear()
  channel.appendLine(`Escopo — ${changeId}`)
  channel.appendLine(`Branch: ${status.branch ?? '(destacado)'} · ${changedCount} arquivo(s) alterado(s)`)
  channel.appendLine(
    current
      ? `Tarefa em andamento: ${current.id} · ${current.plannedFiles.length} arquivo(s) previsto(s)`
      : 'Sem tarefa in_progress no tasks.md — sem base para "fora do previsto".',
  )
  channel.appendLine('')
  if (alerts.length === 0) {
    channel.appendLine('Nenhum alerta de escopo.')
    return
  }
  channel.appendLine(`${alerts.length} alerta(s):`)
  for (const a of alerts) {
    channel.appendLine(`  [${a.kind}] ${a.message}`)
  }
}

/**
 * Navega a rastreabilidade de uma mudança (RF-015, REQ-TRACE-004, feature 0007). Por
 * QuickPick: escolhe-se um requisito e, dele, um artefato ligado (cenário/tarefa/arquivo/
 * teste), que é aberto. Somente leitura. O parsing vive no núcleo puro traceabilityNav.ts.
 */
async function navigateTraceability(node: unknown): Promise<void> {
  const root = vscode.workspace.workspaceFolders?.[0]?.uri
  if (!root) {
    vscode.window.showWarningMessage('SDD: abra uma pasta para navegar a rastreabilidade.')
    return
  }
  const change = featureChangeOf(node)
  if (!change || !change.path) {
    vscode.window.showInformationMessage(
      'SDD: use a ação "Navegar rastreabilidade" de uma feature no painel Features.',
    )
    return
  }

  const changeDir = ['.specs', ...change.path.split('/')]
  const text = await readText(vscode.Uri.joinPath(root, ...changeDir, 'traceability.yaml'))
  if (text === undefined) {
    vscode.window.showInformationMessage(
      `SDD: ${change.id} ainda não tem traceability.yaml — gere com /sdd-kit:tasks.`,
    )
    return
  }
  const nav = parseTraceabilityNav(text)
  if (nav.requirements.length === 0) {
    vscode.window.showInformationMessage('SDD: matriz de rastreabilidade vazia.')
    return
  }

  const reqPick = await vscode.window.showQuickPick(
    nav.requirements.map((req) => ({
      label: req.id,
      description: req.title,
      detail: `${req.scenarios.length} cenário(s) · ${req.tasks.length} tarefa(s) · ${req.files.length} arquivo(s) · ${req.tests.length} teste(s)`,
      req,
    })),
    { title: `Rastreabilidade — ${change.id}`, placeHolder: 'Escolha um requisito' },
  )
  if (!reqPick) {
    return
  }

  const artifacts = artifactsOf(reqPick.req)
  if (artifacts.length === 0) {
    vscode.window.showInformationMessage(`SDD: ${reqPick.req.id} sem artefatos ligados.`)
    return
  }
  const artPick = await vscode.window.showQuickPick(
    artifacts.map((art) => ({
      label: `$(${iconForArtifact(art.kind)}) ${art.id}`,
      description: labelForArtifact(art.kind),
      art,
    })),
    { title: `${reqPick.req.id} — abrir artefato`, placeHolder: 'Cenário, tarefa, arquivo ou teste' },
  )
  if (!artPick) {
    return
  }
  await openArtifact(root, changeDir, artPick.art)
}

/** Abre o artefato conforme o tipo: spec.md (req/cenário), tasks.md (tarefa), o arquivo, ou busca (teste). */
async function openArtifact(root: vscode.Uri, changeDir: string[], art: Artifact): Promise<void> {
  if (art.kind === 'scenario' || art.kind === 'requirement') {
    await openAndReveal(vscode.Uri.joinPath(root, ...changeDir, 'spec.md'), art.id)
  } else if (art.kind === 'task') {
    await openAndReveal(vscode.Uri.joinPath(root, ...changeDir, 'tasks.md'), art.id)
  } else if (art.kind === 'file') {
    const uri = await resolveFile(root, art.id)
    if (uri) {
      await vscode.commands.executeCommand('vscode.open', uri)
    } else {
      vscode.window.showWarningMessage(`SDD: arquivo não encontrado: ${art.id}`)
    }
  } else {
    // teste: o identificador vive no código de teste; abre a busca no workspace.
    await vscode.commands.executeCommand('workbench.action.findInFiles', {
      query: art.id,
      triggerSearch: true,
      isRegex: false,
      isCaseSensitive: true,
    })
  }
}

/** Abre o documento e posiciona no primeiro trecho que contém `id`. */
async function openAndReveal(uri: vscode.Uri, id: string): Promise<void> {
  let doc: vscode.TextDocument
  try {
    doc = await vscode.workspace.openTextDocument(uri)
  } catch {
    vscode.window.showWarningMessage(`SDD: não foi possível abrir ${uri.fsPath}.`)
    return
  }
  const editor = await vscode.window.showTextDocument(doc)
  const line = doc.getText().split('\n').findIndex((l) => l.includes(id))
  if (line >= 0) {
    const pos = new vscode.Position(line, 0)
    editor.selection = new vscode.Selection(pos, pos)
    editor.revealRange(new vscode.Range(pos, pos), vscode.TextEditorRevealType.InCenter)
  }
}

/** Resolve um arquivo da matriz tentando a raiz e o subprojeto da extensão. */
async function resolveFile(root: vscode.Uri, rel: string): Promise<vscode.Uri | undefined> {
  for (const candidate of [rel, `extensions_vscode/${rel}`]) {
    const uri = vscode.Uri.joinPath(root, ...candidate.split('/'))
    if (await exists(uri)) {
      return uri
    }
  }
  return undefined
}

function iconForArtifact(kind: ArtifactKind): string {
  switch (kind) {
    case 'scenario':
      return 'list-tree'
    case 'task':
      return 'checklist'
    case 'file':
      return 'file-code'
    case 'test':
      return 'beaker'
    case 'requirement':
      return 'symbol-property'
  }
}

function labelForArtifact(kind: ArtifactKind): string {
  switch (kind) {
    case 'scenario':
      return 'cenário (spec.md)'
    case 'task':
      return 'tarefa (tasks.md)'
    case 'file':
      return 'arquivo'
    case 'test':
      return 'teste (buscar)'
    case 'requirement':
      return 'requisito (spec.md)'
  }
}

/**
 * Sugere um nome de branch e uma mensagem de commit para a mudança (RF-018,
 * REQ-TRACE-005, feature 0007). NUNCA executa git: apenas apresenta a sugestão e
 * oferece copiar para a área de transferência (NFR-TRACE-001). Lógica pura em
 * commitSuggest.ts.
 */
async function suggestCommit(node: unknown): Promise<void> {
  const change = featureChangeOf(node)
  if (!change) {
    vscode.window.showInformationMessage(
      'SDD: use a ação "Sugerir commit" de uma feature no painel Features.',
    )
    return
  }
  const suggestion = buildCommitSuggestion({ id: change.id, type: change.type, title: change.title })
  const COPY_MSG = 'Copiar mensagem'
  const COPY_BRANCH = 'Copiar branch'
  const choice = await vscode.window.showInformationMessage(
    `SDD: sugestão para ${change.id} (revise e aplique você mesmo — nada é commitado).`,
    { modal: true, detail: `Branch:\n  ${suggestion.branch}\n\nCommit:\n  ${suggestion.message}` },
    COPY_MSG,
    COPY_BRANCH,
  )
  if (choice === COPY_MSG) {
    await vscode.env.clipboard.writeText(suggestion.message)
    vscode.window.showInformationMessage('SDD: mensagem de commit copiada.')
  } else if (choice === COPY_BRANCH) {
    await vscode.env.clipboard.writeText(suggestion.branch)
    vscode.window.showInformationMessage('SDD: nome de branch copiado.')
  }
}

/**
 * Valida uma mudança (RF-017, REQ-EVID-001, feature 0008). Lê o traceability.yaml, classifica
 * cada requisito pela cobertura declarada (heurística D-Q3) e apresenta o relatório num
 * WebviewPanel (ADR-012). Somente leitura: nada é executado nem escrito (NFR-EVID-004).
 */
async function validateChange(node: unknown): Promise<void> {
  const root = vscode.workspace.workspaceFolders?.[0]?.uri
  if (!root) {
    vscode.window.showWarningMessage('SDD: abra uma pasta para validar a mudança.')
    return
  }
  const change = featureChangeOf(node)
  if (!change || !change.path) {
    vscode.window.showInformationMessage(
      'SDD: use a ação "Validar mudança" de uma feature no painel Features.',
    )
    return
  }

  const text = await readText(
    vscode.Uri.joinPath(root, '.specs', ...change.path.split('/'), 'traceability.yaml'),
  )
  if (text === undefined) {
    vscode.window.showInformationMessage(
      `SDD: ${change.id} ainda não tem traceability.yaml — gere com /sdd-kit:tasks.`,
    )
    return
  }

  const report = buildValidationReport(text, change.id)
  const panel = vscode.window.createWebviewPanel(
    'sddValidation',
    `Validação — ${change.id}`,
    vscode.ViewColumn.Active,
    { enableScripts: false, localResourceRoots: [] },
  )
  panel.webview.html = renderValidationHtml(report, nonce())

  const pend = report.summary['nao-atendido'] + report.summary['nao-testado'] + report.summary.parcial
  vscode.window.showInformationMessage(
    pend === 0
      ? `SDD: validação de ${change.id} — ${report.summary.atendido} atendido(s), sem pendências.`
      : `SDD: validação de ${change.id} — ${pend} requisito(s) com pendência. Ver o relatório.`,
  )
}

/** Nonce alfanumérico para a CSP dos webviews (RF-017/ADR-012). */
function nonce(): string {
  return randomBytes(16).toString('base64').replace(/[^a-zA-Z0-9]/g, '')
}

/**
 * Coleta evidências de uma mudança (RF-016, REQ-EVID-002, feature 0008). Reúne o que JÁ
 * existe — resumo da validação, estado do Git, diff, commits, progresso — e organiza num
 * evidence.md (D-Q4: nada é executado). Não sobrescreve um evidence.md existente (D-Q5):
 * nesse caso copia o conteúdo para a área de transferência e oferece abrir o atual.
 */
async function collectEvidence(node: unknown): Promise<void> {
  const root = vscode.workspace.workspaceFolders?.[0]?.uri
  if (!root) {
    vscode.window.showWarningMessage('SDD: abra uma pasta para coletar evidências.')
    return
  }
  const change = featureChangeOf(node)
  if (!change || !change.path) {
    vscode.window.showInformationMessage(
      'SDD: use a ação "Coletar evidências" de uma feature no painel Features.',
    )
    return
  }
  const changeDir = ['.specs', ...change.path.split('/')]

  const traceText = await readText(vscode.Uri.joinPath(root, ...changeDir, 'traceability.yaml'))
  const validation = traceText ? buildValidationReport(traceText, change.id).summary : undefined

  const statusText = await readText(vscode.Uri.joinPath(root, ...changeDir, 'status.yaml'))
  const progress = statusText ? parseTaskProgress(statusText) : undefined

  let git: { branch?: string; changedCount: number; totalAdded: number; totalRemoved: number } | undefined
  const raw = await readGit(root.fsPath)
  if (raw) {
    const status = parseStatus(raw.statusV2)
    const stats = parseNumstat(raw.numstat)
    git = {
      branch: status.branch,
      changedCount: status.files.length,
      totalAdded: stats.reduce((sum, e) => sum + (e.added ?? 0), 0),
      totalRemoved: stats.reduce((sum, e) => sum + (e.removed ?? 0), 0),
    }
  }
  const numeric = /^(\d+)/.exec(change.id)?.[1] ?? change.id
  const commits = parseLog(await readCommits(root.fsPath, numeric))

  const markdown = buildEvidenceMarkdown({
    changeId: change.id,
    title: change.title,
    type: change.type,
    status: change.status,
    date: today(),
    tasks: progress ? { total: progress.total, done: progress.done } : undefined,
    validation,
    git,
    commits,
  })

  const evidenceUri = vscode.Uri.joinPath(root, ...changeDir, 'evidence.md')
  if (await exists(evidenceUri)) {
    // Não sobrescreve conteúdo humano (D-Q5): copia e oferece abrir o existente.
    await vscode.env.clipboard.writeText(markdown)
    const open = await vscode.window.showWarningMessage(
      `SDD: ${change.id} já tem evidence.md — não sobrescrevo. As evidências coletadas foram copiadas para você mesclar.`,
      'Abrir evidence.md',
    )
    if (open === 'Abrir evidence.md') {
      await vscode.commands.executeCommand('vscode.open', evidenceUri)
    }
    return
  }

  const confirm = await vscode.window.showInformationMessage(
    `SDD: criar evidence.md de ${change.id} com as evidências coletadas? Revise e complete o que ficou marcado.`,
    { modal: true, detail: markdown.slice(0, 1500) },
    'Criar',
  )
  if (confirm !== 'Criar') {
    return
  }
  await vscode.workspace.fs.writeFile(evidenceUri, Buffer.from(markdown, 'utf8'))
  await vscode.commands.executeCommand('vscode.open', evidenceUri)
  vscode.window.showInformationMessage(`SDD: evidence.md criado em .specs/${change.path}.`)
}

/**
 * Métricas locais de uma mudança (RF-021/RF-022, feature 0009). Calcula o subconjunto viável
 * a partir de .specs/+Git (núcleo puro), persiste um snapshot local no workspaceState (RNF-004,
 * ADR-013) para o delta vs. a medição anterior, e apresenta num WebviewPanel. Desativável por
 * `sddClaudeKit.metrics.enabled`. Nada é enviado para fora.
 */
async function metricsFeature(node: unknown, context: vscode.ExtensionContext): Promise<void> {
  if (!vscode.workspace.getConfiguration('sddClaudeKit').get<boolean>('metrics.enabled', true)) {
    vscode.window.showInformationMessage(
      'SDD: a coleta de métricas está desativada (sddClaudeKit.metrics.enabled).',
    )
    return
  }
  const root = vscode.workspace.workspaceFolders?.[0]?.uri
  if (!root) {
    vscode.window.showWarningMessage('SDD: abra uma pasta para calcular métricas.')
    return
  }
  const change = featureChangeOf(node)
  if (!change || !change.path) {
    vscode.window.showInformationMessage(
      'SDD: use a ação "Métricas da feature" de uma feature no painel Features.',
    )
    return
  }
  const changeDir = ['.specs', ...change.path.split('/')]

  const statusYaml = await readText(vscode.Uri.joinPath(root, ...changeDir, 'status.yaml'))
  const traceabilityYaml = await readText(vscode.Uri.joinPath(root, ...changeDir, 'traceability.yaml'))

  let git: { changedFiles: number; added: number; removed: number } | undefined
  const raw = await readGit(root.fsPath)
  if (raw) {
    const status = parseStatus(raw.statusV2)
    const stats = parseNumstat(raw.numstat)
    git = {
      changedFiles: status.files.length,
      added: stats.reduce((sum, e) => sum + (e.added ?? 0), 0),
      removed: stats.reduce((sum, e) => sum + (e.removed ?? 0), 0),
    }
  }

  // Contexto estimado (0005): tokens do texto dos artefatos da mudança.
  const texts = await Promise.all(
    ['spec.md', 'design.md', 'tasks.md'].map((f) => readText(vscode.Uri.joinPath(root, ...changeDir, f))),
  )
  const joined = texts.filter((t): t is string => t !== undefined).join('\n')
  const contextTokens = joined.length > 0 ? estimateTokens(joined) : undefined

  const snapshot = computeMetrics({
    changeId: change.id,
    type: change.type,
    title: change.title,
    status: change.status,
    timestamp: new Date().toISOString(),
    statusYaml,
    traceabilityYaml,
    git,
    contextTokens,
  })

  const key = `metrics:${change.id}`
  const prev = context.workspaceState.get<MetricsSnapshot>(key)
  const delta = prev ? compareSnapshots(prev, snapshot) : undefined
  await context.workspaceState.update(key, snapshot) // persistência local (RNF-004)

  const panel = vscode.window.createWebviewPanel(
    'sddMetrics',
    `Métricas — ${change.id}`,
    vscode.ViewColumn.Active,
    { enableScripts: false, localResourceRoots: [] },
  )
  panel.webview.html = renderMetricsHtml(snapshot, delta, nonce())

  const MD = 'Exportar Markdown'
  const JSON_LABEL = 'Exportar JSON'
  const choice = await vscode.window.showInformationMessage(
    `SDD: métricas de ${change.id} — ${snapshot.validatedPct}% validado, ${snapshot.tasksDone}/${snapshot.tasksTotal} tarefa(s).`,
    MD,
    JSON_LABEL,
  )
  if (choice === MD) {
    await vscode.env.clipboard.writeText(renderMetricsMarkdown(snapshot))
    vscode.window.showInformationMessage('SDD: métricas (Markdown) copiadas.')
  } else if (choice === JSON_LABEL) {
    await vscode.env.clipboard.writeText(toMetricsJson(snapshot))
    vscode.window.showInformationMessage('SDD: métricas (JSON) copiadas.')
  }
}

/** Traduz os diagnósticos puros para a Diagnostics API, agrupados por arquivo. */
function publishDoctor(
  collection: vscode.DiagnosticCollection,
  root: vscode.Uri,
  diagnostics: DoctorDiagnostic[],
): void {
  collection.clear()
  const byPath = new Map<string, vscode.Diagnostic[]>()
  const range = new vscode.Range(0, 0, 0, 0)
  for (const d of diagnostics) {
    const rel = d.path ?? '.specs/index.yaml'
    const message = d.suggestion ? `${d.message}\nCorreção: ${d.suggestion}` : d.message
    const diag = new vscode.Diagnostic(range, message, severityOf(d.severity))
    diag.source = 'SDD Doctor'
    diag.code = d.code
    const list = byPath.get(rel) ?? []
    list.push(diag)
    byPath.set(rel, list)
  }
  for (const [rel, list] of byPath) {
    collection.set(vscode.Uri.joinPath(root, ...rel.split('/')), list)
  }
}

function severityOf(severity: DoctorDiagnostic['severity']): vscode.DiagnosticSeverity {
  switch (severity) {
    case 'error':
      return vscode.DiagnosticSeverity.Error
    case 'warning':
      return vscode.DiagnosticSeverity.Warning
    case 'info':
      return vscode.DiagnosticSeverity.Information
  }
}

/** Reúne os diretórios de mudança do disco (rel sob .specs, ex.: features/0009-x). */
async function collectChangeDirs(root: vscode.Uri): Promise<string[]> {
  const categories = ['features', 'bugs', 'refactors', 'changes', 'archive']
  const dirs: string[] = []
  for (const category of categories) {
    let entries: [string, vscode.FileType][]
    try {
      entries = await vscode.workspace.fs.readDirectory(vscode.Uri.joinPath(root, '.specs', category))
    } catch {
      continue // categoria ainda não existe
    }
    for (const [name, kind] of entries) {
      if (kind === vscode.FileType.Directory && /^\d{4}-/.test(name)) {
        dirs.push(`${category}/${name}`)
      }
    }
  }
  return dirs
}

/** Ambiente para a detecção do Claude Code a partir do host (ADR-002, reuso de 0001). */
function hostClaudeEnv(): ClaudeCodeEnv {
  const configured = vscode.workspace
    .getConfiguration('sddClaudeKit')
    .get<string>('claudeCode.path', '')
  return {
    platform: process.platform,
    pathVar: process.env.PATH,
    pathExt: process.env.PATHEXT,
    configuredPath: configured,
    isExecutable: async (absPath) => {
      try {
        const stat = await vscode.workspace.fs.stat(vscode.Uri.file(absPath))
        return (stat.type & vscode.FileType.File) !== 0
      } catch {
        return false
      }
    },
  }
}
