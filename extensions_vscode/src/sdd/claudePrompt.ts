// Núcleo puro do Claude Code Adapter (feature 0004, RF-011) — sem dependência da
// API do VS Code, para ser testável fora do host (standards §6). A borda
// (clipboard, terminal, detecção) fica em extension.ts.
//
// Por ADR-007: o adapter é fire-and-forget + humano no controle — compõe e copia
// o prompt e abre a CLI; não envia a ação nem captura resultado (isso é 0008).

/** Ações do fluxo SDD que a extensão sabe compor como comando do plugin sdd-kit. */
export type SddAction =
  | 'research'
  | 'spec'
  | 'clarify'
  | 'design'
  | 'tasks'
  | 'implement'
  | 'verify'
  | 'mcp'

export interface ActionDef {
  id: SddAction
  /** Rótulo em pt-BR para o QuickPick. */
  label: string
  /** Objetivo em pt-BR (o "objetivo" do PRD §13.2). */
  objective: string
}

/**
 * Conjunto FECHADO de ações. O QuickPick lista exatamente estas; uma ação fora
 * daqui não é oferecida nem produz comando (SCN-CC-004).
 */
export const ACTIONS: readonly ActionDef[] = [
  {
    id: 'research',
    label: 'Research',
    objective: 'Reunir material sobre o projeto antes da spec (/sdd-kit:research).',
  },
  {
    id: 'spec',
    label: 'Detalhar a especificação',
    objective: 'Escrever ou refinar os requisitos da mudança (/sdd-kit:spec).',
  },
  {
    id: 'clarify',
    label: 'Clarificar',
    objective: 'Identificar e resolver ambiguidades da spec (/sdd-kit:clarify).',
  },
  {
    id: 'design',
    label: 'Gerar o design técnico',
    objective: 'Produzir o design técnico a partir da spec (/sdd-kit:design).',
  },
  {
    id: 'tasks',
    label: 'Planejar as tarefas',
    objective: 'Decompor a mudança em tarefas verificáveis (/sdd-kit:tasks).',
  },
  {
    id: 'implement',
    label: 'Implementar a próxima tarefa',
    objective: 'Implementar a próxima tarefa pendente aprovada (/sdd-kit:implement).',
  },
  {
    id: 'verify',
    label: 'Verificar',
    objective: 'Validar implementação e critérios de aceite (/sdd-kit:verify).',
  },
  {
    id: 'mcp',
    label: 'Criar MCP',
    objective: 'Definir um servidor MCP pelos nove aspectos do RF-025 (/sdd-kit:mcp).',
  },
]

/** Definição de uma ação, ou `undefined` para id desconhecido (SCN-CC-004). */
export function actionDef(id: string): ActionDef | undefined {
  return ACTIONS.find((a) => a.id === id)
}

/**
 * Compõe o prompt de uma ação SDD sobre uma mudança: o comando do plugin sdd-kit
 * aplicado ao identificador (ex.: `/sdd-kit:spec 0004-claude-code-adapter`).
 */
export function composePrompt(action: SddAction, changeId: string): string {
  return `/sdd-kit:${action} ${changeId}`
}

/**
 * Cita um caminho para uso no terminal: envolve em aspas duplas quando há espaço
 * ou aspa, escapando aspas embutidas. Caminho simples fica sem aspas. É a citação
 * do CAMINHO — não montamos outra sintaxe de shell (NFR-CC-002, constituição Art. 9).
 */
export function quoteCliPath(path: string): string {
  if (path === '' || !/[\s"]/.test(path)) {
    return path
  }
  return `"${path.replace(/"/g, '\\"')}"`
}

/** Comando para iniciar a CLI no terminal, com o caminho citado com segurança. */
export function buildLaunchCommand(cliPath: string): string {
  return quoteCliPath(cliPath)
}
