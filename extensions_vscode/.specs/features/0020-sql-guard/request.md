# Solicitação original

- **ID:** 0020-sql-guard
- **Tipo:** feature
- **Criada em:** 2026-08-02
- **Origem:** /sdd-kit:new

---

## Texto da solicitação

> SQL Guard (RF-024) — revisar consultas SQL e identificar ausência de filtros, risco de full scan, joins incorretos, duplicação de registros, divisão por zero, casts inseguros, tratamento inadequado de valores nulos, funções incompatíveis, riscos de custo, risco de alteração ou exclusão de dados, e ausência de rollback.

## Interpretação

Materializar o RF-024 do PRD da extensão: um **SQL Guard** que revisa consultas SQL e sinaliza
riscos. São onze categorias no RF-024. Ponto crítico de viabilidade: elas **não são homogêneas**.

- **Detectáveis por análise estática leve** (texto/heurística, sem esquema): risco de alteração/
  exclusão de dados (DELETE/UPDATE/TRUNCATE/DROP sem WHERE), ausência de filtros, risco de full
  scan (`SELECT *`/sem WHERE), divisão por zero (literal), ausência de rollback num script de
  transação.
- **Exigem parser SQL + conhecimento de esquema/dialeto** (muito além de heurística): joins
  incorretos, duplicação de registros, casts inseguros, tratamento inadequado de nulos, funções
  incompatíveis, riscos de custo.

Logo, o incremento realizável hoje é o **subconjunto heurístico** (os riscos perigosos e
detectáveis), no molde de um analisador puro (Project Doctor 0006, análise de tarefas 0018) — sem
Claude Code, sem Fase 2. As demais categorias ficam como questão/futuro.

## O que esta mudança entrega

- Um **SQL Guard** que analisa SQL e sinaliza o subconjunto de riscos detectável por análise
  estática leve (a lista exata é uma questão em aberto).

## O que esta mudança deliberadamente não entrega

- **As categorias que exigem parser + esquema** (joins, duplicação, casts, nulos, funções, custo) —
  fora do alcance de um analisador heurístico; ficam para incrementos futuros/decisão de parser.
- **Reescrever ou executar SQL** — o Guard só revisa e alerta; nunca roda a consulta.

## Restrições conhecidas

- Sem rede própria (RNF-004); compatibilidade Windows/Linux/WSL (RNF-002).
- SQL não é artefato `.specs` — o insumo vem do editor/arquivo `.sql`, diferente das demais features.
- A extensão evita dependências pesadas — um parser SQL completo seria uma decisão de peso (design).
