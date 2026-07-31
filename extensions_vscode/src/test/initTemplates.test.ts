import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  planFiles,
  substitute,
  generateConfigYaml,
  generateIndexYaml,
} from '../sdd/initTemplates'

test('SCN-FOUND-004 — o plano cobre config, index e os 6 documentos de projeto', () => {
  const files = planFiles()
  assert.equal(files.length, 8)
  assert.deepEqual(
    files.map((f) => f.relPath),
    [
      '.specs/config.yaml',
      '.specs/index.yaml',
      '.specs/project/vision.md',
      '.specs/project/constitution.md',
      '.specs/project/context.md',
      '.specs/project/architecture.md',
      '.specs/project/glossary.md',
      '.specs/project/standards.md',
    ],
  )
  assert.equal(files[0].origin, 'gerado')
  assert.equal(files[1].origin, 'gerado')
  assert.ok(files.slice(2).every((f) => f.origin === 'template'))
})

test('substitute troca PROJECT_NAME e DATE', () => {
  const out = substitute('# {{PROJECT_NAME}} em {{DATE}} — {{PROJECT_NAME}}', {
    PROJECT_NAME: 'minha-api',
    DATE: '2026-07-31',
  })
  assert.equal(out, '# minha-api em 2026-07-31 — minha-api')
})

test('config.yaml gerado não deixa placeholder e traz os campos obrigatórios', () => {
  const yaml = generateConfigYaml('minha-api', 'pt-BR')
  assert.ok(!yaml.includes('{{'), 'não pode sobrar {{placeholder}}')
  assert.match(yaml, /^version: 1$/m)
  assert.match(yaml, /name: "minha-api"/)
  assert.match(yaml, /language: pt-BR/)
  assert.match(yaml, /mode: guided/)
  // Comandos de validação nascem null (não detectado), nunca "aprovado".
  assert.match(yaml, /lint: null/)
})

test('index.yaml gerado começa vazio, em next_id 1, sem placeholder', () => {
  const yaml = generateIndexYaml()
  assert.ok(!yaml.includes('{{'))
  assert.match(yaml, /next_id: 1/)
  assert.match(yaml, /changes: \[\]/)
})
