import { createServer } from 'node:http'
import { health } from './routes/health.js'

/** Rotas registradas. Cada uma devolve true quando trata a requisição. */
const routes = [health]

export const app = createServer((req, res) => {
  for (const route of routes) {
    if (route(req, res)) return
  }
  res.writeHead(404, { 'content-type': 'application/json' })
  res.end(JSON.stringify({ error: 'not_found' }))
})

// Só sobe o servidor quando executado diretamente, não quando importado
// por um teste.
if (process.argv[1] && process.argv[1].endsWith('server.js')) {
  const port = Number(process.env['PORT'] ?? 3000)
  app.listen(port, () => console.log(`ouvindo em http://localhost:${port}`))
}
