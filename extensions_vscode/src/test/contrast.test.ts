// TEST-COCK-011 — contraste da camada de marca (NFR-COCK-001, NFR-COCK-004,
// TASK-COCK-019).
//
// A rastreabilidade registra "contraste percebido só se verifica por olho humano", e isso
// continua verdadeiro para as cores que DERIVAM do tema do usuário. Mas a camada de marca
// é hex fixo, então o contraste dela é calculável — e calculável significa testável.
//
// Este teste existe por um achado concreto: medindo os pares, o branco reprovava em AA
// sobre seis dos dez fundos da paleta, o pior em 2,22:1 onde texto pequeno exige 4,5:1.
// Os badges eram ilegíveis em metade dos estados, em todas as superfícies.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { BRAND_TOKENS, STATUS_TOKENS, contrastRatio, readableOn } from '../sdd/themeTokens'

/** WCAG 2.x AA para texto normal. O badge é 0.66rem em negrito — não é "texto grande". */
const AA_NORMAL = 4.5

test('TEST-COCK-011 · NFR-COCK-001 — todo fundo de status tem tinta legível em AA', () => {
  const failures: string[] = []
  for (const [name, background] of Object.entries(STATUS_TOKENS)) {
    const ink = readableOn(background)
    const ratio = contrastRatio(ink, background)
    if (ratio < AA_NORMAL) {
      failures.push(`${name} (${background}) com ${ink}: ${ratio.toFixed(2)}:1`)
    }
  }
  assert.deepEqual(failures, [], `abaixo de ${AA_NORMAL}:1 —\n  ${failures.join('\n  ')}`)
})

test('TEST-COCK-011 · NFR-COCK-001 — o acento e a cor de IA também são legíveis', () => {
  for (const name of ['--sdd-accent', '--sdd-accent-2', '--sdd-ai', '--sdd-ai-2'] as const) {
    const background = BRAND_TOKENS[name]
    const ratio = contrastRatio(readableOn(background), background)
    assert.ok(ratio >= AA_NORMAL, `${name} (${background}): ${ratio.toFixed(2)}:1`)
  }
})

test('TEST-COCK-011 — readableOn escolhe a tinta de maior contraste, não uma fixa', () => {
  const light = BRAND_TOKENS['--sdd-on-brand']
  const dark = BRAND_TOKENS['--sdd-on-brand-dark']
  // Fundo escuro pede tinta clara; fundo claro pede tinta escura. Se a função devolvesse
  // sempre a mesma, um destes falharia — que era exatamente o defeito.
  assert.equal(readableOn('#10141A'), light, 'fundo escuro → tinta clara')
  assert.equal(readableOn('#E0A33A'), dark, 'fundo âmbar claro → tinta escura')
  assert.notEqual(readableOn('#10141A'), readableOn('#E0A33A'), 'as duas tintas são usadas')
})

test('TEST-COCK-011 — contrastRatio bate com os extremos conhecidos do WCAG', () => {
  assert.equal(Math.round(contrastRatio('#000000', '#FFFFFF')), 21, 'preto sobre branco')
  assert.equal(contrastRatio('#7C6BF0', '#7C6BF0'), 1, 'a mesma cor não contrasta')
})

test('TEST-COCK-011 — o CSS emitido carrega a tinta escolhida, não uma herdada', () => {
  // Sem isto, a classe poderia herdar a cor do `.ui-badge` base e desfazer a correção.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { componentsCss } = require('../sdd/uiCss') as { componentsCss: () => string }
  const css = componentsCss()
  for (const [name, background] of Object.entries(STATUS_TOKENS)) {
    const cls = name.replace('--sdd-status-', 's-')
    const rule = new RegExp(`\\.ui-badge\\.${cls} \\{[^}]*color: ${readableOn(background)}`)
    assert.match(css, rule, `${cls} deve declarar a própria tinta`)
  }
})
