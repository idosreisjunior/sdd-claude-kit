// Núcleo puro específico da clarificação (feature 0015, RF-008) — sem a API do VS
// Code (standards §6, NFR-CLAR-003). O contrato das categorias e a pré-condição
// (a spec tem requisitos). A montagem do esqueleto é compartilhada em skeleton.ts
// (`buildSkeleton`). Por ADR-015 (modelo híbrido).

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

/**
 * Pré-condição do RF-008 (D-Q4): a clarificação só é oferecida quando a spec tem
 * requisitos — ao menos um identificador `REQ-<ESCOPO>-NNN`.
 */
export function hasRequirements(specMd: string): boolean {
  return /\bREQ-[A-Z][A-Z0-9]*-\d+/.test(specMd)
}
