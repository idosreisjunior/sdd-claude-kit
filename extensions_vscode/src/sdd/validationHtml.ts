// Renderização do relatório de validação (feature 0008, REQ-EVID-001; redesenhado pela
// 0036, TASK-COCK-013) — lógica pura, sem a API do VS Code.
//
// ORIGEM DO LAYOUT (REQ-COCK-007): derivado da etapa Verificar do mockup
// `12-wizard-8-verify`, que já apresenta critérios de aceite e o estado de cada um — é o
// mesmo conteúdo desta tela, em outra superfície. Não há mockup próprio para o relatório,
// e a derivação está declarada aqui.
//
// Painel SOMENTE-LEITURA: `enableScripts: false` preservado (ADR-038). Identidade pelo CSS
// compartilhado, sem runtime.
import { renderStaticPanelHtml } from './panelHtml'
import { verdictLabel, VERDICTS, type ValidationReport, type Verdict } from './validationReport'

/**
 * Escapa texto para inserção segura em HTML.
 *
 * Mantido aqui e com este comportamento porque é contrato público deste módulo, coberto
 * por TEST-EVID-003.
 */
export function esc(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/** Token de cor de cada veredito. Sem cor literal — o guarda TEST-COCK-001 cobre isto. */
const VERDICT_TOKEN: Readonly<Record<Verdict, string>> = {
  atendido: '--sdd-ok',
  parcial: '--sdd-queued',
  'nao-testado': '--sdd-queued',
  'nao-atendido': '--sdd-danger',
  'nao-aplicavel': '--sdd-text-muted',
}

/**
 * CSS do relatório. O fundo translúcido de cada veredito vem de `color-mix` SOBRE o token,
 * não de um `rgba()` literal: a cor continua derivando da camada, e o guarda continua
 * podendo verificar isso.
 */
function validationCss(): string {
  const verdicts = VERDICTS.map((v) => {
    const token = VERDICT_TOKEN[v]
    return `  .v-${v} { color: var(${token}); background: color-mix(in srgb, var(${token}) 20%, transparent); }`
  }).join('\n')
  return `
  .val-sub { color: var(--sdd-text-muted); font-size: .85rem; margin: -.5rem 0 1rem; }
  .val-summary { display: flex; flex-wrap: wrap; gap: .4rem; margin-bottom: 1.2rem; }
  .val-chip { padding: .2rem .6rem; border-radius: .5rem; font-size: .8rem; font-weight: 600; border: 1px solid var(--sdd-border); }
  .val-table { border-collapse: collapse; width: 100%; }
  .val-table th, .val-table td { text-align: left; padding: .45rem .5rem; border-bottom: 1px solid var(--sdd-border); vertical-align: top; }
  .val-table th { font-size: .72rem; text-transform: uppercase; letter-spacing: .05em; color: var(--sdd-text-muted); font-weight: 700; }
  .val-table code { font-size: .78rem; color: var(--sdd-link); }
  .val-title { display: block; font-size: .8rem; color: var(--sdd-text-muted); }
  .val-badge { display: inline-block; padding: .1rem .5rem; border-radius: .4rem; font-size: .76rem; font-weight: 600; white-space: nowrap; }
  .val-note { display: block; margin-top: .2rem; font-size: .76rem; color: var(--sdd-text-muted); }
  .val-flags { font-size: .78rem; color: var(--sdd-text-muted); white-space: nowrap; }
${verdicts}
  `
}

/** Gera o documento HTML do relatório. `nonce` deve ser alfanumérico. */
export function renderValidationHtml(report: ValidationReport, nonce: string): string {
  const total = report.requirements.length
  const body = `  <header class="ui-panel-header">
    <div class="titles">
      <h1>Validação</h1>
      <span class="subtitle">${esc(report.changeId)}</span>
    </div>
  </header>
  <div class="val-sub">${total} requisito(s) · classificação pela cobertura declarada na matriz (estimativa; RF-017).</div>
  <div class="val-summary">
    ${VERDICTS.map((v) => summaryChip(v, report.summary[v])).join('\n    ')}
  </div>
  ${table(report)}`

  return renderStaticPanelHtml({
    title: `Validação — ${report.changeId}`,
    body,
    nonce,
    css: validationCss(),
  })
}

function summaryChip(verdict: Verdict, count: number): string {
  return `<span class="val-chip v-${verdict}">${count} ${esc(verdictLabel(verdict))}</span>`
}

function table(report: ValidationReport): string {
  if (report.requirements.length === 0) {
    return `<div class="ui-empty">
      <h2>Nada a validar</h2>
      <p>Matriz de rastreabilidade vazia ou ausente — não há requisito para classificar.</p>
    </div>`
  }
  const rows = report.requirements
    .map(
      (r) => `<tr>
      <td><code>${esc(r.id)}</code><span class="val-title">${esc(r.title)}</span></td>
      <td><span class="val-badge v-${r.verdict}">${esc(verdictLabel(r.verdict))}</span>${
        r.note ? `<span class="val-note">${esc(r.note)}</span>` : ''
      }</td>
      <td class="val-flags">${flag('tarefa', r.hasTasks)} · ${flag('teste', r.hasTests)} · ${flag('impl', r.hasImplementation)}</td>
    </tr>`,
    )
    .join('\n    ')
  return `<table class="val-table">
    <thead><tr><th>Requisito</th><th>Veredito</th><th>Cobertura</th></tr></thead>
    <tbody>
    ${rows}
    </tbody>
  </table>`
}

function flag(label: string, present: boolean): string {
  return `${present ? '✓' : '✗'} ${label}`
}
