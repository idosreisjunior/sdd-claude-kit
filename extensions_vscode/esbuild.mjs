// Build do cliente do webview do wizard (feature 0035, ADR-034). Empacota o código
// Preact de src/webview/wizard/ num único out/webview/wizard.js, injetado no
// WebviewPanel sob a CSP com nonce. Somente o wizard usa bundler; os demais painéis
// seguem em vanilla/template-string. Rodado pelo `compile`/`vscode:prepublish`.
import esbuild from 'esbuild'

const production = process.argv.includes('--production')
const watch = process.argv.includes('--watch')

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
}
