import { test } from 'node:test'
import assert from 'node:assert/strict'
import { renderSpecView, highlightIds } from '../sdd/specView'

test('TEST-EDIT-001 — highlightIds destaca os identificadores do SDD', () => {
  assert.equal(highlightIds('REQ-EDIT-001'), '<span class="id">REQ-EDIT-001</span>')
  assert.equal(highlightIds('ADR-006'), '<span class="id">ADR-006</span>')
  assert.equal(highlightIds('ver RF-006 e NFR-EDIT-002'),
    'ver <span class="id">RF-006</span> e <span class="id">NFR-EDIT-002</span>')
  assert.equal(highlightIds('sem id aqui'), 'sem id aqui')
})

test('TEST-EDIT-001 — renderSpecView: cabeçalhos viram hN e ids são destacados', () => {
  const html = renderSpecView('## Requisitos\n\nO REQ-EDIT-001 exige X.\n')
  assert.match(html, /<h2>Requisitos<\/h2>/)
  assert.match(html, /<p>O <span class="id">REQ-EDIT-001<\/span> exige X\.<\/p>/)
})

test('TEST-EDIT-001 — renderSpecView escapa o conteúdo (sem injeção)', () => {
  const html = renderSpecView('# <script>alert(1)</script> & "x"\n')
  assert.ok(!html.includes('<script>'), 'a tag não entra crua')
  assert.match(html, /<h1>&lt;script&gt;alert\(1\)&lt;\/script&gt; &amp; &quot;x&quot;<\/h1>/)
})

test('TEST-EDIT-001 — linhas consecutivas viram um parágrafo com <br>; vazio separa', () => {
  const html = renderSpecView('linha um\nlinha dois\n\nlinha tres\n')
  assert.match(html, /<p>linha um<br>linha dois<\/p>/)
  assert.match(html, /<p>linha tres<\/p>/)
})
