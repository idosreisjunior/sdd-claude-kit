// Borda do adapter do GitHub CLI (feature 0021, RF-019, ADR-020). Executa o `gh`
// para detectar disponibilidade e criar issue/PR. Sem rede própria (NFR-GH-002):
// toda a comunicação com o GitHub é do `gh` — a extensão não abre nenhuma conexão.
// Publica só quando a borda chama `ghCreate`, sempre sob confirmação humana (NFR-GH-001).
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

const run = promisify(execFile)
const MAX_BUFFER = 4 * 1024 * 1024

/**
 * O `gh` está instalado e no PATH? Detecção reusa a ideia do 0004 (executável no PATH),
 * via `gh --version` (ADR-020, Q4). Auth/remoto NÃO são pré-checados aqui: o `ghCreate`
 * tenta-e-reporta a pré-condição faltante.
 */
export async function ghAvailable(): Promise<boolean> {
  try {
    await run('gh', ['--version'], { windowsHide: true })
    return true
  } catch {
    return false
  }
}

export type GhKind = 'issue' | 'pr'

export interface GhCreateResult {
  ok: boolean
  /** URL da issue/PR criada (extraída do stdout do `gh`), quando `ok`. */
  url?: string
  /** Mensagem do `gh` (stderr) quando falha — a pré-condição faltante, para a borda informar. */
  error?: string
}

/**
 * Cria uma issue ou PR via `gh`, no diretório do repositório. Não pré-checa auth/remoto:
 * tenta e reporta (ADR-020). Se faltar pré-condição (não autenticado, sem remoto GitHub,
 * branch não publicada), o `gh` falha com uma mensagem clara, devolvida em `error`, e nada
 * é publicado (SCN-GH-004). `execFile` não usa shell — `title`/`body` vão como argumentos
 * literais, sem risco de injeção nem de escaping.
 */
export async function ghCreate(
  kind: GhKind,
  cwd: string,
  title: string,
  body: string,
): Promise<GhCreateResult> {
  const args = [kind, 'create', '--title', title, '--body', body]
  try {
    const { stdout } = await run('gh', args, { cwd, maxBuffer: MAX_BUFFER, windowsHide: true })
    const url = /(https?:\/\/\S+)/.exec(stdout)?.[1]
    return { ok: true, url }
  } catch (err) {
    return { ok: false, error: ghError(err) }
  }
}

/** Extrai a mensagem de erro do `gh` (stderr preferido) de uma falha de `execFile`. */
function ghError(err: unknown): string {
  const e = err as { stderr?: unknown; message?: unknown }
  const stderr = typeof e.stderr === 'string' ? e.stderr.trim() : ''
  if (stderr.length > 0) {
    return stderr
  }
  return typeof e.message === 'string' ? e.message : 'falha ao executar o gh'
}
