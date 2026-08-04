# Solicitação original

- **ID:** 0026-board-drag-transition
- **Tipo:** feature
- **Criada em:** 2026-08-04
- **Origem:** /sdd-kit:new

---

## Texto da solicitação

> Incremento 2 do Painel SDD (0025): arrastar um cartão entre colunas para **transicionar o estado**
> da mudança, como na SDD Builder AI.

## Interpretação

O incremento 1 (0025) entregou o kanban somente leitura. Este incremento torna o painel
**interativo**: arrastar um cartão para outra coluna **transiciona o estado** da mudança, escrevendo
`status.yaml` (nova entrada de `history` + campo `status`) e `index.yaml`, com **validação da máquina
de estados** (só transições válidas do grafo) e um **motivo obrigatório** (o schema exige `reason`).

## O que esta mudança entrega

- Arrastar-soltar no kanban de mudanças; ao soltar, a extensão resolve o estado-alvo (dos estados da
  coluna, o que é alcançável do estado atual), pede um motivo e escreve os arquivos.
- Validação: transição inválida é recusada com aviso; nada é escrito.
- O watcher já reflete a mudança no board (tempo real).

## O que esta mudança deliberadamente não entrega

- Edição livre de estado (fora do grafo) — só transições válidas.
- Desfazer/redo próprio — o histórico do `status.yaml` e o Git são o registro.

## Restrições conhecidas

- A escrita **preserva** o arquivo (comentários, block scalars, outras chaves) — por manipulação de
  texto, não round-trip de YAML.
- Respeita `plugins/sdd-kit/schemas/workflow.json` (grafo) — a extensão embute uma cópia das
  transições (pacote autônomo).
- Sem rede (RNF-004); compatibilidade Windows/Linux/WSL (RNF-002).
