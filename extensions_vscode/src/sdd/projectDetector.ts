import * as vscode from 'vscode'
import { promises as fsp, constants as fsconst } from 'node:fs'
import { detectFrom, type ExistsProbe, type ProjectDetection } from './detection'
import { detectClaudeCode, type ClaudeCodeEnv, type ClaudeCodeDetection } from './claudeCode'

/** Diagnóstico do workspace com a raiz resolvida (RF-001). */
export interface WorkspaceDetection extends ProjectDetection {
  /** Raiz do workspace, ou undefined quando nenhuma pasta está aberta. */
  root: vscode.Uri | undefined
  /** Disponibilidade do Claude Code (ADR-002). */
  claudeCode: ClaudeCodeDetection
}

/**
 * Diagnostica o workspace ativo. Somente leitura: nunca escreve nada.
 *
 * A lógica de decisão vive em módulos sem VS Code (`detection.ts`,
 * `claudeCode.ts`) e é exercida aqui com probes apoiados em `workspace.fs` e
 * `node:fs`, que funcionam em Windows, Linux e WSL (NFR-FOUND-001).
 */
export async function detectProject(): Promise<WorkspaceDetection> {
  const root = vscode.workspace.workspaceFolders?.[0]?.uri
  const [detection, claudeCode] = await Promise.all([
    detectFrom(root !== undefined, probeFor(root)),
    detectClaudeCode(nodeClaudeEnv()),
  ])
  return { root, ...detection, claudeCode }
}

/** Probe apoiado em workspace.fs para a raiz dada (ou sempre falso sem raiz). */
export function probeFor(root: vscode.Uri | undefined): ExistsProbe {
  return async (relPath) => {
    if (!root) {
      return false
    }
    try {
      await vscode.workspace.fs.stat(vscode.Uri.joinPath(root, ...relPath.split('/')))
      return true
    } catch {
      return false
    }
  }
}

/** Ambiente real para a detecção do Claude Code (ADR-002). */
function nodeClaudeEnv(): ClaudeCodeEnv {
  const configured = vscode.workspace
    .getConfiguration('sddClaudeKit')
    .get<string>('claudeCode.path')
  return {
    platform: process.platform,
    pathVar: process.env['PATH'],
    pathExt: process.env['PATHEXT'],
    configuredPath: configured && configured.trim() !== '' ? configured : undefined,
    isExecutable: async (absPath) => {
      try {
        await fsp.access(absPath, fsconst.X_OK)
        return (await fsp.stat(absPath)).isFile()
      } catch {
        return false
      }
    },
  }
}
