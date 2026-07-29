/**
 * Invariantes sobre os artefatos reais de `.specs/` deste repositório.
 *
 * TEST-PF-011, 012, 013, 016, 017 e 018 foram planejados como testes unitários
 * de lógica — slug, alocação de id, transições. Mas o design §2 estabelece que
 * a Fase 1 não entrega scripts executáveis: essa lógica é instrução em
 * linguagem natural dentro dos SKILL.md.
 *
 * Reimplementar as regras aqui só testaria a reimplementação. Estes testes
 * verificam, em vez disso, que os artefatos produzidos SATISFAZEM as regras —
 * o que é observável, captura regressão e exercita o próprio repositório
 * (constituição, Art. 14).
 */
import { describe, it, expect } from 'vitest'
import { readYaml, read, exists, changeDirs, schema, validate, unfilledMarkers } from './helpers.js'

const index = readYaml('.specs/index.yaml') as Record<string, any>
const dirs = changeDirs()

/** Transições válidas — .specs/project/architecture.md §3. */
const TRANSICOES: Record<string, string[]> = {
  DRAFT: ['CLARIFIED', 'CANCELLED'],
  CLARIFIED: ['DESIGNED', 'DRAFT', 'CANCELLED'],
  DESIGNED: ['PLANNED', 'CLARIFIED', 'CANCELLED'],
  PLANNED: ['APPROVED', 'DESIGNED', 'CANCELLED'],
  APPROVED: ['IN_PROGRESS', 'PLANNED', 'CANCELLED'],
  IN_PROGRESS: ['BLOCKED', 'VERIFIED', 'CANCELLED'],
  BLOCKED: ['IN_PROGRESS', 'PLANNED', 'CANCELLED'],
  VERIFIED: ['ARCHIVED', 'IN_PROGRESS'],
  ARCHIVED: [],
  CANCELLED: [],
}

describe('TEST-PF-011 — identificadores são únicos e sequenciais', () => {
  const ids = dirs.map((d) => (d.split('/')[1] as string).slice(0, 4))

  it('nenhum identificador é reutilizado', () => {
    expect(ids).toEqual([...new Set(ids)])
  })

  it('next_id é maior que todo identificador existente', () => {
    const maior = ids.length ? Math.max(...ids.map(Number)) : 0
    expect(index['next_id']).toBeGreaterThan(maior)
  })
})

describe('TEST-PF-012 — slugs são portáveis nas quatro plataformas', () => {
  const PADRAO = /^[0-9]{4}-[a-z0-9]+(-[a-z0-9]+)*$/
  const INVALIDO_WINDOWS = /[<>:"/\\|?*]|[. ]$/

  for (const d of dirs) {
    const nome = d.split('/')[1] as string
    it(`${nome}`, () => {
      expect(PADRAO.test(nome), 'padrão NNNN-slug em minúsculas').toBe(true)
      expect(INVALIDO_WINDOWS.test(nome), 'caractere inválido em Windows').toBe(false)
      expect(nome.normalize('NFD')).toBe(nome) // sem acentos compostos
    })
  }
})

describe('TEST-PF-013 — índice reflete o disco', () => {
  const entradas = (index['changes'] ?? []) as Record<string, any>[]

  it('toda mudança no disco tem entrada no índice', () => {
    expect(entradas.map((c) => c['path']).sort()).toEqual(dirs)
  })

  it('toda entrada aponta para um diretório existente', () => {
    for (const c of entradas) expect(exists(`.specs/${c['path']}`), c['id']).toBe(true)
  })

  it('id e status da entrada conferem com o status.yaml da mudança', () => {
    for (const c of entradas) {
      const st = readYaml(`.specs/${c['path']}/status.yaml`) as Record<string, any>
      expect(st['id'], c['id']).toBe(c['id'])
      expect(st['status'], `status de ${c['id']}`).toBe(c['status'])
    }
  })
})

describe('TEST-PF-018 — estado e histórico são consistentes', () => {
  const status = schema('status')

  for (const d of dirs) {
    describe(d, () => {
      const st = readYaml(`.specs/${d}/status.yaml`) as Record<string, any>
      const hist = (st['history'] ?? []) as Record<string, any>[]

      it('valida contra o schema', () => {
        expect(validate(status, st)).toEqual([])
      })

      it('toda transição registra data e motivo', () => {
        for (const h of hist) {
          expect(h['date'], 'data').toBeTruthy()
          expect(String(h['reason'] ?? '').trim().length, 'motivo').toBeGreaterThan(0)
        }
      })

      it('o estado atual é o da última entrada do histórico', () => {
        expect(st['status']).toBe(hist[hist.length - 1]?.['status'])
      })

      it('cada transição do histórico é válida na máquina de estados', () => {
        const invalidas: string[] = []
        for (let i = 1; i < hist.length; i++) {
          const de = hist[i - 1]?.['status'] as string
          const para = hist[i]?.['status'] as string
          if (!TRANSICOES[de]?.includes(para)) invalidas.push(`${de} → ${para}`)
        }
        expect(invalidas).toEqual([])
      })

      it('os contadores de tarefas somam', () => {
        const t = st['tasks'] as Record<string, number> | undefined
        if (!t) return
        expect(t['total']).toBe((t['pending'] ?? 0) + (t['in_progress'] ?? 0) + (t['done'] ?? 0))
      })
    })
  }
})

describe('TEST-PF-016 / TEST-PF-017 — rastreabilidade e plano', () => {
  for (const d of dirs.filter((x) => exists(`.specs/${x}/traceability.yaml`))) {
    describe(d, () => {
      const trace = readYaml(`.specs/${d}/traceability.yaml`) as Record<string, any>
      const reqs = trace['requirements'] as Record<string, any>
      const spec = read(`.specs/${d}/spec.md`)
      const tasksBody = exists(`.specs/${d}/tasks.md`) ? read(`.specs/${d}/tasks.md`) : ''

      const idsNaSpec = [...spec.matchAll(/^###\s+((?:REQ|NFR)-[A-Z0-9]+-\d{3})/gm)]
        .map((m) => m[1] as string)
      const idsDeTarefa = [...tasksBody.matchAll(/^##\s+(TASK-[A-Z0-9]+-\d{3})/gm)]
        .map((m) => m[1] as string)

      it('TEST-PF-016 — todo requisito da spec está na matriz com ao menos uma tarefa', () => {
        const descobertos = idsNaSpec.filter(
          (id) => !reqs[id] || (reqs[id]['tasks'] ?? []).length === 0,
        )
        expect(descobertos).toEqual([])
      })

      it('a matriz não referencia requisito que não existe na spec', () => {
        expect(Object.keys(reqs).filter((id) => !idsNaSpec.includes(id))).toEqual([])
      })

      it('TEST-PF-017 — toda tarefa referenciada na matriz existe no plano', () => {
        const inexistentes = new Set<string>()
        for (const r of Object.values(reqs)) {
          for (const t of (r['tasks'] ?? []) as string[]) {
            if (!idsDeTarefa.includes(t)) inexistentes.add(t)
          }
        }
        expect([...inexistentes]).toEqual([])
      })

      it('TEST-PF-017 — nenhuma dependência aponta para tarefa inexistente', () => {
        const pendentes: string[] = []
        for (const m of tasksBody.matchAll(/\*\*Dependências:\*\*\s*(.+)/g)) {
          for (const dep of (m[1] as string).matchAll(/TASK-[A-Z0-9]+-\d{3}/g)) {
            if (!idsDeTarefa.includes(dep[0])) pendentes.push(dep[0])
          }
        }
        expect(pendentes).toEqual([])
      })

      it('TEST-PF-017 — o grafo de dependências não tem ciclo', () => {
        const grafo = new Map<string, string[]>()
        const blocos = tasksBody.split(/^##\s+(?=TASK-)/m).slice(1)
        for (const bloco of blocos) {
          const id = /^(TASK-[A-Z0-9]+-\d{3})/.exec(bloco)?.[1]
          if (!id) continue
          const linha = /\*\*Dependências:\*\*\s*(.+)/.exec(bloco)?.[1] ?? ''
          grafo.set(id, [...linha.matchAll(/TASK-[A-Z0-9]+-\d{3}/g)].map((x) => x[0]))
        }
        const estado = new Map<string, number>()
        const ciclos: string[] = []
        const visita = (n: string, caminho: string[]): void => {
          if (estado.get(n) === 1) { ciclos.push([...caminho, n].join(' → ')); return }
          if (estado.get(n) === 2) return
          estado.set(n, 1)
          for (const v of grafo.get(n) ?? []) visita(v, [...caminho, n])
          estado.set(n, 2)
        }
        for (const n of grafo.keys()) visita(n, [])
        expect(ciclos).toEqual([])
      })

      it('todo arquivo listado em implementation existe', () => {
        const ausentes: string[] = []
        for (const r of Object.values(reqs)) {
          for (const f of (r['implementation'] ?? []) as string[]) {
            if (!exists(f)) ausentes.push(f)
          }
        }
        expect(ausentes).toEqual([])
      })
    })
  }
})

describe('TEST-PF-015 — identificadores não são renumerados', () => {
  for (const d of dirs) {
    it(`${d}: identificadores da spec são únicos e sequenciais por escopo`, () => {
      const spec = read(`.specs/${d}/spec.md`)
      const ids = [...spec.matchAll(/^###\s+((?:REQ|NFR|SCN)-[A-Z0-9]+-\d{3})/gm)]
        .map((m) => m[1] as string)
        .concat([...spec.matchAll(/^####\s+(SCN-[A-Z0-9]+-\d{3})/gm)].map((m) => m[1] as string))
      expect(ids.filter((x, i) => ids.indexOf(x) !== i), 'duplicados').toEqual([])
    })
  }
})

describe('TEST-PF-021 — os artefatos .specs do exemplo validam', () => {
  const EX = 'examples/node-api/.specs'
  const feature = `${EX}/features/0001-customer-registration`

  it('config.yaml do exemplo valida', () => {
    expect(validate(schema('config'), readYaml(`${EX}/config.yaml`))).toEqual([])
  })

  it('status.yaml do exemplo valida', () => {
    expect(validate(schema('status'), readYaml(`${feature}/status.yaml`))).toEqual([])
  })

  it('o índice reflete a mudança existente', () => {
    const idx = readYaml(`${EX}/index.yaml`) as Record<string, any>
    const st = readYaml(`${feature}/status.yaml`) as Record<string, any>
    expect(idx['changes']).toHaveLength(1)
    expect(idx['changes'][0]['id']).toBe(st['id'])
    expect(idx['changes'][0]['status']).toBe(st['status'])
    expect(idx['next_id']).toBe(2)
  })

  it('todo requisito da spec está na matriz com ao menos uma tarefa', () => {
    const trace = readYaml(`${feature}/traceability.yaml`) as Record<string, any>
    const ids = [...read(`${feature}/spec.md`)
      .matchAll(/^###\s+((?:REQ|NFR)-[A-Z0-9]+-\d{3})/gm)].map((m) => m[1] as string)
    expect(ids.length).toBeGreaterThan(0)
    for (const id of ids) {
      expect((trace['requirements'][id]?.['tasks'] ?? []).length, id).toBeGreaterThan(0)
    }
  })

  it('nenhum marcador de template sobra nos artefatos gerados', () => {
    const comMarcador = [
      `${EX}/config.yaml`, `${EX}/index.yaml`,
      ...['vision', 'constitution', 'context', 'architecture', 'glossary', 'standards']
        .map((d) => `${EX}/project/${d}.md`),
      ...['request.md', 'spec.md', 'tasks.md', 'status.yaml', 'traceability.yaml']
        .map((f) => `${feature}/${f}`),
    ].filter((f) => exists(f) && unfilledMarkers(read(f)).length > 0)
    expect(comMarcador).toEqual([])
  })

  it('os seis documentos de projeto foram criados', () => {
    for (const d of ['vision', 'constitution', 'context', 'architecture', 'glossary', 'standards']) {
      expect(exists(`${EX}/project/${d}.md`), d).toBe(true)
    }
  })

  it('demonstra que "não detectado" fica null, e não vira palpite', () => {
    const cfg = readYaml(`${EX}/config.yaml`) as Record<string, any>
    expect(cfg['validation'].commands.lint, 'sem linter no projeto').toBeNull()
    expect(cfg['validation'].commands.test, 'detectado em package.json').toBe('npm test')
  })
})

describe('NFR-PF-005 — specs são legíveis sem o plugin', () => {
  it('todo artefato de .specs é Markdown ou YAML', () => {
    const outros = changeDirs()
      .flatMap((d) => ['spec.md', 'status.yaml', 'request.md'].map((f) => `.specs/${d}/${f}`))
      .filter((f) => exists(f))
      .filter((f) => !f.endsWith('.md') && !f.endsWith('.yaml'))
    expect(outros).toEqual([])
  })

  it('nenhum marcador de template sobra em artefato gerado', () => {
    // Citações de marcador entre crases não contam: documentação que discute
    // `{{NOME}}` é diferente de um marcador esquecido. Ver unfilledMarkers.
    const comMarcador = changeDirs()
      .flatMap((d) => ['spec.md', 'status.yaml', 'request.md', 'tasks.md', 'traceability.yaml']
        .map((f) => `.specs/${d}/${f}`))
      .filter((f) => exists(f))
      .map((f) => ({ f, achados: unfilledMarkers(read(f)) }))
      .filter((x) => x.achados.length > 0)
      .map((x) => `${x.f}: ${x.achados.join(', ')}`)
    expect(comMarcador).toEqual([])
  })

  it('o detector de marcadores reconhece um marcador real — não é vacuoso', () => {
    expect(unfilledMarkers('# Feature: {{CHANGE_TITLE}}')).toHaveLength(1)
    expect(unfilledMarkers('{{guia: preencher aqui}}')).toHaveLength(1)
    expect(unfilledMarkers('a convenção usa `{{NOME}}` entre crases')).toEqual([])
  })
})
