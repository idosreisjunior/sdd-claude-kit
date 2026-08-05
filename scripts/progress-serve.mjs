#!/usr/bin/env node
// Serve o painel de progresso em http://localhost:8777.
//
// Existe porque `file://` no WSL é hostil ao navegador do Windows: o caminho UNC
// `\\wsl.localhost\…` funciona mal e alguns navegadores recusam recarregar sozinhos a
// partir dele. Com o encaminhamento de localhost do WSL2, um servidor aqui é alcançável
// direto pelo navegador do Windows.
//
//   node scripts/progress-serve.mjs          serve e regenera a cada requisição
//   PORT=9000 node scripts/progress-serve.mjs
//
// Regenera a cada GET da página em vez de servir arquivo estático: assim o `--refresh` de
// 10 s do HTML sempre traz o estado do disco, mesmo sem o `--watch` rodando.
import { createServer } from 'node:http'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'

const ROOT = join(dirname(new URL(import.meta.url).pathname), '..')
const OUT = join(ROOT, 'sdd-progress.html')
const GEN = join(ROOT, 'scripts', 'progress.mjs')
const PORT = Number(process.env.PORT ?? 8777)

function regenerate() {
  try {
    execFileSync(process.execPath, [GEN], { cwd: ROOT, stdio: 'pipe' })
  } catch (err) {
    // Falhar ao regenerar não deve derrubar o servidor: serve-se a última versão boa e o
    // erro vai para o log. Um painel velho é melhor que um painel fora do ar.
    console.error('[progress] falha ao regenerar:', err.message)
  }
}

createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'content-type': 'text/plain' })
    res.end('ok')
    return
  }
  regenerate()
  try {
    const html = readFileSync(OUT)
    res.writeHead(200, {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'no-store',
    })
    res.end(html)
  } catch (err) {
    res.writeHead(500, { 'content-type': 'text/plain; charset=utf-8' })
    res.end(`Não foi possível gerar o painel: ${err.message}`)
  }
}).listen(PORT, () => {
  console.log(`[progress] http://localhost:${PORT}`)
})
