import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildCommitSuggestion } from '../sdd/commitSuggest'

test('TEST-TRACE-012 — sugestão por tipo (branch e mensagem conventional) (SCN-TRACE-008)', () => {
  assert.deepEqual(
    buildCommitSuggestion({ id: '0007-git-traceability', type: 'feature', title: 'Git e rastreabilidade' }),
    { branch: 'feature/0007-git-traceability', message: 'feat: Git e rastreabilidade (0007)' },
  )
  assert.deepEqual(
    buildCommitSuggestion({ id: '0011-title-breaks', type: 'bug', title: 'Título quebra o YAML' }),
    { branch: 'fix/0011-title-breaks', message: 'fix: Título quebra o YAML (0011)' },
  )
  assert.equal(buildCommitSuggestion({ id: '0020-x', type: 'refactor', title: 'X' }).message, 'refactor: X (0020)')
  assert.equal(buildCommitSuggestion({ id: '0030-y', type: 'change', title: 'Y' }).branch, 'change/0030-y')
})

test('TEST-TRACE-013 — tipo desconhecido usa defaults; título vazio cai no id', () => {
  const s = buildCommitSuggestion({ id: '0099-z', type: 'wtf', title: '   ' })
  assert.equal(s.branch, 'feature/0099-z')
  assert.equal(s.message, 'feat: 0099-z (0099)')
})

test('TEST-TRACE-013 — id sem prefixo numérico usa o id inteiro entre parênteses', () => {
  const s = buildCommitSuggestion({ id: 'hotfix-login', type: 'bug', title: 'Login' })
  assert.equal(s.message, 'fix: Login (hotfix-login)')
})
