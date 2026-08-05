// Renderização do painel Projeto (feature 0013, REQ-PROJ-005) — lógica pura, sem a
// API do VS Code. Gera o HTML do webview a partir do ProjectOverview com CSP + nonce
// e escapando todo texto (NFR-PROJ-004). Sem scripts: as ações usam command: URIs,
// como o dashboard (ADR-005/ADR-010). O provider habilita enableCommandUris.
import { componentsCss } from './uiCss'
import { bandLabel } from './contextGuardian'
import type { ContextCard, CountsCard, HealthCard, DocLink, ProjectOverview } from './projectOverview'

/** Escapa texto para inserção segura em HTML (NFR-PROJ-004). */
export function esc(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/** command: URI para acionar um comando da extensão a partir de um link do webview. */
function commandUri(command: string, args?: unknown[]): string {
  const suffix = args ? `?${encodeURIComponent(JSON.stringify(args))}` : ''
  return `command:${command}${suffix}`
}

function formatTokens(n: number): string {
  return n >= 1000 ? `${Math.round(n / 1000)}k` : String(n)
}

/**
 * Gera o documento HTML do painel. `nonce` deve ser alfanumérico. `cspSource` é o
 * `webview.cspSource` do VS Code: liberá-lo no `style-src` permite que as variáveis
 * de tema (`--vscode-*`) injetadas pelo host apliquem num WebviewView (sem ele, a
 * CSP `default-src 'none'` as bloqueia e os cartões perdem borda/cor). NFR-PROJ-004.
 */
export function renderProjectOverviewHtml(model: ProjectOverview, nonce: string, cspSource: string): string {
  const csp = `default-src 'none'; style-src ${cspSource} 'nonce-${nonce}'; img-src ${cspSource} data:;`
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta http-equiv="Content-Security-Policy" content="${csp}">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Projeto</title>
<style nonce="${nonce}">
${componentsCss()}
  body { font-family: var(--vscode-font-family); color: var(--sdd-text); padding: .5rem .5rem 1rem; line-height: 1.45; font-size: var(--vscode-font-size); }
  /* aparência do cartão vem de .ui-card (uiCss); aqui só o específico do painel */
  .card { padding: .5rem .6rem; margin-bottom: .5rem; }
  .card h2 { font-size: .72rem; text-transform: uppercase; letter-spacing: .04em; opacity: .75; margin: 0 0 .35rem; font-weight: 600; }
  .big { font-size: 1.1rem; font-weight: 600; }
  .muted { opacity: .65; }
  .na { opacity: .6; font-style: italic; }
  a { color: var(--sdd-link); text-decoration: none; }
  a:hover { text-decoration: underline; }
  .action { display: inline-block; margin-top: .35rem; font-size: .85rem; }
  .bar { height: .5rem; border-radius: .25rem; background: var(--sdd-border); overflow: hidden; margin: .35rem 0; }
  .bar > span { display: block; height: 100%; background: var(--sdd-progress); }
  .err { color: var(--sdd-danger); }
  ul { margin: .25rem 0 0; padding: 0; list-style: none; }
  li { margin: .12rem 0; display: flex; justify-content: space-between; gap: .5rem; }
  .count { opacity: .8; font-variant-numeric: tabular-nums; }
  .docs a.absent { pointer-events: none; }
</style>
</head>
<body>
  ${healthCard(model.health)}
  ${contextCard(model.context)}
  ${countsCard(model.counts)}
  ${docsCard(model.docs)}
</body>
</html>`
}

/**
 * HTML do painel quando o workspace ainda não tem a estrutura SDD. O webview não
 * usa `viewsWelcome` (isso é de TreeView), então o estado de boas-vindas mora aqui.
 */
export function renderNotInitializedHtml(nonce: string, cspSource: string): string {
  const csp = `default-src 'none'; style-src ${cspSource} 'nonce-${nonce}';`
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta http-equiv="Content-Security-Policy" content="${csp}">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Projeto</title>
<style nonce="${nonce}">
${componentsCss()}
  body { font-family: var(--vscode-font-family); color: var(--sdd-text); padding: .75rem; line-height: 1.5; font-size: var(--vscode-font-size); }
  p { opacity: .8; }
  a { color: var(--sdd-link); }
</style>
</head>
<body>
  <p>Este workspace ainda não tem a estrutura SDD (.specs).</p>
  <p><a href="${commandUri('sddClaudeKit.initProject')}">Inicializar SDD</a></p>
  <p class="na">A inicialização não sobrescreve arquivos de código.</p>
</body>
</html>`
}

function healthCard(health: HealthCard): string {
  const runAction = `<a class="action" href="${commandUri('sddClaudeKit.runDoctor')}">Rodar Project Doctor</a>`
  let body: string
  if (health.kind === 'not-run') {
    body = `<div class="na">Diagnóstico não executado</div>`
  } else if (health.kind === 'clean') {
    body = `<div class="big">Nenhum problema estrutural</div>`
  } else {
    const parts = [
      `<span class="err">${health.errors} ${plural(health.errors, 'erro', 'erros')}</span>`,
      `${health.warnings} ${plural(health.warnings, 'aviso', 'avisos')}`,
    ]
    if (health.info > 0) {
      parts.push(`${health.info} ${plural(health.info, 'informação', 'informações')}`)
    }
    body = `<div class="big">${parts.join(' · ')}</div>`
  }
  return `<div class="ui-card card"><h2>Saúde estrutural</h2>${body}${runAction}</div>`
}

function contextCard(context: ContextCard): string {
  if (context.kind === 'not-measured') {
    return `<div class="ui-card card"><h2>Contexto (estimativa)</h2>
    <div class="big">— / ${esc(formatTokens(context.max))}</div>
    <div class="na">Ainda não medido — meça numa feature no painel Features.</div></div>`
  }
  const pct = Math.min(100, Math.round(context.fraction * 100))
  return `<div class="ui-card card"><h2>Contexto (estimativa)</h2>
  <div class="big">~${esc(formatTokens(context.used))} / ${esc(formatTokens(context.max))}</div>
  <div class="bar"><span style="width:${pct}%"></span></div>
  <div class="muted">Faixa: ${esc(bandLabel(context.band))} · ${pct}% do teto (~4 caracteres/token)</div></div>`
}

function countsCard(counts: CountsCard): string {
  if (counts.kind === 'no-index') {
    return `<div class="ui-card card"><h2>Mudanças</h2><div class="na">Índice ausente ou ilegível.</div></div>`
  }
  if (counts.total === 0) {
    return `<div class="ui-card card"><h2>Mudanças</h2><div class="na">Nenhuma mudança registrada.</div></div>`
  }
  const rows = counts.byStatus
    .map((s) => `<li><span>${esc(s.status)}</span><span class="count">${s.count}</span></li>`)
    .join('\n    ')
  return `<div class="ui-card card"><h2>Mudanças (${counts.total})</h2><ul>\n    ${rows}\n  </ul></div>`
}

function docsCard(docs: DocLink[]): string {
  const items = docs
    .map((d) => {
      if (!d.exists) {
        return `<li><span class="na">${esc(d.label)} (ausente)</span></li>`
      }
      const href = commandUri('sddClaudeKit.openProjectDoc', [d.relPath])
      return `<li><a href="${href}">${esc(d.label)}</a></li>`
    })
    .join('\n    ')
  return `<div class="card docs"><h2>Documentos do projeto</h2><ul>\n    ${items}\n  </ul></div>`
}

function plural(n: number, singular: string, plural: string): string {
  return n === 1 ? singular : plural
}
