import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parseStatus, parseNumstat, parseLog } from '../sdd/gitParse'

const STATUS = [
  '# branch.oid abc123',
  '# branch.head feature/x',
  '# branch.upstream origin/feature/x',
  '# branch.ab +1 -0',
  '1 M. N... 100644 100644 100644 hhh iii src/staged.ts',
  '1 .M N... 100644 100644 100644 hhh iii src/unstaged.ts',
  '1 MM N... 100644 100644 100644 hhh iii src/both.ts',
  'u UU N... 100644 100644 100644 100644 h1 h2 h3 src/conflict.ts',
  '? src/untracked.ts',
].join('\n')

test('TEST-TRACE-001 — parseStatus lê branch e classifica os arquivos (SCN-TRACE-001)', () => {
  const s = parseStatus(STATUS)
  assert.equal(s.branch, 'feature/x')
  const by = (p: string) => s.files.find((f) => f.path === p)

  assert.deepEqual(pick(by('src/staged.ts')), { staged: true, unstaged: false, untracked: false, conflict: false })
  assert.deepEqual(pick(by('src/unstaged.ts')), { staged: false, unstaged: true, untracked: false, conflict: false })
  assert.deepEqual(pick(by('src/both.ts')), { staged: true, unstaged: true, untracked: false, conflict: false })
  assert.deepEqual(pick(by('src/conflict.ts')), { staged: false, unstaged: false, untracked: false, conflict: true })
  assert.deepEqual(pick(by('src/untracked.ts')), { staged: false, unstaged: false, untracked: true, conflict: false })
})

test('TEST-TRACE-001 — branch destacado vira undefined, sem quebrar', () => {
  const s = parseStatus('# branch.head (detached)\n? a.txt')
  assert.equal(s.branch, undefined)
  assert.equal(s.files.length, 1)
})

test('TEST-TRACE-002 — parseNumstat lê adições/remoções e binário (SCN-TRACE-003)', () => {
  const numstat = ['10\t2\tsrc/staged.ts', '0\t5\tsrc/removed.ts', '-\t-\tassets/logo.png'].join('\n')
  const stats = parseNumstat(numstat)
  assert.deepEqual(stats, [
    { path: 'src/staged.ts', added: 10, removed: 2 },
    { path: 'src/removed.ts', added: 0, removed: 5 },
    { path: 'assets/logo.png', added: null, removed: null },
  ])
})

test('TEST-TRACE-003 — entrada vazia/malformada não lança e degrada para vazio', () => {
  assert.deepEqual(parseStatus('').files, [])
  assert.equal(parseStatus('').branch, undefined)
  // Linhas desconhecidas são ignoradas, não lançam.
  assert.doesNotThrow(() => parseStatus('lixo\n! ignored.ts\nxyz'))
  assert.deepEqual(parseNumstat(''), [])
  assert.deepEqual(parseNumstat('linha sem tabs'), [])
})

test('TEST-EVID-005 — parseLog lê hash e assunto de cada commit (0008)', () => {
  const log = ['abc1234 feat: algo (0007)', 'def5678 fix: outro (0007)', 'ghi9012'].join('\n')
  assert.deepEqual(parseLog(log), [
    { hash: 'abc1234', subject: 'feat: algo (0007)' },
    { hash: 'def5678', subject: 'fix: outro (0007)' },
    { hash: 'ghi9012', subject: '' },
  ])
  assert.deepEqual(parseLog(''), [])
})

function pick(f: { staged: boolean; unstaged: boolean; untracked: boolean; conflict: boolean } | undefined) {
  assert.ok(f, 'arquivo esperado não encontrado')
  return { staged: f!.staged, unstaged: f!.unstaged, untracked: f!.untracked, conflict: f!.conflict }
}
