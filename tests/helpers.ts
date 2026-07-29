import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse as parseYaml } from 'yaml'
import Ajv2020 from 'ajv/dist/2020.js'
import addFormats from 'ajv-formats'
import type { ValidateFunction } from 'ajv'

export const REPO = fileURLToPath(new URL('..', import.meta.url)).replace(/\/$/, '')

export const abs = (p: string): string => join(REPO, p)
export const read = (p: string): string => readFileSync(abs(p), 'utf8')
export const exists = (p: string): boolean => existsSync(abs(p))

/** Lê um YAML do repositório. */
export function readYaml(p: string): unknown {
  return parseYaml(read(p))
}

/** Percorre um diretório recursivamente, devolvendo caminhos relativos ao repo. */
export function walk(dir: string, filter?: (p: string) => boolean): string[] {
  const root = abs(dir)
  if (!existsSync(root)) return []
  const out: string[] = []
  const visit = (current: string): void => {
    for (const entry of readdirSync(current)) {
      if (entry === 'node_modules' || entry === '.git') continue
      const full = join(current, entry)
      if (statSync(full).isDirectory()) visit(full)
      else out.push(relative(REPO, full).split(sep).join('/'))
    }
  }
  visit(root)
  return (filter ? out.filter(filter) : out).sort()
}

const ajv = addFormats(new Ajv2020({ allErrors: true, strict: false }))

const compilados = new Map<string, ValidateFunction>()

/**
 * Compila um schema do plugin, memoizando por nome.
 *
 * O Ajv indexa por `$id` e recusa registrar o mesmo duas vezes, então
 * recompilar a cada chamada quebra assim que dois testes usam o mesmo schema.
 */
export function schema(name: string): ValidateFunction {
  const cached = compilados.get(name)
  if (cached) return cached
  const fn = ajv.compile(JSON.parse(read(`plugins/sdd-kit/schemas/${name}.schema.json`)))
  compilados.set(name, fn)
  return fn
}

export interface Failure {
  path: string
  message: string
}

/** Valida e devolve as falhas normalizadas, com o caminho do campo. */
export function validate(v: ValidateFunction, doc: unknown): Failure[] {
  if (v(doc)) return []
  return (v.errors ?? []).map((e) => ({
    path: (e.instancePath || '/').replace(/^\//, ''),
    message: e.message ?? 'erro desconhecido',
  }))
}

/**
 * Remove marcadores de um template e substitui valores, como uma skill faria.
 * `{{guia: …}}` some; `{{NOME}}` vira o valor informado.
 */
export function fillTemplate(body: string, values: Record<string, string>): string {
  let out = body.replace(/[ \t]*#?[ \t]*\{\{(?:guia|opcional|repetir):[\s\S]*?\}\}\r?\n?/g, '')
  for (const [key, value] of Object.entries(values)) {
    out = out.replaceAll(`{{${key}}}`, value)
  }
  return out
}

/**
 * Remove blocos e trechos de código de um Markdown.
 *
 * Necessário para distinguir um marcador POR PREENCHER de uma CITAÇÃO de
 * marcador. Documentação que discute `{{NOME}}` usa crases; um marcador real,
 * deixado por engano num artefato gerado, aparece em prosa ou como valor.
 */
export function stripCode(markdown: string): string {
  return markdown
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`[^`\n]*`/g, '')
}

/** Marcadores de template não preenchidos, ignorando citações em crases. */
export function unfilledMarkers(markdown: string): string[] {
  const re = /\{\{(?:[A-Z][A-Z0-9_]*|guia:|opcional:|repetir:)[\s\S]*?\}\}/g
  return [...stripCode(markdown).matchAll(re)].map((m) => m[0].slice(0, 40))
}

/** Front matter + corpo de um SKILL.md. */
export function parseSkill(path: string): { frontmatter: Record<string, unknown>; body: string } {
  const raw = read(path)
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/.exec(raw)
  if (!match) throw new Error(`${path}: front matter ausente ou malformado`)
  return {
    frontmatter: parseYaml(match[1] as string) as Record<string, unknown>,
    body: match[2] as string,
  }
}

/** Os identificadores de mudança presentes em .specs, por diretório. */
export function changeDirs(): string[] {
  const roots = ['features', 'bugs', 'refactors', 'changes', 'archive']
  const out: string[] = []
  for (const r of roots) {
    const dir = abs(`.specs/${r}`)
    if (!existsSync(dir)) continue
    for (const entry of readdirSync(dir)) {
      if (statSync(join(dir, entry)).isDirectory()) out.push(`${r}/${entry}`)
    }
  }
  return out.sort()
}
