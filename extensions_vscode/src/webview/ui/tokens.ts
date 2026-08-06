// Ponte dos tokens para o lado do cliente (feature 0036, TASK-COCK-002, ADR-037).
//
// `themeTokens.ts` é puro e não importa nada, então atravessar a fronteira do bundle custa
// apenas o que ele pesa — ao contrário de módulos que puxam `yamlUtils` e, com ele, o
// `js-yaml`. Este arquivo existe para que os componentes tenham UM lugar de onde tirar
// referência de token, em vez de espalharem literais `var(--sdd-…)` pelo código.
import { statusToken } from '../../sdd/themeTokens'

export { statusToken, themeTokensCss } from '../../sdd/themeTokens'

/** Referência CSS de um token `--sdd-*`, com ou sem o prefixo. */
export function token(name: string): string {
  return `var(--${name.startsWith('sdd-') ? name : `sdd-${name}`})`
}

/** Cor do status do ciclo de vida, pronta para um atributo `style`. */
export function statusColor(status: string): string {
  return `var(${statusToken(status)})`
}
