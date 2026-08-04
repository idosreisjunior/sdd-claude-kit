import { test } from 'node:test'
import assert from 'node:assert/strict'
import { load } from 'js-yaml'
import { appendHistoryAndSetStatus, setIndexStatus } from '../sdd/statusWriter'

const SAMPLE_STATUS = `# comentário de topo
version: 1

id: "0007-git"
type: "feature"
title: "Git"

# Verificada em 2026-08-01.
status: VERIFIED

created: "2026-08-01"
updated: "2026-08-01"

history:
  - status: DRAFT
    date: "2026-08-01"
    reason: >-
      Criada.
  - status: VERIFIED
    date: "2026-08-01"
    reason: >-
      Implementada e testada.

# null significa NÃO APROVADO.
approval: null

resolved_questions: []

tasks:
  total: 1
  pending: 0
  in_progress: 0
  done: 1
`

test('TEST-DND-004 — appendHistoryAndSetStatus troca o status e acrescenta a entrada, preservando o resto (SCN-DND-003)', () => {
  const out = appendHistoryAndSetStatus(SAMPLE_STATUS, {
    status: 'ARCHIVED',
    date: '2026-08-04',
    reason: 'Arquivada pelo painel.',
  })

  // o texto ainda parseia e é YAML válido
  const doc = load(out) as Record<string, unknown>
  assert.equal(doc['status'], 'ARCHIVED')

  const history = doc['history'] as Array<Record<string, unknown>>
  assert.equal(history.length, 3)
  const last = history[history.length - 1]
  assert.equal(last['status'], 'ARCHIVED')
  assert.equal(last['date'], '2026-08-04')
  assert.equal(last['reason'], 'Arquivada pelo painel.')

  // status == última entrada do history (invariante do schema)
  assert.equal(doc['status'], last['status'])

  // comentários e outras chaves preservados
  assert.ok(out.includes('# null significa NÃO APROVADO.'), 'comentário preservado')
  assert.ok(out.includes('resolved_questions: []'), 'outras chaves intactas')
  assert.equal(doc['approval'], null)
})

test('TEST-DND-005 — motivo com novas linhas é achatado em uma linha', () => {
  const out = appendHistoryAndSetStatus(SAMPLE_STATUS, {
    status: 'IN_PROGRESS',
    date: '2026-08-04',
    reason: 'linha um\n   linha dois',
  })
  const doc = load(out) as Record<string, unknown>
  const history = doc['history'] as Array<Record<string, unknown>>
  assert.equal(history[history.length - 1]['reason'], 'linha um linha dois')
})

const SAMPLE_INDEX = `version: 1
next_id: 3
changes:
  - id: 0001-a
    type: feature
    title: A
    status: VERIFIED
    path: features/0001-a
  - id: 0002-b
    type: feature
    title: B
    status: PLANNED
    path: features/0002-b
archive: []
`

test('TEST-DND-006 — setIndexStatus muda só a entrada alvo (SCN-DND-003)', () => {
  const out = setIndexStatus(SAMPLE_INDEX, '0002-b', 'IN_PROGRESS')
  const doc = load(out) as { changes: Array<{ id: string; status: string }> }
  const a = doc.changes.find((c) => c.id === '0001-a')
  const b = doc.changes.find((c) => c.id === '0002-b')
  assert.equal(a?.status, 'VERIFIED', 'a outra entrada não muda')
  assert.equal(b?.status, 'IN_PROGRESS', 'a entrada alvo muda')
})

test('TEST-DND-007w — preserva o fim de linha CRLF (bug 0027)', () => {
  const crlf = SAMPLE_STATUS.replace(/\n/g, '\r\n')
  const out = appendHistoryAndSetStatus(crlf, {
    status: 'ARCHIVED',
    date: '2026-08-04',
    reason: 'Motivo.',
  })
  assert.ok(out.includes('\r\n'), 'mantém CRLF')
  assert.ok(!/[^\r]\n/.test(out), 'não introduz LF solto')
  const doc = load(out) as Record<string, unknown>
  assert.equal(doc['status'], 'ARCHIVED')

  const lf = setIndexStatus(SAMPLE_INDEX.replace(/\n/g, '\r\n'), '0002-b', 'IN_PROGRESS')
  assert.ok(lf.includes('\r\n') && !/[^\r]\n/.test(lf), 'index preserva CRLF')
})

test('TEST-DND-008w — preserva comentário inline na linha status (bug 0027)', () => {
  const withComment = SAMPLE_STATUS.replace('status: VERIFIED', 'status: VERIFIED  # nota')
  const out = appendHistoryAndSetStatus(withComment, {
    status: 'ARCHIVED',
    date: '2026-08-04',
    reason: 'Motivo.',
  })
  assert.match(out, /^status: ARCHIVED {2}# nota$/m, 'valor trocado, comentário inline mantido')

  // index com comentário inline no status também é atualizado (antes era ignorado)
  const idx = SAMPLE_INDEX.replace('status: PLANNED', 'status: PLANNED # wip')
  const outIdx = setIndexStatus(idx, '0002-b', 'IN_PROGRESS')
  assert.match(outIdx, /status: IN_PROGRESS # wip/, 'index: valor trocado, comentário mantido')
})

test('TEST-DND-009w — sem history: ou sem status: de topo, devolve inalterado (bug 0027)', () => {
  const noHistory = 'version: 1\nstatus: DRAFT\ntasks:\n  total: 0\n'
  assert.equal(
    appendHistoryAndSetStatus(noHistory, { status: 'CLARIFIED', date: '2026-08-04', reason: 'x' }),
    noHistory,
    'sem history não muda nada (evita transição parcial)',
  )
  const noStatus = 'version: 1\nhistory:\n  - status: DRAFT\n    date: "2026-08-04"\n    reason: >-\n      c\n'
  assert.equal(
    appendHistoryAndSetStatus(noStatus, { status: 'CLARIFIED', date: '2026-08-04', reason: 'x' }),
    noStatus,
    'sem status de topo não muda nada',
  )
})
