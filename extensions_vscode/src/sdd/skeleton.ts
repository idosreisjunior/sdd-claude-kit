// Núcleo compartilhado dos "passos híbridos" do fluxo SDD (design 0014, clarify
// 0015, research 0017): montar um arquivo-ESQUELETO a partir de um template
// sincronizado, com as seções da etapa e as lacunas marcadas. Puro, sem a API do
// VS Code (standards §6). Antes triplicado em design/clarify/researchGenerator.
// Ver ADR-014/015/017.

/** Dados da mudança para resolver um template de esqueleto. */
export interface SkeletonVars {
  id: string
  title: string
  scope: string
  date: string
}

/** Remove os blocos de orientação `{{guia: …}}` do template. */
export function stripGuides(text: string): string {
  return text.replace(/\{\{guia:[\s\S]*?\}\}\n?/g, '')
}

/**
 * Resolve um template de esqueleto: substitui os marcadores conhecidos, remove as
 * orientações e normaliza os espaços em branco, preservando as seções com as suas
 * lacunas. Não inventa conteúdo — a estrutura vem do template.
 */
export function buildSkeleton(template: string, vars: SkeletonVars): string {
  const filled = template
    .replaceAll('{{CHANGE_TITLE}}', vars.title)
    .replaceAll('{{CHANGE_ID}}', vars.id)
    .replaceAll('{{ID_SCOPE}}', vars.scope)
    .replaceAll('{{DATE}}', vars.date)
  const body = stripGuides(filled)
    .replace(/\n{3,}/g, '\n\n')
    .trimStart()
  return body.endsWith('\n') ? body : `${body}\n`
}
