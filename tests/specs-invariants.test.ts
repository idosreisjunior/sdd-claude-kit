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

/**
 * Transições válidas, carregadas de `schemas/workflow.json`.
 *
 * Antes esta constante redeclarava o grafo à mão, e o teste validava contra a
 * própria cópia — uma edição em `architecture.md` esquecida aqui deixava a
 * suíte verde enquanto o framework divergia da spec. Ver ADR-010.
 */
const workflow = JSON.parse(read('plugins/sdd-kit/schemas/workflow.json')) as {
  states: string[]
  initial: string
  terminal: string[]
  transitions: Record<string, string[]>
}
const TRANSICOES = workflow.transitions

describe('workflow.json — o grafo como fonte única (ADR-010)', () => {
  it('declara os dez estados de RF-004', () => {
    expect(workflow.states).toHaveLength(10)
    expect(workflow.states).toContain('DRAFT')
    expect(workflow.states).toContain('ARCHIVED')
  })

  it('toda transição aponta para um estado declarado', () => {
    const invalidas: string[] = []
    for (const [de, paras] of Object.entries(workflow.transitions)) {
      if (!workflow.states.includes(de)) invalidas.push(`origem ${de}`)
      for (const para of paras) {
        if (!workflow.states.includes(para)) invalidas.push(`${de} → ${para}`)
      }
    }
    expect(invalidas).toEqual([])
  })

  it('todo estado tem transições declaradas', () => {
    expect(Object.keys(workflow.transitions).sort()).toEqual([...workflow.states].sort())
  })

  it('estados terminais não têm saída', () => {
    for (const t of workflow.terminal) {
      expect(workflow.transitions[t], t).toEqual([])
    }
  })

  it('todo estado não terminal alcança CANCELLED', () => {
    const semSaida = workflow.states
      .filter((s) => !workflow.terminal.includes(s))
      .filter((s) => !(workflow.transitions[s] ?? []).includes('CANCELLED'))
    expect(semSaida, 'cancelar não exige passar por estado nenhum').toEqual([])
  })

  it('BLOCKED é alcançável apenas de IN_PROGRESS (ADR-013)', () => {
    const origens = Object.entries(workflow.transitions)
      .filter(([, paras]) => paras.includes('BLOCKED'))
      .map(([de]) => de)
    expect(origens).toEqual(['IN_PROGRESS'])
  })

  it('todo estado é alcançável a partir do inicial', () => {
    const vistos = new Set([workflow.initial])
    const fila = [workflow.initial]
    while (fila.length) {
      for (const p of workflow.transitions[fila.shift() as string] ?? []) {
        if (!vistos.has(p)) { vistos.add(p); fila.push(p) }
      }
    }
    expect([...vistos].sort()).toEqual([...workflow.states].sort())
  })

  it('architecture.md aponta para o arquivo em vez de repetir a tabela (TEST-SWC-004)', () => {
    const arch = read('.specs/project/architecture.md')
    expect(arch, 'referencia workflow.json').toContain('workflow.json')
    expect(arch, 'não repete a tabela').not.toMatch(/^\| `DRAFT` \| `CLARIFIED`/m)
    expect(arch, 'inclui a aresta PLANNED → IN_PROGRESS').toContain('PLANNED')
    expect(arch, 'documenta a aresta PLANNED → IN_PROGRESS').toMatch(/PLANNED[\s┄─]*▶?\s*IN_PROGRESS/)
    expect(arch, 'semântica BLOCKED vs blocked_by').toContain('blocked_by')
    expect(arch, 'link para ADR-013').toContain('ADR-013')
  })
})

describe('TEST-SWC-033 — standards.md fixa a referência por identificador', () => {
  const standards = read('.specs/project/standards.md')

  it('declara a referência por identificador e nomeia index.yaml como resolvedor', () => {
    expect(standards, 'seção de referência a mudanças').toMatch(/##\s+\d+\.\s+Referência a mudanças/)
    expect(standards, 'identificador, não caminho').toContain('identificador')
    expect(standards, 'index.yaml resolve').toContain('index.yaml')
  })

  it('traz exemplo positivo e negativo, e a origem da decisão', () => {
    expect(standards, 'exemplo positivo').toContain('✅')
    expect(standards, 'exemplo negativo').toContain('❌')
    expect(standards, 'origem da decisão').toMatch(/design\.md`?\s*§14/)
  })
})

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

      // Acrescentado depois de uma falha parcial real: a skill tasks escreveu
      // tasks.md e o processo caiu antes de atualizar status.yaml. Os 76
      // invariantes existentes passaram — nenhum comparava o plano com os
      // contadores. O design afirmava que a falha seria detectável; não era.
      it('os contadores refletem o tasks.md', () => {
        if (!exists(`.specs/${d}/tasks.md`)) return
        const t = st['tasks'] as Record<string, number> | undefined
        if (!t) return
        const noPlano = [...read(`.specs/${d}/tasks.md`)
          .matchAll(/^##\s+TASK-[A-Z0-9]+-\d{3}/gm)].length
        expect(t['total'], 'total declarado vs tarefas no plano').toBe(noPlano)
      })

      // Uma asserção "mudança com plano não fica atrás de PLANNED" foi tentada
      // aqui e removida: acusava 0001-plugin-foundation, que tem 17 tarefas
      // concluídas ainda em DESIGNED. Aquele estado é legítimo — a feature foi
      // construída antes de existirem as skills approve e verify que a
      // promoveriam. A asserção de contadores acima já pega a falha real.
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

describe('spec.md não duplica o estado', () => {
  // Encontrado pela própria skill tasks: dois spec.md declaravam
  // "Status: DRAFT" três transições depois, e 214 testes passavam. Mesma
  // classe do grafo triplicado — o mesmo fato em dois lugares diverge.
  // A correção é apagar a cópia, não testar que as duas concordam.
  for (const d of [...dirs, ...['feature', 'bug', 'refactor', 'change']
    .map((t) => `plugins/sdd-kit/templates/pt-BR/${t}`)]) {
    const p = d.startsWith('plugins/') ? `${d}/spec.md` : `.specs/${d}/spec.md`
    if (!exists(p)) continue
    it(`${d}: não declara Status no cabeçalho`, () => {
      expect(read(p)).not.toMatch(/^- \*\*Status:\*\*/m)
    })
  }
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
