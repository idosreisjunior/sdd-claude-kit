// Núcleo puro do SQL Guard (feature 0020, RF-024) — sem a API do VS Code e SEM
// dependência de parser (D-Q5), testável fora do host (standards §6, NFR-SQL-003).
// Somente análise (NFR-SQL-001): recebe o texto do SQL e devolve os achados com
// posição; a borda os publica como diagnósticos (ADR-019).
//
// Heurística dialeto-agnóstica (D-Q6). Cobre as quatro verificações do incremento
// (D-Q1): alteração/exclusão sem WHERE, ausência de filtro / full scan, divisão
// por zero literal, e transação sem ROLLBACK. As categorias semânticas (joins,
// casts, nulos, funções, custo) exigem parser + esquema e ficam para depois.

export type SqlFindingKind =
  | 'data-change-no-where'
  | 'full-scan'
  | 'division-by-zero'
  | 'no-rollback'

export interface SqlFinding {
  kind: SqlFindingKind
  message: string
  /** Linha (base 0) do trecho — âncora do diagnóstico. */
  line: number
}

/**
 * Analisa um trecho de SQL e devolve os riscos das quatro verificações (D-Q1),
 * ordenados por linha. Ignora comentários. Nunca lança.
 */
export function analyzeSql(sql: string): SqlFinding[] {
  const clean = stripComments(sql)
  const findings: SqlFinding[] = []

  // (c) Divisão por zero literal: `/ 0` não seguido de dígito/ponto.
  for (const m of clean.matchAll(/\/\s*0(?![\d.])/g)) {
    findings.push({
      kind: 'division-by-zero',
      message: 'Divisão por zero literal (`/ 0`) — resultado indefinido/erro.',
      line: lineOf(clean, m.index ?? 0),
    })
  }

  // (a) alteração/exclusão sem WHERE e (b) ausência de filtro / full scan.
  for (const stmt of statements(clean)) {
    const head = firstKeyword(stmt.text)
    const hasWhere = /\bWHERE\b/i.test(stmt.text)
    if (head === 'DELETE' && !hasWhere) {
      findings.push(dataChange('DELETE', stmt.line))
    } else if (head === 'UPDATE' && !hasWhere) {
      findings.push(dataChange('UPDATE', stmt.line))
    } else if (head === 'TRUNCATE') {
      findings.push({
        kind: 'data-change-no-where',
        message: 'TRUNCATE remove todas as linhas da tabela (sem filtro).',
        line: stmt.line,
      })
    } else if (head === 'SELECT') {
      if (/\bSELECT\s+\*/i.test(stmt.text)) {
        findings.push({
          kind: 'full-scan',
          message: 'SELECT * — lê todas as colunas; risco de custo/full scan.',
          line: stmt.line,
        })
      } else if (!hasWhere) {
        findings.push({
          kind: 'full-scan',
          message: 'SELECT sem WHERE — risco de full scan.',
          line: stmt.line,
        })
      }
    }
  }

  // (d) Transação sem ROLLBACK: abre transação mas não há ROLLBACK em lugar nenhum.
  const txn = /\bBEGIN\b|\bSTART\s+TRANSACTION\b/i.exec(clean)
  if (txn && !/\bROLLBACK\b/i.test(clean)) {
    findings.push({
      kind: 'no-rollback',
      message: 'Transação sem ROLLBACK — sem caminho de desfazer em caso de erro.',
      line: lineOf(clean, txn.index),
    })
  }

  findings.sort((a, b) => a.line - b.line)
  return findings
}

function dataChange(verb: string, line: number): SqlFinding {
  return {
    kind: 'data-change-no-where',
    message: `${verb} sem WHERE — altera/exclui todas as linhas (sem filtro).`,
    line,
  }
}

/** Remove comentários `-- …` e `/* … *​/`, preservando as quebras de linha (e a posição). */
function stripComments(sql: string): string {
  return sql
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
    .replace(/--[^\n]*/g, (m) => ' '.repeat(m.length))
}

/** Divide o SQL em comandos por `;`, cada um com a linha do primeiro caractere não vazio. */
function statements(sql: string): { text: string; line: number }[] {
  const out: { text: string; line: number }[] = []
  let start = 0
  for (let i = 0; i <= sql.length; i++) {
    if (i === sql.length || sql[i] === ';') {
      const raw = sql.slice(start, i)
      if (raw.trim().length > 0) {
        const lead = raw.length - raw.trimStart().length
        out.push({ text: raw, line: lineOf(sql, start + lead) })
      }
      start = i + 1
    }
  }
  return out
}

/** Primeira palavra-chave do comando, em maiúsculas (ex.: `DELETE`). */
function firstKeyword(text: string): string {
  const m = /^\s*([A-Za-z]+)/.exec(text)
  return m ? m[1].toUpperCase() : ''
}

/** Linha (base 0) de um deslocamento no texto. */
function lineOf(text: string, index: number): number {
  let line = 0
  for (let i = 0; i < index && i < text.length; i++) {
    if (text[i] === '\n') {
      line++
    }
  }
  return line
}
