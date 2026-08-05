// Renderização do relatório de validação (feature 0008, REQ-EVID-001) — lógica pura,
// sem a API do VS Code. Gera o HTML do webview a partir do ValidationReport com CSP + nonce
// e escapando todo texto (NFR-EVID-001/002). Sem scripts. WebviewPanel (aba do editor),
// como o dashboard (ADR-005/ADR-012): CSP com nonce.
import { verdictLabel, VERDICTS, type ValidationReport, type Verdict } from './validationReport'

/** Escapa texto para inserção segura em HTML. */
export function esc(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/** Gera o documento HTML do relatório. `nonce` deve ser alfanumérico. */
export function renderValidationHtml(report: ValidationReport, nonce: string): string {
  const csp = `default-src 'none'; style-src 'nonce-${nonce}';`
  const total = report.requirements.length
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta http-equiv="Content-Security-Policy" content="${csp}">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Validação — ${esc(report.changeId)}</title>
<style nonce="${nonce}">
  body { font-family: var(--vscode-font-family); color: var(--sdd-text); padding: 1rem 1.25rem; line-height: 1.5; }
  h1 { font-size: 1.3rem; margin: 0 0 .25rem; }
  .sub { opacity: .75; font-size: .9rem; margin-bottom: 1rem; }
  .summary { display: flex; flex-wrap: wrap; gap: .5rem; margin-bottom: 1.2rem; }
  .chip { padding: .15rem .6rem; border-radius: .5rem; font-size: .82rem; border: 1px solid var(--sdd-border); }
  table { border-collapse: collapse; width: 100%; }
  th, td { text-align: left; padding: .4rem .5rem; border-bottom: 1px solid var(--sdd-border); vertical-align: top; }
  th { font-size: .75rem; text-transform: uppercase; letter-spacing: .04em; opacity: .7; }
  code { font-family: var(--vscode-editor-font-family); }
  .badge { display: inline-block; padding: .05rem .45rem; border-radius: .4rem; font-size: .8rem; white-space: nowrap; }
  .v-atendido { background: rgba(64,160,64,.22); color: var(--sdd-ok); }
  .v-parcial, .v-nao-testado { background: rgba(200,150,40,.22); color: var(--sdd-queued); }
  .v-nao-atendido { background: rgba(200,60,60,.22); color: var(--sdd-danger); }
  .v-nao-aplicavel { background: var(--sdd-badge-bg); color: var(--sdd-badge-fg); opacity: .85; }
  .flags { opacity: .7; font-size: .8rem; }
  .note { opacity: .7; font-size: .82rem; }
  .muted { opacity: .7; }
</style>
</head>
<body>
  <h1>Validação — ${esc(report.changeId)}</h1>
  <div class="sub">${total} requisito(s) · classificação pela cobertura declarada na matriz (estimativa; RF-017).</div>
  <div class="summary">
    ${VERDICTS.map((v) => summaryChip(v, report.summary[v])).join('\n    ')}
  </div>
  ${table(report)}
</body>
</html>`
}

function summaryChip(verdict: Verdict, count: number): string {
  return `<span class="chip badge v-${verdict}">${count} ${esc(verdictLabel(verdict))}</span>`
}

function table(report: ValidationReport): string {
  if (report.requirements.length === 0) {
    return `<p class="muted">Matriz de rastreabilidade vazia ou ausente — nada a validar.</p>`
  }
  const rows = report.requirements
    .map(
      (r) => `<tr>
      <td><code>${esc(r.id)}</code><br><span class="muted">${esc(r.title)}</span></td>
      <td><span class="badge v-${r.verdict}">${esc(verdictLabel(r.verdict))}</span>${r.note ? `<br><span class="note">${esc(r.note)}</span>` : ''}</td>
      <td class="flags">${flag('tarefa', r.hasTasks)} · ${flag('teste', r.hasTests)} · ${flag('impl', r.hasImplementation)}</td>
    </tr>`,
    )
    .join('\n    ')
  return `<table>
    <thead><tr><th>Requisito</th><th>Veredito</th><th>Cobertura</th></tr></thead>
    <tbody>
    ${rows}
    </tbody>
  </table>`
}

function flag(label: string, present: boolean): string {
  return `${present ? '✓' : '✗'} ${label}`
}
