import { describe, it, expect } from 'vitest'
import { read, readYaml, schema, validate } from './helpers.js'

const config = schema('config')
const status = schema('status')
const traceability = schema('traceability')

// Os estados vêm de workflow.json, a fonte única (ADR-010). Antes esta constante
// redeclarava os dez estados à mão — a mesma cópia divergente que o ADR-010 removeu
// do grafo. Ver TASK-SWC-002.
const workflow = JSON.parse(read('plugins/sdd-kit/schemas/workflow.json')) as {
  states: string[]
}

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
  const ESTADOS = workflow.states

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

  it('resolved_by aceita tarefa ou nome de skill, mas não texto livre (ADR-014)', () => {
    const doc = baseStatus()
    const base = { question: 'Q1', date: '2026-07-29', summary: 'x' }
    doc['resolved_questions'] = [{ ...base, resolved_by: 'TASK-CUST-001' }]
    expect(validate(status, doc), 'tarefa').toEqual([])
    doc['resolved_questions'] = [{ ...base, resolved_by: 'clarify' }]
    expect(validate(status, doc), 'nome de skill').toEqual([])
    doc['resolved_questions'] = [{ ...base, resolved_by: 'Ana Souza' }]
    expect(validate(status, doc).map((f) => f.path), 'nome de pessoa é rejeitado')
      .toContain('resolved_questions/0/resolved_by')
  })

  it('os schemas declaram $schema e $id versionado', () => {
    for (const name of ['config', 'status', 'traceability']) {
      const raw = JSON.parse(read(`plugins/sdd-kit/schemas/${name}.schema.json`))
      expect(raw['$schema'], name).toContain('json-schema.org')
      expect(raw['$id'], name).toContain('/schemas/v1/')
    }
  })
})

describe('TEST-SWC-005 / TEST-SWC-006 — schema da matriz de rastreabilidade', () => {
  /** Uma matriz mínima válida, base para os casos negativos. */
  const baseTrace = (): Record<string, any> => ({
    version: 1,
    feature: '0002-customer-registration',
    requirements: {
      'REQ-CUST-001': {
        title: 'Registrar um cliente',
        scenarios: ['SCN-CUST-001'],
        tasks: ['TASK-CUST-001'],
        implementation: [],
        tests: ['TEST-CUST-001'],
      },
    },
  })

  it('TEST-SWC-005 — a matriz mínima valida', () => {
    expect(validate(traceability, baseTrace())).toEqual([])
  })

  it('TEST-SWC-005 — os traceability.yaml deste repositório validam', () => {
    for (const p of ['0001-plugin-foundation', '0007-sdd-workflow-completion']) {
      expect(
        validate(traceability, readYaml(`.specs/features/${p}/traceability.yaml`)),
        p,
      ).toEqual([])
    }
  })

  it('TEST-SWC-006 — requisito sem tarefa é rejeitado', () => {
    const doc = baseTrace()
    doc['requirements']['REQ-CUST-001'].tasks = []
    expect(validate(traceability, doc).map((f) => f.path))
      .toContain('requirements/REQ-CUST-001/tasks')
  })

  it('TEST-SWC-006 — requisito sem implementation é rejeitado (existe sempre, ainda que vazio)', () => {
    const doc = baseTrace()
    delete doc['requirements']['REQ-CUST-001'].implementation
    expect(validate(traceability, doc).map((f) => f.path))
      .toContain('requirements/REQ-CUST-001')
  })

  it('TEST-SWC-006 — identificador de requisito fora do formato de standards §2 é rejeitado', () => {
    const doc = baseTrace()
    doc['requirements']['req-cust-1'] = doc['requirements']['REQ-CUST-001']
    delete doc['requirements']['REQ-CUST-001']
    expect(validate(traceability, doc).length).toBeGreaterThan(0)
  })

  it('TEST-SWC-006 — tarefa fora do formato TASK-<ESCOPO>-NNN é rejeitada', () => {
    const doc = baseTrace()
    doc['requirements']['REQ-CUST-001'].tasks = ['task-1']
    expect(validate(traceability, doc).length).toBeGreaterThan(0)
  })
})
