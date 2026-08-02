// Núcleo puro do research (feature 0017, RF-007) — sem a API do VS Code, testável
// fora do host (standards §6, NFR-RES-003). Sem I/O: nem de rede (NFR-RES-001) nem
// de disco; a borda (ler o template, escrever o arquivo, confirmar sobrescrita)
// fica em extension.ts.
//
// Por ADR-017 (modelo híbrido, como o ADR-014/015): esta camada monta o
// research.md-ESQUELETO a partir do template `feature/research.md`, com as oito
// frentes do RF-007 como seções (D-Q6). A análise por IA é o reuso da nova ação
// `research` do adapter 0004 (composePrompt), não desta camada.

/**
 * As oito frentes de research do RF-007. É o CONTRATO do template
 * `feature/research.md`: o teste garante que o template não derive desta lista.
 */
export const RESEARCH_TOPICS = [
  'Estrutura do projeto',
  'Arquivos relacionados',
  'Dependências',
  'Padrões existentes',
  'Documentação local',
  'Riscos',
  'Soluções já implementadas',
  'APIs e integrações relevantes',
] as const

/** Marcador de lacuna: uma seção sem informação carrega exatamente isto (D-Q6). */
export const LACUNA_MARK = '> _A preencher no research._'

/** Dados da mudança para resolver o template. */
export interface ResearchChange {
  id: string
  title: string
  scope: string
  date: string
}

/** Remove os blocos de orientação `{{guia: …}}` do template. */
function stripGuides(text: string): string {
  return text.replace(/\{\{guia:[\s\S]*?\}\}\n?/g, '')
}

/**
 * Monta o `research.md`-esqueleto resolvendo o template: substitui os marcadores
 * conhecidos, remove as orientações e preserva as oito frentes do RF-007 com as
 * lacunas marcadas. Não inventa conteúdo. Estrutura vem do template (ADR-017).
 */
export function buildResearchSkeleton(template: string, change: ResearchChange): string {
  const filled = template
    .replaceAll('{{CHANGE_TITLE}}', change.title)
    .replaceAll('{{CHANGE_ID}}', change.id)
    .replaceAll('{{ID_SCOPE}}', change.scope)
    .replaceAll('{{DATE}}', change.date)
  const body = stripGuides(filled)
    .replace(/\n{3,}/g, '\n\n')
    .trimStart()
  return body.endsWith('\n') ? body : `${body}\n`
}
