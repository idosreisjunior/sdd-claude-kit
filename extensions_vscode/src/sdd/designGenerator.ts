// Núcleo puro da geração do design técnico (feature 0014, RF-009) — sem a API do
// VS Code, testável fora do host (standards §6, NFR-DSGN-001). Sem I/O: nem de
// rede (NFR-DSGN-002) nem de disco; a borda (ler o template, escrever o arquivo,
// confirmar sobrescrita) fica em extension.ts.
//
// Por ADR-014 (modelo híbrido): esta camada monta o design.md-ESQUELETO a partir
// do template `feature/design.md`, com as seções do RF-009 e as lacunas marcadas
// (D-Q6). O conteúdo assistido por IA é o reuso da ação `design` do adapter 0004
// (composePrompt), não desta camada.

/**
 * Seções que o design técnico deve conter (RF-009). É o CONTRATO do template
 * `feature/design.md`: o teste garante que o template não derive desta lista.
 */
export const DESIGN_SECTIONS = [
  'Visão da solução',
  'Componentes afetados',
  'Fluxo de dados',
  'Contratos',
  'APIs',
  'Banco de dados',
  'Segurança',
  'Tratamento de erros',
  'Observabilidade',
  'Testes',
  'Migração',
  'Rollback',
  'Riscos',
  'Alternativas consideradas',
] as const

/** Marcador de lacuna: uma seção sem informação carrega exatamente isto (D-Q6). */
export const LACUNA_MARK = '> _A preencher no design._'

/** Subconjunto do `status.yaml` necessário para a pré-condição. */
export interface StatusForDesign {
  /** Campo `approval`: null = não aprovado; objeto preenchido = aprovado. */
  approval: unknown
}

/** Dados da mudança para resolver o template. */
export interface DesignChange {
  id: string
  title: string
  scope: string
  date: string
}

/**
 * Pré-condição do RF-009 (D-Q4): a etapa de design só é oferecida quando a spec
 * está aprovada — `approval != null` no `status.yaml`. `!= null` cobre também
 * `undefined` (campo ausente), tratado como não aprovado.
 */
export function canGenerateDesign(status: StatusForDesign): boolean {
  return status.approval !== null && status.approval !== undefined
}

/**
 * Extrai o escopo dos identificadores do cabeçalho da spec
 * (`- **Escopo dos identificadores:** DSGN`). Retorna `undefined` se ausente —
 * a borda decide o fallback. Puro, para preencher `{{ID_SCOPE}}` no esqueleto.
 */
export function extractScope(specMd: string): string | undefined {
  const m = specMd.match(/^-\s*\*\*Escopo dos identificadores:\*\*\s*([A-Z][A-Z0-9]*)/m)
  return m ? m[1] : undefined
}

/** Remove os blocos de orientação `{{guia: …}}` do template. */
function stripGuides(text: string): string {
  return text.replace(/\{\{guia:[\s\S]*?\}\}\n?/g, '')
}

/**
 * Monta o `design.md`-esqueleto resolvendo o template: substitui os marcadores
 * conhecidos, remove as orientações e preserva as seções do RF-009 com as
 * lacunas marcadas. Não inventa conteúdo (D-Q6). Estrutura vem do template, não
 * daqui (ADR-014).
 */
export function buildDesignSkeleton(template: string, change: DesignChange): string {
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
