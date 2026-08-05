// Ponto de entrada do cliente Preact do wizard (feature 0035). Empacotado pelo esbuild
// em out/webview/wizard.js e injetado no WebviewPanel sob a CSP com nonce (ADR-033/034).
// Lê o payload (WizardState + portão de avanço) do bloco de dados #sdd-state (nunca de
// HTML) e renderiza a casca.
import { render } from 'preact'
import { Shell } from './Shell'
import type { WizardState } from '../../sdd/wizardModel'
import type { AdvanceResult } from '../../sdd/wizardStepGuards'

interface WizardView {
  state: WizardState
  advance: AdvanceResult
}

/** Lê o payload inicial embutido pelo host; devolve null se ausente/ilegível. */
function readView(): WizardView | null {
  const el = document.getElementById('sdd-state')
  if (!el || !el.textContent) {
    return null
  }
  try {
    return JSON.parse(el.textContent) as WizardView
  } catch {
    return null
  }
}

const view = readView()
const root = document.getElementById('root')
if (root && view) {
  render(<Shell state={view.state} advance={view.advance} />, root)
}
