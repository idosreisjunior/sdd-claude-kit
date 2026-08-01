// Núcleo puro do Context Guardian (feature 0005, RF-012) — sem dependência da API
// do VS Code, para ser testável fora do host (standards §6). A borda (leitura de
// arquivos, barra de status) fica em extension.ts.
//
// Por ADR-008: a contagem de tokens é uma HEURÍSTICA LOCAL (~4 caracteres/token),
// determinística e sempre rotulada como estimativa; sem tokenizer nativo nem rede.

/** Faixas do PRD §13.3 (normal / atenção / risco / bloqueio). */
export type Band = 'normal' | 'atencao' | 'risco' | 'bloqueio'

/** Limiares como frações do teto (config sddClaudeKit.context.*). */
export interface Thresholds {
  warning: number
  risk: number
  block: number
}

export interface Usage {
  used: number
  max: number
  /** used/max, ou 0 quando não há teto. */
  fraction: number
  band: Band
}

/** Limite padrão de "arquivo grande" (bytes): acima disso, sinaliza sem ler tudo. */
export const LARGE_FILE_BYTES = 128 * 1024

/**
 * Estima tokens por heurística local (ADR-008): ~4 caracteres por token. Texto
 * vazio estima zero. Determinística: a mesma entrada dá sempre o mesmo valor.
 */
export function estimateTokens(text: string): number {
  if (text.length === 0) {
    return 0
  }
  return Math.ceil(text.length / 4)
}

/** Estima tokens a partir do tamanho em bytes, para arquivos não lidos (grandes). */
export function estimateTokensFromBytes(bytes: number): number {
  if (bytes <= 0) {
    return 0
  }
  return Math.ceil(bytes / 4)
}

/**
 * Classifica o uso nas quatro faixas (REQ-CTX-002). O valor exatamente no limiar
 * entra na faixa mais alta (`≥`). Sem teto (`max <= 0`) → fração 0 → normal.
 */
export function classifyUsage(used: number, max: number, t: Thresholds): Usage {
  const fraction = max > 0 ? used / max : 0
  let band: Band = 'normal'
  if (fraction >= t.block) {
    band = 'bloqueio'
  } else if (fraction >= t.risk) {
    band = 'risco'
  } else if (fraction >= t.warning) {
    band = 'atencao'
  }
  return { used, max, fraction, band }
}

/** Detecta binário por byte nulo numa amostra (heurística usual). */
export function isBinary(sample: Uint8Array): boolean {
  for (let i = 0; i < sample.length; i++) {
    if (sample[i] === 0) {
      return true
    }
  }
  return false
}

/** Um arquivo candidato ao contexto, já com o que a borda conseguiu ler. */
export interface ContextFile {
  path: string
  /** Texto do arquivo; ausente quando binário ou não lido (grande). */
  text?: string
  /** Tamanho em bytes (de stat), para sinalizar "grande" sem ler tudo. */
  bytes: number
  /** Detectado como binário: não conta para a estimativa. */
  binary: boolean
}

export interface ContextEntry {
  path: string
  tokens: number
  bytes: number
  binary: boolean
  large: boolean
}

export interface Composition {
  totalTokens: number
  /** Entradas ordenadas do maior para o menor. */
  entries: ContextEntry[]
  /** Caminhos sinalizados como grandes. */
  large: string[]
  /** Caminhos sinalizados como binários. */
  binary: string[]
}

/**
 * Compõe o contexto (REQ-CTX-003): total de tokens, entradas ordenadas do maior
 * para o menor e listas de grandes/binários. Binário conta 0; texto lido estima
 * por caracteres; texto não lido (grande) estima por bytes, sem carregar o arquivo.
 */
export function buildComposition(files: ContextFile[], largeBytes = LARGE_FILE_BYTES): Composition {
  const entries: ContextEntry[] = files.map((f) => {
    const large = f.bytes >= largeBytes
    let tokens = 0
    if (!f.binary) {
      tokens = f.text !== undefined ? estimateTokens(f.text) : estimateTokensFromBytes(f.bytes)
    }
    return { path: f.path, tokens, bytes: f.bytes, binary: f.binary, large }
  })
  entries.sort((a, b) => b.tokens - a.tokens || b.bytes - a.bytes || a.path.localeCompare(b.path))
  const totalTokens = entries.reduce((sum, e) => sum + e.tokens, 0)
  return {
    totalTokens,
    entries,
    large: entries.filter((e) => e.large).map((e) => e.path),
    binary: entries.filter((e) => e.binary).map((e) => e.path),
  }
}

/** Rótulo pt-BR da faixa, para exibição (RNF de idioma, standards §5). */
export function bandLabel(band: Band): string {
  switch (band) {
    case 'normal':
      return 'normal'
    case 'atencao':
      return 'atenção'
    case 'risco':
      return 'risco'
    case 'bloqueio':
      return 'bloqueio'
  }
}
