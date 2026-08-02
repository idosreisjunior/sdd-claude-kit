// Núcleo puro da criação de ADR (feature 0016, RF-020, REQ-HIST-002) — sem a API
// do VS Code, testável fora do host (NFR-HIST-003). A borda coleta os números de
// ADR existentes (varrendo os decisions/) e escreve o arquivo; aqui só se decide
// o número, o slug e o conteúdo. Por ADR-016.
import { sanitizeSlug } from './featureCreator'

/**
 * Próximo número de ADR livre: `max + 1`. Numeração global e sequencial, nunca
 * reutilizada — buracos NÃO são preenchidos (standards §2).
 */
export function nextAdrNumber(existing: number[]): number {
  return existing.length === 0 ? 1 : Math.max(...existing) + 1
}

/** Slug determinístico do título do ADR (reusa a regra de `sanitizeSlug`). */
export function adrSlug(title: string): string {
  return sanitizeSlug(title)
}

/** Formata o número do ADR com três dígitos: 7 → "007". */
export function padAdr(n: number): string {
  return String(n).padStart(3, '0')
}

export interface AdrVars {
  number: number
  title: string
  date: string
  origin?: string
  decidedIn?: string
}

/**
 * Monta um ADR-esqueleto resolvendo o template `adr/ADR-template.md`: substitui
 * os marcadores conhecidos (número, título, status Proposto, data, origem),
 * remove as orientações e deixa as seções de conteúdo como lacuna
 * (`_a preencher_`). Não inventa conteúdo.
 */
export function buildAdr(template: string, vars: AdrVars): string {
  const filled = template
    .replaceAll('{{ADR_NUMBER}}', padAdr(vars.number))
    .replaceAll('{{ADR_TITLE}}', vars.title)
    .replaceAll('{{ADR_STATUS}}', 'Proposto')
    .replaceAll('{{DATE}}', vars.date)
    .replaceAll('{{ADR_ORIGIN}}', vars.origin ?? 'criado pela extensão SDD')
    .replaceAll('{{DECIDED_IN}}', vars.decidedIn ?? '_a preencher_')
  return filled
    .replace(/\{\{(guia|repetir|opcional):[\s\S]*?\}\}\n?/g, '')
    .replace(/\{\{[^{}]+\}\}/g, '_a preencher_')
    .replace(/\n{3,}/g, '\n\n')
    .trimStart()
}
