// Cliente da sidebar (feature 0036, TASK-COCK-016, ADR-036). Empacotado pelo esbuild em
// out/webview/sidebar.js e carregado sob a CSP com nonce.
//
// Este é o cliente que ADR-040 justifica: superfície nova e interativa. O que a `TreeView`
// dava pronto — foco, seleção, ação por item — é reimplementado aqui, e o estado que
// sustenta isso vive puro em `src/sdd/sidebarModel.ts`, testado sem o host.
//
// As ações NÃO são reimplementadas: o cliente só avisa qual item e qual intenção; a borda
// executa os mesmos comandos de sempre (ver `sidebarViewProvider`).
import { render } from 'preact'
import type { SidebarItem, SidebarState } from '../../sdd/sidebarModel'
import { StatusBadge } from '../ui/index'
import { vscodeApi } from '../wizard/vscodeApi'

function post(message: unknown) {
  vscodeApi.postMessage(message)
}

/** Barra de progresso das tarefas. Ausente quando a mudança não tem contagem conhecida. */
function Progress({ progress }: { progress?: { done: number; total: number } }) {
  if (!progress || progress.total <= 0) {
    return null
  }
  const pct = Math.max(0, Math.min(100, Math.round((progress.done / progress.total) * 100)))
  return (
    <>
      <span class="sb-bar" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
        <i style={`width:${pct}%`} />
      </span>
      <span class="sb-count">
        {progress.done}/{progress.total}
      </span>
    </>
  )
}

function ChangeRow({ item, state }: { item: SidebarItem; state: SidebarState }) {
  const change = item.change
  if (!change) {
    return null
  }
  const classes = [
    'sb-item',
    state.focusedKey === item.key ? 'focused' : '',
    state.selectedKey === item.key ? 'selected' : '',
  ]
    .filter(Boolean)
    .join(' ')

  // `stopPropagation` nos botões: clicar numa ação não deve também selecionar o cartão.
  const act = (command: string) => (ev: Event) => {
    ev.stopPropagation()
    post({ type: 'invoke', id: change.id, command })
  }

  return (
    <li class={classes} data-key={item.key}>
      <div
        class="ui-card"
        role="option"
        aria-selected={state.selectedKey === item.key}
        tabIndex={-1}
        onClick={() => post({ type: 'select', key: item.key })}
        onDblClick={() => post({ type: 'invoke', id: change.id, command: 'sddClaudeKit.openDashboard' })}
        title={`${change.id} · ${change.type} · ${change.status}`}
      >
        <div class="sb-head">
          <span class="sb-title">{item.label}</span>
          <span class="sb-actions">
            <button class="sb-act" onClick={act('sddClaudeKit.openDashboard')} title="Abrir dashboard" aria-label={`Abrir dashboard de ${change.id}`}>
              ▤
            </button>
            <button class="sb-act" onClick={act('sddClaudeKit.editSpec')} title="Editar spec" aria-label={`Editar spec de ${change.id}`}>
              ✎
            </button>
            <button
              class="sb-act"
              onClick={(ev) => {
                ev.stopPropagation()
                post({ type: 'menu', id: change.id })
              }}
              title="Mais ações"
              aria-label={`Mais ações de ${change.id}`}
            >
              ⋯
            </button>
          </span>
        </div>
        <div class="sb-meta">
          <span class="sb-id">{change.id}</span>
          <StatusBadge status={change.status} />
          <Progress progress={item.progress} />
        </div>
      </div>
    </li>
  )
}

function List({ state }: { state: SidebarState }) {
  return (
    <ul class="sb-list" role="listbox" aria-label="Mudanças especificadas">
      {state.items.map((item) =>
        item.kind === 'group' ? (
          <li class="sb-group" key={item.key} role="presentation">
            {item.label}
          </li>
        ) : (
          <ChangeRow key={item.key} item={item} state={state} />
        ),
      )}
    </ul>
  )
}

/** Boas-vindas: estado da própria sidebar, não painel que abre sozinho (Q7). */
function Welcome() {
  return (
    <div class="sb-welcome">
      <h1>Bem-vindo ao SDD Cockpit</h1>
      <p>A especificação vem antes do código. Organize requisitos, decisões e rastreabilidade sem sair do VS Code.</p>
      <button class="ui-btn primary" onClick={() => post({ type: 'init' })}>
        Inicializar SDD
      </button>
      <p class="sb-hint">Não sobrescreve arquivos de código.</p>
      <ol class="sb-steps">
        <li>
          <b>1 · Especifique</b> Descreva a mudança em linguagem natural.
        </li>
        <li>
          <b>2 · Planeje</b> Clarifique dúvidas, registre ADRs, decomponha em tarefas.
        </li>
        <li>
          <b>3 · Implemente</b> Uma tarefa por vez, com evidência.
        </li>
      </ol>
    </div>
  )
}

function readState(): SidebarState | null {
  const el = document.getElementById('sdd-state')
  if (!el || !el.textContent) {
    return null
  }
  try {
    return JSON.parse(el.textContent) as SidebarState
  } catch {
    return null
  }
}

const root = document.getElementById('root')
const initial = readState()
if (root && initial) {
  render(initial.mode === 'welcome' ? <Welcome /> : <List state={initial} />, root)
}
