import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  diagnose,
  REQUIRED_PROJECT_FILES,
  type DoctorInput,
  type DoctorChange,
} from '../sdd/projectDoctor'

/** Todos os arquivos obrigatórios presentes. */
function allFiles(present = true): Record<string, boolean> {
  const files: Record<string, boolean> = {}
  for (const f of REQUIRED_PROJECT_FILES) {
    files[f] = present
  }
  return files
}

function healthyChange(over: Partial<DoctorChange> = {}): DoctorChange {
  return {
    id: '0005-context-guardian',
    path: 'features/0005-context-guardian',
    indexStatus: 'IN_PROGRESS',
    hasStatusFile: true,
    diskStatus: 'IN_PROGRESS',
    hasSpec: true,
    ...over,
  }
}

function input(over: Partial<DoctorInput> = {}): DoctorInput {
  return {
    files: allFiles(),
    changes: [healthyChange()],
    diskChangeDirs: ['features/0005-context-guardian'],
    hasGit: true,
    claudeCodeAvailable: true,
    ...over,
  }
}

const codes = (ds: { code: string }[]): string[] => ds.map((d) => d.code)

test('TEST-PD-001 — projeto saudável não gera erro nem aviso (SCN-PD-001)', () => {
  const ds = diagnose(input())
  assert.deepEqual(ds, [])
})

test('TEST-PD-001 — Claude Code ausente gera só um informativo, sem erro/aviso', () => {
  const ds = diagnose(input({ claudeCodeAvailable: false }))
  assert.equal(ds.length, 1)
  assert.equal(ds[0].severity, 'info')
  assert.equal(ds[0].code, 'no-claude-code')
})

test('TEST-PD-002 — sem status.yaml → erro; status inválido → erro (SCN-PD-002)', () => {
  const noStatus = diagnose(
    input({ changes: [healthyChange({ hasStatusFile: false, diskStatus: undefined })] }),
  )
  assert.ok(codes(noStatus).includes('missing-status'))
  assert.equal(noStatus.find((d) => d.code === 'missing-status')?.severity, 'error')

  const invalid = diagnose(input({ changes: [healthyChange({ diskStatus: 'DONE' })] }))
  assert.ok(codes(invalid).includes('invalid-status'))
  assert.equal(invalid.find((d) => d.code === 'invalid-status')?.severity, 'error')
})

test('TEST-PD-002 — status divergente índice↔disco → aviso nomeando os dois (SCN-PD-003)', () => {
  const ds = diagnose(
    input({ changes: [healthyChange({ indexStatus: 'PLANNED', diskStatus: 'IN_PROGRESS' })] }),
  )
  const mismatch = ds.find((d) => d.code === 'status-mismatch')
  assert.ok(mismatch)
  assert.equal(mismatch?.severity, 'warning')
  assert.match(mismatch!.message, /PLANNED/)
  assert.match(mismatch!.message, /IN_PROGRESS/)
})

test('TEST-PD-003 — órfão → aviso; arquivo obrigatório ausente → erro; sem git → aviso (SCN-PD-004/005)', () => {
  const orphan = diagnose(
    input({ diskChangeDirs: ['features/0005-context-guardian', 'features/0099-ghost'] }),
  )
  const o = orphan.find((d) => d.code === 'orphan-change')
  assert.ok(o)
  assert.equal(o?.severity, 'warning')
  assert.match(o!.message, /0099-ghost/)

  const files = allFiles()
  files['.specs/project/constitution.md'] = false
  const missing = diagnose(input({ files }))
  const m = missing.find((d) => d.code === 'missing-project-file')
  assert.ok(m)
  assert.equal(m?.severity, 'error')

  const noGit = diagnose(input({ hasGit: false }))
  assert.equal(noGit.find((d) => d.code === 'no-git')?.severity, 'warning')
})

test('TEST-PD-003 — missing-spec quando a mudança não tem spec.md', () => {
  const ds = diagnose(input({ changes: [healthyChange({ hasSpec: false })] }))
  const s = ds.find((d) => d.code === 'missing-spec')
  assert.ok(s)
  assert.equal(s?.severity, 'warning')
})
