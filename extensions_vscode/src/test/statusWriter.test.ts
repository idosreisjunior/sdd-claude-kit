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
