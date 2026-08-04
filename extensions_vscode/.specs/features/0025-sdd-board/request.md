# Solicitação original

- **ID:** 0025-sdd-board
- **Tipo:** feature
- **Criada em:** 2026-08-04
- **Origem:** /sdd-kit:new

---

## Texto da solicitação

> A interface gráfica está simples demais; quero uma interface com mais cara de sistema e vários
> recursos, mostrando em tempo real um kanban com o acompanhamento das tasks. Algo parecido com a
> extensão SDD Builder AI.

## Interpretação

Referência (SDD Builder AI, `CoeusAI.sdd-platform`): um **Kanban** com colunas de workflow, um
**Overview** com métricas de saúde do projeto e acompanhamento em tempo real. Mapeando ao nosso
modelo (`.specs/` + máquina de estados DRAFT→…→ARCHIVED):

- **Kanban das mudanças** — colunas pelos grupos de status já existentes (os mesmos do painel
  Features), cartões = mudanças com progresso de tarefas, **atualizando ao vivo**.
- **Overview** — contadores e % concluído no topo.
- **Drill-down de tarefas** — abrir uma mudança mostra o kanban das tarefas dela.

O tempo real reusa o watcher de `.specs/*.yaml` que já existe. Diferente dos demais webviews (sem
script, ADR-005), este painel precisa de **script** para render client-side e atualização sem
recarregar — registrado num ADR novo.

## O que esta mudança entrega (incremento 1)

- Painel "Painel SDD": kanban das mudanças por status + overview, ao vivo.
- Drill-down de tarefas (pendente/em progresso/concluída) por mudança.
- Somente leitura: clicar num cartão abre o dashboard.

## O que esta mudança deliberadamente não entrega

- **Arrastar cartão para transicionar o estado** (escreve `status.yaml`) — incremento 2, por exigir
  validação da máquina de estados, histórico e motivo.
- Requirement board / split-diff da referência — fora do escopo deste incremento.

## Restrições conhecidas

- Segurança do webview: CSP com nonce; texto inserido por `textContent` (sem injeção). `enableScripts`
  só neste painel — exceção justificada ao ADR-005.
- Sem rede (RNF-004); compatibilidade Windows/Linux/WSL (RNF-002).
