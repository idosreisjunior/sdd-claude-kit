// Decisões dos componentes compartilhados (feature 0036, TASK-COCK-003, ADR-037) —
// lógica pura, sem a API do VS Code e sem JSX.
//
// Existe porque `src/webview` está FORA do `tsc` (ADR-034): componente `.tsx` não é
// alcançável por `node --test`. O que um componente decide mora aqui e é testado; o `.tsx`
// fica só com a marcação, que é o pedaço genuinamente não testável (gap registrado).
//
// Sem imports de runtime além de themeTokens (que não importa nada): este módulo atravessa
// para o bundle do webview, e qualquer dependência sua vai junto.
import { statusToken } from './themeTokens'
import type { Count } from './dashboardModel'

/** O que um `StatTile` mostra. `available: false` significa que a fonte não deu o número. */
export interface TileDisplay {
  text: string
  available: boolean
  /** Explicação da indisponibilidade, para `title`/leitor de tela. */
  note?: string
}

/**
 * Decide o conteúdo de um `StatTile`.
 *
 * A regra que importa: valor indisponível NUNCA vira `0`. Um zero é uma afirmação — "não
 * há requisitos" — e é indistinguível de "não consegui ler o arquivo". Na dúvida, mostra
 * o travessão e diz o porquê (SCN-COCK-005).
 */
export function statTileDisplay(count: Count | undefined): TileDisplay {
  if (count === undefined) {
    return { text: '—', available: false, note: 'fonte não disponível' }
  }
  if (!count.available) {
    return { text: '—', available: false, note: count.note }
  }
  return { text: String(count.value), available: true }
}

/** O que um `StatusBadge` mostra: o rótulo, o token de cor e a classe modificadora. */
export interface BadgeDisplay {
  label: string
  /** Nome do token `--sdd-status-*`. Status desconhecido cai em rascunho. */
  tokenName: string
  /**
   * Classe CSS que aplica a cor (`s-designed`, `s-in-progress`, …).
   *
   * Existe porque estilo INLINE não passa na CSP: `style-src 'nonce-…'` autoriza elementos
   * `<style>`, mas atributos `style=` só passam com `'unsafe-inline'`, que não temos e não
   * queremos. A cor entra por classe declarada no bloco `<style nonce>` (`uiCss.ts`).
   */
  className: string
}

/**
 * Decide rótulo e cor de um `StatusBadge`. Status desconhecido não quebra nem some: cai
 * na cor de rascunho e preserva o texto original, porque esconder um estado que existe em
 * disco seria pior do que mostrá-lo sem cor própria.
 */
export function statusBadge(status: string): BadgeDisplay {
  const label = status.trim() === '' ? 'SEM STATUS' : status.trim().toUpperCase()
  const tokenName = statusToken(status)
  return { label, tokenName, className: tokenName.replace('--sdd-status-', 's-') }
}

/** Percentual de progresso, limitado a 0–100. Total zero devolve 0, nunca NaN. */
export function progressPct(done: number, total: number): number {
  if (!Number.isFinite(done) || !Number.isFinite(total) || total <= 0) {
    return 0
  }
  return Math.max(0, Math.min(100, Math.round((done / total) * 100)))
}
