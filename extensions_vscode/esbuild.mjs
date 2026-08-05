// Build dos clientes de webview (features 0035 e 0036, ADR-034 e ADR-037). Empacota o
// código Preact de src/webview/<superfície>/ em out/webview/<nome>.js, injetado no webview
// sob a CSP com nonce. Rodado pelo `compile`/`vscode:prepublish`.
//
// Um bundle POR SUPERFÍCIE, não um bundle único: assim um erro num painel não derruba os
// outros, e o tamanho de cada um é medido e limitado separadamente (ADR-037).
import esbuild from 'esbuild'
import { statSync } from 'node:fs'

const production = process.argv.includes('--production')
const watch = process.argv.includes('--watch')

// As superfícies empacotadas. Acrescentar um painel é acrescentar uma linha aqui.
//
// `maxKb` é um TETO, e existe por um acidente real: um `import { taskCounts }` — valor,
// não tipo — de src/sdd/wizardContent.ts arrastou o js-yaml, via yamlUtils, para dentro do
// webview e o inflou de 21 kB para 136 kB. Se um teto estourar, procure um import de VALOR
// novo de src/sdd/ num componente antes de simplesmente subir o número: o host deriva, o
// cliente importa só tipos.
const BUNDLES = [{ name: 'wizard', entry: 'src/webview/wizard/index.tsx', maxKb: 60 }]

/** Opções comuns a todos os bundles. @type {import('esbuild').BuildOptions} */
const common = {
  bundle: true,
  format: 'iife',
  platform: 'browser',
  target: 'es2020',
  jsx: 'automatic',
  jsxImportSource: 'preact',
  sourcemap: !production,
  minify: production,
  logLevel: 'info',
}

/** Opções de um bundle. @returns {import('esbuild').BuildOptions} */
function optionsFor(bundle) {
  return { ...common, entryPoints: [bundle.entry], outfile: `out/webview/${bundle.name}.js` }
}

/** Falha o build quando um bundle passa do seu teto, nomeando a causa provável. */
function checkSize(bundle) {
  const kb = statSync(`out/webview/${bundle.name}.js`).size / 1024
  if (kb > bundle.maxKb) {
    console.error(
      `[esbuild] bundle "${bundle.name}" com ${kb.toFixed(1)} kB, acima do teto de ` +
        `${bundle.maxKb} kB (ADR-034/037). Procure um import de VALOR de src/sdd/ num ` +
        'componente do webview — só tipos devem atravessar essa fronteira.',
    )
    return false
  }
  return true
}

if (watch) {
  const contexts = await Promise.all(BUNDLES.map((b) => esbuild.context(optionsFor(b))))
  await Promise.all(contexts.map((ctx) => ctx.watch()))
  console.log(`[esbuild] observando ${BUNDLES.length} superfície(s) em src/webview/…`)
} else {
  await Promise.all(BUNDLES.map((b) => esbuild.build(optionsFor(b))))
  const oversized = BUNDLES.filter((b) => !checkSize(b))
  if (oversized.length > 0) {
    process.exit(1)
  }
}
