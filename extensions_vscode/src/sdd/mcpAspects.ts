// Núcleo puro do assistente de criação de MCPs (feature 0022, RF-025, REQ-MCP-001) —
// sem a API do VS Code nem I/O, testável fora do host (standards §6, NFR-MCP-001).
// É a FONTE ÚNICA dos nove aspectos do RF-025 (na ordem do texto) e o relato de
// pendências: quais aspectos do `mcp.md` ainda estão sem decisão. A redação das
// seções vive no template sincronizado `feature/mcp.md` (ADR-021) — aqui fica só a
// lista dos aspectos e a lógica de completude. Robusto: nunca lança.

export interface McpAspect {
  /** Chave estável, sem acento — para rastreio. */
  key: string
  /** Título exibido no `mcp.md`; espelha os cabeçalhos do template. */
  title: string
}

/** Os nove aspectos do RF-025, na ordem do texto. Fonte única da verdade. */
export const MCP_ASPECTS: readonly McpAspect[] = [
  { key: 'objetivo', title: 'Objetivo' },
  { key: 'ferramentas', title: 'Ferramentas' },
  { key: 'recursos', title: 'Recursos' },
  { key: 'schemas', title: 'Schemas' },
  { key: 'autenticacao', title: 'Autenticação' },
  { key: 'permissoes', title: 'Permissões' },
  { key: 'testes', title: 'Testes' },
  { key: 'documentacao', title: 'Documentação' },
  { key: 'publicacao', title: 'Publicação' },
]

/** Marcador de um aspecto ainda sem decisão (espelha o template `feature/mcp.md`). */
export const MCP_PENDING_MARKER = '_A definir._'

/**
 * Dado o conteúdo de um `mcp.md`, devolve os títulos dos aspectos ainda PENDENTES —
 * seção ausente, ou presente mas com o corpo ainda no marcador — na ordem do RF-025.
 * Puro e robusto: entrada vazia ou sem seções → todos os nove como pendentes, sem lançar.
 */
export function pendingAspects(md: string | undefined): string[] {
  const text = md ?? ''
  return MCP_ASPECTS.filter((aspect) => isPending(text, aspect)).map((a) => a.title)
}

/** Um aspecto está pendente quando sua seção falta ou seu corpo não tem decisão real. */
function isPending(md: string, aspect: McpAspect): boolean {
  // Cabeçalho "## N. Título" (o número varia; casamos pelo título).
  const heading = new RegExp(`^##\\s+\\d+\\.\\s+${escapeRegExp(aspect.title)}\\s*$`, 'm')
  const match = heading.exec(md)
  if (match === null) {
    return true // seção ausente = pendente
  }
  // Corpo: do fim do cabeçalho até a próxima seção de nível 2 (ou o fim).
  const afterHeading = md.slice(match.index + match[0].length)
  const next = /^##\s+/m.exec(afterHeading)
  const body = next === null ? afterHeading : afterHeading.slice(0, next.index)
  // Sobra alguma linha de conteúdo, fora o marcador e as linhas de guia?
  const meaningful = body
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .filter((line) => line !== MCP_PENDING_MARKER && line !== `> ${MCP_PENDING_MARKER}`)
    .filter((line) => !line.startsWith('_Guia:'))
  return meaningful.length === 0
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
