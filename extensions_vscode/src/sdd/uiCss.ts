// CSS dos componentes compartilhados (feature 0036, TASK-COCK-003, ADR-037) — lógica
// pura. Emitido uma vez por documento, junto do CSS base do `panelHtml`.
//
// Toda cor vem de um token `--sdd-*`: o teste-guarda TEST-COCK-001 varre este arquivo e
// falha se aparecer `--vscode-*` de cor ou hex fixo. Se você precisar de uma cor que não
// existe como token, o lugar de criá-la é `themeTokens.ts`, não aqui.

/** CSS de `Card`, `StatusBadge`, `PanelHeader`, `EmptyState`, `Toolbar` e `StatTile`. */
export function componentsCss(): string {
  return `
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

  .ui-badge { display: inline-block; font-size: .66rem; font-weight: 700; letter-spacing: .04em; padding: .1rem .45rem; border-radius: .8rem; color: var(--sdd-on-brand); white-space: nowrap; }

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
  .ui-btn.primary { background: var(--sdd-accent); border-color: var(--sdd-accent); color: var(--sdd-on-brand); }
  .ui-btn:disabled { opacity: .5; cursor: not-allowed; }
  `
}
