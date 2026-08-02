# Solicitação original

- **ID:** 0019-tasks-evidence-field
- **Tipo:** bug
- **Criada em:** 2026-08-02
- **Origem:** /sdd-kit:new (follow-up descoberto em 0018-task-generation, D-Q2b)

---

## Texto da solicitação

> Adicionar o campo "evidências necessárias" ao template _shared/tasks.md: o RF-010 exige onze campos por tarefa, mas o template só tem dez — falta "evidências necessárias". Alinhar o template ao RF-010 (fonte no plugin + sincronização para a extensão).

## Interpretação

O RF-010 (PRD §10) estabelece que cada tarefa deverá possuir **onze** campos, entre eles
"evidências necessárias". O template de tarefas do framework (`_shared/tasks.md`) só contém **dez**
— não há o campo "evidências necessárias". Logo, todo `tasks.md` gerado pelo fluxo nasce em
desacordo com o próprio RF-010. Corrigir = acrescentar o campo ao template-fonte no plugin e
sincronizar a cópia embutida na extensão.

Descoberto durante a implementação do 0018 (análise de tarefas), decisão D-Q2b: a análise passou a
checar só os 10 campos que o formato define, justamente para não sinalizar todo `tasks.md` como
incompleto enquanto o template não tivesse o campo.

## O que esta mudança entrega

- O campo **"evidências necessárias"** acrescentado ao template `_shared/tasks.md` (fonte no plugin
  + cópia sincronizada), alinhando-o ao RF-010.

## O que esta mudança deliberadamente não entrega

- **Alterar o analisador do 0018** para passar a checar os 11 campos — sinalizaria todo `tasks.md`
  legado (18 features) como incompleto; fica para uma mudança própria, se desejada.
- **Regenerar os `tasks.md` existentes** — permanecem com 10 campos até serem refeitos pelo fluxo.

## Restrições conhecidas

- O template-fonte vive em `plugins/sdd-kit/templates/` e é sincronizado para
  `extensions_vscode/templates/` (`.sync-manifest.json`) — a correção precisa dos dois em sincronia.
- pt-BR nos documentos; identificadores em inglês.
