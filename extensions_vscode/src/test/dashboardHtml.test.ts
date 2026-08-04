import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  renderDashboardHtml,
  esc,
  actionHref,
  FEATURE_ACTION_COMMANDS,
} from '../sdd/dashboardHtml'
import type { DashboardModel } from '../sdd/dashboardModel'
import type { ChangeEntry } from '../sdd/specsIndex'

function change(overrides: Partial<ChangeEntry> = {}): ChangeEntry {
  return {
    id: '0014-design-generation',
    type: 'feature',
    title: 'Geração do design',
    status: 'DRAFT',
    path: 'features/0014-design-generation',
    ...overrides,
  }
}

function model(overrides: Partial<DashboardModel> = {}): DashboardModel {
  return {
    id: '0002-x',
    type: 'feature',
    title: 'Título',
    status: 'DRAFT',
    objective: null,
    progress: null,
    counts: {
      requirements: { available: true, value: 3 },
      scenarios: { available: true, value: 4 },
      acceptanceCriteria: { available: false, note: 'sem spec.md' },
      tasks: { available: true, value: 9 },
      tests: { available: true, value: 2 },
      files: { available: true, value: 5 },
    },
    blockers: [],
    history: [],
    deferred: [{ label: 'Consumo de tokens', note: 'feature 0005' }],
    ...overrides,
  }
}

test('TEST-UI-002 — o HTML aplica CSP com nonce e default-src none (NFR-UI-002)', () => {
  const html = renderDashboardHtml(model(), 'abc123')
  assert.match(html, /http-equiv="Content-Security-Policy"/)
  assert.match(html, /default-src 'none'/)
  assert.match(html, /style-src 'nonce-abc123'/)
  assert.match(html, /<style nonce="abc123">/)
  // sem script: não deve haver tag <script>
  assert.ok(!/<script/i.test(html), 'dashboard não usa scripts')
})

test('TEST-UI-002 — todo texto de artefato é escapado (sem injeção)', () => {
  const html = renderDashboardHtml(
    model({ title: '<img src=x onerror="alert(1)"> & "aspas"' }),
    'n0nce',
  )
  assert.ok(!html.includes('<img src=x'), 'a tag não entra crua')
  assert.match(html, /&lt;img src=x/)
  assert.match(html, /&amp; &quot;aspas&quot;/)
})

test('TEST-UI-002 — contagem indisponível aparece com a nota', () => {
  const html = renderDashboardHtml(model(), 'n')
  assert.match(html, /class="na">sem spec\.md/)
  assert.match(html, />3<\/div>/) // requisitos disponível
})

test('TEST-UI-002 — esc cobre os cinco caracteres perigosos', () => {
  assert.equal(esc(`&<>"'`), '&amp;&lt;&gt;&quot;&#39;')
})

test('TEST-DASH-001 — com change, o dashboard mostra a seção Ações com command: URIs (SCN-DASH-001)', () => {
  const html = renderDashboardHtml(model(), 'n', change())
  assert.match(html, /<h2>Ações<\/h2>/)
  // um botão por comando de ação, cada um com seu command: URI
  for (const command of FEATURE_ACTION_COMMANDS) {
    assert.ok(
      html.includes(`href="command:${command}?`),
      `esperava botão para ${command}`,
    )
  }
  // o id da feature vai no argumento do comando (para agir sobre a mudança certa)
  assert.ok(html.includes('0014-design-generation'), 'o id da feature vai no argumento')
})

test('TEST-DASH-002 — sem change, a seção Ações é omitida (compatibilidade)', () => {
  const html = renderDashboardHtml(model(), 'n')
  assert.ok(!/<h2>Ações<\/h2>/.test(html), 'sem change não há seção Ações')
})

test('TEST-DASH-003 — actionHref embute o nó sintético { kind: feature, change }', () => {
  const href = actionHref('sddClaudeKit.research', change({ id: '0099-x' }))
  assert.ok(href.startsWith('command:sddClaudeKit.research?'))
  const json = decodeURIComponent(href.split('?')[1])
  const [node] = JSON.parse(json)
  assert.equal(node.kind, 'feature')
  assert.equal(node.change.id, '0099-x')
  assert.equal(node.change.path, 'features/0014-design-generation')
})
