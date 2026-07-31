// Sincroniza os templates embutidos a partir da fonte única do plugin (ADR-001).
//
//   node scripts/sync-templates.mjs
//
// Regenera extensions_vscode/templates/ a partir de plugins/sdd-kit/templates/
// e grava um manifesto com o hash combinado. Rode e faça commit sempre que os
// templates do plugin mudarem; a verificação em CI (check-templates) falha se a
// cópia versionada divergir da fonte.
import { existsSync, rmSync, mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import {
  SOURCE_DIR,
  EMBED_DIR,
  MANIFEST_NAME,
  walk,
  normalized,
  treeHashes,
  combinedHash,
  toAbs,
} from './templates-lib.mjs'

if (!existsSync(SOURCE_DIR)) {
  console.error(`✖ [sync-templates] Fonte não encontrada: ${SOURCE_DIR}`)
  console.error('  Correção: rode a partir do monorepo, com plugins/sdd-kit presente.')
  process.exit(1)
}

// Regenera do zero para nunca herdar arquivo removido na fonte.
rmSync(EMBED_DIR, { recursive: true, force: true })

const files = walk(SOURCE_DIR)
for (const rel of files) {
  const dest = toAbs(EMBED_DIR, rel)
  mkdirSync(dirname(dest), { recursive: true })
  // Escreve conteúdo normalizado (LF) para consistência multiplataforma.
  writeFileSync(dest, normalized(toAbs(SOURCE_DIR, rel)))
}

const hashes = treeHashes(EMBED_DIR)
const manifest = {
  syncedFrom: 'plugins/sdd-kit/templates',
  fileCount: files.length,
  combinedHash: combinedHash(hashes),
  files: hashes,
}
writeFileSync(join(EMBED_DIR, MANIFEST_NAME), `${JSON.stringify(manifest, null, 2)}\n`)

console.log(`✔ [sync-templates] ${files.length} arquivos sincronizados`)
console.log(`  Fonte:   ${SOURCE_DIR}`)
console.log(`  Destino: ${EMBED_DIR}`)
console.log(`  Hash:    ${manifest.combinedHash.slice(0, 16)}…`)
