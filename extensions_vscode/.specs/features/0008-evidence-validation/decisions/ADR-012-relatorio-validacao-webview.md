# ADR-012 — Relatório de validação como WebviewPanel

- **Status:** Aceito
- **Data:** 2026-08-01
- **Origem:** questão Q2 da spec de 0008 — onde apresentar o relatório de validação (RF-017)?
- **Decidido em:** TASK-EVID-001

---

## Contexto

O RF-017/REQ-EVID-001 pede classificar cada requisito (atendido / parcial / não testado / não
atendido / não aplicável) e destacar pendências. As superfícies possíveis:

- **WebviewPanel** (aba do editor): tabela por requisito com categorias coloridas e um resumo.
  É o formato natural de um relatório; segue o padrão já usado no dashboard (0003) e no painel
  Projeto (0013). Núcleo puro (classificação + render) testável; a borda só hospeda o painel.
- **Canal de saída**: simples, mas texto puro — perde a leitura em tabela colorida por categoria.
- **Diagnostics (Problems)**: navegável e idiomático para "problemas", mas força ancorar cada
  requisito a uma linha de arquivo, e um requisito não é um problema pontual num arquivo — é um
  veredito sobre a cobertura. Distorce a metáfora.

## Decisão

**Apresentar o relatório num `WebviewPanel`**, como o dashboard. O núcleo é puro:
`validationReport.ts` classifica cada requisito a partir da matriz de rastreabilidade e dos
`gaps` (heurística D-Q3), e `validationHtml.ts` renderiza o HTML com **CSP + nonce** (sem
scripts, sem rede), escapando todo texto. A borda cria o painel e injeta o HTML.

## Alternativas consideradas

| Alternativa | Por que não |
| --- | --- |
| Canal de saída | Texto puro; perde a tabela colorida por categoria |
| Diagnostics (Problems) | Requisito não é problema pontual num arquivo; ancoragem forçada distorce a leitura |

## Consequências

**Positivas**

- Leitura em tabela com resumo e categorias coloridas.
- Reusa o padrão núcleo-puro + webview já provado; classificação testável.

**Negativas**

- Um webview custa mais que um canal de texto. **Mitigação:** render sob demanda, a partir de
  dados já em disco (a matriz), sem executar nada (NFR-EVID-004).

## Limite desta decisão

Cobre a **apresentação** do relatório de validação (RF-017, incremento 1). A coleta de
evidências (RF-016) e a trava de conclusão são incrementos seguintes e podem reusar o mesmo
webview ou uma superfície própria — a decisão da validação já estará tomada.
