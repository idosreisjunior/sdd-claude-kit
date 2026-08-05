// Renderização do relatório de métricas (feature 0009, RF-022, REQ-METR-002) — lógica pura,
// sem a API do VS Code. Gera o HTML do webview a partir do MetricsSnapshot com CSP + nonce,
// escapando todo texto (NFR-METR-001). WebviewPanel, como o dashboard/validação (ADR-013).
import type { MetricsSnapshot, MetricsDelta } from './metrics'

/** Escapa texto para inserção segura em HTML. */
export function esc(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/** Gera o documento HTML do relatório de métricas. `nonce` deve ser alfanumérico. */
export function renderMetricsHtml(s: MetricsSnapshot, delta: MetricsDelta | undefined, nonce: string): string {
  const csp = `default-src 'none'; style-src 'nonce-${nonce}';`
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta http-equiv="Content-Security-Policy" content="${csp}">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Métricas — ${esc(s.changeId)}</title>
<style nonce="${nonce}">
  body { font-family: var(--vscode-font-family); color: var(--sdd-text); padding: 1rem 1.25rem; line-height: 1.5; }
  h1 { font-size: 1.3rem; margin: 0 0 .25rem; }
  .sub { opacity: .75; font-size: .9rem; margin-bottom: 1rem; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(9rem, 1fr)); gap: .6rem; }
  .card { border: 1px solid var(--sdd-border); border-radius: .4rem; padding: .55rem .65rem; }
  .card .n { font-size: 1.35rem; font-weight: 600; }
  .card .l { opacity: .75; font-size: .8rem; }
  .delta { font-size: .8rem; margin-left: .35rem; }
  .up { color: var(--sdd-ok); }
  .down { color: var(--sdd-danger); }
  .muted { opacity: .7; font-size: .85rem; margin-top: 1rem; }
  .bar { height: .5rem; border-radius: .25rem; background: var(--sdd-border); overflow: hidden; margin: .35rem 0; }
  .bar > span { display: block; height: 100%; background: var(--sdd-progress); }
</style>
</head>
<body>
  <h1>Métricas — ${esc(s.changeId)}</h1>
  <div class="sub">${esc(s.status)} · medido em ${esc(s.timestamp)}${delta ? ' · delta vs. medição anterior' : ' · primeira medição'}</div>
  <div class="grid">
    ${card('Tarefas', `${s.tasksDone}/${s.tasksTotal}`, delta?.tasksDone)}
    ${card('Requisitos validados', `${s.requirementsValidated}/${s.requirements}`, delta?.requirementsValidated)}
    ${card('% validado', `${s.validatedPct}%`, delta?.validatedPct, '%')}
    ${card('Cenários', String(s.scenarios))}
    ${card('Testes', String(s.tests), delta?.tests)}
    ${card('Arquivos rastreados', String(s.files), delta?.files)}
    ${s.durationDays !== undefined ? card('Duração (dias)', String(s.durationDays)) : ''}
    ${s.git ? card('Diff (git)', `+${s.git.added}/-${s.git.removed}`) : ''}
    ${s.contextTokens !== undefined ? card('Contexto (est.)', `~${formatTokens(s.contextTokens)}`) : ''}
  </div>
  <div class="bar"><span style="width:${Math.min(100, s.validatedPct)}%"></span></div>
  <div class="muted">Métricas locais, sem telemetria (RNF-004). Contexto/tokens são estimativa (~4 caracteres/token).</div>
</body>
</html>`
}

function card(label: string, value: string, delta?: number, suffix = ''): string {
  return `<div class="card"><div class="n">${esc(value)}${deltaBadge(delta, suffix)}</div><div class="l">${esc(label)}</div></div>`
}

function deltaBadge(delta: number | undefined, suffix: string): string {
  if (delta === undefined || delta === 0) {
    return ''
  }
  const cls = delta > 0 ? 'up' : 'down'
  const sign = delta > 0 ? '+' : ''
  return `<span class="delta ${cls}">${sign}${delta}${suffix}</span>`
}

function formatTokens(n: number): string {
  return n >= 1000 ? `${Math.round(n / 1000)}k` : String(n)
}
