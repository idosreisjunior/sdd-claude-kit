// Build do cliente do webview do wizard (feature 0035, ADR-034). Empacota o código
// Preact de src/webview/wizard/ num único out/webview/wizard.js, injetado no
// WebviewPanel sob a CSP com nonce. Somente o wizard usa bundler; os demais painéis
// seguem em vanilla/template-string. Rodado pelo `compile`/`vscode:prepublish`.
import esbuild from 'esbuild'
import { statSync } from 'node:fs'

const production = process.argv.includes('--production')
const watch = process.argv.includes('--watch')

// Teto do bundle (ADR-034: "bundle leve só para o wizard"). Existe por um acidente real:
// um `import { taskCounts }` — valor, não tipo — de src/sdd/wizardContent.ts arrastou o
// js-yaml, via yamlUtils, para dentro do webview e o inflou de 21 kB para 136 kB. O host
// deriva; o cliente importa só tipos. Se este teto estourar, procure um import de VALOR
// novo de src/sdd/ nos componentes antes de simplesmente subir o número.
const MAX_BUNDLE_KB = 60

/** @type {import('esbuild').BuildOptions} */
const options = {
  entryPoints: ['src/webview/wizard/index.tsx'],
  bundle: true,
  format: 'iife',
  platform: 'browser',
  target: 'es2020',
  outfile: 'out/webview/wizard.js',
  jsx: 'automatic',
  jsxImportSource: 'preact',
  sourcemap: !production,
  minify: production,
  logLevel: 'info',
}

if (watch) {
  const ctx = await esbuild.context(options)
  await ctx.watch()
  console.log('[esbuild] observando src/webview/wizard/…')
} else {
  await esbuild.build(options)
  const kb = statSync(options.outfile).size / 1024
  if (kb > MAX_BUNDLE_KB) {
    console.error(
      `[esbuild] bundle do wizard com ${kb.toFixed(1)} kB, acima do teto de ${MAX_BUNDLE_KB} kB ` +
        '(ADR-034). Procure um import de VALOR de src/sdd/ num componente do webview.',
    )
    process.exit(1)
  }
}
