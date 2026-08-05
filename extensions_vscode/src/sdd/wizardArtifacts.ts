// Montagem do retrato de artefatos de uma mudança (feature 0035, TASK-WIZ-006) — lógica
// pura, sem a API do VS Code. A borda (wizardPanel) lê os arquivos do disco de forma
// robusta e passa os textos/flags; aqui extraímos os campos do ChangeArtifacts que o
// wizardModel consome. Tolerante: texto ausente/ilegível vira 0/false, nunca exceção.
import { parseYaml, get, isRecord, str } from './yamlUtils'
import { parseStatusField, parseTaskProgress } from './specsIndex'
import type { ChangeArtifacts } from './wizardModel'

/** Textos e sinais lidos do disco para uma mudança. */
export interface ArtifactInputs {
  statusYaml?: string
  specMd?: string
  hasRequest: boolean
  hasDesign: boolean
  adrCount: number
}

/** Conta os requisitos funcionais (cabeçalhos `### REQ-<ESCOPO>-NNN`) na spec. */
export function countRequirements(specMd: string): number {
  const matches = specMd.match(/^###\s+REQ-[A-Z]+-\d+/gm)
  return matches ? matches.length : 0
}

/** Há alguma dúvida de severidade crítica em aberto? Lê `blocked_by` do status.yaml. */
export function hasCriticalOpenQuestions(statusYaml: string): boolean {
  const blocked = get(parseYaml(statusYaml), 'blocked_by')
  if (!Array.isArray(blocked)) {
    return false
  }
  return blocked.some((item) => str(get(item, 'severity')) === 'critical')
}

/** Monta o ChangeArtifacts a partir dos textos lidos do disco. Puro e total. */
export function buildChangeArtifacts(inputs: ArtifactInputs): ChangeArtifacts {
  const statusYaml = inputs.statusYaml ?? ''
  const doc = parseYaml(statusYaml)
  const progress = parseTaskProgress(statusYaml)
  return {
    sddStatus: parseStatusField(statusYaml) ?? 'DRAFT',
    hasRequest: inputs.hasRequest,
    requirementCount: countRequirements(inputs.specMd ?? ''),
    hasCriticalOpenQuestions: hasCriticalOpenQuestions(statusYaml),
    hasDesign: inputs.hasDesign,
    adrCount: inputs.adrCount,
    taskTotal: progress?.total ?? 0,
    taskDone: progress?.done ?? 0,
    // approval preenchido (objeto {date,by,revision}) = aprovado; null/ausente = não.
    approved: isRecord(get(doc, 'approval')),
  }
}
