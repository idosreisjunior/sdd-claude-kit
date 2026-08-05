import { test } from 'node:test'
import assert from 'node:assert/strict'
import { renderWizardHtml } from '../sdd/wizardHtml'
import { deriveWizardState, type ChangeArtifacts } from '../sdd/wizardModel'
import { canAdvance } from '../sdd/wizardStepGuards'

function artifacts(over: Partial<ChangeArtifacts> = {}): ChangeArtifacts {
  return {
    sddStatus: 'DESIGNED',
    hasRequest: true,
    requirementCount: 6,
    hasCriticalOpenQuestions: false,
    hasDesign: true,
    adrCount: 3,
    taskTotal: 0,
    taskDone: 0,
    approved: false,
    ...over,
  }
}

function html(title = 'Wizard Cockpit', nonce = 'abc123') {
  const a = artifacts()
  const state = deriveWizardState({ id: '0035-wizard-cockpit', title, type: 'feature' }, a)
  const advance = canAdvance(state.currentStage, a)
  return renderWizardHtml({ state, advance, nonce, scriptUri: 'https://webview/wizard.js' })
}

test('TEST-WIZ-006 · NFR-WIZ-001 — aplica CSP com nonce em style e script', () => {
  const h = html()
  assert.match(h, /http-equiv="Content-Security-Policy"/)
  assert.match(h, /default-src 'none'/)
  assert.match(h, /style-src 'nonce-abc123'/)
  assert.match(h, /script-src 'nonce-abc123'/)
  assert.match(h, /<style nonce="abc123">/)
  assert.match(h, /<script nonce="abc123" src="https:\/\/webview\/wizard\.js">/)
})

test('TEST-WIZ-006 — embute o payload (estado + avanço) e a raiz do Preact', () => {
  const h = html()
  assert.match(h, /<div id="root"><\/div>/)
  assert.match(h, /<script type="application\/json" id="sdd-state"/)
  assert.ok(h.includes('0035-wizard-cockpit'), 'o estado embutido traz o id')
  assert.ok(h.includes('"advance"'), 'o portão de avanço entra no payload')
  assert.ok(h.includes('--sdd-accent'), 'os tokens --sdd-* entram no <style>')
})

test('TEST-WIZ-006 · NFR-WIZ-001 — o `<` do dado é neutralizado (não fecha a tag script)', () => {
  const h = html('</script><img src=x onerror=alert(1)>')
  assert.ok(!h.includes('</script><img src=x'), 'o dado não aparece cru')
  assert.match(h, /\\u003c\/script>/)
  // apenas as duas tags </script> reais (bloco de dados + bundle)
  assert.equal((h.match(/<\/script>/g) || []).length, 2)
})
