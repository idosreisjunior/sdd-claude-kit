/**
 * TEST-PF-022 — nenhum componente do plugin faz I/O de rede.
 *
 * ADR-005 e constituição Art. 9: o framework não envia dados para lugar nenhum.
 * Esta é a verificação executável dessa promessa.
 */
import { describe, it, expect } from 'vitest'
import { walk, read } from './helpers.js'

/** Padrões que indicam I/O de rede em JavaScript. */
const PADROES: { nome: string; re: RegExp }[] = [
  { nome: 'fetch', re: /\bfetch\s*\(/ },
  { nome: 'XMLHttpRequest', re: /\bXMLHttpRequest\b/ },
  { nome: 'import node:http', re: /from\s+['"]node:https?['"]|require\(['"]node:https?['"]\)/ },
  { nome: 'import http', re: /from\s+['"]https?['"]|require\(['"]https?['"]\)/ },
  { nome: 'import net/dgram/tls', re: /from\s+['"]node:(net|dgram|tls)['"]/ },
  { nome: 'WebSocket', re: /\bnew\s+WebSocket\b/ },
  { nome: 'cliente HTTP', re: /from\s+['"](axios|node-fetch|got|undici|superagent)['"]/ },
]

/** Só código executável. Templates e Markdown são conteúdo, não programa. */
const EXECUTAVEIS = (p: string): boolean =>
  (p.endsWith('.js') || p.endsWith('.mjs') || p.endsWith('.cjs') || p.endsWith('.ts')) &&
  !p.includes('/templates/')

function detectar(fonte: string): string[] {
  return PADROES.filter((p) => p.re.test(fonte)).map((p) => p.nome)
}

describe('TEST-PF-022 — nenhum I/O de rede no plugin', () => {
  const arquivos = walk('plugins/sdd-kit', EXECUTAVEIS)

  it('o detector reconhece I/O de rede — o teste não é vacuoso', () => {
    // Sem esta asserção, um detector quebrado passaria enquanto não houvesse
    // scripts, e continuaria passando depois que houvesse.
    expect(detectar('const r = await fetch("https://exemplo.com")')).toContain('fetch')
    expect(detectar("import https from 'node:https'")).toContain('import node:http')
    expect(detectar("import axios from 'axios'")).toContain('cliente HTTP')
    expect(detectar('const soma = (a, b) => a + b')).toEqual([])
  })

  it('nenhum arquivo executável do plugin faz I/O de rede', () => {
    const infratores = arquivos
      .map((f) => ({ f, achados: detectar(read(f)) }))
      .filter((x) => x.achados.length > 0)
      .map((x) => `${x.f}: ${x.achados.join(', ')}`)
    expect(infratores).toEqual([])
  })

  it('registra quantos arquivos executáveis existem hoje no plugin', () => {
    // ADR-007: os scripts chegam na Fase 4. Enquanto forem zero, a asserção
    // acima é verdadeira por ausência — e este teste deixa isso explícito em
    // vez de deixar a cobertura parecer maior do que é.
    expect(arquivos.length).toBe(0)
  })
})
