// Núcleo puro da detecção de mudanças fora do escopo (feature 0007, RF-014) — sem a
// API do VS Code (standards §6, NFR-TRACE-002). Compara os arquivos alterados (do Git)
// com os arquivos prováveis da tarefa em andamento (D-Q5) e sinaliza divergências.
// Alertas são INFORMATIVOS, não bloqueios (D-Q4). Puro e determinístico; nunca lança.
import type { DiffStat } from './gitParse'

export type AlertKind = 'unplanned' | 'sensitive' | 'removal' | 'diff-limit' | 'dependency'

export interface ScopeAlert {
  kind: AlertKind
  path?: string
  message: string
}

export interface ScopeConfig {
  /** Globs de arquivos sensíveis (D-Q3). */
  sensitiveGlobs: string[]
  /** Limite de linhas (added+removed) do diff antes de alertar. */
  maxLines: number
  /** Limite de arquivos alterados antes de alertar. */
  maxFiles: number
  /** Manifests cuja alteração indica dependência nova/alterada. */
  dependencyManifests: string[]
}

/** Defaults sensatos (D-Q3); a borda os mescla com sddClaudeKit.scope.*. */
export const DEFAULT_SCOPE_CONFIG: ScopeConfig = {
  sensitiveGlobs: ['.env', '.env.*', '**/*.pem', '**/*.key', '**/id_rsa'],
  maxLines: 400,
  maxFiles: 20,
  dependencyManifests: ['package.json', 'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml'],
}

export interface ScopeInput {
  /** Todos os arquivos alterados (rastreados + não rastreados), caminhos do Git. */
  changedFiles: string[]
  /** Arquivos prováveis da tarefa em andamento (D-Q5). Vazio = sem tarefa para comparar. */
  plannedFiles: string[]
  /** Estatísticas do diff (para linhas e remoções). */
  diffStats: DiffStat[]
  config: ScopeConfig
}

/**
 * Avalia o escopo (REQ-TRACE-003). Devolve os alertas encontrados, do mais específico
 * (arquivo) ao agregado (limite). Determinístico.
 */
export function checkScope(input: ScopeInput): ScopeAlert[] {
  const alerts: ScopeAlert[] = []
  const { changedFiles, plannedFiles, diffStats, config } = input

  for (const file of changedFiles) {
    // Arquivo sensível (independe do previsto — SCN-TRACE-005).
    if (matchesAnyGlob(file, config.sensitiveGlobs)) {
      alerts.push({ kind: 'sensitive', path: file, message: `Arquivo sensível alterado: ${file}` })
    }
    // Dependência nova/alterada.
    if (isDependencyManifest(file, config.dependencyManifests)) {
      alerts.push({ kind: 'dependency', path: file, message: `Manifesto de dependências alterado: ${file}` })
    }
    // Fora do previsto (só quando há uma tarefa para comparar — SCN-TRACE-004/006).
    if (plannedFiles.length > 0 && !isPlanned(file, plannedFiles)) {
      alerts.push({ kind: 'unplanned', path: file, message: `Arquivo alterado fora dos previstos na tarefa: ${file}` })
    }
  }

  // Remoção não solicitada: arquivo só perdeu linhas (removed>0, added=0).
  for (const stat of diffStats) {
    if ((stat.added ?? 0) === 0 && (stat.removed ?? 0) > 0) {
      alerts.push({ kind: 'removal', path: stat.path, message: `Remoção sem adição em ${stat.path} (${stat.removed} linhas)` })
    }
  }

  // Limite de diff (linhas e arquivos).
  const totalLines = diffStats.reduce((sum, s) => sum + (s.added ?? 0) + (s.removed ?? 0), 0)
  if (totalLines > config.maxLines) {
    alerts.push({ kind: 'diff-limit', message: `Diff extenso: ${totalLines} linhas (limite ${config.maxLines})` })
  }
  if (changedFiles.length > config.maxFiles) {
    alerts.push({ kind: 'diff-limit', message: `Muitos arquivos alterados: ${changedFiles.length} (limite ${config.maxFiles})` })
  }

  return alerts
}

/**
 * Um arquivo alterado é "previsto" se casa com algum arquivo provável. Comparação
 * tolerante ao prefixo do subprojeto: o Git dá caminhos relativos à raiz do repo
 * (ex.: extensions_vscode/src/x.ts) e o tasks.md costuma listar relativos ao
 * subprojeto (src/x.ts) — casa por sufixo em qualquer direção.
 */
function isPlanned(changed: string, planned: string[]): boolean {
  const c = normalize(changed)
  return planned.some((p) => {
    const n = normalize(p)
    return c === n || c.endsWith('/' + n) || n.endsWith('/' + c)
  })
}

function isDependencyManifest(file: string, manifests: string[]): boolean {
  const base = basename(file)
  return manifests.includes(base)
}

function normalize(path: string): string {
  return path.replace(/\\/g, '/').replace(/^\.\//, '')
}

function basename(path: string): string {
  const n = normalize(path)
  const i = n.lastIndexOf('/')
  return i >= 0 ? n.slice(i + 1) : n
}

/** Casa `path` com algum glob (por caminho completo ou por basename). */
function matchesAnyGlob(path: string, globs: string[]): boolean {
  const n = normalize(path)
  const base = basename(n)
  return globs.some((g) => {
    const re = globToRegExp(g)
    return re.test(n) || re.test(base)
  })
}

/** Converte um glob simples (`*`, `**`) em RegExp ancorada. Puro. */
function globToRegExp(glob: string): RegExp {
  let re = '^'
  for (let i = 0; i < glob.length; i++) {
    const ch = glob[i]
    if (ch === '*') {
      if (glob[i + 1] === '*') {
        re += '.*' // ** — atravessa diretórios
        i++
      } else {
        re += '[^/]*' // * — dentro de um segmento
      }
    } else if ('.+?^${}()|[]\\'.includes(ch)) {
      re += '\\' + ch
    } else {
      re += ch
    }
  }
  return new RegExp(re + '$')
}
