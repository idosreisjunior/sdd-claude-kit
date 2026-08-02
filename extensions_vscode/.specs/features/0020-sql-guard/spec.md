# Feature: SQL Guard (RF-024)

- **ID:** 0020-sql-guard
- **Escopo dos identificadores:** SQL
- **Estado:** ver `status.yaml` — a autoridade é ele

---

## Objetivo

Dar à extensão um **SQL Guard** que revisa SQL do editor e sinaliza riscos — o subconjunto das
categorias do RF-024 detectável por análise estática leve (heurística), sem executar nem reescrever
o SQL.

## Contexto

O RF-024 quer revisar SQL e identificar onze categorias de risco. Elas **não são homogêneas em
viabilidade**: um subconjunto é detectável por heurística (texto), enquanto joins incorretos,
duplicação de registros, casts inseguros, tratamento de nulos, funções incompatíveis e riscos de
custo exigem **parser SQL + esquema/dialeto**. Por decisão de escopo (D-Q5), o incremento 1 é
**heurístico e sem dependência**, no molde dos analisadores puros já existentes (Project Doctor
0006, análise de tarefas 0018) — sem Claude Code, sem Fase 2. Diferente das demais features, o
insumo é **SQL do editor**, não um artefato `.specs`.

## Escopo

### Incluído

- **Análise estática leve de SQL** do editor, sinalizando o subconjunto perigoso e detectável do
  RF-024 (D-Q1).

### Não incluído

- **Categorias que exigem parser + esquema** (joins, duplicação, casts, nulos, funções, custo) —
  incrementos futuros.
- **Executar ou reescrever SQL** — o Guard só revisa e alerta.

---

## Decisões de escopo (2026-08-02)

As questões Q1, Q2, Q5 e Q6 foram respondidas pelo autor. Q3 (superfície) e Q4 (gatilho) são de
design e ficam para o `design.md`.

| # | Decisão | Efeito |
| --- | --- | --- |
| D-Q1 | O incremento 1 cobre **quatro** verificações: (a) **alteração/exclusão sem WHERE** (DELETE/UPDATE/TRUNCATE); (b) **ausência de filtro / full scan** (SELECT sem WHERE ou `SELECT *`); (c) **divisão por zero** (literal `/ 0`); (d) **ausência de rollback** num script de transação (BEGIN/START TRANSACTION sem COMMIT/ROLLBACK). As categorias semânticas ficam para depois. | REQ-SQL-001. |
| D-Q2 | Insumo: o **editor ativo** quando é SQL (arquivo `.sql`) ou a **seleção** atual. | REQ-SQL-001. |
| D-Q5 | **Heurística sem dependência** (regex/tokenização leve; sem parser SQL nem esquema). | REQ-SQL-001; NFR-SQL-003. |
| D-Q6 | **Dialeto-agnóstico**: as heurísticas independem de dialeto. | REQ-SQL-001. |

---

## Requisitos funcionais

> Origem: os requisitos derivam do texto do RF-024 e das decisões D-Q1/D-Q2/D-Q5/D-Q6.

### REQ-SQL-001 — Análise heurística de riscos em SQL

A extensão deve analisar o SQL do editor ativo (arquivo `.sql` ou seleção, D-Q2) por heurística
dialeto-agnóstica (D-Q5/D-Q6) e sinalizar as quatro verificações do incremento (D-Q1): alteração/
exclusão sem WHERE, ausência de filtro / full scan, divisão por zero, e ausência de rollback num
script de transação. Nada é executado.

#### SCN-SQL-001 — DELETE/UPDATE sem WHERE

DADO um comando `DELETE FROM t` (ou `UPDATE t SET …`) sem cláusula WHERE
QUANDO o SQL Guard analisa o SQL
ENTÃO ele sinaliza risco de alteração/exclusão de dados sem filtro.

#### SCN-SQL-002 — Divisão por zero

DADO uma expressão com divisão por zero literal (ex.: `x / 0`)
QUANDO o SQL Guard analisa o SQL
ENTÃO ele sinaliza risco de divisão por zero.

#### SCN-SQL-003 — Full scan / sem filtro

DADO um `SELECT * FROM t` (ou SELECT sem WHERE)
QUANDO o SQL Guard analisa o SQL
ENTÃO ele sinaliza ausência de filtro / risco de full scan.

#### SCN-SQL-004 — SQL seguro

DADO um comando com WHERE, sem `SELECT *`, sem `/ 0` e (se transação) com COMMIT/ROLLBACK
QUANDO o SQL Guard analisa o SQL
ENTÃO ele não sinaliza nada.

### REQ-SQL-002 — Apresentação dos achados

A extensão deve apresentar os riscos de forma **localizável** (categoria, mensagem e posição no
SQL), sem alterar o SQL. A superfície é a Q3 (design).

#### SCN-SQL-005 — Apresentar os riscos

DADO uma análise que encontrou riscos
QUANDO o resultado é apresentado
ENTÃO cada risco aparece com categoria, mensagem e posição no SQL.

---

## Requisitos não funcionais

### NFR-SQL-001 — Somente leitura, sem executar SQL

O Guard nunca executa nem reescreve o SQL; apenas analisa o texto e apresenta alertas.

### NFR-SQL-002 — Sem rede

Nenhum I/O de rede (RNF-004).

### NFR-SQL-003 — Núcleo puro e testável, sem dependência

A análise (parsing heurístico + classificação) é pura (sem a API do VS Code) e **sem dependência de
parser** (D-Q5), testável fora do host (standards §6).

---

## Critérios de aceite

- [ ] O Guard sinaliza as quatro verificações do incremento sobre o SQL do editor (REQ-SQL-001,
      SCN-SQL-001/002/003).
- [ ] SQL sem os padrões cobertos não gera alerta (SCN-SQL-004).
- [ ] Os riscos são apresentados de forma localizável, sem alterar o SQL (REQ-SQL-002, SCN-SQL-005).
- [ ] Nada é executado; o núcleo é puro, sem dependência, e coberto por testes (NFR-SQL-001/003).

---

## Questões pendentes

Q1, Q2, Q5 e Q6 foram respondidas — ver **Decisões de escopo**. Permanecem duas questões, ambas
**de design** (o *como*), que não impedem a spec de sair de DRAFT:

| # | Questão | Bloqueia | Prioridade |
| --- | --- | --- | --- |
| Q3 | Superfície — diagnósticos no Problems sobre o SQL (como 0006/0018), webview, ou canal? Decisão de design → provável ADR. | design | média |
| Q4 | Gatilho na UI — comando na paleta e/ou no menu de contexto do editor `.sql`? (SQL não é feature, então não é ação do painel Features.) | design | média |

## Hipóteses assumidas

> HIPÓTESE: A superfície reusa diagnósticos no Problems (0006/0018), com a posição do risco no SQL —
> a confirmar em Q3 no design.

> HIPÓTESE: O gatilho é um comando "SQL Guard" na paleta e no menu de contexto do editor quando o
> conteúdo é SQL — a confirmar em Q4 no design.
