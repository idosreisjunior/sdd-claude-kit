// HTML do webview do editor de spec (RF-006, TASK-EDIT-003) — lógica pura, sem a
// API do VS Code. Documento com CSP + nonce (style e script), um textarea com o
// Markdown (escapado) e o painel renderizado (specView). O script mínimo faz só a
// mensageria de sincronização com o provider (ADR-006).
//
// Redesenhado pela 0036 (TASK-COCK-014). ORIGEM DO LAYOUT (REQ-COCK-007): a hierarquia do
// painel de visualização deriva da etapa Especificar do mockup 06-wizard-2-spec, que já
// lista requisitos e cenários. Por ADR-039/040 o cliente inline PERMANECE — os testes de
// specEditorHtml.test.ts afirmam o mecanismo (script inline, #editor, #view) e o editor já
// reage ao usuário sem precisar de outro runtime.
import { componentsCss } from './uiCss'
import { renderSpecView } from './specView'
import { esc } from './dashboardHtml'

/** Script de sincronização do webview. Estático; sem `${}` nem backticks. */
const SYNC_SCRIPT = [
  'const vscode = acquireVsCodeApi();',
  "const editor = document.getElementById('editor');",
  "const view = document.getElementById('view');",
  'let timer;',
  "editor.addEventListener('input', function () {",
  '  clearTimeout(timer);',
  '  timer = setTimeout(function () {',
  "    vscode.postMessage({ type: 'edit', text: editor.value });",
  '  }, 150);',
  '});',
  "window.addEventListener('message', function (e) {",
  '  const m = e.data;',
  "  if (m && m.type === 'update') {",
  '    if (document.activeElement !== editor && editor.value !== m.text) {',
  '      editor.value = m.text;',
  '    }',
  '    view.innerHTML = m.viewHtml;',
  '  }',
  '});',
].join('\n')

/** Gera o documento HTML do editor. `nonce` deve ser alfanumérico. */
export function renderSpecEditorHtml(markdown: string, nonce: string): string {
  const csp = `default-src 'none'; style-src 'nonce-${nonce}'; script-src 'nonce-${nonce}';`
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta http-equiv="Content-Security-Policy" content="${csp}">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>SDD: editor de spec</title>
<style nonce="${nonce}">
${componentsCss()}
  html, body { height: 100%; margin: 0; }
  body { font-family: var(--vscode-font-family); color: var(--sdd-text); background: var(--sdd-surface-raised); }
  .wrap { display: grid; grid-template-columns: 1fr 1fr; gap: 0; height: 100vh; }
  #editor {
    box-sizing: border-box; width: 100%; height: 100%; resize: none; border: none;
    padding: 1rem; font-family: var(--vscode-editor-font-family, monospace);
    font-size: var(--vscode-editor-font-size, 13px);
    color: var(--sdd-text); background: var(--sdd-surface-raised);
    border-right: 1px solid var(--sdd-border); outline: none;
  }
  #view { overflow: auto; padding: 1rem 1.25rem; line-height: 1.5; }
  #view h1 { font-size: 1.15rem; margin: 0 0 .6rem; font-weight: 700; }
  #view h2 { font-size: .78rem; text-transform: uppercase; letter-spacing: .06em; color: var(--sdd-text-muted); font-weight: 700; margin: 1.2rem 0 .4rem; }
  #view h3 { font-size: .92rem; font-weight: 600; margin: .8rem 0 .25rem; }
  #view .id { color: var(--sdd-link); font-weight: 600; font-family: var(--vscode-editor-font-family, monospace); font-size: .85em; }
  #view p { margin: .5rem 0; }
</style>
</head>
<body>
  <div class="wrap">
    <textarea id="editor" spellcheck="false">${esc(markdown)}</textarea>
    <div id="view">${renderSpecView(markdown)}</div>
  </div>
  <script nonce="${nonce}">
${SYNC_SCRIPT}
  </script>
</body>
</html>`
}
