// TEST-COCK-001 — guarda: nenhuma cor de conteúdo fora da camada de tokens
// (REQ-COCK-001, SCN-COCK-002, TASK-COCK-004).
//
// É o critério de aceite virando verificação automática. Foi escrito ANTES da
// TASK-COCK-005 de propósito: começa vermelho, listando os módulos infratores, e ficar
// verde é a definição de pronto daquela tarefa.
//
// Lê os ARQUIVOS-FONTE, não o CSS renderizado: a regra é sobre como o código é escrito.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

// __dirname aponta para out/test/ no código compilado; a fonte está dois níveis acima.
const SRC = join(__dirname, '..', '..', 'src', 'sdd')

/** Os módulos que emitem HTML/CSS de superfície. Acrescentar painel = acrescentar linha. */
const PANEL_MODULES = [
  'boardHtml.ts',
  'dashboardHtml.ts',
  'projectOverviewHtml.ts',
  'historyHtml.ts',
  'metricsHtml.ts',
  'validationHtml.ts',
  'specEditorHtml.ts',
  'wizardHtml.ts',
  'panelHtml.ts',
  'uiCss.ts',
]

/**
 * Onde a cor de marca PODE ser declarada. É a única exceção, e é uma só: o ADR-035 define
 * que a paleta semântica do SDD é cor própria, não derivada do tema. Qualquer outro
 * arquivo declarando hex está fora do contrato.
 */
const BRAND_LAYER = 'themeTokens.ts'

/** Propriedades CSS em que um valor `--vscode-*` é cor de conteúdo. */
const COLOR_PROPS = /(?:^|[;{\s])(color|background|background-color|border|border-color|border-top|border-bottom|border-left|border-right|outline|fill|stroke|box-shadow)\s*:\s*([^;}\n]*)/gi

function read(file: string): string | undefined {
  const path = join(SRC, file)
  return existsSync(path) ? readFileSync(path, 'utf8') : undefined
}

/** Declarações de cor que referenciam --vscode-* sem passar pela camada --sdd-*. */
function rawVscodeColors(source: string): string[] {
  const out: string[] = []
  for (const match of source.matchAll(COLOR_PROPS)) {
    const [, prop, value] = match
    // `var(--sdd-x, var(--vscode-y))` é a camada fazendo o seu trabalho — não é infração.
    if (value.includes('--vscode-') && !value.includes('--sdd-')) {
      out.push(`${prop}: ${value.trim()}`)
    }
  }
  return out
}

/** Hex de cor fora da camada de marca. */
function fixedHex(source: string): string[] {
  return [...source.matchAll(/#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b/g)].map((m) => m[0])
}

test('TEST-COCK-001 · SCN-COCK-002 — nenhum painel usa --vscode-* para cor de conteúdo', () => {
  const offenders: string[] = []
  for (const file of PANEL_MODULES) {
    const source = read(file)
    if (source === undefined) {
      continue // módulo ainda não existe ou já foi migrado para cliente Preact
    }
    const raw = rawVscodeColors(source)
    if (raw.length > 0) {
      offenders.push(`  ${file} — ${raw.length} declaração(ões): ${raw.slice(0, 3).join(' · ')}`)
    }
  }
  assert.deepEqual(
    offenders,
    [],
    `cor de conteúdo fora da camada --sdd-*:\n${offenders.join('\n')}\n` +
      'Derive de um token --sdd-* (themeTokens.ts) em vez de referenciar --vscode-* direto.',
  )
})

test('TEST-COCK-001 — só a camada de marca declara hex', () => {
  const offenders: string[] = []
  for (const file of PANEL_MODULES) {
    if (file === BRAND_LAYER) {
      continue
    }
    const source = read(file)
    if (source === undefined) {
      continue
    }
    const hex = fixedHex(source)
    if (hex.length > 0) {
      offenders.push(`  ${file} — ${[...new Set(hex)].join(', ')}`)
    }
  }
  assert.deepEqual(
    offenders,
    [],
    `hex fixo fora de ${BRAND_LAYER}:\n${offenders.join('\n')}\n` +
      'A paleta de marca vive em themeTokens.ts (ADR-035); painéis consomem tokens.',
  )
})
