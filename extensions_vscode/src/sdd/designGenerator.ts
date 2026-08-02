// Núcleo puro específico do design (feature 0014, RF-009) — sem a API do VS Code
// (standards §6, NFR-DSGN-001). O contrato das seções, a pré-condição de
// aprovação e a extração do escopo. A montagem do esqueleto é compartilhada em
// skeleton.ts (`buildSkeleton`). Por ADR-014 (modelo híbrido).

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

/**
 * Pré-condição do RF-009 (D-Q4): a etapa de design só é oferecida quando a spec
 * está aprovada — `approval` diferente de null/undefined no `status.yaml`.
 */
export function canGenerateDesign(approval: unknown): boolean {
  return approval !== null && approval !== undefined
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
