// Acesso único à API do webview do VS Code. `acquireVsCodeApi` só pode ser chamada uma
// vez por documento — por isso o valor é capturado aqui e reutilizado.
declare function acquireVsCodeApi(): {
  postMessage(message: unknown): void
  getState(): unknown
  setState(state: unknown): void
}

export const vscodeApi = acquireVsCodeApi()
