import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  sanitizeSlug,
  isValidSlug,
  isValidScope,
  suggestScope,
  formatId,
  numericIdOf,
  reconcileNextId,
  dirNameFor,
  insertChangeEntry,
  yamlInline,
  substituteChange,
  DIR_FOR,
  type ChangeEntry,
} from '../sdd/featureCreator'

test('TEST-FEAT-002 — sanitizeSlug aplica as regras determinísticas (skill §4)', () => {
  assert.equal(sanitizeSlug('Cadastro de Clientes'), 'cadastro-de-clientes')
  assert.equal(sanitizeSlug('  Ação   Rápida  '), 'acao-rapida') // acentos + espaços
  assert.equal(sanitizeSlug('foo__bar baz!!'), 'foo-bar-baz') // _ e espaço viram hífen; ! removido
  assert.equal(sanitizeSlug('a//b'), 'ab') // '/' é removido, não é separador (skill §4/5)
  assert.equal(sanitizeSlug('--já--'), 'ja') // hifens de borda + acento
  assert.equal(sanitizeSlug('a'.repeat(60)).length, 40) // limite de 40
})

test('TEST-FEAT-002 — validação de slug e escopo', () => {
  assert.equal(isValidSlug('feature-management'), true)
  assert.equal(isValidSlug('Feature'), false) // maiúscula
  assert.equal(isValidSlug('-x'), false)
  assert.equal(isValidSlug('a--b'), false) // hifen duplo
  assert.equal(isValidScope('FEAT'), true)
  assert.equal(isValidScope('F2'), true)
  assert.equal(isValidScope('feat'), false)
  assert.equal(isValidScope('2F'), false) // não começa com letra
})

test('TEST-FEAT-002 — suggestScope usa a primeira palavra em maiúsculas', () => {
  assert.equal(suggestScope('feature-management'), 'FEATURE')
  assert.equal(suggestScope('customer-registration'), 'CUSTOMER')
})

test('TEST-FEAT-002 — formatId / numericIdOf / dirNameFor', () => {
  assert.equal(formatId(2), '0002')
  assert.equal(formatId(42), '0042')
  assert.equal(numericIdOf('0002-management'), 2)
  assert.equal(numericIdOf('archive'), undefined)
  assert.equal(dirNameFor(3, 'customer-registration'), '0003-customer-registration')
  assert.equal(DIR_FOR.feature, 'features')
  assert.equal(DIR_FOR.bug, 'bugs')
})

test('TEST-FEAT-002 — reconcileNextId detecta índice defasado (skill §5)', () => {
  assert.deepEqual(reconcileNextId(3, [1, 2]), { ok: true })
  assert.deepEqual(reconcileNextId(3, []), { ok: true })
  assert.deepEqual(reconcileNextId(3, [1, 2, 3]), { ok: false, conflictId: 3 })
  assert.deepEqual(reconcileNextId(3, [5]), { ok: false, conflictId: 5 })
})

const ENTRY: ChangeEntry = {
  id: '0002-customer-registration',
  type: 'feature',
  title: 'Cadastro de clientes',
  path: 'features/0002-customer-registration',
  date: '2026-07-31',
}

test('TEST-FEAT-002 — insertChangeEntry em lista vazia (changes: []) incrementa next_id', () => {
  const index = `version: 1
next_id: 2
changes: []
archive: []
`
  const out = insertChangeEntry(index, ENTRY)
  assert.match(out, /next_id: 3/)
  assert.match(out, /^changes:$/m)
  assert.match(out, /^ {2}- id: 0002-customer-registration$/m)
  assert.match(out, /^ {4}type: feature$/m)
  assert.match(out, /^ {4}title: Cadastro de clientes$/m)
  assert.match(out, /^ {4}status: DRAFT$/m)
  assert.match(out, /^ {4}path: features\/0002-customer-registration$/m)
  assert.match(out, /^ {4}created: "2026-07-31"$/m)
  // não corrompe archive
  assert.match(out, /^archive: \[\]$/m)
})

test('TEST-FEAT-002 — insertChangeEntry acrescenta ao fim de uma lista com itens', () => {
  const index = `version: 1
next_id: 3
changes:
  - id: 0001-foundation
    type: feature
    title: Fundação
    status: DRAFT
    path: features/0001-foundation
    created: "2026-07-30"
    updated: "2026-07-30"

archive: []
`
  const out = insertChangeEntry(index, { ...ENTRY, id: '0003-x', path: 'features/0003-x' })
  assert.match(out, /next_id: 4/)
  // a entrada nova vem depois da existente e antes de archive
  const foundationAt = out.indexOf('0001-foundation')
  const newAt = out.indexOf('0003-x')
  const archiveAt = out.indexOf('archive:')
  assert.ok(foundationAt < newAt && newAt < archiveAt, 'ordem: existente < nova < archive')
})

test('TEST-FEAT-002 — insertChangeEntry lança em índice sem next_id/changes', () => {
  assert.throws(() => insertChangeEntry('changes: []\n', ENTRY), /next_id/)
  assert.throws(() => insertChangeEntry('next_id: 1\n', ENTRY), /changes/)
})

test('TEST-FEAT-002 — yamlInline cita só quando necessário', () => {
  assert.equal(yamlInline('Cadastro de clientes'), 'Cadastro de clientes')
  assert.equal(yamlInline('Título: com dois pontos'), '"Título: com dois pontos"')
  assert.equal(yamlInline('# comeca com hash'), '"# comeca com hash"')
  assert.equal(yamlInline('borda '), '"borda "') // espaço na borda
})

test('TEST-FEAT-002 — substituteChange preenche os marcadores mecânicos', () => {
  const status = substituteChange(
    'id: "{{CHANGE_ID}}"\ntype: "{{CHANGE_TYPE}}"\ntitle: "{{CHANGE_TITLE}}"\ncreated: "{{DATE}}"\nreason: {{CREATION_REASON}}\n',
    {
      CHANGE_ID: '0002-x',
      CHANGE_TYPE: 'feature',
      CHANGE_TITLE: 'X',
      DATE: '2026-07-31',
      CREATION_REASON: 'criada pelo formulário',
      ID_SCOPE: 'X',
      REQUEST_ORIGIN: 'Extensão VS Code',
      ORIGINAL_REQUEST: 'quero X',
    },
  )
  assert.match(status, /id: "0002-x"/)
  assert.match(status, /type: "feature"/)
  assert.match(status, /created: "2026-07-31"/)
  assert.match(status, /reason: criada pelo formulário/)
  assert.ok(!status.includes('{{'), 'nenhum marcador remanescente nos campos conhecidos')
})
