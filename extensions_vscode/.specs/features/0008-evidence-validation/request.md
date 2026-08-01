# Solicitação original

- **ID:** 0008-evidence-validation
- **Tipo:** feature
- **Criada em:** 2026-07-31
- **Origem:** Backlog do MVP (Épico 8 do PRD); materializada a pedido do usuário para especificar e implementar.

---

## Texto da solicitação

> Seguir para o Épico 8 — evidências e validação da feature. Cobre RF-016 (coletar e
> organizar evidências da implementação) e RF-017 (validar a feature: comparar a
> implementação final com requisitos, critérios, tarefas, testes e evidências, classificando
> cada requisito).

## Interpretação

A feature dá à extensão duas capacidades complementares:

- **Validação (RF-017):** para uma mudança, comparar a matriz de rastreabilidade e o estado
  (requisitos × cenários × tarefas × testes × implementação × evidências) e **classificar cada
  requisito** como atendido, parcialmente atendido, não atendido, não testado ou não aplicável,
  destacando pendências e divergências num relatório.
- **Evidências (RF-016):** coletar e organizar as evidências disponíveis da implementação
  (testes, lint, build, cobertura, commits, diff, checklist, validação manual…) num
  `evidence.md`, e exigir confirmação explícita para concluir sem evidência.

É o componente "Evidence + Validation Engine" da arquitetura (§2), que consome a rastreabilidade
da 0007. A implementação é incremental.

## O que esta mudança entrega

Um relatório de validação por mudança (classificação de cada requisito) e a coleta/organização
de evidências. Incremental: o primeiro incremento entrega uma das duas capacidades; a outra vem
a seguir.

## O que esta mudança deliberadamente não entrega

- **Execução automática de comandos** sem ação/revisão explícita — os comandos de validação do
  `config.yaml` são entrada não confiável (arquitetura §6); nada roda sozinho.
- **Conclusão de tarefa sem evidência** sem confirmação explícita do usuário (RF-016).
- Integração com GitHub/PR (RF-019, pós-MVP) e métricas (RF-021/022, feature 0009).

## Restrições conhecidas

- Núcleo de análise/classificação puro e testável, separado da borda (standards §6).
- Sem I/O de rede (ADR-005).
- Somente leitura por padrão; qualquer escrita (evidence.md) ou execução de comando exige ação
  explícita do usuário.
- Reusa a matriz de rastreabilidade da 0007 e os artefatos da mudança.
