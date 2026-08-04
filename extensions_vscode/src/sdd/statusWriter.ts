// Escrita de status.yaml / index.yaml por manipulação de TEXTO — pura (feature
// 0026, ADR-025; endurecido no bug 0027). Round-trip por js-yaml perderia
// comentários e reformataria os block scalars dos `reason`; aqui a edição é
// cirúrgica e preserva o arquivo: troca só o VALOR de `status:` (mantendo um
// eventual comentário inline), preserva o fim de linha original (LF/CRLF), e
// acrescenta uma entrada ao fim de `history:` sem tocar no resto.

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

/** Fim de linha dominante do texto (preserva arquivos Windows). */
function lineEnding(text: string): string {
  return text.includes('\r\n') ? '\r\n' : '\n'
}

/** Troca só o valor de `status:` na linha, preservando indentação e comentário inline. */
function replaceStatusValue(line: string, status: string): string {
  return line.replace(/^(\s*status:\s*)\S+/, `$1${status}`)
}

/**
 * Acrescenta uma entrada ao fim da lista `history:` e ajusta a linha `status:` de
 * topo. Preserva comentários, comentário inline do status, fim de linha e demais
 * chaves. Só altera se AMBOS `status:` (topo) e `history:` existirem — do
 * contrário devolve o texto inalterado (all-or-nothing; evita transição parcial).
 */
export function appendHistoryAndSetStatus(yaml: string, entry: HistoryEntry): string {
  const nl = lineEnding(yaml)
  const lines = yaml.split(/\r?\n/)

  // status: de topo (coluna 0; não confundir com `  - status:` do history).
  const statusIdx = lines.findIndex((l) => /^status:\s*\S/.test(l))
  const histIdx = lines.findIndex((l) => /^history:\s*$/.test(l))
  if (statusIdx < 0 || histIdx < 0) {
    return yaml // faltando um campo obrigatório: não muda nada
  }

  // Fim do bloco history: primeira chave de coluna 0 (não-comentário) após ele.
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

  lines[statusIdx] = replaceStatusValue(lines[statusIdx], entry.status)
  const block = [
    `  - status: ${entry.status}`,
    `    date: "${entry.date}"`,
    `    reason: >-`,
    `      ${sanitizeReason(entry.reason)}`,
  ]
  lines.splice(lastContent + 1, 0, ...block)
  return lines.join(nl)
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Ajusta o `status:` da entrada `id` no index.yaml, sem tocar nas demais.
 * Preserva indentação, comentário inline e fim de linha. Devolve o texto
 * inalterado se a entrada não for encontrada.
 */
export function setIndexStatus(indexYaml: string, id: string, status: string): string {
  const nl = lineEnding(indexYaml)
  const lines = indexYaml.split(/\r?\n/)
  const idIdx = lines.findIndex((l) => new RegExp(`^\\s*-\\s*id:\\s*${escapeRegExp(id)}\\s*$`).test(l))
  if (idIdx < 0) {
    return indexYaml
  }
  for (let i = idIdx + 1; i < lines.length; i++) {
    if (/^\s*-\s*id:/.test(lines[i])) {
      break // próxima entrada; não achou status nesta
    }
    if (/^\s*status:\s*\S/.test(lines[i])) {
      lines[i] = replaceStatusValue(lines[i], status)
      break
    }
  }
  return lines.join(nl)
}
