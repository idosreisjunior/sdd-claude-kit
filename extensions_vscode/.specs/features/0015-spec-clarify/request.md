# Solicitação original

- **ID:** 0015-spec-clarify
- **Tipo:** feature
- **Criada em:** 2026-08-01
- **Origem:** /sdd-kit:new

---

## Texto da solicitação

> Clarificação da especificação (RF-008) — analisar a spec de uma mudança e identificar requisitos ambíguos, critérios de aceite ausentes, conflitos, regras incompletas, casos extremos, dependências não definidas, decisões técnicas prematuras, riscos de segurança e impactos em dados; registrar as respostas em clarifications.md.

## Interpretação

Materializar o RF-008 do PRD da extensão: a etapa de **clarificação** do fluxo SDD
(`spec → clarify → design → tasks`), entre a spec e o design. A extensão deve analisar a spec de
uma mudança e levantar as nove categorias de lacuna que o RF-008 enumera, com o resultado
registrado em `clarifications.md`. Como a análise (identificar ambiguidade, conflito, risco de
segurança) é trabalho de linguagem natural, a realização natural é **delegar ao Claude Code** —
coerente com "sem rede" e com o padrão do 0014 (RF-009), a confirmar na spec/design.

## O que esta mudança entrega

- Uma forma de, sobre a spec de uma mudança, obter uma análise de clarificação cobrindo as nove
  categorias do RF-008 (ambiguidades, critérios de aceite ausentes, conflitos, regras
  incompletas, casos extremos, dependências não definidas, decisões técnicas prematuras, riscos
  de segurança, impactos em dados).
- O resultado registrado em `clarifications.md` na pasta da mudança.

## O que esta mudança deliberadamente não entrega

- **Geração de design (RF-009, 0014)** e **research (RF-007)** — etapas próprias e distintas.
- **Resolução automática das ambiguidades** — clarificar é levantar e registrar; decidir é do
  humano (constituição, Art. 2 e 9).
- **Promoção de estado `DRAFT → CLARIFIED`** — a transição de estado é responsabilidade do fluxo
  de status, não desta análise; fica como questão.

## Restrições conhecidas

- Sem rede própria: a análise por IA passa pelo Claude Code (RNF-004, ADR-005 do padrão 0014).
- A extensão não decide pela pessoa: registra perguntas/riscos, não os resolve sozinha.
- Compatibilidade Windows/Linux/WSL (RNF-002).
