// Ponto de entrada do cliente Preact do wizard (feature 0035). Empacotado pelo esbuild
// em out/webview/wizard.js e injetado no WebviewPanel sob a CSP com nonce (ADR-033/034).
// Lê o WizardState do bloco de dados #sdd-state (nunca de HTML) e renderiza a casca.
import { render } from 'preact'
import { Shell } from './Shell'
import type { WizardState } from '../../sdd/wizardModel'

/** Lê o estado inicial embutido pelo host; devolve null se ausente/ilegível. */
function readState(): WizardState | null {
  const el = document.getElementById('sdd-state')
  if (!el || !el.textContent) {
    return null
  }
  try {
    return JSON.parse(el.textContent) as WizardState
  } catch {
    return null
  }
}

const state = readState()
const root = document.getElementById('root')
if (root && state) {
  render(<Shell state={state} />, root)
}
