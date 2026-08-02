import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildGithubBody } from '../sdd/githubBody'

// TEST-GH-001 — o corpo inclui requisitos, resumo de validação e evidências.
test('TEST-GH-001: buildGithubBody inclui requisitos, validação e evidências', () => {
  const body = buildGithubBody({
    changeId: '0021-github-integration',
    title: 'Integração com GitHub (RF-019)',
    type: 'feature',
    requirements: [
      { id: 'REQ-GH-001', title: 'Gerar a descrição' },
      { id: 'REQ-GH-002', title: 'Criar issue ou PR' },
    ],
    validation: { atendido: 2, pendentes: 1 },
    evidence: '- Build: verde\n- Testes: 131',
  })

  assert.ok(body.includes('## Integração com GitHub (RF-019)'))
  assert.ok(body.includes('`0021-github-integration`'))
  assert.ok(body.includes('`REQ-GH-001`') && body.includes('`REQ-GH-002`'))
  assert.ok(body.includes('2 atendido(s), 1 pendente(s)'))
  assert.ok(body.includes('Build: verde'))
})

// TEST-GH-002 — artefatos parciais: sem evidência/validação/requisitos, marca e não quebra.
test('TEST-GH-002: buildGithubBody é robusto a artefatos parciais', () => {
  const body = buildGithubBody({
    changeId: '0099-x',
    title: 'Sem artefatos',
    type: 'feature',
    requirements: [],
  })

  // Não lança e produz um corpo com as seções e os marcadores de ausência.
  assert.ok(body.includes('### Requisitos'))
  assert.ok(body.includes('Nenhum requisito registrado'))
  assert.ok(body.includes('Validação não disponível'))
  assert.ok(body.includes('Sem `evidence.md`'))
})
