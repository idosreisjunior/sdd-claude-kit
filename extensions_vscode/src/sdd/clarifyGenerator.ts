// Núcleo puro da clarificação da spec (feature 0015, RF-008) — sem a API do VS
// Code, testável fora do host (standards §6, NFR-CLAR-003). Sem I/O: nem de rede
// (NFR-CLAR-001) nem de disco; a borda (ler o template, escrever o arquivo,
// confirmar sobrescrita) fica em extension.ts.
//
// Por ADR-015 (modelo híbrido, como o ADR-014): esta camada monta o
// clarifications.md-ESQUELETO a partir do template `feature/clarifications.md`,
// com as nove categorias do RF-008 como seções (D-Q5). A análise por IA é o reuso
// da ação `clarify` do adapter 0004 (composePrompt), não desta camada.

/**
 * As nove categorias de lacuna do RF-008. É o CONTRATO do template
 * `feature/clarifications.md`: o teste garante que o template não derive desta lista.
 */
export const CLARIFY_CATEGORIES = [
  'Requisitos ambíguos',
  'Critérios de aceite ausentes',
  'Conflitos',
  'Regras incompletas',
  'Casos extremos',
  'Dependências não definidas',
  'Decisões técnicas prematuras',
  'Riscos de segurança',
  'Impactos em dados',
] as const

/** Marcador de lacuna: uma seção sem informação carrega exatamente isto (D-Q5). */
export const LACUNA_MARK = '> _A preencher na clarificação._'

/** Dados da mudança para resolver o template. */
export interface ClarifyChange {
  id: string
  title: string
  scope: string
  date: string
}

/**
 * Pré-condição do RF-008 (D-Q4): a clarificação só é oferecida quando a spec tem
 * requisitos — ao menos um identificador `REQ-<ESCOPO>-NNN`.
 */
export function hasRequirements(specMd: string): boolean {
  return /\bREQ-[A-Z][A-Z0-9]*-\d+/.test(specMd)
}

/** Remove os blocos de orientação `{{guia: …}}` do template. */
function stripGuides(text: string): string {
  return text.replace(/\{\{guia:[\s\S]*?\}\}\n?/g, '')
}

/**
 * Monta o `clarifications.md`-esqueleto resolvendo o template: substitui os
 * marcadores conhecidos, remove as orientações e preserva as nove categorias do
 * RF-008 com as lacunas marcadas. Não inventa conteúdo. Estrutura vem do template,
 * não daqui (ADR-015).
 */
export function buildClarificationsSkeleton(template: string, change: ClarifyChange): string {
  const filled = template
    .replaceAll('{{CHANGE_TITLE}}', change.title)
    .replaceAll('{{CHANGE_ID}}', change.id)
    .replaceAll('{{ID_SCOPE}}', change.scope)
    .replaceAll('{{DATE}}', change.date)
  const body = stripGuides(filled)
    .replace(/\n{3,}/g, '\n\n')
    .trimStart()
  return body.endsWith('\n') ? body : `${body}\n`
}
