// Documento HTML de qualquer superfície de webview da extensão (feature 0036,
// TASK-COCK-002, ADR-037) — lógica pura, sem a API do VS Code.
//
// Ponto ÚNICO por onde todos os painéis passam. É isso que torna a postura de segurança
// verificável: um teste sobre esta função cobre todas as superfícies, em vez de N testes
// que podem divergir com o tempo (design §8). O conteúdo executável é sempre o bundle
// Preact da superfície; nada de marcação montada por concatenação.
//
// O estado entra como BLOCO DE DADOS (`<script type="application/json">`), lido pelo
// cliente com textContent + JSON.parse — nunca executado, nunca inserido como HTML. Todo
// texto vindo de `.specs/` é conteúdo não confiável e tem o `<` neutralizado para não
// fechar a tag (NFR-COCK-002, ADR-024).
import { themeTokensCss } from './themeTokens'
import { componentsCss } from './uiCss'

/** Serializa dados para dentro de um `<script>`, neutralizando `<`. */
function inlineJson(value: unknown): string {
  return JSON.stringify(value).replace(/</g, '\\u003c')
}

export interface PanelHtmlOptions {
  /** Título do documento. Aparece só no `<title>`; escapado como texto. */
  title: string
  /** Estado inicial da superfície. Serializado como bloco de dados. */
  payload: unknown
  /** Deve ser alfanumérico. Gerado pela borda a cada render. */
  nonce: string
  /** webview.asWebviewUri(out/webview/<nome>.js) — a borda resolve; aqui é opaco. */
  scriptUri: string
  /** CSS específico da superfície, além dos tokens e do CSS base. */
  css?: string
}

/** Escapa texto para inserção segura em conteúdo HTML. */
export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/**
 * CSS base compartilhado por todas as superfícies: reset mínimo e a tipografia do host.
 * Cores vêm dos tokens `--sdd-*` — nenhuma cor de conteúdo é declarada aqui.
 */
export function baseCss(): string {
  return `
  * { box-sizing: border-box; }
  body { margin: 0; padding: 0; font-family: var(--vscode-font-family); font-size: var(--vscode-font-size); color: var(--sdd-text); background: var(--sdd-surface-raised); }
  a { color: var(--sdd-link); }
  :focus-visible { outline: 2px solid var(--sdd-focus); outline-offset: 2px; }
  code { font-family: var(--vscode-editor-font-family, monospace); }
  `
}

/**
 * Gera o documento de uma superfície de webview. A CSP proíbe tudo por padrão e libera
 * apenas o `<style>` e o `<script>` que carregam este nonce — sem rede, sem inline solto.
 */
export function renderPanelHtml({
  title,
  payload,
  nonce,
  scriptUri,
  css = '',
}: PanelHtmlOptions): string {
  const csp = `default-src 'none'; style-src 'nonce-${nonce}'; script-src 'nonce-${nonce}';`
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta http-equiv="Content-Security-Policy" content="${csp}">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(title)}</title>
<style nonce="${nonce}">
${themeTokensCss()}
${baseCss()}
${componentsCss()}
${css}
</style>
</head>
<body>
  <div id="root"></div>
  <script type="application/json" id="sdd-state" nonce="${nonce}">${inlineJson(payload)}</script>
  <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`
}
