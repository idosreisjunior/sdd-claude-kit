import { describe, it, expect } from 'vitest'
import { read, readYaml, schema, validate } from './helpers.js'

const config = schema('config')
const status = schema('status')

/** Um status.yaml válido, base para os casos negativos. */
const baseStatus = (): Record<string, any> => ({
  version: 1,
  id: '0001-user-authentication',
  type: 'feature',
  status: 'DRAFT',
  created: '2026-07-29',
  updated: '2026-07-29',
  history: [{ status: 'DRAFT', date: '2026-07-29', reason: 'Mudança criada' }],
  approval: null,
})

const baseConfig = (): Record<string, any> => readYaml('.specs/config.yaml') as Record<string, any>

describe('TEST-PF-003 — config.yaml deste repositório valida', () => {
  it('valida sem erros', () => {
    expect(validate(config, readYaml('.specs/config.yaml'))).toEqual([])
  })

  it('rejeita workflow.mode fora do enum, no campo certo', () => {
    const doc = baseConfig()
    doc['workflow'].mode = 'strictt'
    expect(validate(config, doc).map((f) => f.path)).toContain('workflow/mode')
  })

  it('rejeita chave desconhecida em workflow — typo não pode passar em silêncio', () => {
    const doc = baseConfig()
    doc['workflow'].require_aproval = true
    expect(validate(config, doc).map((f) => f.path)).toContain('workflow')
  })

  it('aceita comando null, rejeita string vazia', () => {
    const doc = baseConfig()
    doc['validation'].commands.test = null
    expect(validate(config, doc)).toEqual([])
    doc['validation'].commands.test = ''
    expect(validate(config, doc).map((f) => f.path)).toContain('validation/commands/test')
  })

  it('rejeita idioma fora do enum', () => {
    const doc = baseConfig()
    doc['project'].language = 'es'
    expect(validate(config, doc).map((f) => f.path)).toContain('project/language')
  })

  it('rejeita version diferente de 1 — fronteira de migração explícita', () => {
    const doc = baseConfig()
    doc['version'] = 2
    expect(validate(config, doc).map((f) => f.path)).toContain('version')
  })
})

describe('TEST-PF-004 — estado inexistente é rejeitado', () => {
  const ESTADOS = ['DRAFT', 'CLARIFIED', 'DESIGNED', 'PLANNED', 'APPROVED',
    'IN_PROGRESS', 'BLOCKED', 'VERIFIED', 'ARCHIVED', 'CANCELLED']

  it('aceita os dez estados de RF-004', () => {
    for (const s of ESTADOS) {
      const doc = baseStatus()
      doc['status'] = s
      expect(validate(status, doc), `estado ${s}`).toEqual([])
    }
  })

  it('rejeita estado inventado, apontando o campo status', () => {
    const doc = baseStatus()
    doc['status'] = 'REVIEWED'
    expect(validate(status, doc).map((f) => f.path)).toContain('status')
  })
})

describe('TEST-PF-005 — history sem reason é rejeitado', () => {
  it('rejeita entrada sem reason', () => {
    const doc = baseStatus()
    doc['history'] = [{ status: 'DRAFT', date: '2026-07-29' }]
    expect(validate(status, doc).map((f) => f.path)).toContain('history/0')
  })

  it('rejeita reason vazio — transição sem motivo é indistinguível de acidente', () => {
    const doc = baseStatus()
    doc['history'] = [{ status: 'DRAFT', date: '2026-07-29', reason: '' }]
    expect(validate(status, doc).map((f) => f.path)).toContain('history/0/reason')
  })

  it('rejeita history vazio', () => {
    const doc = baseStatus()
    doc['history'] = []
    expect(validate(status, doc).map((f) => f.path)).toContain('history')
  })
})

describe('schemas — invariantes de forma', () => {
  it('rejeita data fora de ISO 8601', () => {
    const doc = baseStatus()
    doc['created'] = '29/07/2026'
    expect(validate(status, doc).map((f) => f.path)).toContain('created')
  })

  it('rejeita id fora do padrão NNNN-slug', () => {
    const doc = baseStatus()
    doc['id'] = '0001_Plugin_Foundation'
    expect(validate(status, doc).map((f) => f.path)).toContain('id')
  })

  it('approval exige date, by e revision quando não é null', () => {
    const doc = baseStatus()
    doc['approval'] = { date: '2026-07-29', by: 'ana' }
    expect(validate(status, doc).map((f) => f.path)).toContain('approval')
    doc['approval'] = { date: '2026-07-29', by: 'ana', revision: 'a1b2c3d' }
    expect(validate(status, doc)).toEqual([])
  })

  it('rejeita severity fora do enum em blocked_by', () => {
    const doc = baseStatus()
    doc['blocked_by'] = [{ question: 'Q9', description: 'x', severity: 'urgent' }]
    expect(validate(status, doc).map((f) => f.path)).toContain('blocked_by/0/severity')
  })

  it('rejeita contador negativo', () => {
    const doc = baseStatus()
    doc['tasks'] = { total: 1, pending: 1, in_progress: 0, done: -1 }
    expect(validate(status, doc).map((f) => f.path)).toContain('tasks/done')
  })

  it('ambos os schemas declaram $schema e $id versionado', () => {
    for (const name of ['config', 'status']) {
      const raw = JSON.parse(read(`plugins/sdd-kit/schemas/${name}.schema.json`))
      expect(raw['$schema'], name).toContain('json-schema.org')
      expect(raw['$id'], name).toContain('/schemas/v1/')
    }
  })
})
