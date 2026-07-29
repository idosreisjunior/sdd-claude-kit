/**
 * Rota de verificação de saúde.
 *
 * @param {import('node:http').IncomingMessage} req
 * @param {import('node:http').ServerResponse} res
 * @returns {boolean} true se a rota tratou a requisição
 */
export function health(req, res) {
  if (req.url !== '/health' || req.method !== 'GET') return false
  res.writeHead(200, { 'content-type': 'application/json' })
  res.end(JSON.stringify({ status: 'ok' }))
  return true
}
