// Ponto de entrada do cliente Preact do wizard (feature 0035). Empacotado pelo esbuild
// em out/webview/wizard.js e injetado no WebviewPanel sob a CSP com nonce (ADR-033/034).
// Lê o payload do bloco de dados #sdd-state (nunca de HTML) e renderiza o modo que o
// host pediu: o hub (lista de mudanças) ou uma mudança em curso.
import { render } from 'preact'
import { Shell } from './Shell'
import { Hub } from './Hub'
import type { WizardPayload } from '../../sdd/wizardHtml'

/** Lê o payload inicial embutido pelo host; devolve null se ausente/ilegível. */
function readPayload(): WizardPayload | null {
  const el = document.getElementById('sdd-state')
  if (!el || !el.textContent) {
    return null
  }
  try {
    return JSON.parse(el.textContent) as WizardPayload
  } catch {
    return null
  }
}

const payload = readPayload()
const root = document.getElementById('root')
if (root && payload) {
  render(
    payload.view === 'hub' ? (
      <Hub hub={payload.hub} />
    ) : (
      <Shell
        state={payload.state}
        advance={payload.advance}
        details={payload.details}
        hasDesign={payload.hasDesign}
      />
    ),
    root,
  )
}
