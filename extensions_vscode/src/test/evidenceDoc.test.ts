import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildEvidenceMarkdown, type EvidenceInput } from '../sdd/evidenceDoc'

function input(over: Partial<EvidenceInput> = {}): EvidenceInput {
  return {
    changeId: '0099-x',
    title: 'Exemplo',
    type: 'feature',
    status: 'IN_PROGRESS',
    date: '2026-08-01',
    tasks: { total: 4, done: 3 },
    validation: { atendido: 2, parcial: 0, 'nao-testado': 1, 'nao-atendido': 0, 'nao-aplicavel': 1 },
    git: { branch: 'feature/x', changedCount: 3, totalAdded: 40, totalRemoved: 5 },
    commits: [{ hash: 'abc1234', subject: 'feat: algo (0099)' }],
    ...over,
  }
}

test('TEST-EVID-004 — evidence.md organiza as evidências por seção (SCN-EVID-005)', () => {
  const md = buildEvidenceMarkdown(input())
  assert.match(md, /^# Evidências — 0099-x/m)
  assert.match(md, /Tarefas:\*\* 3\/4/)
  assert.match(md, /## Validação \(RF-017\)/)
  assert.match(md, /atendido: 2/)
  assert.match(md, /não testado: 1/)
  assert.match(md, /## Git \(RF-018\)/)
  assert.match(md, /Branch: feature\/x/)
  assert.match(md, /\+40 \/ -5 linhas/)
  assert.match(md, /## Commits/)
  assert.match(md, /`abc1234` feat: algo \(0099\)/)
  // D-Q4: comandos não são executados; ficam como checklist.
  assert.match(md, /## A completar/)
  assert.match(md, /\[ \] Lint/)
})

test('TEST-EVID-004 — sem git/validação/commits usa marcadores, sem quebrar', () => {
  const md = buildEvidenceMarkdown(input({ git: undefined, validation: undefined, commits: [] }))
  assert.match(md, /Sem relatório de validação/)
  assert.match(md, /Sem repositório Git/)
  assert.match(md, /Nenhum commit relacionado/)
})
