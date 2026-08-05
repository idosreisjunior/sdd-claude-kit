// Tokens de tema do SDD Cockpit (feature 0035, ADR-035) — lógica pura, sem a API do
// VS Code. Emite o CSS dos tokens `--sdd-*` usados pelo webview do wizard.
//
// Duas camadas, por decisão do ADR-035:
//   • CONTEÚDO (superfície, borda, texto, entradas): cada token DERIVA de uma variável
//     `--vscode-*`, para respeitar tema claro/escuro e a personalização do usuário. O
//     valor de fallback (hex) só entra quando não há host do VS Code — ex.: pré-visualizar
//     o HTML fora do editor. Nenhuma cor de conteúdo é fixa.
//   • MARCA (acento violeta/coral e as cores de status do ciclo de vida): é a paleta
//     semântica do SDD, cor própria aplicada como camada de destaque — não substitui o
//     tema do conteúdo. Espelha docs/ui-redesign/STYLE-CONTRACT.md.

/** Tokens de conteúdo: cada valor referencia uma variável `--vscode-*` (com fallback). */
export const CONTENT_TOKENS: Readonly<Record<string, string>> = {
  '--sdd-surface': 'var(--vscode-editorWidget-background, #161B22)',
  '--sdd-surface-raised': 'var(--vscode-editor-background, #1B2230)',
  '--sdd-border': 'var(--vscode-panel-border, #263041)',
  '--sdd-text': 'var(--vscode-foreground, #E6EDF3)',
  '--sdd-text-muted': 'var(--vscode-descriptionForeground, #9AA7B4)',
  '--sdd-progress': 'var(--vscode-progressBar-background, #7C6BF0)',
  '--sdd-badge-bg': 'var(--vscode-badge-background, #1B2230)',
  '--sdd-badge-fg': 'var(--vscode-badge-foreground, #E6EDF3)',
  '--sdd-focus': 'var(--vscode-focusBorder, #7C6BF0)',
  '--sdd-link': 'var(--vscode-textLink-foreground, #4C9BF0)',
  '--sdd-input-bg': 'var(--vscode-input-background, #0E1116)',
  '--sdd-input-border': 'var(--vscode-input-border, var(--vscode-panel-border, #263041))',
}

/** Acento de marca: cor própria do SDD Cockpit (ADR-035), não derivada do tema. */
export const BRAND_TOKENS: Readonly<Record<string, string>> = {
  '--sdd-accent': '#7C6BF0',
  '--sdd-accent-2': '#9C8CFF',
  '--sdd-ai': '#E08256',
  '--sdd-ai-2': '#F0A07A',
}

/** Cores de status do ciclo de vida — paleta semântica do SDD (STYLE-CONTRACT.md). */
export const STATUS_TOKENS: Readonly<Record<string, string>> = {
  '--sdd-status-draft': '#6B7684',
  '--sdd-status-clarified': '#4C9BF0',
  '--sdd-status-designed': '#7C6BF0',
  '--sdd-status-planned': '#E0A33A',
  '--sdd-status-approved': '#38BDC9',
  '--sdd-status-in-progress': '#E0823A',
  '--sdd-status-verified': '#3FB86B',
  '--sdd-status-archived': '#49525E',
}

/** Serializa um mapa de tokens em declarações CSS (`  --nome: valor;`). */
function declarations(map: Readonly<Record<string, string>>): string {
  return Object.entries(map)
    .map(([name, value]) => `  ${name}: ${value};`)
    .join('\n')
}

/**
 * CSS dos tokens do SDD Cockpit, para injeção num `<style nonce>` do webview. Emite um
 * bloco `:root` com as três camadas (conteúdo derivado do tema + marca + status).
 */
export function themeTokensCss(): string {
  return `:root {
${declarations(CONTENT_TOKENS)}
${declarations(BRAND_TOKENS)}
${declarations(STATUS_TOKENS)}
}`
}

/** Nome do token `--sdd-status-*` para um status do ciclo de vida (uppercase ou não). */
export function statusToken(status: string): string {
  const key = `--sdd-status-${status.trim().toLowerCase().replace(/_/g, '-')}`
  return key in STATUS_TOKENS ? key : '--sdd-status-draft'
}
