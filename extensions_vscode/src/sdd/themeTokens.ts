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
  // Acrescentados pela feature 0036 (TASK-COCK-005): os painéis existentes usavam estas
  // variáveis --vscode-* diretamente, e sem token correspondente não haveria como fazê-los
  // consumir a camada (REQ-COCK-001). Mesma regra das demais: derivam do tema, com
  // fallback só para quando não há host do VS Code.
  '--sdd-input-fg': 'var(--vscode-input-foreground, #E6EDF3)',
  '--sdd-input-placeholder': 'var(--vscode-input-placeholderForeground, #9AA7B4)',
  '--sdd-dropdown-bg': 'var(--vscode-dropdown-background, #0E1116)',
  '--sdd-dropdown-fg': 'var(--vscode-dropdown-foreground, #E6EDF3)',
  '--sdd-button-bg': 'var(--vscode-button-secondaryBackground, #263041)',
  '--sdd-button-fg': 'var(--vscode-button-secondaryForeground, #E6EDF3)',
  '--sdd-button-hover': 'var(--vscode-button-secondaryHoverBackground, #2F3A4D)',
  '--sdd-hover': 'var(--vscode-list-hoverBackground, rgba(127, 127, 127, 0.12))',
  '--sdd-drop': 'var(--vscode-list-dropBackground, rgba(124, 107, 240, 0.18))',
  '--sdd-danger': 'var(--vscode-errorForeground, #E05A5A)',
  '--sdd-ok': 'var(--vscode-testing-iconPassed, #3FB86B)',
  '--sdd-queued': 'var(--vscode-testing-iconQueued, #E0A33A)',
}

/** Acento de marca: cor própria do SDD Cockpit (ADR-035), não derivada do tema. */
export const BRAND_TOKENS: Readonly<Record<string, string>> = {
  '--sdd-accent': '#7C6BF0',
  '--sdd-accent-2': '#9C8CFF',
  '--sdd-ai': '#E08256',
  '--sdd-ai-2': '#F0A07A',
  // Texto sobre uma superfície de marca (acento, IA, badge de status). É cor de marca, não
  // de conteúdo: o par fundo-da-marca/texto tem que se manter legível independentemente do
  // tema do usuário, então não pode derivar de --vscode-*. Acrescentado pela 0036 para que
  // os painéis parem de escrever `#fff` solto (REQ-COCK-001).
  //
  // São DUAS tintas porque uma só não serve. Medindo o contraste WCAG do branco sobre cada
  // fundo da paleta, seis dos dez reprovavam em AA — o pior, o âmbar de `planned`, ficava
  // em 2,22:1 onde texto pequeno exige 4,5:1. Quem escolhe entre elas é `readableOn`.
  '--sdd-on-brand': '#FFFFFF',
  '--sdd-on-brand-dark': '#10141A',
}

/** Luminância relativa (WCAG 2.x) de uma cor `#RRGGBB`. */
function luminance(hex: string): number {
  const channels = [1, 3, 5]
    .map((i) => parseInt(hex.substr(i, 2), 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)))
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2]
}

/** Razão de contraste WCAG entre duas cores `#RRGGBB`. 1:1 é igual; 21:1 é preto e branco. */
export function contrastRatio(a: string, b: string): number {
  const la = luminance(a)
  const lb = luminance(b)
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05)
}

/**
 * A tinta legível sobre um fundo de marca: clara ou escura, a que der mais contraste.
 *
 * Existe porque a paleta do SDD tem fundos claros (âmbar, verde, ciano) e escuros (violeta,
 * cinza) na mesma família, e fixar branco em todos reprovava metade deles no WCAG AA. A
 * escolha é calculada, não opinada — e `contrast.test.ts` verifica o resultado.
 */
export function readableOn(background: string): string {
  const light = BRAND_TOKENS['--sdd-on-brand']
  const dark = BRAND_TOKENS['--sdd-on-brand-dark']
  return contrastRatio(light, background) >= contrastRatio(dark, background) ? light : dark
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
