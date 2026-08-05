// Passo híbrido do fluxo SDD (features 0014/0015/0017/0022 e agora 0035, TASK-WIZ-010).
//
// Extraído de `extension.ts` para um serviço reusável: o menu de contexto do painel
// Features e o wizard acionam exatamente o MESMO caminho, sem duas regras divergentes.
//
// Por ADR-007, o adapter é fire-and-forget + humano no controle: compõe e copia o prompt
// e deixa-o PRONTO no terminal — não envia a ação nem captura resultado.
import * as vscode from 'vscode'
import { buildLaunchCommand, composePrompt, type SddAction } from './claudePrompt'
import { detectClaudeCode, type ClaudeCodeEnv } from './claudeCode'
import { extractScope } from './designGenerator'
import { buildSkeleton } from './skeleton'
import { featureChangeOf } from '../views/featuresTreeProvider'

const CLAUDE_TERMINAL_NAME = 'SDD · Claude Code'

/**
 * Ambiente de detecção do Claude Code no host (borda do 0004): junta a configuração do
 * usuário, o PATH do processo e um probe de executável sobre o sistema de arquivos.
 */
export function hostClaudeEnv(): ClaudeCodeEnv {
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

/**
 * Compõe o prompt de uma ação SDD, copia-o (RF-011) e deixa-o PRONTO num terminal
 * com a CLI detectada — sem enviar (ADR-007, NFR-CC-001). CLI ausente: prompt
 * copiado + orientação de instalação/configuração (SCN-WIZ-012). Reusado por "Abrir
 * no Claude Code" (0004), pelos passos híbridos (0014) e pelas ações de IA do wizard
 * (0035, REQ-WIZ-003).
 */
export async function launchClaudeAction(
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
  const terminal =
    existing ?? vscode.window.createTerminal({ name: CLAUDE_TERMINAL_NAME, cwd: root })
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
 * Contexto passado à pré-condição de um passo híbrido.
 */
export interface HybridPreconditionCtx {
  root: vscode.Uri
  changeDir: string[]
  changeId: string
  specMd: string | undefined
}

/**
 * Descreve um "passo híbrido" do fluxo SDD (research 0017, design 0014, clarify
 * 0015): scaffolda um arquivo-esqueleto de um template sincronizado e oferece
 * delegar a análise ao Claude Code. As ações diferem só nestes dados.
 */
export interface HybridStep {
  /** Basename do template e do arquivo de saída (ex.: `design.md`). */
  fileName: string
  /** Ação do 0004 delegada ao Claude Code. */
  action: SddAction
  /** Mensagem quando não há pasta aberta. */
  noRootMessage: string
  /** Rótulo da ação no aviso "use a ação X de uma feature". */
  menuLabel: string
  /** Rótulo do botão que delega ao Claude Code. */
  offerLabel: string
  /** Mensagem de sucesso; recebe `change.path` e o esqueleto gerado. */
  createdMessage: (changePath: string, skeleton: string) => string
  /** Pré-condição opcional; devolve a mensagem de bloqueio, ou `undefined` se ok. */
  precondition?: (ctx: HybridPreconditionCtx) => Promise<string | undefined>
}

/**
 * Executa um passo híbrido (RF-007/008/009): valida o nó, a pré-condição e o
 * template, monta o esqueleto (`buildSkeleton`), grava sem sobrescrever sem
 * confirmação, e oferece delegar ao Claude Code. Somente esta função conhece o
 * fluxo; as ações são só descritores.
 */
export async function runHybridStep(
  context: vscode.ExtensionContext,
  node: unknown,
  step: HybridStep,
): Promise<void> {
  const root = vscode.workspace.workspaceFolders?.[0]?.uri
  if (!root) {
    vscode.window.showWarningMessage(step.noRootMessage)
    return
  }
  const change = featureChangeOf(node)
  if (!change || !change.path) {
    vscode.window.showInformationMessage(
      `SDD: use a ação "${step.menuLabel}" de uma feature no painel Features.`,
    )
    return
  }
  const changeDir = ['.specs', ...change.path.split('/')]
  const specMd = await readText(vscode.Uri.joinPath(root, ...changeDir, 'spec.md'))

  if (step.precondition) {
    const blocked = await step.precondition({ root, changeDir, changeId: change.id, specMd })
    if (blocked !== undefined) {
      vscode.window.showInformationMessage(blocked)
      return
    }
  }

  const template = await readText(
    vscode.Uri.joinPath(context.extensionUri, 'templates', 'pt-BR', 'feature', step.fileName),
  )
  if (template === undefined) {
    vscode.window.showErrorMessage(
      `SDD: template feature/${step.fileName} não encontrado no pacote da extensão.`,
    )
    return
  }
  const skeleton = buildSkeleton(template, {
    id: change.id,
    title: change.title,
    scope: extractScope(specMd ?? '') ?? '',
    date: today(),
  })

  const outUri = vscode.Uri.joinPath(root, ...changeDir, step.fileName)
  if (await exists(outUri)) {
    // Não sobrescreve sem confirmação: recusada, o arquivo fica intacto.
    const overwrite = await vscode.window.showWarningMessage(
      `SDD: ${change.id} já tem ${step.fileName}. Sobrescrever com um novo esqueleto? O conteúdo atual será perdido.`,
      { modal: true },
      'Sobrescrever',
    )
    if (overwrite !== 'Sobrescrever') {
      return
    }
  }
  await vscode.workspace.fs.writeFile(outUri, Buffer.from(skeleton, 'utf8'))
  await vscode.commands.executeCommand('vscode.open', outUri)

  const choice = await vscode.window.showInformationMessage(
    step.createdMessage(change.path, skeleton),
    step.offerLabel,
  )
  if (choice === step.offerLabel) {
    await launchClaudeAction(root, change.id, step.action)
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

function today(): string {
  return new Date().toISOString().slice(0, 10)
}
