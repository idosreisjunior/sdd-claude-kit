// Escrita de status.yaml / index.yaml por manipulação de TEXTO — pura (feature
// 0026, ADR-025). Round-trip por js-yaml perderia comentários e reformataria os
// block scalars dos `reason`; aqui a edição é cirúrgica e preserva o arquivo:
// troca a linha `status:` de topo e acrescenta uma entrada ao fim de `history:`,
// sem tocar no resto (comentários, resolved_questions, approval).

export interface HistoryEntry {
  status: string
  /** Formato "YYYY-MM-DD". */
  date: string
  /** Motivo em uma linha (novas linhas são achatadas). */
  reason: string
}

function sanitizeReason(reason: string): string {
  return reason.replace(/\s+/g, ' ').trim()
}

/**
 * Acrescenta uma entrada ao fim da lista `history:` e ajusta a linha `status:` de
 * topo. Preserva comentários e formatação. Se não houver `history:` ou `status:`,
 * devolve o texto inalterado (defensivo).
 */
export function appendHistoryAndSetStatus(yaml: string, entry: HistoryEntry): string {
  const lines = yaml.split(/\r?\n/)

  // 1) status: de topo (coluna 0; não confundir com `  - status:` do history).
  const statusIdx = lines.findIndex((l) => /^status:\s*\S/.test(l))
  if (statusIdx >= 0) {
    lines[statusIdx] = `status: ${entry.status}`
  }

  // 2) fim do bloco history: primeira chave de coluna 0 (não-comentário) após ele.
  const histIdx = lines.findIndex((l) => /^history:\s*$/.test(l))
  if (histIdx < 0) {
    return lines.join('\n')
  }
  let nextKey = lines.length
  for (let i = histIdx + 1; i < lines.length; i++) {
    if (/^[^\s#]/.test(lines[i])) {
      nextKey = i
      break
    }
  }
  // Última linha de conteúdo do bloco (não vazia, não comentário).
  let lastContent = histIdx
  for (let i = histIdx + 1; i < nextKey; i++) {
    const t = lines[i].trim()
    if (t !== '' && !t.startsWith('#')) {
      lastContent = i
    }
  }

  const block = [
    `  - status: ${entry.status}`,
    `    date: "${entry.date}"`,
    `    reason: >-`,
    `      ${sanitizeReason(entry.reason)}`,
  ]
  lines.splice(lastContent + 1, 0, ...block)
  return lines.join('\n')
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Ajusta o `status:` da entrada `id` no index.yaml, sem tocar nas demais.
 * Devolve o texto inalterado se a entrada não for encontrada.
 */
export function setIndexStatus(indexYaml: string, id: string, status: string): string {
  const lines = indexYaml.split(/\r?\n/)
  const idIdx = lines.findIndex((l) => new RegExp(`^\\s*-\\s*id:\\s*${escapeRegExp(id)}\\s*$`).test(l))
  if (idIdx < 0) {
    return lines.join('\n')
  }
  for (let i = idIdx + 1; i < lines.length; i++) {
    if (/^\s*-\s*id:/.test(lines[i])) {
      break // próxima entrada; não achou status nesta
    }
    const m = lines[i].match(/^(\s*)status:\s*\S+\s*$/)
    if (m) {
      lines[i] = `${m[1]}status: ${status}`
      break
    }
  }
  return lines.join('\n')
}
