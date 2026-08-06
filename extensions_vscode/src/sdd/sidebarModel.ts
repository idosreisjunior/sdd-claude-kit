// Estado da sidebar (feature 0036, TASK-COCK-015, ADR-036) — lógica pura, sem a API do
// VS Code.
//
// Existe porque a sidebar deixa de ser `TreeView` e vira uma superfície de webview: o que
// a plataforma resolvia sozinha — qual item está em foco, qual está selecionado, como o
// foco anda pelo teclado — passa a ser estado nosso. Manter isso puro é o que torna
// REQ-COCK-006 verificável sem abrir o VS Code.
//
// O que este módulo NÃO decide: como a lista é desenhada, e o que cada ação faz. Ele diz
// apenas em que estado a sidebar está.
import { groupByStatus, type ChangeEntry } from './specsIndex'

// Navegação vem de sidebarNav, que não importa nada: o cliente do webview precisa dessas
// funções e importar este módulo lá arrastaria js-yaml para o bundle.
export { moveFocus, focusEdge, select, focusedItem, intentForKey } from './sidebarNav'
export type { NavIntent } from './sidebarNav'

/** Um item navegável da sidebar. Grupos são cabeçalhos; mudanças são alvos de ação. */
export interface SidebarItem {
  kind: 'group' | 'change'
  /** Chave estável para foco e seleção. Para grupo, o rótulo; para mudança, o id. */
  key: string
  label: string
  /** Presentes só quando `kind === 'change'`. */
  change?: ChangeEntry
  progress?: { done: number; total: number }
}

export type SidebarMode = 'list' | 'welcome'

export interface SidebarState {
  /** `welcome` quando o projeto não tem `.specs/` (REQ-COCK-005, Q7). */
  mode: SidebarMode
  /** Lista achatada, na ordem em que aparece — grupos e mudanças intercalados. */
  items: SidebarItem[]
  /** Item com foco de teclado. `undefined` quando a lista está vazia. */
  focusedKey?: string
  /** Item selecionado. Espelha `TreeView.selection`, que deixa de existir. */
  selectedKey?: string
}

/**
 * Monta o estado inicial. `hasSpecs` falso produz o modo de boas-vindas — decidido em Q7
 * para que a tela do mockup 02 viva aqui em vez de abrir sozinha num painel.
 *
 * O agrupamento reusa `groupByStatus`, o mesmo do Board e do hub do wizard: uma segunda
 * regra de agrupamento seria uma segunda verdade sobre o ciclo de vida.
 */
export function buildSidebarState(
  changes: readonly ChangeEntry[],
  hasSpecs: boolean,
  progressById: ReadonlyMap<string, { done: number; total: number }> = new Map(),
): SidebarState {
  if (!hasSpecs) {
    return { mode: 'welcome', items: [] }
  }
  const items: SidebarItem[] = []
  for (const group of groupByStatus([...changes].filter((c) => c.id && c.path))) {
    items.push({ kind: 'group', key: `group:${group.label}`, label: group.label })
    for (const change of group.changes) {
      items.push({
        kind: 'change',
        key: change.id,
        label: change.title || change.id,
        change,
        progress: progressById.get(change.id),
      })
    }
  }
  return { mode: 'list', items, focusedKey: firstFocusable(items) }
}

/** Primeiro item que aceita foco. Grupos entram na navegação: são recolhíveis e clicáveis. */
function firstFocusable(items: readonly SidebarItem[]): string | undefined {
  return items.length > 0 ? items[0].key : undefined
}

/**
 * Estado com a lista relida do disco, preservando foco e seleção quando as chaves
 * sobrevivem. Sem isto, cada reidratação jogaria o usuário de volta ao topo — coisa que a
 * `TreeView` nunca fez e que ninguém perdoaria numa lista longa.
 */
export function rehydrate(previous: SidebarState, fresh: SidebarState): SidebarState {
  const keeps = (key?: string) => (key && fresh.items.some((i) => i.key === key) ? key : undefined)
  return {
    ...fresh,
    focusedKey: keeps(previous.focusedKey) ?? fresh.focusedKey,
    selectedKey: keeps(previous.selectedKey),
  }
}
