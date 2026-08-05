// Conteúdo das views de etapa do wizard (feature 0035, TASK-WIZ-011, REQ-WIZ-001) —
// lógica pura, sem a API do VS Code.
//
// O `wizardModel` responde "em que etapa estou"; este módulo responde "o que essa etapa
// tem para mostrar": os requisitos escritos, as dúvidas em aberto, os ADRs registrados e
// as tarefas planejadas. A borda lê os arquivos e passa os textos; aqui só se extrai.
//
// Mesmo contrato de robustez do resto da feature (SCN-WIZ-007): artefato ausente ou
// ilegível vira lista vazia, nunca exceção — a view mostra o vazio, o wizard não quebra.
import { parseYaml, get, str } from './yamlUtils'
import { parseTasksPlan } from './tasksPlan'
import { analyzeTasks } from './taskAnalysis'

export interface RequirementRef {
  id: string
  title: string
}

export interface OpenQuestion {
  question: string
  description: string
  severity: string
}

export interface AdrRef {
  /** Número com o zero à esquerda, como no nome do arquivo (ex.: `033`). */
  number: string
  title: string
}

export interface TaskRef {
  id: string
  status: string
}

/** Retrato do CONTEÚDO dos artefatos, para as views das etapas 2–5. */
export interface WizardDetails {
  requirements: RequirementRef[]
  /** Cenários de aceite (`#### SCN-*`) escritos na spec. */
  scenarioCount: number
  openQuestions: OpenQuestion[]
  resolvedQuestionCount: number
  adrs: AdrRef[]
  tasks: TaskRef[]
  /** Quantas tarefas por status — derivado aqui, não no cliente (ver nota abaixo). */
  taskCountsByStatus: Record<string, number>
  /** Achados do `analyzeTasks` (tarefa grande, campo obrigatório ausente). */
  taskFindings: { taskId: string; message: string }[]
}

/** Textos lidos do disco pela borda. Todos opcionais: ausente = vazio. */
export interface DetailInputs {
  specMd?: string
  statusYaml?: string
  tasksMd?: string
  /** Nomes dos arquivos em `decisions/` (ex.: `ADR-033-webview-interativo.md`). */
  adrFiles?: string[]
}

const REQ_HEADING = /^###\s+(REQ-[A-Z0-9]+-\d+)\s*(?:—|-|–)?\s*(.*)$/gm
const SCN_HEADING = /^####\s+SCN-[A-Z0-9]+-\d+/gm
const ADR_FILE = /^ADR-(\d+)-(.+)\.md$/i

/** Requisitos funcionais da spec, na ordem em que aparecem. */
export function parseRequirements(specMd: string): RequirementRef[] {
  const out: RequirementRef[] = []
  for (const match of specMd.matchAll(REQ_HEADING)) {
    out.push({ id: match[1], title: match[2].trim() })
  }
  return out
}

/** Quantidade de cenários de aceite escritos na spec. */
export function countScenarios(specMd: string): number {
  const matches = specMd.match(SCN_HEADING)
  return matches ? matches.length : 0
}

/**
 * Dúvidas em aberto (`blocked_by` do status.yaml). Um item sem `question` legível é
 * descartado: melhor omitir do que exibir uma linha vazia como se fosse um bloqueio.
 */
export function parseOpenQuestions(statusYaml: string): OpenQuestion[] {
  const blocked = get(parseYaml(statusYaml), 'blocked_by')
  if (!Array.isArray(blocked)) {
    return []
  }
  const out: OpenQuestion[] = []
  for (const item of blocked) {
    const question = str(get(item, 'question'))
    if (!question) {
      continue
    }
    out.push({
      question,
      description: str(get(item, 'description')) ?? '',
      severity: str(get(item, 'severity')) ?? 'medium',
    })
  }
  return out
}

/** Quantas questões já foram resolvidas (`resolved_questions`). */
export function countResolvedQuestions(statusYaml: string): number {
  const resolved = get(parseYaml(statusYaml), 'resolved_questions')
  return Array.isArray(resolved) ? resolved.length : 0
}

/**
 * ADRs a partir dos NOMES dos arquivos de `decisions/` — sem abrir cada um: o nome já
 * carrega número e slug, e a view só precisa listar. Arquivo fora do padrão é ignorado.
 */
export function parseAdrs(files: readonly string[]): AdrRef[] {
  const out: AdrRef[] = []
  for (const file of files) {
    const match = ADR_FILE.exec(file)
    if (match) {
      out.push({ number: match[1], title: match[2].replace(/-/g, ' ') })
    }
  }
  return out.sort((a, b) => a.number.localeCompare(b.number))
}

/**
 * Monta o retrato de conteúdo das etapas 2–5. Puro e total.
 *
 * Tudo o que a view precisa é derivado AQUI, no host, e viaja pronto no payload. O
 * cliente Preact importa deste módulo apenas TIPOS (apagados na compilação): um import
 * de valor arrastaria `js-yaml`, via yamlUtils, para dentro do bundle do webview — o que
 * o inflou de 21 kB para 136 kB antes desta separação, contrariando o "bundle leve" do
 * ADR-034. Derivação nova para uma view: acrescente um campo aqui, não um import lá.
 */
export function buildWizardDetails(inputs: DetailInputs): WizardDetails {
  const specMd = inputs.specMd ?? ''
  const statusYaml = inputs.statusYaml ?? ''
  const tasksMd = inputs.tasksMd ?? ''
  const tasks = parseTasksPlan(tasksMd).map((t) => ({ id: t.id, status: t.status }))
  return {
    requirements: parseRequirements(specMd),
    scenarioCount: countScenarios(specMd),
    openQuestions: parseOpenQuestions(statusYaml),
    resolvedQuestionCount: countResolvedQuestions(statusYaml),
    adrs: parseAdrs(inputs.adrFiles ?? []),
    tasks,
    taskCountsByStatus: taskCounts(tasks),
    taskFindings: analyzeTasks(tasksMd).map((f) => ({ taskId: f.taskId, message: f.message })),
  }
}

/** Contagem por status das tarefas, para o resumo da etapa Tarefas. */
export function taskCounts(tasks: readonly TaskRef[]): Record<string, number> {
  const counts: Record<string, number> = {}
  for (const task of tasks) {
    const key = task.status || 'sem status'
    counts[key] = (counts[key] ?? 0) + 1
  }
  return counts
}
