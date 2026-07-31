import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  detectClaudeCode,
  splitPath,
  candidateNames,
  type ClaudeCodeEnv,
} from '../sdd/claudeCode'

function env(over: Partial<ClaudeCodeEnv>): ClaudeCodeEnv {
  return {
    platform: 'linux',
    pathVar: '',
    pathExt: undefined,
    configuredPath: undefined,
    isExecutable: async () => false,
    ...over,
  }
}

test('TEST-FOUND-003 — ausente: available false e não lança', async () => {
  const d = await detectClaudeCode(
    env({ pathVar: '/usr/bin:/bin', isExecutable: async () => false }),
  )
  assert.deepEqual(d, { available: false, path: undefined, via: undefined })
})

test('TEST-FOUND-003 — presente no PATH (POSIX)', async () => {
  const hit = '/home/u/.local/bin/claude'
  const d = await detectClaudeCode(
    env({ pathVar: '/usr/bin:/home/u/.local/bin', isExecutable: async (p) => p === hit }),
  )
  assert.equal(d.available, true)
  assert.equal(d.path, hit)
  assert.equal(d.via, 'path')
})

test('TEST-FOUND-003 — presente no PATH (Windows, via PATHEXT)', async () => {
  const hit = 'C:\\tools\\claude.cmd'
  const d = await detectClaudeCode(
    env({
      platform: 'win32',
      pathVar: 'C:\\Windows;C:\\tools',
      pathExt: '.EXE;.CMD',
      isExecutable: async (p) => p === hit,
    }),
  )
  assert.equal(d.available, true)
  assert.equal(d.path, hit)
  assert.equal(d.via, 'path')
})

test('TEST-FOUND-003 — caminho configurado tem precedência', async () => {
  const cfg = '/opt/claude/bin/claude'
  const d = await detectClaudeCode(
    env({
      configuredPath: cfg,
      pathVar: '/usr/bin',
      isExecutable: async (p) => p === cfg || p === '/usr/bin/claude',
    }),
  )
  assert.equal(d.via, 'config')
  assert.equal(d.path, cfg)
})

test('TEST-FOUND-003 — PATH vazio: available false', async () => {
  const d = await detectClaudeCode(env({ pathVar: undefined }))
  assert.equal(d.available, false)
})

test('TEST-FOUND-003 — probe que lança é tratado como ausência (não propaga)', async () => {
  const d = await detectClaudeCode(
    env({
      pathVar: '/usr/bin',
      isExecutable: async () => {
        throw new Error('boom')
      },
    }),
  )
  assert.equal(d.available, false)
})

test('splitPath e candidateNames por plataforma', () => {
  assert.deepEqual(splitPath('/a:/b', false), ['/a', '/b'])
  assert.deepEqual(splitPath('C:\\a;C:\\b', true), ['C:\\a', 'C:\\b'])
  assert.deepEqual(candidateNames(false, undefined), ['claude'])
  assert.ok(candidateNames(true, '.EXE;.CMD').includes('claude.cmd'))
})
