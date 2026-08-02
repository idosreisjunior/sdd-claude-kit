import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  ACTIONS,
  actionDef,
  composePrompt,
  quoteCliPath,
  buildLaunchCommand,
} from '../sdd/claudePrompt'

test('TEST-CC-001 — composePrompt monta /sdd-kit:<ação> <id> (SCN-CC-001)', () => {
  assert.equal(
    composePrompt('spec', '0004-claude-code-adapter'),
    '/sdd-kit:spec 0004-claude-code-adapter',
  )
  assert.equal(
    composePrompt('implement', '0002-feature-management'),
    '/sdd-kit:implement 0002-feature-management',
  )
})

test('TEST-CC-001 — ACTIONS é conjunto fechado; actionDef desconhecido é undefined (SCN-CC-004)', () => {
  assert.deepEqual(
    ACTIONS.map((a) => a.id),
    ['research', 'spec', 'clarify', 'design', 'tasks', 'implement', 'verify'],
  )
  assert.equal(actionDef('spec')?.id, 'spec')
  assert.equal(actionDef('deploy'), undefined)
  assert.equal(actionDef(''), undefined)
  for (const a of ACTIONS) {
    assert.ok(a.label.length > 0, `ação ${a.id} sem rótulo`)
    assert.ok(a.objective.length > 0, `ação ${a.id} sem objetivo`)
  }
})

test('TEST-CC-002 — quoteCliPath cita caminho com espaço e escapa aspas (NFR-CC-002)', () => {
  assert.equal(quoteCliPath('/usr/bin/claude'), '/usr/bin/claude')
  assert.equal(quoteCliPath('C:\\Program Files\\claude.cmd'), '"C:\\Program Files\\claude.cmd"')
  assert.equal(quoteCliPath('/opt/cla"ude'), '"/opt/cla\\"ude"')
  assert.equal(quoteCliPath(''), '')
})

test('TEST-CC-002 — buildLaunchCommand usa o caminho citado', () => {
  assert.equal(buildLaunchCommand('/usr/bin/claude'), '/usr/bin/claude')
  assert.equal(
    buildLaunchCommand('C:\\Program Files\\claude.cmd'),
    '"C:\\Program Files\\claude.cmd"',
  )
})
