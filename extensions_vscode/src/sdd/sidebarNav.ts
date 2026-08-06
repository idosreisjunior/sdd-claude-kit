// Navegação da sidebar (feature 0036, TASK-COCK-015/017) — lógica pura e SEM IMPORT ALGUM.
//
// A ausência de imports é o ponto deste arquivo, não um acaso. Estas funções precisam
// rodar nos DOIS lados: na borda, ao tratar uma mensagem, e dentro do cliente, para que
// uma seta não custe uma ida e volta ao host. Mas `sidebarModel` importa `specsIndex`, que
// importa `js-yaml` — trazê-lo para o bundle do webview o infla em ~100 kB, o mesmo erro
// que a 0035 cometeu e o teto do `esbuild.mjs` existe para pegar.
//
// Só `buildSidebarState` precisa do agrupamento e por isso ficou em `sidebarModel`; tudo
// que apenas caminha sobre a lista mora aqui.

/** Um item navegável da sidebar. Estrutural de propósito: sem depender de outro módulo. */
export interface NavItem {
  kind: 'group' | 'change'
  key: string
}

export interface NavState {
  items: NavItem[]
  focusedKey?: string
  selectedKey?: string
}

/**
 * Move o foco `delta` posições. Não circula de propósito: numa lista longa, saltar do fim
 * para o começo desorienta mais do que ajuda, e é o comportamento da `TreeView` que estamos
 * substituindo. Lista vazia devolve o estado intacto.
 */
export function moveFocus<T extends NavState>(state: T, delta: number): T {
  if (state.items.length === 0) {
    return state
  }
  const current = state.items.findIndex((i) => i.key === state.focusedKey)
  const from = current === -1 ? 0 : current
  const next = Math.max(0, Math.min(state.items.length - 1, from + delta))
  return next === current ? state : { ...state, focusedKey: state.items[next].key }
}

/** Leva o foco ao primeiro ou ao último item (Home/End). */
export function focusEdge<T extends NavState>(state: T, edge: 'first' | 'last'): T {
  if (state.items.length === 0) {
    return state
  }
  const item = edge === 'first' ? state.items[0] : state.items[state.items.length - 1]
  return { ...state, focusedKey: item.key }
}

/**
 * Seleciona um item por chave. Chave desconhecida não altera nada: a chave vem do webview,
 * e confiar nela cegamente deixaria o estado apontando para item que a lista não contém.
 */
export function select<T extends NavState>(state: T, key: string): T {
  if (!state.items.some((i) => i.key === key)) {
    return state
  }
  return { ...state, selectedKey: key, focusedKey: key }
}

/** O item em foco, se houver. É sobre ele que a ação padrão do teclado age. */
export function focusedItem<T extends NavState>(state: T): T['items'][number] | undefined {
  return state.items.find((i) => i.key === state.focusedKey)
}

/**
 * Traduz uma tecla em intenção de navegação. Fica aqui, e não no cliente, para ser
 * testável sem DOM — o mapeamento é a parte que erra, não o `addEventListener`.
 *
 * `null` significa "não é minha": a tecla segue o caminho normal, sem `preventDefault`.
 */
export type NavIntent =
  | { kind: 'move'; delta: number }
  | { kind: 'edge'; edge: 'first' | 'last' }
  | { kind: 'activate' }
  | { kind: 'actions' }

export function intentForKey(key: string): NavIntent | null {
  switch (key) {
    case 'ArrowDown':
      return { kind: 'move', delta: 1 }
    case 'ArrowUp':
      return { kind: 'move', delta: -1 }
    case 'PageDown':
      return { kind: 'move', delta: 10 }
    case 'PageUp':
      return { kind: 'move', delta: -10 }
    case 'Home':
      return { kind: 'edge', edge: 'first' }
    case 'End':
      return { kind: 'edge', edge: 'last' }
    case 'Enter':
    case ' ':
      return { kind: 'activate' }
    // A tecla de menu de contexto e Shift+F10 são o que um usuário de teclado espera para
    // "mais ações"; a plataforma as entregava com a TreeView.
    case 'ContextMenu':
      return { kind: 'actions' }
    default:
      return null
  }
}
