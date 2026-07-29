import { test, after } from 'node:test'
import assert from 'node:assert/strict'
import { app } from '../src/server.js'

const server = app.listen(0)
const base = () => `http://localhost:${server.address().port}`

after(() => server.close())

test('GET /health responde 200 com status ok', async () => {
  const res = await fetch(`${base()}/health`)
  assert.equal(res.status, 200)
  assert.deepEqual(await res.json(), { status: 'ok' })
})

test('rota desconhecida responde 404', async () => {
  const res = await fetch(`${base()}/nao-existe`)
  assert.equal(res.status, 404)
})
