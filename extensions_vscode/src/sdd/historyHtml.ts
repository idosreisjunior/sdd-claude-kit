// Renderização do histórico (feature 0016, RF-020, REQ-HIST-001) — lógica pura,
// sem a API do VS Code. HTML do webview com CSP + nonce, texto escapado
// (NFR-HIST-003). WebviewPanel read-only, como métricas/validação (ADR-016).
// Reusa `esc` do relatório de métricas (mesma escapagem de HTML).
import { esc } from './metricsHtml'
import type { HistoryModel, HistoryEvent } from './historyModel'

/** Gera o documento HTML do histórico. `nonce` deve ser alfanumérico. */
export function renderHistoryHtml(changeId: string, model: HistoryModel, nonce: string): string {
  const csp = `default-src 'none'; style-src 'nonce-${nonce}';`
  const events =
    model.events.length > 0
      ? model.events.map(eventRow).join('\n')
      : `    <li class="muted">Sem eventos registrados.</li>`
  const tasks = model.currentState.tasks
  const validation = model.currentState.validation
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta http-equiv="Content-Security-Policy" content="${csp}">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Histórico — ${esc(changeId)}</title>
<style nonce="${nonce}">
  body { font-family: var(--vscode-font-family); color: var(--sdd-text); padding: 1rem 1.25rem; line-height: 1.5; }
  h1 { font-size: 1.3rem; margin: 0 0 .75rem; }
  h2 { font-size: 1rem; margin: 1.25rem 0 .4rem; }
  ul { list-style: none; padding: 0; margin: 0; }
  li { border-left: 2px solid var(--sdd-border); padding: .3rem 0 .3rem .75rem; margin-left: .3rem; }
  .kind { font-size: .7rem; text-transform: uppercase; opacity: .6; margin-left: .4rem; }
  .date { opacity: .7; font-size: .8rem; }
  .detail { opacity: .8; font-size: .85rem; white-space: pre-wrap; }
  .muted { opacity: .7; font-size: .85rem; }
</style>
</head>
<body>
  <h1>Histórico — ${esc(changeId)}</h1>
  <ul>
${events}
  </ul>
  <h2>Estado atual</h2>
  <ul>
    ${tasks ? `<li>Tarefas: ${tasks.done}/${tasks.total}</li>` : ''}
    ${validation ? `<li>Validação: ${validation.atendido} atendido(s), ${validation.pendentes} pendente(s)</li>` : ''}
  </ul>
  <h2>Não capturado (sem fonte persistida)</h2>
  <ul>
    ${model.unavailable.map((u) => `<li class="muted">${esc(u)}</li>`).join('\n    ')}
  </ul>
</body>
</html>`
}

function eventRow(e: HistoryEvent): string {
  const detail = e.detail ? `<div class="detail">${esc(e.detail)}</div>` : ''
  return `    <li><span class="date">${esc(e.date || '—')}</span><span class="kind">${esc(e.kind)}</span><br>${esc(e.title)}${detail}</li>`
}
