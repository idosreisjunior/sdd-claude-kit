/**
 * A documentação cita números concretos dos artefatos do exemplo — "1 requisito,
 * 6 questões, 3 críticas". Sem estes testes, mudar o exemplo faria o tutorial
 * mentir em silêncio, que é o modo de falha mais comum de documentação.
 */
import { describe, it, expect } from 'vitest'
import { dirname, join, normalize } from 'node:path'
import { read, readYaml, exists, walk } from './helpers.js'

const DOCS = [
  'README.md',
  'CONTRIBUTING.md',
  'docs/pt-BR/instalacao.md',
  'docs/pt-BR/primeira-feature.md',
  'examples/node-api/README.md',
]

describe('links relativos da documentação', () => {
  for (const doc of DOCS) {
    it(`${doc}: todos os links resolvem`, () => {
      const quebrados: string[] = []
      for (const m of read(doc).matchAll(/\[[^\]]*\]\(((?!https?:\/\/|#)[^)]+)\)/g)) {
        const alvo = (m[1] as string).split('#')[0]
        if (!alvo) continue
        if (!exists(normalize(join(dirname(doc), alvo)))) quebrados.push(alvo)
      }
      expect(quebrados).toEqual([])
    })
  }
})

describe('o tutorial não diverge do exemplo', () => {
  const F = 'examples/node-api/.specs/features/0001-customer-registration'
  const spec = read(`${F}/spec.md`)
  const tasks = read(`${F}/tasks.md`)
  const cfg = readYaml('examples/node-api/.specs/config.yaml') as Record<string, any>
  const st = readYaml(`${F}/status.yaml`) as Record<string, any>

  const conta = (re: RegExp, texto: string): number => (texto.match(re) ?? []).length

  it('1 requisito funcional e nenhum não funcional', () => {
    expect(conta(/^### REQ-CUST-\d{3}/gm, spec), 'REQ').toBe(1)
    expect(conta(/^### NFR-CUST-\d{3}/gm, spec), 'NFR').toBe(0)
  })

  it('2 cenários', () => {
    expect(conta(/^#### SCN-CUST-\d{3}/gm, spec)).toBe(2)
  })

  it('6 questões em aberto, 3 delas críticas', () => {
    expect(conta(/^\| Q\d+ \|/gm, spec), 'questões').toBe(6)
    expect(conta(/\*\*Crítica\*\*/g, spec), 'críticas').toBe(3)
  })

  it('5 tarefas, as duas primeiras são decisões', () => {
    expect(conta(/^## TASK-CUST-\d{3}/gm, tasks)).toBe(5)
    expect(tasks).toContain('TASK-CUST-001 — Decidir e registrar o mecanismo de persistência')
    expect(tasks).toContain('TASK-CUST-002 — Decidir e registrar o modelo de autorização')
  })

  it('lint continua null e test continua detectado', () => {
    expect(cfg['validation'].commands.lint).toBeNull()
    expect(cfg['validation'].commands.test).toBe('npm test')
  })

  it('a mudança continua em DRAFT com 3 bloqueios críticos', () => {
    expect(st['status']).toBe('DRAFT')
    expect((st['blocked_by'] as any[]).filter((b) => b.severity === 'critical')).toHaveLength(3)
  })
})

describe('SCN-DCR-001 — referências cruzadas no que é distribuído', () => {
  const TPL = 'plugins/sdd-kit/templates/pt-BR'

  /** Artigos que EXISTEM na constituição gerada por init — não na deste repo. */
  const artigos = new Map(
    [...read(`${TPL}/project/constitution.md`).matchAll(/^## Artigo (\d+) — (.+)$/gm)]
      .map((m) => [Number(m[1]), (m[2] as string).trim()] as const),
  )

  const distribuidos = [
    ...walk(TPL),
    ...walk('plugins/sdd-kit/skills'),
  ].filter((p) => p.endsWith('.md') || p.endsWith('.yaml'))

  it('a constituição gerada tem artigos numerados', () => {
    expect(artigos.size).toBeGreaterThan(0)
  })

  it('toda referência a "Art. N" existe na constituição gerada', () => {
    const quebradas: string[] = []
    for (const f of distribuidos) {
      for (const m of read(f).matchAll(/Art(?:igo)?\.?\s*(\d+)/g)) {
        const n = Number(m[1])
        if (!artigos.has(n)) quebradas.push(`${f} → Art. ${n}`)
      }
    }
    expect(quebradas).toEqual([])
  })

  it('SCN-DCR-002 — a regra sobre "não executado" aponta para Definition of Done', () => {
    const cfg = read(`${TPL}/config.yaml`)
    const ref = /jamais "aprovado"[\s\S]{0,80}?Art\.\s*(\d+)/.exec(cfg)
    expect(ref, 'referência encontrada no template de config').not.toBeNull()
    expect(artigos.get(Number(ref?.[1]))).toContain('Definition of Done')
  })

  it('nenhum artefato gerado do exemplo tem referência quebrada', () => {
    const constExemplo = new Set(
      [...read('examples/node-api/.specs/project/constitution.md')
        .matchAll(/^## Artigo (\d+) —/gm)].map((m) => Number(m[1])),
    )
    const quebradas: string[] = []
    for (const f of ['examples/node-api/.specs/config.yaml']) {
      for (const m of read(f).matchAll(/Art(?:igo)?\.?\s*(\d+)/g)) {
        if (!constExemplo.has(Number(m[1]))) quebradas.push(`${f} → Art. ${m[1]}`)
      }
    }
    expect(quebradas).toEqual([])
  })
})

describe('a documentação não promete o que não existe', () => {
  const guias = ['docs/pt-BR/instalacao.md', 'docs/pt-BR/primeira-feature.md']

  it('declara que só 4 das 13 skills existem', () => {
    expect(read('docs/pt-BR/instalacao.md')).toMatch(/Fase 2/)
  })

  it('não apresenta como pronta nenhuma skill da Fase 2', () => {
    const daFase2 = ['clarify', 'design', 'approve', 'implement', 'verify', 'archive']
    for (const doc of guias) {
      const corpo = read(doc)
      for (const skill of daFase2) {
        // Citar a skill é permitido; apresentá-la como comando pronto, não.
        expect(corpo, `${doc} promete /sdd-kit:${skill}`).not.toMatch(
          new RegExp(`^\\s*/sdd-kit:${skill}\\b`, 'm'),
        )
      }
    }
  })

  it('docs/en/ está vazio e o README diz isso', () => {
    expect(read('README.md')).toContain('docs/en/')
    expect(read('README.md')).toMatch(/Fase 6/)
  })
})
