// CSS dos componentes compartilhados (feature 0036, TASK-COCK-003, ADR-037) — lógica
// pura. Emitido uma vez por documento, junto do CSS base do `panelHtml`.
//
// Toda cor vem de um token `--sdd-*`: o teste-guarda TEST-COCK-001 varre este arquivo e
// falha se aparecer `--vscode-*` de cor ou hex fixo. Se você precisar de uma cor que não
// existe como token, o lugar de criá-la é `themeTokens.ts`, não aqui.
//
// Por que as cores de status são CLASSES e não estilo inline: a CSP é
// `style-src 'nonce-…'`, e nonce autoriza elementos `<style>` — atributos `style=` só
// passariam com `'unsafe-inline'`, que enfraqueceria a postura (NFR-COCK-002). Tudo que
// varia por dado vira classe declarada aqui, ou regra emitida no bloco com nonce.
import { STATUS_TOKENS, BRAND_TOKENS, readableOn } from './themeTokens'

/**
 * Uma classe por status do ciclo de vida: `.ui-badge.s-designed`, `.ui-badge.s-…`.
 *
 * Cada uma leva a SUA tinta, escolhida por contraste em vez de fixada em branco: a paleta
 * mistura fundos claros e escuros, e branco em todos reprovava seis dos dez no WCAG AA.
 */
function statusBadgeClasses(): string {
  return Object.entries(STATUS_TOKENS)
    .map(([tokenName, hex]) => {
      const cls = tokenName.replace('--sdd-status-', 's-')
      return `  .ui-badge.${cls} { background: var(${tokenName}); color: ${readableOn(hex)}; }`
    })
    .join('\n')
}

/** CSS de `Card`, `StatusBadge`, `PanelHeader`, `EmptyState`, `Toolbar` e `StatTile`. */
export function componentsCss(): string {
  return `
${statusBadgeClasses()}
  .ui-panel-header { display: flex; align-items: flex-start; gap: .75rem; margin-bottom: 1rem; }
  .ui-panel-header .titles { flex: 1 1 auto; min-width: 0; }
  .ui-panel-header h1 { margin: 0; font-size: 1.05rem; font-weight: 700; }
  .ui-panel-header .subtitle { display: block; margin-top: .15rem; font-size: .8rem; color: var(--sdd-text-muted); }
  .ui-panel-header .actions { display: flex; align-items: center; gap: .4rem; flex-shrink: 0; }

  .ui-toolbar { display: flex; align-items: center; gap: .5rem; flex-wrap: wrap; padding: .5rem 0 .75rem; }

  .ui-card { border: 1px solid var(--sdd-border); border-radius: .5rem; background: var(--sdd-surface); padding: .7rem .8rem; }
  .ui-card + .ui-card { margin-top: .4rem; }
  .ui-card .ui-card-head { display: flex; align-items: center; gap: .5rem; margin-bottom: .35rem; }
  .ui-card .ui-card-title { flex: 1 1 auto; min-width: 0; font-size: .88rem; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .ui-card .ui-card-actions { display: flex; gap: .3rem; flex-shrink: 0; }
  .ui-card:hover { background: var(--sdd-hover); }

  /* O fundo padrão é o de rascunho: um status desconhecido, que não casa com nenhuma
     classe .s-*, cai nele em vez de ficar sem fundo — texto branco sobre transparente
     seria um badge invisível. Espelha em CSS o fallback de statusToken(). */
  .ui-badge { display: inline-block; font-size: .66rem; font-weight: 700; letter-spacing: .04em; padding: .1rem .45rem; border-radius: .8rem; background: var(--sdd-status-draft); color: ${readableOn(STATUS_TOKENS["--sdd-status-draft"])}; white-space: nowrap; }

  .ui-empty { border: 1px dashed var(--sdd-border); border-radius: .5rem; padding: 1.25rem; text-align: center; color: var(--sdd-text-muted); }
  .ui-empty h2 { margin: 0 0 .35rem; font-size: .95rem; color: var(--sdd-text); font-weight: 600; }
  .ui-empty p { margin: 0 auto; max-width: 34rem; font-size: .83rem; }
  .ui-empty .ui-empty-action { margin-top: .9rem; }

  .ui-tiles { display: flex; flex-wrap: wrap; gap: .5rem; }
  .ui-tile { flex: 1 1 7rem; min-width: 7rem; border: 1px solid var(--sdd-border); border-radius: .5rem; background: var(--sdd-surface); padding: .6rem .7rem; }
  .ui-tile .ui-tile-value { display: block; font-size: 1.25rem; font-weight: 700; line-height: 1.1; }
  .ui-tile .ui-tile-label { display: block; margin-top: .2rem; font-size: .72rem; color: var(--sdd-text-muted); }
  .ui-tile.unavailable .ui-tile-value { color: var(--sdd-text-muted); }
  .ui-tile .ui-tile-note { display: block; margin-top: .2rem; font-size: .68rem; color: var(--sdd-text-muted); font-style: italic; }

  .ui-btn { font: inherit; font-size: .8rem; font-weight: 600; padding: .3rem .7rem; border-radius: .4rem; border: 1px solid var(--sdd-border); background: var(--sdd-button-bg); color: var(--sdd-button-fg); cursor: pointer; }
  .ui-btn:hover { background: var(--sdd-button-hover); }
  .ui-btn.primary { background: var(--sdd-accent); border-color: var(--sdd-accent); color: ${readableOn(BRAND_TOKENS["--sdd-accent"])}; }
  .ui-btn:disabled { opacity: .5; cursor: not-allowed; }
  `
}
