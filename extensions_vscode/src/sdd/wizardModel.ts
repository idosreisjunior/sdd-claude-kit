// Modelo do wizard SDD (feature 0035, REQ-WIZ-001) — lógica pura, sem a API do VS Code.
//
// Projeta o estado das 8 etapas do ciclo a partir do status da mudança (fonte da verdade,
// status.yaml) e de um retrato dos artefatos em disco. A borda (wizardPanel) lê o disco de
// forma robusta e passa o retrato já montado; aqui NÃO se lança exceção por artefato ausente
// (SCN-WIZ-007): a etapa correspondente apenas aparece como pendente.
//
// A ordem das etapas espelha o fluxo do CLAUDE.md e do stateMachine.ts:
//   Solicitar → Especificar → Clarificar → Desenhar → Tarefas → Aprovar → Implementar → Verificar

/** As 8 etapas do wizard, na ordem do fluxo. */
export type WizardStage =
  | 'request'
  | 'spec'
  | 'clarify'
  | 'design'
  | 'tasks'
  | 'approve'
  | 'implement'
  | 'verify'

export const WIZARD_STAGES: readonly WizardStage[] = [
  'request',
  'spec',
  'clarify',
  'design',
  'tasks',
  'approve',
  'implement',
  'verify',
]

/** Rótulo pt-BR de cada etapa (espelha os mockups em docs/ui-redesign/). */
export const STAGE_LABELS: Readonly<Record<WizardStage, string>> = {
  request: 'Solicitar',
  spec: 'Especificar',
  clarify: 'Clarificar',
  design: 'Desenhar',
  tasks: 'Tarefas',
  approve: 'Aprovar',
  implement: 'Implementar',
  verify: 'Verificar',
}

/** `done` concluída · `current` a etapa em foco · `locked` ainda bloqueada. */
export type StageStatus = 'done' | 'current' | 'locked'

export interface StageState {
  stage: WizardStage
  label: string
  status: StageStatus
  summary: string
}

export interface WizardState {
  id: string
  title: string
  type: string
  currentStage: WizardStage
  stages: StageState[]
  /** Fração concluída (0–100), pelas etapas já concluídas antes da atual. */
  progressPct: number
}

/**
 * Retrato dos artefatos da mudança, montado pela borda a partir do disco. Campos
 * ausentes/ilegíveis viram 0/false — nunca exceção (SCN-WIZ-007).
 */
export interface ChangeArtifacts {
  /** Status SDD atual (status.yaml). Valor desconhecido é tratado como DRAFT. */
  sddStatus: string
  hasRequest: boolean
  requirementCount: number
  hasCriticalOpenQuestions: boolean
  hasDesign: boolean
  adrCount: number
  taskTotal: number
  taskDone: number
  /** approval != null em status.yaml. */
  approved: boolean
}

/** Identificação mínima da mudança para o cabeçalho do wizard. */
export interface ChangeRef {
  id: string
  title: string
  type: string
}

/** Ordena os estados do ciclo de vida; CANCELLED e desconhecidos ficam em -1/0. */
const STATE_RANK: Readonly<Record<string, number>> = {
  DRAFT: 0,
  CLARIFIED: 1,
  DESIGNED: 2,
  PLANNED: 3,
  APPROVED: 4,
  IN_PROGRESS: 5,
  BLOCKED: 5,
  VERIFIED: 6,
  ARCHIVED: 7,
  CANCELLED: -1,
}

function rankOf(status: string): number {
  return Object.prototype.hasOwnProperty.call(STATE_RANK, status) ? STATE_RANK[status] : 0
}

/** Uma etapa está concluída quando o status alcançou seu marco E o artefato existe. */
function isStageDone(stage: WizardStage, a: ChangeArtifacts): boolean {
  const rank = rankOf(a.sddStatus)
  switch (stage) {
    case 'request':
      return a.hasRequest
    case 'spec':
      return a.requirementCount > 0
    case 'clarify':
      return rank >= 1 && !a.hasCriticalOpenQuestions
    case 'design':
      return rank >= 2 && a.hasDesign
    case 'tasks':
      return rank >= 3 && a.taskTotal > 0
    case 'approve':
      return a.approved || rank >= 4
    case 'implement':
      return rank >= 6 || (a.taskTotal > 0 && a.taskDone === a.taskTotal)
    case 'verify':
      return rank >= 6
  }
}

function summaryFor(stage: WizardStage, a: ChangeArtifacts): string {
  const rank = rankOf(a.sddStatus)
  switch (stage) {
    case 'request':
      return a.hasRequest ? 'solicitação registrada' : 'crie a solicitação'
    case 'spec':
      return a.requirementCount > 0 ? `${a.requirementCount} requisitos` : 'sem requisitos ainda'
    case 'clarify':
      return a.hasCriticalOpenQuestions ? 'dúvidas críticas em aberto' : 'sem dúvidas críticas'
    case 'design':
      return a.hasDesign ? `${a.adrCount} ADRs` : 'sem design ainda'
    case 'tasks':
      return a.taskTotal > 0 ? `${a.taskDone}/${a.taskTotal} tarefas` : 'sem tarefas ainda'
    case 'approve':
      return a.approved || rank >= 4 ? 'aprovado' : 'aguarda aprovação'
    case 'implement':
      return a.taskTotal > 0 ? `${a.taskDone}/${a.taskTotal} tarefas` : 'sem tarefas ainda'
    case 'verify':
      return rank >= 6 ? 'verificado' : 'aguarda verificação'
  }
}

/**
 * Deriva o estado do wizard: classifica cada etapa e aponta a atual. Monotônico — a etapa
 * atual é a PRIMEIRA não concluída; tudo depois dela fica `locked`, tudo antes fica `done`.
 * Puro e total: nunca lança, mesmo com artefatos ausentes (SCN-WIZ-007).
 */
export function deriveWizardState(change: ChangeRef, a: ChangeArtifacts): WizardState {
  const done = WIZARD_STAGES.map((stage) => isStageDone(stage, a))
  let firstNotDone = done.findIndex((d) => !d)
  const allDone = firstNotDone === -1
  if (allDone) {
    firstNotDone = WIZARD_STAGES.length // nada fica `current`; todas `done`
  }

  const stages: StageState[] = WIZARD_STAGES.map((stage, i) => {
    let status: StageStatus
    if (i < firstNotDone) {
      status = 'done'
    } else if (i === firstNotDone) {
      status = 'current'
    } else {
      status = 'locked'
    }
    return { stage, label: STAGE_LABELS[stage], status, summary: summaryFor(stage, a) }
  })

  const currentStage = allDone ? 'verify' : WIZARD_STAGES[firstNotDone]
  const progressPct = Math.round((firstNotDone / WIZARD_STAGES.length) * 100)

  return { id: change.id, title: change.title, type: change.type, currentStage, stages, progressPct }
}
