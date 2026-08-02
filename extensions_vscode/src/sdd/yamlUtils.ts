// Leitura tolerante do YAML das specs — compartilhada pelos modelos que leem
// status.yaml/traceability.yaml sem quebrar (fonte ausente/inválida → undefined,
// nunca exceção). Fonte única de parseYaml/get/isRecord/str, antes duplicados em
// dashboardModel e historyModel.
import { load } from 'js-yaml'

/** Faz parsing de um YAML; `undefined`/ilegível vira `undefined`, nunca lança. */
export function parseYaml(text: string | undefined): unknown {
  if (text === undefined) {
    return undefined
  }
  try {
    return load(text)
  } catch {
    return undefined
  }
}

/** Lê uma chave de um objeto, ou `undefined` se não for um registro. */
export function get(obj: unknown, key: string): unknown {
  return isRecord(obj) ? obj[key] : undefined
}

/** Verdadeiro para um objeto simples (não nulo, não array). */
export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** Retorna a string não vazia, ou `undefined`. */
export function str(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined
}
