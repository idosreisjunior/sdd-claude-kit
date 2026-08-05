// Documento da sidebar (feature 0036, TASK-COCK-016, ADR-036) — lógica pura, sem a API do
// VS Code. Emite o documento e o payload; a marcação nasce no cliente Preact.
//
// Passa pelo `renderPanelHtml` como qualquer superfície interativa: CSP com nonce, tokens,
// componentes compartilhados e o estado como bloco de dados com `<` neutralizado.
import { renderPanelHtml } from './panelHtml'
import type { SidebarState } from './sidebarModel'

/** CSS da lista. Só tokens e classes compartilhadas — TEST-COCK-001 varre este arquivo. */
export function sidebarCss(): string {
  return `
  body { padding: .35rem .4rem; }
  .sb-group { font-size: .68rem; text-transform: uppercase; letter-spacing: .06em; color: var(--sdd-text-muted); font-weight: 700; padding: .5rem .3rem .2rem; }
  .sb-list { list-style: none; margin: 0; padding: 0; }
  .sb-item { margin-bottom: .25rem; }
  .sb-item .ui-card { padding: .4rem .45rem; cursor: pointer; }
  .sb-item.focused .ui-card { outline: 2px solid var(--sdd-focus); outline-offset: 1px; }
  .sb-item.selected .ui-card { border-color: var(--sdd-accent); }
  .sb-head { display: flex; align-items: center; gap: .35rem; }
  .sb-title { flex: 1 1 auto; min-width: 0; font-size: .82rem; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .sb-id { font-family: var(--vscode-editor-font-family, monospace); font-size: .68rem; color: var(--sdd-text-muted); }
  .sb-meta { display: flex; align-items: center; gap: .35rem; margin-top: .25rem; }
  .sb-bar { flex: 1 1 auto; height: .3rem; border-radius: .2rem; background: var(--sdd-border); overflow: hidden; }
  .sb-bar > i { display: block; height: 100%; background: var(--sdd-progress); }
  .sb-count { font-size: .66rem; color: var(--sdd-text-muted); font-variant-numeric: tabular-nums; }
  .sb-actions { display: flex; gap: .15rem; flex-shrink: 0; }
  .sb-act { font: inherit; font-size: .72rem; line-height: 1; padding: .15rem .3rem; border-radius: .25rem; border: 1px solid transparent; background: transparent; color: var(--sdd-text-muted); cursor: pointer; }
  .sb-act:hover { background: var(--sdd-hover); color: var(--sdd-text); }
  .sb-welcome { padding: .75rem .5rem; }
  .sb-welcome h1 { font-size: .95rem; margin: 0 0 .4rem; }
  .sb-welcome p { font-size: .8rem; color: var(--sdd-text-muted); margin: 0 0 .5rem; }
  .sb-steps { list-style: none; margin: .6rem 0 0; padding: 0; display: flex; flex-direction: column; gap: .45rem; }
  .sb-steps li { font-size: .76rem; color: var(--sdd-text-muted); }
  .sb-steps b { display: block; color: var(--sdd-text); font-size: .8rem; }
  `
}

/** Gera o documento da sidebar. `nonce` deve ser alfanumérico. */
export function renderSidebarHtml(state: SidebarState, nonce: string, scriptUri: string): string {
  return renderPanelHtml({
    title: 'SDD — Features',
    payload: state,
    nonce,
    scriptUri,
    css: sidebarCss(),
  })
}
