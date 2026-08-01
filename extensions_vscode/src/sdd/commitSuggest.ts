// Núcleo puro das sugestões de branch/commit (feature 0007, RF-018, REQ-TRACE-005) —
// sem a API do VS Code (standards §6, NFR-TRACE-002). Deriva um nome de branch e uma
// mensagem de commit a partir da mudança. É SUGESTÃO: nunca executa nada (NFR-TRACE-001).
// Convenção (D-Q7): branch `<prefixo>/<id>`; commit no estilo conventional do repositório
// (`<tipo>: <título> (<NNNN>)`), em que o texto é editável pelo usuário.

export interface ChangeInfo {
  id: string
  type: string
  title: string
}

export interface CommitSuggestion {
  branch: string
  message: string
}

/** Prefixo de branch por tipo de mudança. */
const BRANCH_PREFIX: Record<string, string> = {
  feature: 'feature',
  bug: 'fix',
  refactor: 'refactor',
  change: 'change',
}

/** Prefixo conventional-commit por tipo de mudança. */
const COMMIT_PREFIX: Record<string, string> = {
  feature: 'feat',
  bug: 'fix',
  refactor: 'refactor',
  change: 'chore',
}

/**
 * Monta a sugestão de branch e mensagem de commit. Puro e determinístico. O identificador
 * numérico (NNNN) é extraído do id da mudança; título e id vão como estão.
 */
export function buildCommitSuggestion(change: ChangeInfo): CommitSuggestion {
  const branchPrefix = BRANCH_PREFIX[change.type] ?? 'feature'
  const commitPrefix = COMMIT_PREFIX[change.type] ?? 'feat'
  const numeric = /^(\d+)/.exec(change.id)?.[1] ?? change.id
  const title = change.title.trim() || change.id
  return {
    branch: `${branchPrefix}/${change.id}`,
    message: `${commitPrefix}: ${title} (${numeric})`,
  }
}
