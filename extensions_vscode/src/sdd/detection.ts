// Lógica pura do diagnóstico do workspace — sem dependência da API do VS Code,
// para ser testável fora do host do editor (standards §6, TASK-FOUND-007).

/** Marcadores que caracterizam o projeto. Relativos à raiz do workspace. */
export const SPECS_MARKER = '.specs/config.yaml'
export const GIT_MARKER = '.git'

export interface ProjectDetection {
  /** Há uma pasta aberta no workspace. */
  hasWorkspace: boolean
  /** O workspace já tem .specs/config.yaml (projeto inicializado). */
  hasSpecs: boolean
  /** O workspace tem um repositório Git. */
  hasGit: boolean
}

/** Probe somente-leitura: um caminho relativo existe na raiz? */
export type ExistsProbe = (relPath: string) => Promise<boolean>

/**
 * Decide o diagnóstico a partir de um probe injetável. Sem workspace aberto,
 * nada é sondado e tudo é falso (SCN-FOUND-003, caminho sem pasta).
 */
export async function detectFrom(
  hasWorkspace: boolean,
  exists: ExistsProbe,
): Promise<ProjectDetection> {
  if (!hasWorkspace) {
    return { hasWorkspace: false, hasSpecs: false, hasGit: false }
  }
  const [hasSpecs, hasGit] = await Promise.all([exists(SPECS_MARKER), exists(GIT_MARKER)])
  return { hasWorkspace: true, hasSpecs, hasGit }
}
