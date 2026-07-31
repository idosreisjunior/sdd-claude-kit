// Lógica pura da inicialização — sem dependência da API do VS Code, para ser
// testável fora do host do editor (standards §6). O initializer usa estas
// funções e cuida do IO com workspace.fs.

export const PROJECT_DOCS = [
  'vision.md',
  'constitution.md',
  'context.md',
  'architecture.md',
  'glossary.md',
  'standards.md',
] as const

export type FileOrigin = 'gerado' | 'template'

export interface PlannedFile {
  /** Caminho relativo à raiz do workspace, com '/'. */
  relPath: string
  origin: FileOrigin
}

export interface Vars {
  PROJECT_NAME: string
  DATE: string
}

/** Lista, em ordem de criação, os arquivos que a inicialização produz. */
export function planFiles(): PlannedFile[] {
  return [
    { relPath: '.specs/config.yaml', origin: 'gerado' },
    { relPath: '.specs/index.yaml', origin: 'gerado' },
    ...PROJECT_DOCS.map((doc): PlannedFile => ({
      relPath: `.specs/project/${doc}`,
      origin: 'template',
    })),
  ]
}

/** Substitui os marcadores que a inicialização conhece com certeza. */
export function substitute(content: string, vars: Vars): string {
  return content
    .replaceAll('{{PROJECT_NAME}}', vars.PROJECT_NAME)
    .replaceAll('{{DATE}}', vars.DATE)
}

/** Gera o conteúdo de um arquivo de máquina (`config.yaml`/`index.yaml`). */
export function generate(relPath: string, vars: Vars, language: string): string {
  if (relPath.endsWith('config.yaml')) return generateConfigYaml(vars.PROJECT_NAME, language)
  if (relPath.endsWith('index.yaml')) return generateIndexYaml()
  throw new Error(`sem gerador para ${relPath}`)
}

export function generateConfigYaml(projectName: string, language: string): string {
  return `# Configuração do SDD Claude Kit.
# Documentação dos campos: plugins/sdd-kit/schemas/config.schema.json
version: 1

project:
  name: ${JSON.stringify(projectName)}
  language: ${language}

workflow:
  # advisory = recomenda | guided = orienta e pede aprovação | strict = bloqueia
  mode: guided
  require_approval: true
  require_tests: true
  require_traceability: true
  allow_parallel_tasks: false

paths:
  # Preencha após revisar o projeto (a inicialização não faz descoberta).
  source: []
  tests: []
  ignored:
    - node_modules
    - dist
    - build
    - coverage
    - .git

validation:
  # null significa NÃO DETECTADO. A verificação reporta "não executado",
  # jamais "aprovado".
  commands:
    lint: null
    test: null
    build: null

specification:
  scenarios: gherkin
  architecture_decisions: adr
  task_size: small

security:
  hooks_enabled: false
  allow_shell_commands: prompt
`
}

export function generateIndexYaml(): string {
  return `# Índice de todas as mudanças especificadas neste projeto.
version: 1

# Próximo identificador a ser alocado. Nunca reutilizado nem renumerado.
next_id: 1

changes: []

archive: []
`
}

/** '.specs/project/vision.md' -> 'project/vision.md' (sob o template do idioma). */
export function templatePathFor(specRelPath: string): string {
  return specRelPath.replace(/^\.specs\//, '')
}
