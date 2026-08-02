# Solicitação original

- **ID:** 0016-history-decisions
- **Tipo:** feature
- **Criada em:** 2026-08-01
- **Origem:** /sdd-kit:new

---

## Texto da solicitação

> Histórico e decisões (RF-020) — manter um histórico das atividades de uma mudança (alterações na spec, aprovações, mudanças de status, execuções do Claude Code, contexto utilizado, decisões técnicas, tarefas concluídas, validações, erros, ações manuais) e permitir registrar decisões importantes como ADRs.

## Interpretação

Materializar o RF-020 do PRD da extensão: dar visibilidade ao **histórico de atividades** de uma
mudança e permitir **registrar decisões como ADRs**. Ponto central: boa parte desse histórico já
vive em artefatos versionados — `status.yaml` (`history` de status/motivos, `approval`), ADRs em
`decisions/`, `tasks.md` (tarefas concluídas), validação (0008) e commits (0007). A extensão
**agrega e apresenta** esse histórico. Outras atividades listadas (execuções do Claude Code,
contexto utilizado, erros, ações manuais) **não são capturadas hoje** — exigiriam instrumentação
nova; o subconjunto viável é a decidir na spec.

## O que esta mudança entrega

- Uma visão do **histórico de uma mudança**, agregando as fontes já existentes (mudanças de
  status e aprovações do `status.yaml`, ADRs de `decisions/`, tarefas concluídas, e o que 0007/0008
  já produzem).
- Uma forma de **registrar uma decisão como ADR** na pasta `decisions/` da mudança.

## O que esta mudança deliberadamente não entrega

- **Captura de eventos não persistidos** (execuções do Claude Code, erros de runtime, ações
  manuais) — a extensão não os registra hoje; sem uma fonte, não há o que exibir. Fica como
  questão de escopo.
- **Telemetria / envio de dados** — tudo local (RNF-004), como no 0009.
- **Reescrever o histórico** — o histórico é append-only (constituição, Art. 5); esta feature
  lê/agrega e acrescenta ADRs, não edita o passado.

## Restrições conhecidas

- Somente leitura sobre os artefatos existentes (exceto criar um novo ADR).
- Sem rede (RNF-004); compatibilidade Windows/Linux/WSL (RNF-002).
- ADRs têm numeração global e sequencial, nunca reutilizada (standards §2) — alocar exige
  reconciliar com os ADRs já existentes.
