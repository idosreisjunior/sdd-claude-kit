// Lógica pura da criação de mudança (RF-003, TASK-FEAT-006) — sem dependência da
// API do VS Code, para ser testável fora do host (standards §6). O IO (ler o
// índice, listar diretórios, escrever arquivos) fica na camada do editor.
//
// Por ADR-004: o formulário é um scaffolder determinístico. Slug e escopo são
// entradas do usuário (não traduções automáticas); o `status.yaml` nasce por
// substituição de template; a entrada do `index.yaml` é inserida por edição
// textual, preservando comentários e layout.

export type ChangeType = 'feature' | 'bug' | 'refactor' | 'change'

/** Diretório de cada tipo dentro de `.specs/` (skill `new`, §3). */
export const DIR_FOR: Record<ChangeType, string> = {
  feature: 'features',
  bug: 'bugs',
  refactor: 'refactors',
  change: 'changes',
}

const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/
const SCOPE_RE = /^[A-Z][A-Z0-9]*$/

const ACCENTS: Record<string, string> = {
  á: 'a', à: 'a', â: 'a', ã: 'a', ä: 'a',
  é: 'e', è: 'e', ê: 'e', ë: 'e',
  í: 'i', ì: 'i', î: 'i', ï: 'i',
  ó: 'o', ò: 'o', ô: 'o', õ: 'o', ö: 'o',
  ú: 'u', ù: 'u', û: 'u', ü: 'u',
  ç: 'c', ñ: 'n',
}

/**
 * Saneia um slug pelas regras determinísticas da skill `new` (§4, passos 2–7).
 * Não traduz — a tradução pt→en é juízo de linguagem, reservado a `/sdd-kit:new`.
 */
export function sanitizeSlug(input: string): string {
  const lowered = input.toLowerCase()
  let out = ''
  for (const ch of lowered) {
    out += ACCENTS[ch] ?? ch
  }
  return out
    .replace(/[\s_]+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
    .replace(/-+$/g, '')
}

export function isValidSlug(slug: string): boolean {
  return SLUG_RE.test(slug)
}

export function isValidScope(scope: string): boolean {
  return SCOPE_RE.test(scope)
}

/** Sugere um escopo padrão: a primeira palavra do slug, em maiúsculas. */
export function suggestScope(slug: string): string {
  const first = slug.split('-')[0] ?? ''
  return first.toUpperCase().replace(/[^A-Z0-9]/g, '')
}

/** Formata um identificador numérico com no mínimo quatro dígitos: 2 → "0002". */
export function formatId(n: number): string {
  return String(n).padStart(4, '0')
}

/** Extrai o número de um nome de diretório de mudança: "0002-x" → 2; senão undefined. */
export function numericIdOf(dirName: string): number | undefined {
  const m = dirName.match(/^(\d+)-/)
  if (!m) {
    return undefined
  }
  const n = Number(m[1])
  return Number.isInteger(n) ? n : undefined
}

export interface IdReconciliation {
  ok: boolean
  /** Id em conflito (>= next_id encontrado no disco), quando `ok` é falso. */
  conflictId?: number
}

/**
 * Reconcilia `next_id` com os identificadores já usados no disco (skill `new` §5).
 * Se algum id no disco for `>= next_id`, o índice está defasado — não se escolhe
 * um número, reporta-se o conflito.
 */
export function reconcileNextId(nextId: number, existingIds: number[]): IdReconciliation {
  const conflict = existingIds.find((id) => id >= nextId)
  return conflict === undefined ? { ok: true } : { ok: false, conflictId: conflict }
}

export interface ChangeEntry {
  id: string
  type: ChangeType
  title: string
  path: string
  date: string
}

/** Nome do diretório da mudança: `<NNNN>-<slug>`. */
export function dirNameFor(id: number, slug: string): string {
  return `${formatId(id)}-${slug}`
}

/**
 * Insere a entrada da mudança no `index.yaml` e incrementa `next_id`, por edição
 * textual — preserva comentários e formato (ADR-004). A entrada é acrescentada ao
 * fim da lista `changes`, com os campos na ordem da CLI e datas entre aspas.
 * Lança se o arquivo não tiver as chaves `next_id`/`changes` (índice inválido).
 */
export function insertChangeEntry(indexText: string, entry: ChangeEntry): string {
  const lines = indexText.split('\n')

  const nextIdLine = lines.findIndex((l) => /^\s*next_id:\s*\d+/.test(l))
  if (nextIdLine === -1) {
    throw new Error('index.yaml sem next_id')
  }
  lines[nextIdLine] = lines[nextIdLine].replace(
    /^(\s*next_id:\s*)(\d+)(.*)$/,
    (_all, prefix: string, num: string, rest: string) => `${prefix}${Number(num) + 1}${rest}`,
  )

  const changesLine = lines.findIndex((l) => /^changes:/.test(l))
  if (changesLine === -1) {
    throw new Error('index.yaml sem changes')
  }

  const block = renderEntryLines(entry)

  if (/^changes:\s*\[\s*\]\s*$/.test(lines[changesLine])) {
    lines[changesLine] = 'changes:'
    lines.splice(changesLine + 1, 0, ...block)
    return lines.join('\n')
  }

  // Lista com itens: encontra o fim do bloco (próxima linha de nível superior,
  // ex.: `archive:`) e insere antes de eventuais linhas em branco finais.
  let end = lines.length
  for (let j = changesLine + 1; j < lines.length; j++) {
    if (/^\S/.test(lines[j])) {
      end = j
      break
    }
  }
  let insertAt = end
  while (insertAt > changesLine + 1 && lines[insertAt - 1].trim() === '') {
    insertAt--
  }
  lines.splice(insertAt, 0, ...block)
  return lines.join('\n')
}

function renderEntryLines(e: ChangeEntry): string[] {
  return [
    `  - id: ${e.id}`,
    `    type: ${e.type}`,
    `    title: ${yamlInline(e.title)}`,
    `    status: DRAFT`,
    `    path: ${e.path}`,
    `    created: "${e.date}"`,
    `    updated: "${e.date}"`,
  ]
}

/**
 * Escreve um escalar YAML em linha: sem aspas quando é seguro (como a CLI faz com
 * títulos simples); entre aspas quando o texto tem caracteres que confundiriam o
 * parser (`:`, `#`, aspas, ou espaço nas bordas).
 */
export function yamlInline(value: string): string {
  const safe = /^[^\s:#&*!|>'"%@`-][^:#]*[^\s]$/.test(value) || /^[^\s:#&*!|>'"%@`-]$/.test(value)
  return safe ? value : JSON.stringify(value)
}

/**
 * Escapa um valor para uso DENTRO de um escalar YAML entre aspas duplas
 * (`title: "…"`). Sem isso, uma aspa no texto livre — como o título digitado no
 * formulário — quebraria o YAML gerado (bug 0011, mesma classe do 0006). Escapa
 * a barra invertida e a aspa dupla, as duas sequências especiais de um escalar
 * `"…"` em uma linha.
 */
export function yamlDquote(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
}

export interface ChangeVars {
  CHANGE_ID: string
  CHANGE_TYPE: ChangeType
  CHANGE_TITLE: string
  DATE: string
  CREATION_REASON: string
  ID_SCOPE: string
  REQUEST_ORIGIN: string
  ORIGINAL_REQUEST: string
}

/** Substitui os marcadores mecânicos que a criação conhece (ADR-004, item 3/5). */
export function substituteChange(content: string, vars: ChangeVars): string {
  return content
    .replaceAll('{{CHANGE_ID}}', vars.CHANGE_ID)
    .replaceAll('{{CHANGE_TYPE}}', vars.CHANGE_TYPE)
    .replaceAll('{{CHANGE_TITLE}}', vars.CHANGE_TITLE)
    .replaceAll('{{DATE}}', vars.DATE)
    .replaceAll('{{CREATION_REASON}}', vars.CREATION_REASON)
    .replaceAll('{{ID_SCOPE}}', vars.ID_SCOPE)
    .replaceAll('{{REQUEST_ORIGIN}}', vars.REQUEST_ORIGIN)
    .replaceAll('{{ORIGINAL_REQUEST}}', vars.ORIGINAL_REQUEST)
}
