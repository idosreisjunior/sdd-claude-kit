// Detecção do Claude Code — lógica pura, sem dependência da API do VS Code
// (ADR-002, TASK-FOUND-004). Recebe o ambiente e um probe injetáveis, para ser
// testável nos perfis Windows e POSIX sem depender da máquina que roda o teste.

export interface ClaudeCodeEnv {
  /** process.platform do host. */
  platform: NodeJS.Platform
  /** Conteúdo da variável PATH. */
  pathVar: string | undefined
  /** Conteúdo de PATHEXT (Windows). */
  pathExt: string | undefined
  /** Caminho configurado explicitamente pelo usuário, se houver. */
  configuredPath: string | undefined
  /** Verdadeiro se o caminho aponta para um executável. Não deve lançar. */
  isExecutable: (absPath: string) => Promise<boolean>
}

export interface ClaudeCodeDetection {
  available: boolean
  /** Caminho encontrado, quando disponível. */
  path: string | undefined
  /** Como foi encontrado. */
  via: 'config' | 'path' | undefined
}

const NOT_FOUND: ClaudeCodeDetection = { available: false, path: undefined, via: undefined }

/**
 * Detecta o Claude Code. Nunca lança nem trava: qualquer falha do probe vira
 * "não encontrado". Sem execução de processo (ADR-002).
 */
export async function detectClaudeCode(env: ClaudeCodeEnv): Promise<ClaudeCodeDetection> {
  const isWin = env.platform === 'win32'

  // 1. Caminho configurado tem precedência sobre o PATH.
  if (env.configuredPath && env.configuredPath.trim() !== '') {
    if (await safeExecutable(env, env.configuredPath)) {
      return { available: true, path: env.configuredPath, via: 'config' }
    }
  }

  // 2. Varredura do PATH do host.
  const names = candidateNames(isWin, env.pathExt)
  for (const dir of splitPath(env.pathVar, isWin)) {
    for (const name of names) {
      const candidate = joinPath(dir, name, isWin)
      if (await safeExecutable(env, candidate)) {
        return { available: true, path: candidate, via: 'path' }
      }
    }
  }

  return NOT_FOUND
}

async function safeExecutable(env: ClaudeCodeEnv, path: string): Promise<boolean> {
  try {
    return await env.isExecutable(path)
  } catch {
    return false
  }
}

/** Divide a variável PATH pelos separadores da plataforma. */
export function splitPath(pathVar: string | undefined, isWin: boolean): string[] {
  if (!pathVar) {
    return []
  }
  return pathVar
    .split(isWin ? ';' : ':')
    .map((dir) => dir.trim())
    .filter((dir) => dir.length > 0)
}

/** Nomes candidatos do executável, por plataforma. */
export function candidateNames(isWin: boolean, pathExt: string | undefined): string[] {
  if (!isWin) {
    return ['claude']
  }
  const exts = (pathExt && pathExt.trim() !== '' ? pathExt : '.COM;.EXE;.BAT;.CMD')
    .split(';')
    .map((ext) => ext.trim())
    .filter((ext) => ext.length > 0)
  return [...exts.map((ext) => `claude${ext.toLowerCase()}`), 'claude']
}

function joinPath(dir: string, name: string, isWin: boolean): string {
  const sep = isWin ? '\\' : '/'
  const base = dir.endsWith('\\') || dir.endsWith('/') ? dir.slice(0, -1) : dir
  return `${base}${sep}${name}`
}
