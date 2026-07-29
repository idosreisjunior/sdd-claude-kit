import { describe, it, expect } from 'vitest'
import { parse as parseYaml } from 'yaml'
import { read, walk, schema, validate, fillTemplate, exists } from './helpers.js'

const TPL = 'plugins/sdd-kit/templates'
const LANGS = ['pt-BR']
const templateFiles = walk(`${TPL}/pt-BR`)

describe('TEST-PF-006 — template de config.yaml preenchido valida', () => {
  const filled = fillTemplate(read(`${TPL}/pt-BR/config.yaml`), {
    PROJECT_NAME: 'minha-api',
    PROJECT_TYPE: 'backend',
    SOURCE_PATH: 'src',
    TEST_PATH: 'tests',
  })

  it('não sobra marcador', () => {
    expect(filled).not.toContain('{{')
  })

  it('valida contra config.schema.json', () => {
    expect(validate(schema('config'), parseYaml(filled))).toEqual([])
  })

  it('nasce em guided, com comandos null — "não detectado", nunca "aprovado"', () => {
    const doc = parseYaml(filled) as Record<string, any>
    expect(doc['workflow'].mode).toBe('guided')
    expect(doc['validation'].commands).toEqual({ lint: null, test: null, build: null })
  })
})

describe('TEST-PF-007 — template de status.yaml valida nos quatro tipos', () => {
  const status = schema('status')
  for (const type of ['feature', 'bug', 'refactor', 'change']) {
    it(`type: ${type}`, () => {
      const filled = fillTemplate(read(`${TPL}/pt-BR/_shared/status.yaml`), {
        CHANGE_ID: '0002-customer-registration',
        CHANGE_TYPE: type,
        CHANGE_TITLE: 'Cadastro de clientes',
        DATE: '2026-07-29',
        CREATION_REASON: 'Mudança criada',
      })
      expect(filled).not.toContain('{{')
      expect(validate(status, parseYaml(filled))).toEqual([])
    })
  }

  it('nasce em DRAFT, sem aprovação', () => {
    const doc = parseYaml(fillTemplate(read(`${TPL}/pt-BR/_shared/status.yaml`), {
      CHANGE_ID: '0002-x', CHANGE_TYPE: 'feature', CHANGE_TITLE: 'X',
      DATE: '2026-07-29', CREATION_REASON: 'criada',
    })) as Record<string, any>
    expect(doc['status']).toBe('DRAFT')
    expect(doc['approval']).toBeNull()
  })
})

describe('TEST-PF-008 — estrutura dos templates é estável (SCN-PF-018)', () => {
  it('índice nasce vazio com next_id 1', () => {
    const doc = parseYaml(fillTemplate(read(`${TPL}/pt-BR/index.yaml`), {})) as Record<string, any>
    expect(doc).toMatchObject({ version: 1, next_id: 1, changes: [], archive: [] })
  })

  it('as seções de cada spec.md são estáveis', () => {
    for (const type of ['feature', 'bug', 'refactor', 'change']) {
      const headings = [...read(`${TPL}/pt-BR/${type}/spec.md`).matchAll(/^## (.+)$/gm)]
        .map((m) => m[1])
      expect(headings, type).toMatchSnapshot()
    }
  })

  it('as seções dos documentos de projeto são estáveis', () => {
    for (const doc of ['vision', 'constitution', 'context', 'architecture', 'glossary', 'standards']) {
      const headings = [...read(`${TPL}/pt-BR/project/${doc}.md`).matchAll(/^## (.+)$/gm)]
        .map((m) => m[1])
      expect(headings, doc).toMatchSnapshot()
    }
  })
})

describe('TEST-PF-014 — spec.md gerado tem requisito, cenário e critérios', () => {
  for (const type of ['feature', 'bug', 'refactor', 'change']) {
    it(`${type}/spec.md declara as seções exigidas`, () => {
      const body = read(`${TPL}/pt-BR/${type}/spec.md`)
      expect(body, 'critérios de aceite').toMatch(/## Critérios de aceite/)
      expect(body, 'questões pendentes').toMatch(/## Questões pendentes/)
      expect(body, 'hipóteses — constituição Art. 2').toContain('> HIPÓTESE:')
      expect(body, 'cenário em Gherkin').toMatch(/DADO .*\nQUANDO .*\nENTÃO /)
    })
  }

  it('feature/spec.md tem requisitos funcionais e não funcionais', () => {
    const body = read(`${TPL}/pt-BR/feature/spec.md`)
    expect(body).toMatch(/## Requisitos funcionais/)
    expect(body).toMatch(/## Requisitos não funcionais/)
  })
})

describe('convenções dos templates', () => {
  const MARKER = /\{\{(.+?)\}\}/gs
  const ALLOWED = /^(?:[A-Z][A-Z0-9_]*|(?:guia|opcional|repetir):\s)/

  it('todo marcador segue a convenção do README', () => {
    const bad: string[] = []
    for (const f of templateFiles) {
      for (const m of read(f).matchAll(MARKER)) {
        if (!ALLOWED.test(m[1] as string)) bad.push(`${f}: {{${(m[1] as string).slice(0, 30)}`)
      }
    }
    expect(bad).toEqual([])
  })

  it('chaves balanceadas', () => {
    for (const f of templateFiles) {
      const body = read(f)
      expect(body.split('{{').length, f).toBe(body.split('}}').length)
    }
  })

  it('marcadores em YAML vão entre aspas — senão o arquivo deixa de ser YAML', () => {
    const offenders: string[] = []
    for (const f of templateFiles.filter((p) => p.endsWith('.yaml'))) {
      read(f).split('\n').forEach((line, i) => {
        if (!line.trim().startsWith('#') && /(:\s|-\s)\{\{[A-Z_]+\}\}/.test(line)) {
          offenders.push(`${f}:${i + 1}`)
        }
      })
    }
    expect(offenders).toEqual([])
  })

  it('todo template YAML parseia mesmo com marcadores', () => {
    for (const f of templateFiles.filter((p) => p.endsWith('.yaml'))) {
      expect(() => parseYaml(read(f)), f).not.toThrow()
    }
  })

  it('0004 — o guia declara que question e resolves_with são identificadores', () => {
    const tpl = read(`${TPL}/pt-BR/_shared/status.yaml`)
    expect(tpl, 'formato de question').toMatch(/question\s+identificador/)
    expect(tpl, 'formato de resolves_with').toMatch(/resolves_with\s+opcional; id da tarefa/)
    expect(tpl, 'exemplo concreto').toMatch(/question: Q3/)
    // O aviso quebra linha no comentário YAML — casar por palavra, não por frase.
    expect(tpl, 'aviso de que não é texto livre').toContain('IDENTIFICADORES')
  })

  it('0004 — status.yaml com blocked_by preenchido valida contra o schema', () => {
    // Antes da correção, o guia enumerava os campos sem dizer o formato de
    // dois deles, e a skill preenchia com prosa.
    const doc = parseYaml(fillTemplate(read(`${TPL}/pt-BR/_shared/status.yaml`), {
      CHANGE_ID: '0002-x', CHANGE_TYPE: 'feature', CHANGE_TITLE: 'X',
      DATE: '2026-07-29', CREATION_REASON: 'criada',
    })) as Record<string, any>
    doc['blocked_by'] = [{
      question: 'Q3',
      description: 'Quais campos são obrigatórios no cadastro?',
      severity: 'critical',
      resolves_with: 'TASK-CUST-002',
    }]
    doc['resolved_questions'] = [{
      question: 'Q1', date: '2026-07-29', resolved_by: 'TASK-CUST-001',
      summary: 'Persistência em arquivo JSON.', adr: 'ADR-001',
    }]
    expect(validate(schema('status'), doc)).toEqual([])
  })

  it('0005 — a Definition of Done é satisfazível sem linter configurado', () => {
    const art = read(`${TPL}/pt-BR/project/constitution.md`)
    const dod = /## Artigo 10 — Definition of Done([\s\S]*?)(?=\n## )/.exec(art)?.[1] ?? ''
    expect(dod, 'artigo encontrado').not.toBe('')
    // Não pode exigir lint incondicionalmente.
    expect(dod, 'lint incondicional').not.toMatch(/;\s*lint aprovado;/)
    expect(dod, 'fala em validações configuradas').toContain('validações configuradas')
    expect(dod, 'trata o caso não configurado').toContain('não configurada')
    // E a regra contra passe silencioso continua intacta.
    expect(dod, 'não executado ≠ aprovado').toMatch(/jamais como\s*\n?"aprovado"/)
  })

  it('campos de texto livre sobrevivem a aspas no valor', () => {
    // `reason` cita o pedido do usuário, e pedidos contêm aspas. Um escalar
    // entre aspas duplas quebra o YAML no primeiro `"` do texto.
    const comAspas = 'Mudança criada a partir de "criar cadastro de clientes".'
    const filled = fillTemplate(read(`${TPL}/pt-BR/_shared/status.yaml`), {
      CHANGE_ID: '0002-x', CHANGE_TYPE: 'feature', CHANGE_TITLE: 'X',
      DATE: '2026-07-29', CREATION_REASON: comAspas,
    })
    expect(() => parseYaml(filled)).not.toThrow()
    const doc = parseYaml(filled) as Record<string, any>
    expect(doc['history'][0].reason).toContain('criar cadastro de clientes')
  })

  it('sem HTML embutido e um único H1 (standards §10)', () => {
    for (const f of templateFiles.filter((p) => p.endsWith('.md'))) {
      const body = read(f)
      expect(/<!--|<div|<br\s*\/?>/.test(body), `${f}: HTML`).toBe(false)
      expect((body.match(/^# /gm) ?? []).length, `${f}: H1`).toBe(1)
    }
  })

  it('cada idioma tem a mesma árvore de arquivos (ADR-009)', () => {
    const base = walk(`${TPL}/pt-BR`).map((p) => p.replace(`${TPL}/pt-BR/`, ''))
    for (const lang of LANGS.filter((l) => l !== 'pt-BR')) {
      expect(walk(`${TPL}/${lang}`).map((p) => p.replace(`${TPL}/${lang}/`, '')), lang).toEqual(base)
    }
  })

  it('os quatro tipos de mudança têm spec.md; _shared não tem', () => {
    for (const type of ['feature', 'bug', 'refactor', 'change']) {
      expect(exists(`${TPL}/pt-BR/${type}/spec.md`), type).toBe(true)
    }
    expect(exists(`${TPL}/pt-BR/_shared/spec.md`)).toBe(false)
  })
})
