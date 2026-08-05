// Documento HTML do webview do wizard (feature 0035, TASK-WIZ-005, ADR-033) — lógica
// pura, sem a API do VS Code. O cliente executável é o bundle Preact (out/webview/
// wizard.js), carregado por <script nonce src=…>. O estado inicial entra como um bloco
// de DADOS (<script type="application/json">), lido pelo cliente via textContent +
// JSON.parse — nunca executado e nunca inserido como HTML. Todo texto de artefato tem o
// `<` neutralizado no JSON para não fechar a tag (NFR-WIZ-001, espelha o boardHtml).
import { themeTokensCss } from './themeTokens'
import type { WizardState } from './wizardModel'

/** Serializa dados para dentro de um <script>, neutralizando `<` (evita fechar a tag). */
function inlineJson(value: unknown): string {
  return JSON.stringify(value).replace(/</g, '\\u003c')
}

/** CSS de layout do wizard (usa os tokens --sdd-*). Injetado sob o <style nonce>. */
export function wizardCss(): string {
  return `
  * { box-sizing: border-box; }
  body { margin: 0; padding: 0; font-family: var(--vscode-font-family); color: var(--sdd-text); background: var(--vscode-editor-background); }
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
  .sdd-step.done .sdd-node { background: var(--sdd-accent); border-color: var(--sdd-accent); color: #fff; }
  .sdd-step.current .sdd-node { border-color: var(--sdd-accent); color: var(--sdd-text); box-shadow: 0 0 0 3px color-mix(in srgb, var(--sdd-accent) 30%, transparent); }
  .sdd-step .lbl { display: block; margin-top: .35rem; font-size: .72rem; color: var(--sdd-text-muted); overflow: hidden; text-overflow: ellipsis; }
  .sdd-step.current .lbl { color: var(--sdd-text); font-weight: 600; }
  .sdd-step .sum { display: block; font-size: .64rem; color: var(--sdd-text-muted); opacity: .8; }
  .sdd-content { border: 1px solid var(--sdd-border); border-radius: .6rem; padding: 1rem; background: var(--sdd-surface); }
  .sdd-content h2 { margin: 0 0 .35rem; font-size: 1rem; }
  .sdd-content .muted { color: var(--sdd-text-muted); font-size: .85rem; }
  `
}

/** Argumentos de render: o estado inicial, o nonce da CSP e o URI do bundle no webview. */
export interface WizardHtmlOptions {
  state: WizardState
  nonce: string
  /** webview.asWebviewUri(out/webview/wizard.js) — a borda resolve; aqui é opaco. */
  scriptUri: string
}

/** Gera o documento HTML do wizard. `nonce` deve ser alfanumérico. */
export function renderWizardHtml({ state, nonce, scriptUri }: WizardHtmlOptions): string {
  const csp = `default-src 'none'; style-src 'nonce-${nonce}'; script-src 'nonce-${nonce}';`
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta http-equiv="Content-Security-Policy" content="${csp}">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Assistente SDD</title>
<style nonce="${nonce}">
:root {}
${themeTokensCss()}
${wizardCss()}
</style>
</head>
<body>
  <div id="root"></div>
  <script type="application/json" id="sdd-state" nonce="${nonce}">${inlineJson(state)}</script>
  <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`
}
