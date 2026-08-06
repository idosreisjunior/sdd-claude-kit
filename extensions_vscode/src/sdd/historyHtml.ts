// Renderização do histórico (feature 0016, RF-020, REQ-HIST-001; redesenhado pela 0036,
// TASK-COCK-011) — lógica pura, sem a API do VS Code.
//
// ORIGEM DO LAYOUT (REQ-COCK-007): derivado do bloco de linha do tempo do mockup
// `13-feature-dashboard`, em tela cheia. O dashboard já apresenta eventos datados numa
// coluna com marcador à esquerda; o histórico é esse mesmo bloco sem o resto da tela.
// Não há mockup próprio para esta superfície, e a derivação está declarada aqui em vez de
// ficar implícita na implementação.
//
// Painel SOMENTE-LEITURA: `enableScripts: false` é preservado (ADR-038). A identidade vem
// do CSS compartilhado (`componentsCss`) e das mesmas classes dos componentes Preact —
// nenhum runtime é carregado. Ver ADR-016 e NFR-COCK-002.
import { renderStaticPanelHtml, escapeHtml } from './panelHtml'
import { statusBadge } from './uiModel'
import type { HistoryModel, HistoryEvent } from './historyModel'

/** Rótulo pt-BR de cada tipo de evento, para o badge da linha do tempo. */
const KIND_LABEL: Readonly<Record<string, string>> = {
  status: 'ESTADO',
  approval: 'APROVAÇÃO',
  adr: 'ADR',
  commit: 'COMMIT',
}

/** CSS da linha do tempo. Só tokens — o teste-guarda cobre este arquivo. */
function timelineCss(): string {
  return `
  .hist-timeline { list-style: none; margin: 0; padding: 0; position: relative; }
  .hist-timeline::before { content: ""; position: absolute; left: .45rem; top: .35rem; bottom: .35rem; width: 2px; background: var(--sdd-border); }
  .hist-event { position: relative; padding: 0 0 .8rem 1.6rem; }
  .hist-event .dot { position: absolute; left: 0; top: .3rem; width: 1rem; height: 1rem; border-radius: 50%; border: 2px solid var(--sdd-border); background: var(--sdd-surface-raised); }
  .hist-event.status .dot { border-color: var(--sdd-accent); }
  .hist-event .head { display: flex; align-items: baseline; gap: .5rem; flex-wrap: wrap; }
  .hist-event .date { font-size: .75rem; color: var(--sdd-text-muted); }
  .hist-event .title { font-size: .87rem; }
  .hist-event .detail { margin-top: .2rem; font-size: .8rem; color: var(--sdd-text-muted); white-space: pre-wrap; }
  .hist-kind { font-size: .62rem; font-weight: 700; letter-spacing: .05em; padding: .05rem .4rem; border-radius: .8rem; background: var(--sdd-badge-bg); color: var(--sdd-badge-fg); }
  .hist-section { margin-top: 1.5rem; }
  .hist-section h2 { font-size: .78rem; text-transform: uppercase; letter-spacing: .06em; color: var(--sdd-text-muted); margin: 0 0 .5rem; font-weight: 700; }
  .hist-unavailable { list-style: none; margin: 0; padding: 0; display: flex; flex-wrap: wrap; gap: .3rem; }
  .hist-unavailable li { font-size: .74rem; color: var(--sdd-text-muted); border: 1px dashed var(--sdd-border); border-radius: .35rem; padding: .15rem .5rem; }
  `
}

/** Uma entrada da linha do tempo, no formato do bloco do mockup 13. */
function eventRow(e: HistoryEvent): string {
  const detail = e.detail ? `<div class="detail">${escapeHtml(e.detail)}</div>` : ''

  // O evento de estado ganha o badge colorido do ciclo de vida — mesma cor que o status
  // tem no Board e no dashboard (REQ-COCK-002, SCN-COCK-003). Nesse caso o próprio badge
  // já diz qual é o estado, então o título não se repete ao lado.
  const isStatus = e.kind === 'status'
  const status = statusBadge(e.title)
  const badge = isStatus
    ? `<span class="ui-badge ${status.className}">${escapeHtml(status.label)}</span>`
    : `<span class="hist-kind">${escapeHtml(KIND_LABEL[e.kind] ?? e.kind)}</span>`
  const title = isStatus ? '' : `<span class="title">${escapeHtml(e.title)}</span>`
  return `      <li class="hist-event ${escapeHtml(e.kind)}">
        <span class="dot" aria-hidden="true"></span>
        <div class="head">
          <span class="date">${escapeHtml(e.date || '—')}</span>
          ${badge}
          ${title}
        </div>
        ${detail}
      </li>`
}

/** Estado atual em `StatTile`, reusando os componentes compartilhados. */
function currentState(model: HistoryModel): string {
  const { tasks, validation } = model.currentState
  if (!tasks && !validation) {
    return ''
  }
  const tiles = [
    tasks
      ? `<div class="ui-tile"><span class="ui-tile-value">${tasks.done}/${tasks.total}</span><span class="ui-tile-label">tarefas concluídas</span></div>`
      : '',
    validation
      ? `<div class="ui-tile"><span class="ui-tile-value">${validation.atendido}</span><span class="ui-tile-label">critérios atendidos</span></div>
       <div class="ui-tile"><span class="ui-tile-value">${validation.pendentes}</span><span class="ui-tile-label">critérios pendentes</span></div>`
      : '',
  ]
    .filter(Boolean)
    .join('\n      ')
  return `  <section class="hist-section">
    <h2>Estado atual</h2>
    <div class="ui-tiles">
      ${tiles}
    </div>
  </section>`
}

/** Gera o documento HTML do histórico. `nonce` deve ser alfanumérico. */
export function renderHistoryHtml(changeId: string, model: HistoryModel, nonce: string): string {
  const events =
    model.events.length > 0
      ? `<ul class="hist-timeline">\n${model.events.map(eventRow).join('\n')}\n    </ul>`
      : `<div class="ui-empty">
      <h2>Sem eventos registrados</h2>
      <p>Esta mudança ainda não tem transições de estado, ADRs nem commits associados.</p>
    </div>`

  const unavailable =
    model.unavailable.length > 0
      ? `  <section class="hist-section">
    <h2>Não capturado — sem fonte persistida</h2>
    <ul class="hist-unavailable">
      ${model.unavailable.map((u) => `<li>${escapeHtml(u)}</li>`).join('\n      ')}
    </ul>
  </section>`
      : ''

  const body = `  <header class="ui-panel-header">
    <div class="titles">
      <h1>Histórico</h1>
      <span class="subtitle">${escapeHtml(changeId)}</span>
    </div>
  </header>
  <section>
    ${events}
  </section>
${currentState(model)}
${unavailable}`

  return renderStaticPanelHtml({
    title: `Histórico — ${changeId}`,
    body,
    nonce,
    css: timelineCss(),
  })
}
