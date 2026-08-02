import { test } from 'node:test'
import assert from 'node:assert/strict'
import { analyzeSql } from '../sdd/sqlGuard'

// TEST-SQL-001 — alteração/exclusão sem WHERE e full scan, com a linha.
test('TEST-SQL-001: analyzeSql sinaliza DELETE/UPDATE sem WHERE e full scan', () => {
  const sql = 'DELETE FROM users;\nUPDATE t SET x = 1;\nSELECT * FROM big;'
  const f = analyzeSql(sql)

  assert.ok(f.some((x) => x.kind === 'data-change-no-where' && x.line === 0), 'DELETE sem WHERE')
  assert.ok(f.some((x) => x.kind === 'data-change-no-where' && x.line === 1), 'UPDATE sem WHERE')
  assert.ok(f.some((x) => x.kind === 'full-scan' && x.line === 2), 'SELECT *')

  // DELETE com WHERE não é sinalizado.
  assert.equal(analyzeSql('DELETE FROM users WHERE id = 1;').length, 0)
  // TRUNCATE é sempre sinalizado (sem filtro).
  assert.ok(analyzeSql('TRUNCATE TABLE t;').some((x) => x.kind === 'data-change-no-where'))
})

// TEST-SQL-002 — divisão por zero e transação sem rollback; SQL seguro → sem achado.
test('TEST-SQL-002: analyzeSql sinaliza divisão por zero e transação sem ROLLBACK', () => {
  assert.ok(
    analyzeSql('SELECT a / 0 FROM t WHERE id = 1;').some((x) => x.kind === 'division-by-zero'),
    'divisão por zero',
  )
  assert.ok(
    analyzeSql('BEGIN;\nUPDATE t SET x = 1 WHERE id = 1;\nCOMMIT;').some(
      (x) => x.kind === 'no-rollback',
    ),
    'transação sem ROLLBACK',
  )

  // SQL seguro: WHERE, sem `*`, sem `/ 0` — nenhum achado.
  assert.equal(analyzeSql('SELECT a FROM t WHERE id = 1;').length, 0)
  // `/ 0.5` não é divisão por zero.
  assert.equal(analyzeSql('SELECT a / 0.5 FROM t WHERE id = 1;').length, 0)
  // Transação com ROLLBACK não é sinalizada.
  assert.equal(
    analyzeSql('BEGIN;\nUPDATE t SET x = 1 WHERE id = 1;\nROLLBACK;').length,
    0,
  )
  // Comentário não é analisado.
  assert.equal(analyzeSql('-- DELETE FROM t;\nSELECT a FROM t WHERE id = 1;').length, 0)
})
