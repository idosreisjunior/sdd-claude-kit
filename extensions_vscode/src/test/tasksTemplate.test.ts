import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

// Regressão do bug 0019: o template de tarefas deve conter os onze campos do
// RF-010, incluindo "evidências necessárias" (antes tinha só dez). `npm test`
// roda de extensions_vscode/, então lê a cópia sincronizada do template.
const TEMPLATE = readFileSync('templates/pt-BR/_shared/tasks.md', 'utf8')

// TEST-TEVF-001 — o template contém a seção "Evidências necessárias" (SCN-TEVF-001).
test('TEST-TEVF-001: o template tasks.md tem a seção Evidências necessárias', () => {
  assert.ok(
    /^###\s+Evidências necessárias\s*$/m.test(TEMPLATE),
    'template _shared/tasks.md sem a seção "### Evidências necessárias" (RF-010)',
  )
})
