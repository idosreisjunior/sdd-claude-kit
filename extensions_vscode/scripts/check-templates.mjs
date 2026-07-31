// Verifica que os templates embutidos são idênticos à fonte do plugin (ADR-001).
// Realiza TEST-FOUND-005. Sai com código != 0 quando há divergência, para que a
// verificação em CI falhe.
//
//   node scripts/check-templates.mjs
import { existsSync } from 'node:fs'
import { SOURCE_DIR, EMBED_DIR, treeHashes, combinedHash } from './templates-lib.mjs'

function fail(lines) {
  console.error('✖ [check-templates] Templates embutidos divergem da fonte')
  for (const l of lines) console.error(`  ${l}`)
  console.error('  Correção: rode `npm run sync-templates` e faça commit.')
  process.exit(1)
}

if (!existsSync(SOURCE_DIR)) fail([`Fonte não encontrada: ${SOURCE_DIR}`])
if (!existsSync(EMBED_DIR)) fail([`Cópia embutida ausente: ${EMBED_DIR}`])

const source = treeHashes(SOURCE_DIR)
const embed = treeHashes(EMBED_DIR)

const problems = []
for (const rel of Object.keys(source)) {
  if (!(rel in embed)) problems.push(`faltando na cópia: ${rel}`)
  else if (source[rel] !== embed[rel]) problems.push(`conteúdo diferente: ${rel}`)
}
for (const rel of Object.keys(embed)) {
  if (!(rel in source)) problems.push(`sobrando na cópia: ${rel}`)
}

if (problems.length > 0) fail(problems)

const sourceHash = combinedHash(source)
const embedHash = combinedHash(embed)
if (sourceHash !== embedHash) {
  fail([`hash combinado difere: fonte ${sourceHash.slice(0, 12)} vs cópia ${embedHash.slice(0, 12)}`])
}

console.log(`✔ [check-templates] ${Object.keys(source).length} arquivos idênticos à fonte`)
console.log(`  Hash: ${sourceHash.slice(0, 16)}…`)
