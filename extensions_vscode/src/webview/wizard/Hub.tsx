// Hub do wizard (feature 0035, TASK-WIZ-009, REQ-WIZ-006). Lista as mudanças agrupadas
// pelo ciclo de vida e retoma cada uma na sua etapa atual (SCN-WIZ-010); sem nenhuma
// mudança, apresenta as boas-vindas com a ação de criar a primeira (SCN-WIZ-011).
//
// `statusBadge` vem de uiModel, que só depende de themeTokens — não arrasta peso para o
// bundle. A CLASSE em vez de `style` inline: atributo inline não passa na CSP com nonce.
import type { HubState } from '../../sdd/wizardHub'
import { statusBadge } from '../../sdd/uiModel'
import { vscodeApi } from './vscodeApi'

function resume(id: string) {
  vscodeApi.postMessage({ type: 'open', id })
}

function create() {
  vscodeApi.postMessage({ type: 'create' })
}

export function Hub({ hub }: { hub: HubState }) {
  if (hub.total === 0) {
    return (
      <div class="sdd-wizard">
        <header class="sdd-topbar">
          <h1>Assistente SDD</h1>
        </header>
        <div class="sdd-welcome">
          <h2>Nenhuma mudança ainda</h2>
          <p>
            A especificação vem antes do código. Comece registrando o que você quer
            mudar em linguagem natural — o assistente conduz do primeiro requisito à
            verificação.
          </p>
          <button class="sdd-btn primary" onClick={create}>
            Criar a primeira mudança ▸
          </button>
        </div>
      </div>
    )
  }

  return (
    <div class="sdd-wizard">
      <header class="sdd-topbar">
        <h1>Assistente SDD</h1>
        <span class="sub">
          {hub.total} {hub.total === 1 ? 'mudança' : 'mudanças'}
        </span>
      </header>
      <p class="sdd-hub-intro">
        Retome uma mudança de onde parou — o assistente abre na etapa atual dela,
        projetada do <code>status.yaml</code>.
      </p>

      {hub.groups.map((group) => (
        <section class="sdd-group" key={group.label}>
          <h2>{group.label}</h2>
          <ul class="sdd-hub-list">
            {group.changes.map((change) => (
              <li class="sdd-hub-item" key={change.id}>
                <span class="id">{change.id}</span>
                <span class="title">{change.title}</span>
                <span class="type">{change.type}</span>
                <span class={`ui-badge ${statusBadge(change.status).className}`}>
                  {statusBadge(change.status).label}
                </span>
                <button
                  class="sdd-btn ghost"
                  onClick={() => resume(change.id)}
                  aria-label={`Retomar ${change.id} — ${change.title}`}
                >
                  Retomar ▸
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}

      <div class="sdd-actions">
        <button class="sdd-btn ghost" onClick={create}>
          + Nova mudança
        </button>
      </div>
    </div>
  )
}
