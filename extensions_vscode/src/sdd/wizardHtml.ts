// Documento HTML do webview do wizard (feature 0035, TASK-WIZ-005/007, ADR-033) — lógica
// pura, sem a API do VS Code. O cliente executável é o bundle Preact (out/webview/
// wizard.js), carregado por <script nonce src=…>. O estado inicial (WizardState + o
// resultado do portão de avanço) entra como um bloco de DADOS (<script
// type="application/json">), lido pelo cliente via textContent + JSON.parse — nunca
// executado e nunca inserido como HTML. Todo texto de artefato tem o `<` neutralizado no
// JSON para não fechar a tag (NFR-WIZ-001, espelha o boardHtml).
import { themeTokensCss, readableOn, BRAND_TOKENS, STATUS_TOKENS } from './themeTokens'
import { componentsCss } from './uiCss'
import type { WizardState } from './wizardModel'
import type { AdvanceResult } from './wizardStepGuards'
import type { WizardDetails } from './wizardContent'
import type { HubState } from './wizardHub'

/** Serializa dados para dentro de um <script>, neutralizando `<` (evita fechar a tag). */
function inlineJson(value: unknown): string {
  return JSON.stringify(value).replace(/</g, '\\u003c')
}

/** CSS de layout do wizard (usa os tokens --sdd-*). Injetado sob o <style nonce>. */
export function wizardCss(): string {
  return `
  * { box-sizing: border-box; }
  body { margin: 0; padding: 0; font-family: var(--vscode-font-family); color: var(--sdd-text); background: var(--sdd-surface-raised); }
  .sdd-wizard { padding: 1rem 1.25rem; }
  .sdd-topbar { display: flex; align-items: baseline; gap: .6rem; margin-bottom: 1rem; }
  .sdd-topbar h1 { font-size: 1.1rem; margin: 0; font-weight: 700; }
  .sdd-topbar .sub { color: var(--sdd-text-muted); font-size: .85rem; }
  .sdd-stepper { display: flex; align-items: flex-start; list-style: none; margin: 0 0 1.25rem; padding: 0; }
  .sdd-step { position: relative; flex: 1 1 0; text-align: center; min-width: 0; }
  .sdd-step .conn { position: absolute; top: 13px; left: -50%; width: 100%; height: 2px; background: var(--sdd-border); z-index: 0; }
  .sdd-step.done .conn, .sdd-step.current .conn { background: var(--sdd-accent); }
  .sdd-step:first-child .conn { display: none; }
  .sdd-node { position: relative; z-index: 1; width: 26px; height: 26px; margin: 0 auto; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: .72rem; font-weight: 700; background: var(--sdd-surface); border: 2px solid var(--sdd-border); color: var(--sdd-text-muted); }
  .sdd-step.done .sdd-node { background: var(--sdd-accent); border-color: var(--sdd-accent); color: ${readableOn(BRAND_TOKENS["--sdd-accent"])}; }
  .sdd-step.current .sdd-node { border-color: var(--sdd-accent); color: var(--sdd-text); box-shadow: 0 0 0 3px color-mix(in srgb, var(--sdd-accent) 30%, transparent); }
  .sdd-step .lbl { display: block; margin-top: .35rem; font-size: .72rem; color: var(--sdd-text-muted); overflow: hidden; text-overflow: ellipsis; }
  .sdd-step.current .lbl { color: var(--sdd-text); font-weight: 600; }
  .sdd-step .sum { display: block; font-size: .64rem; color: var(--sdd-text-muted); opacity: .8; }
  .sdd-content { border: 1px solid var(--sdd-border); border-radius: .6rem; padding: 1rem; background: var(--sdd-surface); }
  .sdd-content h2 { margin: 0 0 .35rem; font-size: 1rem; }
  .sdd-content .muted { color: var(--sdd-text-muted); font-size: .85rem; }
  .sdd-stat { margin: .5rem 0 .7rem; font-size: .85rem; color: var(--sdd-text); }
  .sdd-stat strong { color: var(--sdd-accent-2); }
  .sdd-empty { margin: .5rem 0; font-size: .85rem; color: var(--sdd-text-muted); }
  .sdd-warn { margin: .6rem 0 .3rem; font-size: .8rem; color: var(--sdd-status-planned); }
  .sdd-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: .3rem; }
  .sdd-list li { display: flex; align-items: baseline; gap: .5rem; flex-wrap: wrap; font-size: .82rem; padding: .3rem .5rem; border-radius: .35rem; background: var(--sdd-surface-raised); border: 1px solid var(--sdd-border); }
  .sdd-list.compact li { padding: .2rem .5rem; font-size: .78rem; }
  .sdd-list.findings li { border-color: var(--sdd-status-planned); }
  .sdd-list li.critical { border-color: var(--sdd-status-in-progress); }
  .sdd-list code { font-size: .76rem; color: var(--sdd-link); background: var(--sdd-badge-bg); padding: .05rem .3rem; border-radius: .25rem; }
  .sdd-desc { color: var(--sdd-text-muted); flex: 1 1 12rem; min-width: 0; }
  .sdd-sev { font-size: .68rem; text-transform: uppercase; letter-spacing: .04em; color: var(--sdd-text-muted); }
  .sdd-list li.critical .sdd-sev { color: var(--sdd-status-in-progress); font-weight: 700; }
  .sdd-badge { display: inline-block; margin-left: .5rem; font-size: .7rem; padding: .1rem .45rem; border-radius: .8rem; background: var(--sdd-badge-bg); color: var(--sdd-badge-fg); }
  .sdd-badge.critical { background: var(--sdd-status-in-progress); color: ${readableOn(STATUS_TOKENS["--sdd-status-in-progress"])}; }
  .sdd-task-status { font-size: .68rem; text-transform: uppercase; letter-spacing: .04em; color: var(--sdd-text-muted); }
  .sdd-task-status.done { color: var(--sdd-status-verified); }
  .sdd-task-status.in_progress { color: var(--sdd-status-in-progress); }
  .sdd-task-status.blocked { color: var(--sdd-status-planned); }
  .sdd-hub-intro { color: var(--sdd-text-muted); font-size: .85rem; margin: 0 0 1rem; max-width: 46rem; }
  .sdd-group { margin-bottom: 1.1rem; }
  .sdd-group h2 { font-size: .78rem; text-transform: uppercase; letter-spacing: .06em; color: var(--sdd-text-muted); margin: 0 0 .45rem; font-weight: 700; }
  .sdd-hub-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: .4rem; }
  .sdd-hub-item { display: flex; align-items: center; gap: .7rem; padding: .55rem .7rem; border: 1px solid var(--sdd-border); border-radius: .5rem; background: var(--sdd-surface); }
  .sdd-hub-item .id { font-family: var(--vscode-editor-font-family, monospace); font-size: .76rem; color: var(--sdd-link); }
  .sdd-hub-item .title { flex: 1 1 auto; font-size: .86rem; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .sdd-hub-item .type { font-size: .7rem; color: var(--sdd-text-muted); }
  .sdd-btn.ghost { background: transparent; color: var(--sdd-accent-2); border-color: var(--sdd-border); padding: .3rem .7rem; font-size: .8rem; }
  .sdd-btn.ghost:hover { border-color: var(--sdd-accent); }
  .sdd-welcome { border: 1px solid var(--sdd-border); border-radius: .6rem; padding: 1.5rem; background: var(--sdd-surface); text-align: center; }
  .sdd-welcome h2 { margin: 0 0 .5rem; font-size: 1.05rem; }
  .sdd-welcome p { color: var(--sdd-text-muted); font-size: .87rem; margin: 0 auto 1rem; max-width: 34rem; }
  .sdd-backlink { background: none; border: none; color: var(--sdd-text-muted); font: inherit; font-size: .78rem; cursor: pointer; padding: 0; margin-bottom: .6rem; }
  .sdd-backlink:hover { color: var(--sdd-text); text-decoration: underline; }
  .sdd-actions { display: flex; align-items: center; gap: .6rem; flex-wrap: wrap; margin-top: .9rem; }
  .sdd-btn.ai { background: var(--sdd-ai); color: ${readableOn(BRAND_TOKENS["--sdd-ai"])}; }
  .sdd-btn.ai:hover { background: var(--sdd-ai-2); }
  .sdd-btn:focus-visible { outline: 2px solid var(--sdd-focus); outline-offset: 2px; }
  .sdd-hint { color: var(--sdd-text-muted); font-size: .75rem; }
  .sdd-footer { display: flex; flex-direction: column; align-items: flex-end; gap: .4rem; margin-top: 1rem; }
  .sdd-btn { font: inherit; font-size: .9rem; font-weight: 600; padding: .45rem 1rem; border-radius: .5rem; border: 1px solid transparent; cursor: pointer; }
  .sdd-btn.primary { background: var(--sdd-accent); color: ${readableOn(BRAND_TOKENS["--sdd-accent"])}; }
  .sdd-btn:disabled { opacity: .5; cursor: not-allowed; }
  .sdd-reasons { margin: 0; padding-left: 1.1rem; color: var(--sdd-status-planned); font-size: .8rem; text-align: right; list-style: none; }
  .sdd-reasons li::before { content: "⚠ "; }
  `
}

/**
 * O que o cliente renderiza: o HUB (lista de mudanças) ou UMA mudança em curso. O modo
 * é dado pelo host, não inferido no cliente — a borda sabe o que foi pedido.
 */
export type WizardPayload =
  | { view: 'hub'; hub: HubState }
  | {
      view: 'change'
      state: WizardState
      advance: AdvanceResult
      /** Conteúdo dos artefatos para a view da etapa atual (TASK-WIZ-011). */
      details: WizardDetails
      /** `design.md` existe? Sinal que a view Desenhar consome. */
      hasDesign: boolean
    }

/** Argumentos de render: o payload a projetar, o nonce e o URI do bundle. */
export interface WizardHtmlOptions {
  payload: WizardPayload
  nonce: string
  /** webview.asWebviewUri(out/webview/wizard.js) — a borda resolve; aqui é opaco. */
  scriptUri: string
}

/** Gera o documento HTML do wizard. `nonce` deve ser alfanumérico. */
export function renderWizardHtml({ payload, nonce, scriptUri }: WizardHtmlOptions): string {
  const csp = `default-src 'none'; style-src 'nonce-${nonce}'; script-src 'nonce-${nonce}';`
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta http-equiv="Content-Security-Policy" content="${csp}">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Assistente SDD</title>
<style nonce="${nonce}">
${themeTokensCss()}
${componentsCss()}
${wizardCss()}
</style>
</head>
<body>
  <div id="root"></div>
  <script type="application/json" id="sdd-state" nonce="${nonce}">${inlineJson(payload)}</script>
  <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`
}
