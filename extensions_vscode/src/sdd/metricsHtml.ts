// Renderização do relatório de métricas (feature 0009, RF-022, REQ-METR-002; redesenhado
// pela 0036, TASK-COCK-012) — lógica pura, sem a API do VS Code.
//
// ORIGEM DO LAYOUT (REQ-COCK-007): derivado dos *stat tiles* e da barra de progresso do
// mockup `13-feature-dashboard` — a única tela aprovada que apresenta números agregados.
// Não há mockup próprio para métricas, e a derivação está declarada aqui.
//
// Painel SOMENTE-LEITURA: `enableScripts: false` preservado (ADR-038). Identidade pelo CSS
// compartilhado, sem runtime.
import { renderStaticPanelHtml } from './panelHtml'
import type { MetricsSnapshot, MetricsDelta } from './metrics'

/**
 * Escapa texto para inserção segura em HTML.
 *
 * Mantido aqui e com este comportamento porque é contrato público deste módulo, coberto
 * por TEST-METR-004. Difere do `escapeHtml` do `panelHtml` por também escapar `'`.
 */
export function esc(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/**
 * CSS do relatório. A largura da barra entra AQUI, no bloco com nonce, e não como
 * `style="width:…"` no elemento: atributo inline não é autorizado por `style-src` com
 * nonce (ver a nota em `uiCss.ts`).
 */
function metricsCss(validatedPct: number): string {
  const width = Math.max(0, Math.min(100, validatedPct))
  return `
  .m-sub { color: var(--sdd-text-muted); font-size: .85rem; margin: -.5rem 0 1rem; }
  .m-bar { height: .5rem; border-radius: .25rem; background: var(--sdd-border); overflow: hidden; margin: 1rem 0 .35rem; }
  .m-bar > span { display: block; height: 100%; background: var(--sdd-progress); width:${width}%; }
  .m-delta { font-size: .78rem; margin-left: .35rem; font-weight: 600; }
  .m-delta.up { color: var(--sdd-ok); }
  .m-delta.down { color: var(--sdd-danger); }
  .m-note { color: var(--sdd-text-muted); font-size: .8rem; margin-top: 1rem; }
  `
}

/** Gera o documento HTML do relatório de métricas. `nonce` deve ser alfanumérico. */
export function renderMetricsHtml(
  s: MetricsSnapshot,
  delta: MetricsDelta | undefined,
  nonce: string,
): string {
  const tiles = [
    tile('Tarefas', `${s.tasksDone}/${s.tasksTotal}`, delta?.tasksDone),
    tile('Requisitos validados', `${s.requirementsValidated}/${s.requirements}`, delta?.requirementsValidated),
    tile('% validado', `${s.validatedPct}%`, delta?.validatedPct, '%'),
    tile('Cenários', String(s.scenarios)),
    tile('Testes', String(s.tests), delta?.tests),
    tile('Arquivos rastreados', String(s.files), delta?.files),
    s.durationDays !== undefined ? tile('Duração (dias)', String(s.durationDays)) : '',
    s.git ? tile('Diff (git)', `+${s.git.added}/-${s.git.removed}`) : '',
    s.contextTokens !== undefined ? tile('Contexto (est.)', `~${formatTokens(s.contextTokens)}`) : '',
  ]
    .filter(Boolean)
    .join('\n      ')

  const body = `  <header class="ui-panel-header">
    <div class="titles">
      <h1>Métricas</h1>
      <span class="subtitle">${esc(s.changeId)}</span>
    </div>
  </header>
  <div class="m-sub">${esc(s.status)} · medido em ${esc(s.timestamp)}${
    delta ? ' · delta vs. medição anterior' : ' · primeira medição'
  }</div>
  <div class="ui-tiles">
      ${tiles}
  </div>
  <div class="m-bar"><span></span></div>
  <div class="m-note">Métricas locais, sem telemetria (RNF-004). Contexto/tokens são estimativa (~4 caracteres/token).</div>`

  return renderStaticPanelHtml({
    title: `Métricas — ${s.changeId}`,
    body,
    nonce,
    css: metricsCss(s.validatedPct),
  })
}

/** Um número agregado, no `StatTile` compartilhado. */
function tile(label: string, value: string, delta?: number, suffix = ''): string {
  return `<div class="ui-tile"><span class="ui-tile-value">${esc(value)}${deltaBadge(delta, suffix)}</span><span class="ui-tile-label">${esc(label)}</span></div>`
}

function deltaBadge(delta: number | undefined, suffix: string): string {
  if (delta === undefined || delta === 0) {
    return ''
  }
  const cls = delta > 0 ? 'up' : 'down'
  const sign = delta > 0 ? '+' : ''
  return `<span class="m-delta ${cls}">${sign}${delta}${suffix}</span>`
}

function formatTokens(n: number): string {
  return n >= 1000 ? `${Math.round(n / 1000)}k` : String(n)
}
