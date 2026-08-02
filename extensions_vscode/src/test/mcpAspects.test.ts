import { test } from 'node:test'
import assert from 'node:assert/strict'
import { MCP_ASPECTS, MCP_PENDING_MARKER, pendingAspects } from '../sdd/mcpAspects'

// Os nove aspectos do RF-025, na ordem do texto.
const NOVE = [
  'Objetivo',
  'Ferramentas',
  'Recursos',
  'Schemas',
  'Autenticação',
  'Permissões',
  'Testes',
  'Documentação',
  'Publicação',
]

/** Monta um `mcp.md` de teste com cada seção no marcador de pendente. */
function esqueletoMcp(): string {
  const partes = ['# MCP: Exemplo', '']
  NOVE.forEach((titulo, i) => {
    partes.push(`## ${i + 1}. ${titulo}`, '', `> ${MCP_PENDING_MARKER}`, '')
  })
  return partes.join('\n')
}

// TEST-MCP-001 — a fonte única tem os nove aspectos do RF-025, na ordem do texto.
test('TEST-MCP-001: MCP_ASPECTS tem os nove aspectos do RF-025, em ordem', () => {
  assert.deepEqual(
    MCP_ASPECTS.map((a) => a.title),
    NOVE,
  )
})

// TEST-MCP-002 — aspectos sem decisão são marcados como pendentes; robusto a artefatos parciais.
test('TEST-MCP-002: pendingAspects marca os indecididos e não quebra', () => {
  // Esqueleto recém-criado: todos os nove pendentes.
  assert.deepEqual(pendingAspects(esqueletoMcp()), NOVE)

  // Decide dois aspectos (Objetivo e Testes): saem da lista de pendentes.
  const decidido = esqueletoMcp()
    .replace(`## 1. Objetivo\n\n> ${MCP_PENDING_MARKER}`, '## 1. Objetivo\n\nExpor métricas de build.')
    .replace(`## 7. Testes\n\n> ${MCP_PENDING_MARKER}`, '## 7. Testes\n\nCasos felizes e de erro por ferramenta.')
  const pendentes = pendingAspects(decidido)
  assert.ok(!pendentes.includes('Objetivo'))
  assert.ok(!pendentes.includes('Testes'))
  assert.equal(pendentes.length, 7)

  // Entrada vazia / sem seções: todos pendentes, sem lançar.
  assert.equal(pendingAspects('').length, 9)
  assert.equal(pendingAspects(undefined).length, 9)
  assert.equal(pendingAspects('texto sem nenhuma seção de aspecto').length, 9)
})
