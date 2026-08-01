// Borda do adapter de Git (feature 0007, RF-018, ADR-011). Executa APENAS comandos de
// leitura do `git` no diretório do workspace e devolve a saída crua para os parsers puros
// (gitParse.ts). Nunca escreve no repositório (NFR-TRACE-001); sem rede (NFR-TRACE-004).
// Git ausente / diretório fora de um repo → undefined, tratado pela borda chamadora.
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

const run = promisify(execFile)
const MAX_BUFFER = 16 * 1024 * 1024 // diffs grandes cabem sem estourar

export interface GitRaw {
  /** Saída de `git status --porcelain=v2 --branch`. */
  statusV2: string
  /** Saída de `git diff --numstat HEAD` (vazia se não há HEAD ou não há mudanças). */
  numstat: string
}

/**
 * Lê o estado do Git do workspace. Devolve `undefined` quando não há repositório ou o
 * `git` não está disponível. Somente leitura: nenhum comando de escrita é executado.
 */
export async function readGit(cwd: string): Promise<GitRaw | undefined> {
  const statusV2 = await tryGit(cwd, ['status', '--porcelain=v2', '--branch'])
  if (statusV2 === undefined) {
    return undefined // não é repo / git ausente
  }
  // `diff --numstat HEAD` falha em repo sem commits (sem HEAD); nesse caso, vazio.
  const numstat = (await tryGit(cwd, ['diff', '--numstat', 'HEAD'])) ?? ''
  return { statusV2, numstat }
}

async function tryGit(cwd: string, args: string[]): Promise<string | undefined> {
  try {
    const { stdout } = await run('git', args, { cwd, maxBuffer: MAX_BUFFER, windowsHide: true })
    return stdout
  } catch {
    return undefined
  }
}
