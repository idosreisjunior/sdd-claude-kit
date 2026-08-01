// Núcleo puro do adapter de Git (feature 0007, RF-018) — sem dependência da API do
// VS Code, para ser testável fora do host (standards §6, ADR-011). A borda que executa
// o `git` fica em gitAdapter.ts; aqui só o parsing da saída.
//
// Formatos estáveis desenhados para máquina: `git status --porcelain=v2 --branch` e
// `git diff --numstat`. Robusto (NFR-TRACE-003): linha desconhecida é ignorada, entrada
// vazia vira estado vazio, nunca lança.

export interface GitFile {
  path: string
  staged: boolean
  unstaged: boolean
  untracked: boolean
  conflict: boolean
}

export interface GitStatus {
  /** Branch atual; undefined se destacado ou não informado. */
  branch?: string
  files: GitFile[]
}

/** Uma linha do `git diff --numstat`. `added`/`removed` = null para binário. */
export interface DiffStat {
  path: string
  added: number | null
  removed: number | null
}

/**
 * Faz parsing de `git status --porcelain=v2 --branch`. Cada arquivo vira um GitFile.
 * Puro e robusto: linhas fora do formato são ignoradas.
 */
export function parseStatus(porcelainV2: string): GitStatus {
  const status: GitStatus = { files: [] }
  for (const raw of porcelainV2.split('\n')) {
    const line = raw.replace(/\r$/, '')
    if (line.length === 0) {
      continue
    }
    if (line.startsWith('# branch.head ')) {
      const head = line.slice('# branch.head '.length).trim()
      status.branch = head === '(detached)' ? undefined : head
      continue
    }
    if (line.startsWith('# ')) {
      continue // outros cabeçalhos de branch
    }
    const file = parseFileLine(line)
    if (file) {
      status.files.push(file)
    }
  }
  return status
}

/** Interpreta uma linha de arquivo do porcelain=v2 (tipos 1, 2, u, ?). */
function parseFileLine(line: string): GitFile | undefined {
  const marker = line[0]
  const tokens = line.split(' ')

  if (marker === '?') {
    // "? <path>"
    const path = restFrom(line, 1)
    return path ? { path, staged: false, unstaged: false, untracked: true, conflict: false } : undefined
  }
  if (marker === 'u') {
    // "u <xy> <sub> <m1> <m2> <m3> <mW> <h1> <h2> <h3> <path>" — 10 campos fixos
    const path = restFrom(line, 10)
    return path ? { path, staged: false, unstaged: false, untracked: false, conflict: true } : undefined
  }
  if (marker === '1' || marker === '2') {
    // "1 <XY> ..." (8 campos fixos) / "2 <XY> ... <path>\t<orig>" (9 campos fixos)
    const xy = tokens[1]
    if (!xy || xy.length < 2) {
      return undefined
    }
    const staged = xy[0] !== '.'
    const unstaged = xy[1] !== '.'
    const rest = restFrom(line, marker === '1' ? 8 : 9)
    if (!rest) {
      return undefined
    }
    const path = marker === '2' ? rest.split('\t')[0] : rest // rename: <path>\t<orig>
    return { path, staged, unstaged, untracked: false, conflict: false }
  }
  return undefined // linha desconhecida
}

/** Devolve os campos a partir do índice `n` (juntos por espaço), ou '' se não houver. */
function restFrom(line: string, n: number): string {
  const tokens = line.split(' ')
  return tokens.length > n ? tokens.slice(n).join(' ') : ''
}

/**
 * Faz parsing de `git diff --numstat`: linhas "adicionadas\tremovidas\tcaminho".
 * "-" (binário) vira null. Puro e robusto.
 */
export function parseNumstat(numstat: string): DiffStat[] {
  const out: DiffStat[] = []
  for (const raw of numstat.split('\n')) {
    const line = raw.replace(/\r$/, '')
    if (line.length === 0) {
      continue
    }
    const parts = line.split('\t')
    if (parts.length < 3) {
      continue
    }
    const path = parts.slice(2).join('\t')
    if (!path) {
      continue
    }
    out.push({ path, added: numOrNull(parts[0]), removed: numOrNull(parts[1]) })
  }
  return out
}

function numOrNull(value: string): number | null {
  if (value === '-') {
    return null // binário
  }
  const n = Number(value)
  return Number.isInteger(n) && n >= 0 ? n : null
}

/** Um commit do `git log --oneline`. */
export interface LogEntry {
  hash: string
  subject: string
}

/** Faz parsing de `git log --oneline` ("<hash> <assunto>"). Puro e robusto. */
export function parseLog(oneline: string): LogEntry[] {
  const out: LogEntry[] = []
  for (const raw of oneline.split('\n')) {
    const line = raw.replace(/\r$/, '').trim()
    if (line.length === 0) {
      continue
    }
    const space = line.indexOf(' ')
    if (space < 0) {
      out.push({ hash: line, subject: '' })
    } else {
      out.push({ hash: line.slice(0, space), subject: line.slice(space + 1) })
    }
  }
  return out
}
