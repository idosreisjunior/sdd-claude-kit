// Planejamento da criação de uma mudança (feature 0035, TASK-WIZ-008) — lógica pura, sem
// a API do VS Code. Compõe os helpers já testados do featureCreator para alocar o id e o
// diretório de uma nova mudança e detectar conflitos, espelhando o §5 da skill `new`. A
// borda (etapa Solicitar do wizard) lê o índice e os nomes de diretório do disco, chama
// isto e só então escreve os arquivos.
import {
  DIR_FOR,
  dirNameFor,
  numericIdOf,
  reconcileNextId,
  type ChangeType,
} from './featureCreator'

/** Lê o `next_id` do índice; `undefined` se ausente/ilegível. */
export function parseNextId(indexText: string): number | undefined {
  const m = indexText.match(/^\s*next_id:\s*(\d+)/m)
  return m ? Number(m[1]) : undefined
}

export type AllocationResult =
  | { ok: true; changeId: string; relDir: string; nextId: number }
  | { ok: false; error: 'no-next-id' }
  | { ok: false; error: 'index-stale'; conflictId: number }

/**
 * Planeja a alocação de uma nova mudança (id e diretório) e detecta conflitos. Puro e
 * total: nunca lança. Não escreve nada — a alocação é irreversível, então a borda
 * confirma antes de criar (skill `new`, §5). `existingDirNames` são apenas os nomes dos
 * diretórios já usados em .specs/{features,bugs,refactors,changes,archive}.
 *
 * Um diretório já existente com o id que seria alocado é, por definição, um id no disco
 * >= next_id: `reconcileNextId` o detecta como índice defasado (index-stale) — o mesmo
 * "reconcilie o índice, não sobrescreva" da skill `new` (SCN-WIZ-009).
 */
export function planAllocation(
  indexText: string,
  existingDirNames: string[],
  type: ChangeType,
  slug: string,
): AllocationResult {
  const nextId = parseNextId(indexText)
  if (nextId === undefined) {
    return { ok: false, error: 'no-next-id' }
  }
  const existingIds = existingDirNames
    .map(numericIdOf)
    .filter((n): n is number => n !== undefined)
  const reconciliation = reconcileNextId(nextId, existingIds)
  if (!reconciliation.ok) {
    return { ok: false, error: 'index-stale', conflictId: reconciliation.conflictId ?? nextId }
  }
  const dir = dirNameFor(nextId, slug)
  return { ok: true, changeId: dir, relDir: `${DIR_FOR[type]}/${dir}`, nextId }
}
