// Núcleo puro da coleta de evidências (feature 0008, RF-016, REQ-EVID-002) — sem a API
// do VS Code (standards §6, NFR-EVID-001). Organiza as evidências JÁ DISPONÍVEIS (validação,
// git, commits, status) num markdown de evidence.md. NÃO executa comandos (D-Q4): o resultado
// de lint/test/build entra apenas como seção a completar. Puro e determinístico (a data é
// injetada pela borda, não obtida aqui).
import { VERDICTS, verdictLabel, type Verdict } from './validationReport'

export interface EvidenceInput {
  changeId: string
  title: string
  type: string
  status: string
  date: string
  tasks?: { total: number; done: number }
  /** Resumo do relatório de validação (RF-017), por veredito. */
  validation?: Record<Verdict, number>
  git?: {
    branch?: string
    changedCount: number
    totalAdded: number
    totalRemoved: number
  }
  /** Commits que mencionam a mudança (mais recentes primeiro). */
  commits: Array<{ hash: string; subject: string }>
}

/** Monta o markdown do evidence.md a partir das evidências disponíveis. Puro. */
export function buildEvidenceMarkdown(input: EvidenceInput): string {
  const lines: string[] = []
  lines.push(`# Evidências — ${input.changeId}`)
  lines.push('')
  lines.push(`- **Gerado em:** ${input.date} (coleta automática — revise e complete)`)
  lines.push(`- **Mudança:** ${input.title} (${input.type}, ${input.status})`)
  if (input.tasks) {
    lines.push(`- **Tarefas:** ${input.tasks.done}/${input.tasks.total} concluídas`)
  }
  lines.push('')

  lines.push('## Validação (RF-017)')
  if (input.validation) {
    for (const v of VERDICTS) {
      lines.push(`- ${verdictLabel(v)}: ${input.validation[v]}`)
    }
  } else {
    lines.push('- _Sem relatório de validação disponível._')
  }
  lines.push('')

  lines.push('## Git (RF-018)')
  if (input.git) {
    lines.push(`- Branch: ${input.git.branch ?? '(destacado)'}`)
    lines.push(
      `- Arquivos alterados: ${input.git.changedCount} (+${input.git.totalAdded} / -${input.git.totalRemoved} linhas)`,
    )
  } else {
    lines.push('- _Sem repositório Git ou estado indisponível._')
  }
  lines.push('')

  lines.push('## Commits')
  if (input.commits.length > 0) {
    for (const c of input.commits) {
      lines.push(`- \`${c.hash}\` ${c.subject}`)
    }
  } else {
    lines.push('- _Nenhum commit relacionado encontrado._')
  }
  lines.push('')

  // D-Q4: a extensão não executa os comandos; ficam como checklist a completar.
  lines.push('## A completar (não coletado automaticamente)')
  lines.push('- [ ] Testes automatizados (resultado da suíte)')
  lines.push('- [ ] Lint')
  lines.push('- [ ] Build')
  lines.push('- [ ] Cobertura')
  lines.push('- [ ] Capturas de tela / logs / resposta de API / SQL')
  lines.push('- [ ] Validação manual')
  lines.push('')

  return lines.join('\n')
}
