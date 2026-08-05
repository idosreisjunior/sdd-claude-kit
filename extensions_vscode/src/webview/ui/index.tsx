// Biblioteca de componentes compartilhados (feature 0036, TASK-COCK-003, ADR-037).
//
// Um só arquivo porque são seis componentes pequenos: espalhá-los em seis arquivos de 15
// linhas custaria mais navegação do que ganha em organização. Se algum crescer, ele sai.
//
// Regra de fronteira: daqui só se importa TIPO de `src/sdd/`, ou valor de módulo que não
// tenha imports próprios (`uiModel` só depende de `themeTokens`). Um import de valor de
// módulo que puxe `yamlUtils` arrasta o `js-yaml` para o bundle — ver o teto no
// `esbuild.mjs`.
import type { ComponentChildren } from 'preact'
import type { Count } from '../../sdd/dashboardModel'
import { statTileDisplay, statusBadge } from '../../sdd/uiModel'

/** Cabeçalho de painel: título, subtítulo opcional e ações à direita. */
export function PanelHeader({
  title,
  subtitle,
  actions,
}: {
  title: string
  subtitle?: string
  actions?: ComponentChildren
}) {
  return (
    <header class="ui-panel-header">
      <div class="titles">
        <h1>{title}</h1>
        {subtitle && <span class="subtitle">{subtitle}</span>}
      </div>
      {actions && <div class="actions">{actions}</div>}
    </header>
  )
}

/** Barra de controles de um painel (filtro, busca, ordenação). */
export function Toolbar({ children }: { children: ComponentChildren }) {
  return (
    <div class="ui-toolbar" role="toolbar">
      {children}
    </div>
  )
}

/** Cartão: a unidade visual que representa uma mudança, um ADR, uma entrada de feed. */
export function Card({
  title,
  actions,
  children,
}: {
  title?: string
  actions?: ComponentChildren
  children?: ComponentChildren
}) {
  return (
    <article class="ui-card">
      {(title || actions) && (
        <div class="ui-card-head">
          {title && <span class="ui-card-title">{title}</span>}
          {actions && <div class="ui-card-actions">{actions}</div>}
        </div>
      )}
      {children}
    </article>
  )
}

/**
 * Badge do status do ciclo de vida. Status desconhecido não some nem quebra: cai na cor
 * de rascunho preservando o texto (ver `statusBadge`).
 */
export function StatusBadge({ status }: { status: string }) {
  const { label, tokenName } = statusBadge(status)
  return (
    <span class="ui-badge" style={{ background: `var(${tokenName})` }}>
      {label}
    </span>
  )
}

/** Estado vazio explicativo — nunca uma tela em branco. */
export function EmptyState({
  title,
  description,
  action,
}: {
  title: string
  description: string
  action?: ComponentChildren
}) {
  return (
    <div class="ui-empty">
      <h2>{title}</h2>
      <p>{description}</p>
      {action && <div class="ui-empty-action">{action}</div>}
    </div>
  )
}

/**
 * Número agregado com rótulo. Valor indisponível mostra travessão e a nota — nunca `0`,
 * que seria indistinguível de "o valor é mesmo zero" (SCN-COCK-005).
 */
export function StatTile({ label, value }: { label: string; value: Count | undefined }) {
  const display = statTileDisplay(value)
  return (
    <div
      class={`ui-tile${display.available ? '' : ' unavailable'}`}
      title={display.note}
      aria-label={`${label}: ${display.available ? display.text : display.note ?? 'indisponível'}`}
    >
      <span class="ui-tile-value">{display.text}</span>
      <span class="ui-tile-label">{label}</span>
      {!display.available && display.note && <span class="ui-tile-note">{display.note}</span>}
    </div>
  )
}

/** Agrupador dos `StatTile`, para o layout em linha com quebra. */
export function Tiles({ children }: { children: ComponentChildren }) {
  return <div class="ui-tiles">{children}</div>
}
