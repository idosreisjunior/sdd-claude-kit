// Visualização consciente de SDD do Markdown de uma spec (RF-006, TASK-EDIT-002) —
// lógica pura, sem a API do VS Code. Produz o HTML do painel renderizado: cabeçalhos
// como estrutura e os identificadores do SDD destacados. Todo texto é escapado antes
// de qualquer marcação (NFR-EDIT-002), então destacar não reintroduz injeção.
import { esc } from './dashboardHtml'

// REQ-/NFR-/SCN-/TASK-/TEST-<ESCOPO>-NNN e ADR-/RF-/RNF-NNN (identificadores do kit).
const ID_RE = /\b((?:REQ|NFR|SCN|TASK|TEST)-[A-Z0-9]+-\d{3}|(?:ADR|RF|RNF)-\d{3})\b/g

/** Envolve os identificadores do SDD em `<span class="id">`. Opera sobre texto já escapado. */
export function highlightIds(escaped: string): string {
  return escaped.replace(ID_RE, '<span class="id">$1</span>')
}

/**
 * Renderiza o Markdown da spec para o HTML do painel de visualização. Cabeçalhos
 * viram `<h1..6>`; demais linhas viram parágrafos (linhas unidas por `<br>`).
 * Puro e robusto: nunca lança.
 */
export function renderSpecView(markdown: string): string {
  const lines = markdown.split('\n')
  const out: string[] = []
  let para: string[] = []

  const flush = (): void => {
    if (para.length > 0) {
      out.push(`<p>${para.join('<br>')}</p>`)
      para = []
    }
  }

  for (const line of lines) {
    const heading = line.match(/^(#{1,6})\s+(.*)$/)
    if (heading) {
      flush()
      const level = heading[1].length
      out.push(`<h${level}>${highlightIds(esc(heading[2]))}</h${level}>`)
    } else if (line.trim() === '') {
      flush()
    } else {
      para.push(highlightIds(esc(line)))
    }
  }
  flush()
  return out.join('\n')
}
