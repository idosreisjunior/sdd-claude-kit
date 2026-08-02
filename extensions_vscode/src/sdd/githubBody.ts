// Núcleo puro da descrição de issue/PR (feature 0021, RF-019, REQ-GH-001) — sem a
// API do VS Code nem I/O, testável fora do host (standards §6, NFR-GH-003).
// Compõe o corpo a partir de dados já reunidos pela borda: requisitos (spec),
// resumo da validação (0008) e evidências (evidence.md) — D-Q3. Robusto a
// artefatos parciais: marca o que falta, nunca lança.

export interface GithubBodyInput {
  changeId: string
  title: string
  type: string
  /** Requisitos da feature (spec/traceability). */
  requirements: { id: string; title?: string }[]
  /** Resumo da validação (0008): atendidos e pendentes. */
  validation?: { atendido: number; pendentes: number }
  /** Conteúdo (ou trecho) do evidence.md, se existir. */
  evidence?: string
}

/**
 * Monta o corpo em Markdown de uma issue/PR a partir da feature. Cada seção
 * ausente é marcada explicitamente, para o corpo ser honesto sem quebrar.
 */
export function buildGithubBody(input: GithubBodyInput): string {
  const lines: string[] = []

  lines.push(`## ${input.title}`)
  lines.push('')
  lines.push(`Mudança \`${input.changeId}\` (${input.type}).`)
  lines.push('')

  lines.push('### Requisitos')
  if (input.requirements.length > 0) {
    for (const req of input.requirements) {
      lines.push(`- \`${req.id}\`${req.title ? ` — ${req.title}` : ''}`)
    }
  } else {
    lines.push('_Nenhum requisito registrado na rastreabilidade._')
  }
  lines.push('')

  lines.push('### Validação')
  if (input.validation) {
    lines.push(
      `- ${input.validation.atendido} atendido(s), ${input.validation.pendentes} pendente(s).`,
    )
  } else {
    lines.push('_Validação não disponível (gere com "Validar mudança")._')
  }
  lines.push('')

  lines.push('### Evidências')
  const evidence = input.evidence?.trim()
  if (evidence && evidence.length > 0) {
    lines.push(evidence)
  } else {
    lines.push('_Sem `evidence.md` — gere com "Coletar evidências"._')
  }
  lines.push('')

  return `${lines.join('\n').trimEnd()}\n`
}
