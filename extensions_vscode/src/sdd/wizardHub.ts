// Hub do wizard (feature 0035, TASK-WIZ-009, REQ-WIZ-006) — lógica pura, sem a API do
// VS Code. Projeta a lista de mudanças para a tela de entrada do assistente.
//
// O agrupamento reusa `groupByStatus` do specsIndex (a mesma ordem do painel Features e
// do Board): uma segunda regra de agrupamento seria uma segunda verdade sobre o ciclo de
// vida. Aqui só se acrescenta o que a tela precisa — o total e os grupos não vazios.
//
// O hub NÃO deriva a etapa de cada mudança: isso exigiria ler os artefatos de todas elas
// a cada abertura. A lista mostra o status do ciclo (a verdade do index.yaml/status.yaml);
// a etapa é projetada ao retomar UMA mudança, que é quando ela importa (SCN-WIZ-010).
import { groupByStatus, type ChangeEntry } from './specsIndex'

export interface HubChange {
  id: string
  type: string
  title: string
  status: string
}

export interface HubGroup {
  label: string
  changes: HubChange[]
}

export interface HubState {
  /** Total de mudanças listadas. Zero dispara as boas-vindas (SCN-WIZ-011). */
  total: number
  groups: HubGroup[]
}

/**
 * Monta o estado do hub. Mudança sem `id` é descartada: sem identificador não há como
 * retomá-la, e uma linha que não abre nada é pior do que uma linha a menos.
 */
export function buildHubState(changes: readonly ChangeEntry[]): HubState {
  const usable = changes.filter((c) => c.id && c.path)
  const groups = groupByStatus([...usable])
    .map((group) => ({
      label: group.label,
      changes: group.changes.map((c) => ({
        id: c.id,
        type: c.type,
        title: c.title,
        status: c.status,
      })),
    }))
    .filter((group) => group.changes.length > 0)

  return { total: usable.length, groups }
}
