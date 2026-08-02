import { describe, it, expect } from 'vitest'
import { readdirSync } from 'node:fs'
import { parseSkill, abs, read, exists } from './helpers.js'

const SKILLS = readdirSync(abs('plugins/sdd-kit/skills')).filter((n) => !n.startsWith('.')).sort()

/** Campos de front matter confirmados na documentação oficial (TASK-PF-001). */
const CAMPOS_REAIS = new Set([
  'name', 'description', 'when_to_use', 'argument-hint', 'arguments',
  'disable-model-invocation', 'user-invocable', 'allowed-tools', 'disallowed-tools',
  'model', 'effort', 'context', 'agent', 'background', 'hooks', 'paths', 'shell',
  'version', 'license',
])

/** Variáveis de substituição reais. Qualquer outra é invenção. */
const VARS_REAIS = new Set([
  'CLAUDE_PLUGIN_ROOT', 'CLAUDE_PROJECT_DIR', 'CLAUDE_SKILL_DIR',
  'CLAUDE_PLUGIN_DATA', 'CLAUDE_SESSION_ID', 'CLAUDE_EFFORT',
])

describe('skills — contratos da plataforma', () => {
  it('as dez skills do fluxo SDD existem (4 da Fase 1 + 6 da Fase 2)', () => {
    expect(SKILLS).toEqual([
      'approve', 'archive', 'clarify', 'design', 'implement',
      'init', 'new', 'spec', 'tasks', 'verify',
    ])
  })

  for (const name of SKILLS) {
    describe(`/sdd-kit:${name}`, () => {
      const { frontmatter, body } = parseSkill(`plugins/sdd-kit/skills/${name}/SKILL.md`)

      it('não inventa campo de front matter', () => {
        expect(Object.keys(frontmatter).filter((k) => !CAMPOS_REAIS.has(k))).toEqual([])
      })

      it('name confere com o diretório — define o namespace', () => {
        expect(frontmatter['name']).toBe(name)
      })

      it('description + when_to_use cabem no limite de 1536 caracteres', () => {
        const len = String(frontmatter['description'] ?? '').length +
          String(frontmatter['when_to_use'] ?? '').length
        expect(len).toBeLessThanOrEqual(1536)
      })

      it('declara disable-model-invocation explicitamente (ADR-008)', () => {
        expect(frontmatter).toHaveProperty('disable-model-invocation')
      })

      it('remove Edit do conjunto de ferramentas — não altera código', () => {
        expect(String(frontmatter['disallowed-tools'] ?? '')).toContain('Edit')
      })

      it('não inventa variável de substituição', () => {
        const usadas = [...body.matchAll(/\$\{([A-Z_]+)\}/g)].map((m) => m[1] as string)
        expect(usadas.filter((v) => !VARS_REAIS.has(v))).toEqual([])
      })

      it('declara os arquivos que lê (NFR-PF-003)', () => {
        expect(body).toContain('Arquivos que esta skill lê')
      })

      it('TEST-PF-024 — declara o modo de governança (SCN-PF-019 e SCN-PF-020)', () => {
        expect(body, 'seção').toContain('## Modo de governança')
        expect(body, 'advisory nunca bloqueia').toMatch(/`advisory`[\s\S]{0,200}?nunca\*{0,2}\s*bloqueia/i)
        expect(body, 'strict declarado não implementado').toContain('Ainda não implementado na Fase 1')
        expect(body, 'não finge bloqueio').toContain('finja um bloqueio')
      })

      it('templates são referenciados por CLAUDE_PLUGIN_ROOT, não por SKILL_DIR', () => {
        if (body.includes('/templates/')) {
          expect(body).toContain('${CLAUDE_PLUGIN_ROOT}/templates')
        }
      })
    })
  }
})

describe('init — cenários declarados na instrução', () => {
  const { body } = parseSkill('plugins/sdd-kit/skills/init/SKILL.md')

  it('SCN-PF-002 — cria config.yaml e index.yaml', () => {
    expect(body).toContain('config.yaml')
    expect(body).toContain('index.yaml')
  })

  it('SCN-PF-003 — detecção é somente leitura e não altera código', () => {
    expect(body.toLowerCase()).toContain('somente leitura')
    expect(body).toContain('Nunca alterar arquivo de código')
  })

  it('SCN-PF-004 — detecta projeto já inicializado e não sobrescreve', () => {
    expect(body).toContain('já está inicializado')
    expect(body).toContain('sem confirmação')
  })

  it('TEST-PF-009 / TEST-PF-010 — interpreta --mode e --language de $ARGUMENTS', () => {
    expect(body).toContain('$ARGUMENTS')
    expect(body).toContain('--mode')
    expect(body).toContain('--language')
    expect(body, 'sem parsing nativo de flags').toMatch(/não existe parsing nativo de flags/i)
  })

  it('TEST-PF-023 — idioma sem templates interrompe, não gera pt-BR em silêncio', () => {
    expect(body).toMatch(/Se não existir, pare e pergunte/)
    expect(exists('plugins/sdd-kit/templates/en')).toBe(false)
  })

  it('exige que nenhum marcador sobre nos documentos gerados', () => {
    expect(body).toContain('Nenhum `{{` pode sobrar')
  })
})

describe('new — cenários declarados na instrução', () => {
  const { body } = parseSkill('plugins/sdd-kit/skills/new/SKILL.md')

  it('SCN-PF-007 — identificadores nunca são reutilizados', () => {
    expect(body).toContain('reutilizados')
  })

  it('SCN-PF-008 — propõe o tipo e pede confirmação', () => {
    expect(body).toContain('peça confirmação')
  })

  it('Q5 — reconcilia o índice com o disco antes de alocar', () => {
    expect(body).toContain('Reconcilie com o disco')
  })

  it('Q4 — slug em inglês, confirmado antes de criar o diretório', () => {
    expect(body).toContain('em inglês')
    expect(body).toContain('antes de criar o diretório')
  })

  it('os quatro tipos mapeiam para o diretório correto', () => {
    for (const dir of ['features', 'bugs', 'refactors', 'changes']) {
      expect(body, dir).toContain(`.specs/${dir}/`)
    }
  })

  it('não cria tasks.md prematuramente', () => {
    expect(body).toContain('não** são criados aqui')
  })
})

describe('spec — a regra que sustenta o framework', () => {
  const { body } = parseSkill('plugins/sdd-kit/skills/spec/SKILL.md')

  it('SCN-PF-010 — instrui a não inventar, com exemplos concretos', () => {
    expect(body).toContain('Não inventar requisitos')
    expect(body).toContain('Como a invenção se disfarça')
    expect(body).toContain('> HIPÓTESE:')
  })

  it('SCN-PF-011 — preserva identificadores e marca removidos', () => {
    expect(body).toContain('nunca são reutilizados nem renumerados')
    expect(body).toContain('REMOVIDO')
  })

  it('não lê código-fonte nem outras specs (NFR-PF-003)', () => {
    expect(body).toContain('Não leia o código-fonte')
    expect(body).toContain('Não leia as specs de outras mudanças')
  })

  it('não altera o estado — CLARIFIED é trabalho de clarify', () => {
    expect(body).toContain('não** muda o `status.yaml`')
  })

  // Bug 0003: a instrução cobria invenção de detalhe, não de operação.
  // Este teste é condição NECESSÁRIA, não suficiente — a verificação de
  // comportamento é por execução real, registrada na spec do bug.
  it('0003 — nomeia a expansão por completude como padrão de invenção', () => {
    expect(body, 'seção').toContain('expansão por completude')
    expect(body, 'exemplo do CRUD').toMatch(/consultar, listar, atualizar, remover/)
    expect(body, 'regra da contagem').toContain('conte as operações no texto da solicitação')
  })

  it('0003 — exige origem declarada para todo requisito', () => {
    expect(body).toContain('Todo requisito precisa de origem')
    expect(body).toMatch(/de qual trecho da solicitação ele veio/)
  })

  it('0003 — não proíbe CRUD quando ele foi pedido', () => {
    expect(body).toMatch(/A regra é sobre o texto, não sobre proibir CRUD/)
  })
})

describe('tasks — planejamento e transição', () => {
  const { body } = parseSkill('plugins/sdd-kit/skills/tasks/SKILL.md')

  it('SCN-PF-012 — declara os dez campos de RF-007', () => {
    for (const campo of ['Arquivos prováveis', 'Testes esperados', 'Critério de conclusão',
      'Complexidade', 'Dependências']) {
      expect(body, campo).toContain(campo)
    }
  })

  it('SCN-PF-013 — requisito descoberto bloqueia, e não é coberto por invenção', () => {
    expect(body).toContain('Requisitos descobertos')
    expect(body).toContain('Não corrija sozinho inventando uma tarefa')
  })

  it('SCN-PF-014 — detecta dependência inexistente e ciclos', () => {
    expect(body).toContain('referenciar uma tarefa que existe')
    expect(body).toContain('Ciclo de dependências')
  })

  it('SCN-PF-016 — transição inválida avisa, sem relaxar a máquina de estados', () => {
    expect(body).toContain('Transição de estado inválida')
    expect(body).toContain('Não relaxe a máquina de estados')
    expect(body).toContain('registre o salto no motivo')
  })

  it('nenhuma tarefa G sobrevive ao plano', () => {
    expect(body).toContain('Nenhuma tarefa `G` pode sobreviver')
  })

  it('implementation fica vazio até a implementação existir', () => {
    expect(body).toContain('implementation` fica vazio')
  })
})

describe('manifestos', () => {
  it('TEST-PF-001 — plugin.json tem name e nenhum campo inventado', () => {
    const m = JSON.parse(read('plugins/sdd-kit/.claude-plugin/plugin.json'))
    expect(m['name']).toBe('sdd-kit')
    expect(m['license']).toBe('Apache-2.0')
    // Não declara componentes: os diretórios padrão são autodescobertos.
    expect(m).not.toHaveProperty('skills')
    expect(m).not.toHaveProperty('agents')
  })

  it('TEST-PF-002 — marketplace.json tem name, owner.name, plugins[] e source existente', () => {
    const m = JSON.parse(read('.claude-plugin/marketplace.json'))
    expect(typeof m['name']).toBe('string')
    expect(typeof m['owner']?.name).toBe('string')
    expect(Array.isArray(m['plugins'])).toBe(true)
    for (const p of m['plugins']) {
      expect(typeof p.name).toBe('string')
      expect(exists(String(p.source).replace(/^\.\//, ''))).toBe(true)
    }
  })

  it('marketplace não duplica version — plugin.json é a autoridade', () => {
    const m = JSON.parse(read('.claude-plugin/marketplace.json'))
    for (const p of m['plugins']) expect(p).not.toHaveProperty('version')
  })

  it('o nome do marketplace não colide com os reservados pela Anthropic', () => {
    const RESERVADOS = new Set(['claude-code-marketplace', 'claude-code-plugins',
      'claude-plugins-official', 'claude-plugins-community', 'claude-community',
      'anthropic-marketplace', 'anthropic-plugins', 'agent-skills',
      'anthropic-agent-skills', 'first-party-plugins', 'healthcare'])
    expect(RESERVADOS.has(JSON.parse(read('.claude-plugin/marketplace.json'))['name'])).toBe(false)
  })
})
