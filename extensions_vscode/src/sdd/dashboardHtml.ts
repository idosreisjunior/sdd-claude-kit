// Renderização do dashboard (RF-005, TASK-UI-003) — lógica pura, sem a API do VS
// Code. Gera o HTML do webview a partir do DashboardModel com CSP + nonce e
// escapando todo texto vindo dos artefatos (NFR-UI-002). Sem scripts, sem rede.
import type { Count, DashboardModel } from './dashboardModel'

/** Escapa texto para inserção segura em HTML (NFR-UI-002). */
export function esc(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/** Gera o documento HTML do dashboard. `nonce` deve ser alfanumérico. */
export function renderDashboardHtml(model: DashboardModel, nonce: string): string {
  const csp = `default-src 'none'; style-src 'nonce-${nonce}'; img-src data:;`
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta http-equiv="Content-Security-Policy" content="${csp}">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(model.title)}</title>
<style nonce="${nonce}">
  body { font-family: var(--vscode-font-family); color: var(--vscode-foreground); padding: 1rem 1.25rem; line-height: 1.5; }
  h1 { font-size: 1.3rem; margin: 0 0 .25rem; }
  h2 { font-size: .95rem; text-transform: uppercase; letter-spacing: .04em; opacity: .8; margin: 1.4rem 0 .5rem; }
  .sub { opacity: .75; font-size: .9rem; margin-bottom: .5rem; }
  .badge { display: inline-block; padding: .1rem .5rem; border-radius: .5rem; background: var(--vscode-badge-background); color: var(--vscode-badge-foreground); font-size: .8rem; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(9rem, 1fr)); gap: .5rem; }
  .card { border: 1px solid var(--vscode-panel-border); border-radius: .4rem; padding: .5rem .6rem; }
  .card .n { font-size: 1.4rem; font-weight: 600; }
  .card .l { opacity: .75; font-size: .8rem; }
  .na { opacity: .55; font-style: italic; }
  .bar { height: .5rem; border-radius: .25rem; background: var(--vscode-panel-border); overflow: hidden; margin: .35rem 0; }
  .bar > span { display: block; height: 100%; background: var(--vscode-progressBar-background); }
  ul { margin: .25rem 0; padding-left: 1.2rem; }
  li { margin: .15rem 0; }
  .sev { font-size: .75rem; opacity: .8; }
  .hist { font-size: .85rem; }
  .hist .d { opacity: .6; }
  .muted { opacity: .7; }
</style>
</head>
<body>
  <h1>${esc(model.title)}</h1>
  <div class="sub">${esc(model.id)} · ${esc(model.type)} · <span class="badge">${esc(model.status)}</span></div>
  ${objectiveBlock(model)}
  ${progressBlock(model)}
  <h2>Contagens</h2>
  <div class="grid">
    ${card('Requisitos', model.counts.requirements)}
    ${card('Cenários', model.counts.scenarios)}
    ${card('Critérios de aceite', model.counts.acceptanceCriteria)}
    ${card('Tarefas', model.counts.tasks)}
    ${card('Testes', model.counts.tests)}
    ${card('Arquivos', model.counts.files)}
  </div>
  ${blockersBlock(model)}
  ${historyBlock(model)}
  <h2>Ainda não disponível</h2>
  <ul class="muted">
    ${model.deferred.map((d) => `<li>${esc(d.label)}: <span class="na">${esc(d.note)}</span></li>`).join('\n    ')}
  </ul>
</body>
</html>`
}

function objectiveBlock(model: DashboardModel): string {
  if (!model.objective) {
    return ''
  }
  return `<h2>Objetivo</h2>\n  <p>${esc(model.objective).replace(/\n+/g, ' ')}</p>`
}

function progressBlock(model: DashboardModel): string {
  if (!model.progress) {
    return ''
  }
  const { done, total } = model.progress
  const pct = total > 0 ? Math.round((done / total) * 100) : 0
  return `<h2>Progresso</h2>
  <div>${done}/${total} tarefas (${pct}%)</div>
  <div class="bar"><span style="width:${pct}%"></span></div>`
}

function card(label: string, count: Count): string {
  const n = count.available ? String(count.value) : `<span class="na">${esc(count.note)}</span>`
  return `<div class="card"><div class="n">${n}</div><div class="l">${esc(label)}</div></div>`
}

function blockersBlock(model: DashboardModel): string {
  if (model.blockers.length === 0) {
    return `<h2>Bloqueios</h2>\n  <p class="muted">Nenhum bloqueio ativo.</p>`
  }
  const items = model.blockers
    .map((b) => `<li><strong>${esc(b.question)}</strong> <span class="sev">(${esc(b.severity)})</span><br>${esc(b.description)}</li>`)
    .join('\n    ')
  return `<h2>Bloqueios</h2>\n  <ul>\n    ${items}\n  </ul>`
}

function historyBlock(model: DashboardModel): string {
  if (model.history.length === 0) {
    return ''
  }
  const items = model.history
    .map((h) => `<li class="hist"><span class="badge">${esc(h.status)}</span> <span class="d">${esc(h.date)}</span><br>${esc(h.reason)}</li>`)
    .join('\n    ')
  return `<h2>Histórico</h2>\n  <ul>\n    ${items}\n  </ul>`
}
