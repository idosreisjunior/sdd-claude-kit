// Máquina de estados do fluxo SDD — lógica pura (feature 0026, ADR-025).
//
// As transições espelham plugins/sdd-kit/schemas/workflow.json (fonte da verdade
// do grafo). Aqui ficam embutidas porque a extensão é um pacote autônomo: se o
// grafo mudar no plugin, esta cópia precisa acompanhar. Os grupos são o inverso
// de groupFor (specsIndex): dropar um cartão numa coluna = escolher entre os
// estados daquele grupo alcançáveis a partir do estado atual.

/** Estados canônicos (workflow.json). */
export type SddState =
  | 'DRAFT'
  | 'CLARIFIED'
  | 'DESIGNED'
  | 'PLANNED'
  | 'APPROVED'
  | 'IN_PROGRESS'
  | 'BLOCKED'
  | 'VERIFIED'
  | 'ARCHIVED'
  | 'CANCELLED'

/** Arestas válidas do grafo (workflow.json). Estados terminais têm lista vazia. */
export const TRANSITIONS: Readonly<Record<SddState, readonly SddState[]>> = {
  DRAFT: ['CLARIFIED', 'CANCELLED'],
  CLARIFIED: ['DESIGNED', 'DRAFT', 'CANCELLED'],
  DESIGNED: ['PLANNED', 'CLARIFIED', 'CANCELLED'],
  PLANNED: ['APPROVED', 'IN_PROGRESS', 'DESIGNED', 'CANCELLED'],
  APPROVED: ['IN_PROGRESS', 'PLANNED', 'CANCELLED'],
  IN_PROGRESS: ['BLOCKED', 'VERIFIED', 'CANCELLED'],
  BLOCKED: ['IN_PROGRESS', 'PLANNED', 'CANCELLED'],
  VERIFIED: ['ARCHIVED', 'IN_PROGRESS', 'CANCELLED'],
  ARCHIVED: [],
  CANCELLED: [],
}

/**
 * Estados de cada grupo do painel (inverso de groupFor). "Rascunho" também é o
 * balde de estados desconhecidos, mas aqui listamos só os canônicos.
 */
export const GROUP_STATES: Readonly<Record<string, readonly SddState[]>> = {
  Rascunho: ['DRAFT', 'CLARIFIED', 'DESIGNED', 'PLANNED'],
  'Em desenvolvimento': ['APPROVED', 'IN_PROGRESS'],
  Bloqueadas: ['BLOCKED'],
  'Em validação': ['VERIFIED'],
  Concluídas: ['ARCHIVED'],
  Canceladas: ['CANCELLED'],
}

function isState(value: string): value is SddState {
  return Object.prototype.hasOwnProperty.call(TRANSITIONS, value)
}

/** Transições válidas a partir de `from` (vazio se estado desconhecido/terminal). */
export function validTransitions(from: string): readonly SddState[] {
  return isState(from) ? TRANSITIONS[from] : []
}

/** `to` é alcançável a partir de `from` numa única transição? */
export function canTransition(from: string, to: string): boolean {
  return isState(to) && validTransitions(from).includes(to)
}

/**
 * Estados-alvo candidatos ao soltar um cartão (estado atual `from`) na coluna do
 * grupo `toGroupLabel`: os estados do grupo alcançáveis a partir de `from`, na
 * ordem de preferência do grupo. Vazio = transição inválida para aquela coluna.
 */
export function candidateTargets(from: string, toGroupLabel: string): SddState[] {
  const inGroup = GROUP_STATES[toGroupLabel] ?? []
  return inGroup.filter((s) => canTransition(from, s))
}
