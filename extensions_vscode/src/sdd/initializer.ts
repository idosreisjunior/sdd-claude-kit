import * as vscode from 'vscode'
import {
  generate,
  planFiles,
  substitute,
  templatePathFor,
  type Vars,
} from './initTemplates'

/**
 * Inicialização da estrutura .specs (RF-001, TASK-FOUND-005).
 *
 * Por ADR-001, os documentos de projeto vêm dos templates EMBUTIDOS na extensão
 * (`templates/<lang>/…`), nunca do plugin instalado. Os arquivos de máquina
 * (`config.yaml`, `index.yaml`) são gerados já válidos contra os schemas — assim
 * a estrutura nunca nasce com um `{{placeholder}}` em campo que a CLI lê.
 *
 * A lógica pura (plano, geradores, substituição) vive em `initTemplates.ts`,
 * sem depender da API do VS Code. Aqui fica só o IO com `workspace.fs`.
 */

export interface InitResult {
  created: string[]
  /** Arquivos que já existiam e foram preservados (nunca sobrescritos). */
  skipped: string[]
}

export { planFiles } from './initTemplates'

/** Verdadeiro quando o workspace já tem `.specs/config.yaml`. */
export async function isInitialized(root: vscode.Uri): Promise<boolean> {
  return exists(vscode.Uri.joinPath(root, '.specs', 'config.yaml'))
}

/**
 * Cria a estrutura. Nunca sobrescreve um arquivo existente: se algo já está lá,
 * é preservado e reportado em `skipped` (SCN-FOUND-004 / SCN-FOUND-005).
 */
export async function runInitialization(
  context: vscode.ExtensionContext,
  root: vscode.Uri,
  language = 'pt-BR',
): Promise<InitResult> {
  const vars: Vars = { PROJECT_NAME: workspaceName(root), DATE: today() }

  const created: string[] = []
  const skipped: string[] = []

  for (const file of planFiles()) {
    const target = uriFor(root, file.relPath)
    if (await exists(target)) {
      skipped.push(file.relPath)
      continue
    }
    const content =
      file.origin === 'gerado'
        ? generate(file.relPath, vars, language)
        : substitute(await readEmbeddedDoc(context, language, file.relPath), vars)

    await vscode.workspace.fs.writeFile(target, Buffer.from(content, 'utf8'))
    created.push(file.relPath)
  }

  return { created, skipped }
}

async function readEmbeddedDoc(
  context: vscode.ExtensionContext,
  language: string,
  specRelPath: string,
): Promise<string> {
  const within = templatePathFor(specRelPath)
  const templateUri = vscode.Uri.joinPath(
    context.extensionUri,
    'templates',
    language,
    ...within.split('/'),
  )
  const bytes = await vscode.workspace.fs.readFile(templateUri)
  return Buffer.from(bytes).toString('utf8')
}

function workspaceName(root: vscode.Uri): string {
  const parts = root.path.split('/').filter(Boolean)
  return parts[parts.length - 1] ?? 'projeto'
}

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

function uriFor(root: vscode.Uri, relPath: string): vscode.Uri {
  return vscode.Uri.joinPath(root, ...relPath.split('/'))
}

async function exists(uri: vscode.Uri): Promise<boolean> {
  try {
    await vscode.workspace.fs.stat(uri)
    return true
  } catch {
    return false
  }
}
