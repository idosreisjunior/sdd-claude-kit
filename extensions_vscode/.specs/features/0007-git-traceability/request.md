# Solicitação original

- **ID:** 0007-git-traceability
- **Tipo:** feature
- **Criada em:** 2026-07-31
- **Origem:** Backlog do MVP (Épico 7 do PRD); materializada a pedido do usuário para especificar e implementar.

---

## Texto da solicitação

> Começar a especificar e implementar a feature 0007 — Git e rastreabilidade. Cobre os
> requisitos de produto RF-014 (detecção de mudanças fora do escopo), RF-015
> (rastreabilidade navegável) e RF-018 (integração com Git, sem commit automático).

## Interpretação

A feature dá à extensão a capacidade de **ler o estado do Git** do workspace (branch,
arquivos alterados/não rastreados, diff, conflitos — RF-018), **detectar mudanças fora do
escopo** de uma tarefa comparando o que foi planejado com o que o Git mostra ter mudado
(RF-014), e **navegar a cadeia de rastreabilidade** requisito → tarefa → arquivo → teste a
partir do `traceability.yaml` (RF-015). É o componente "Traceability + Git Adapter" da
arquitetura (§2). Nenhum commit é feito sem ação explícita do usuário (RF-018, constituição
Art. 8) — a extensão apenas lê e, no máximo, sugere.

## O que esta mudança entrega

Um adapter de Git somente-leitura (estado + diff), a detecção de mudanças fora do escopo de
uma tarefa, e a navegação da matriz de rastreabilidade. A implementação é incremental: o
primeiro incremento estabelece o adapter de Git e a detecção de escopo; a navegação de
rastreabilidade e as sugestões (branch/commit) vêm em incrementos seguintes.

## O que esta mudança deliberadamente não entrega

- **Commit, push ou qualquer escrita no repositório** — a extensão nunca commita sozinha
  (RF-018); no máximo sugere nome de branch e mensagem de commit para o usuário aplicar.
- **Integração com GitHub** (issues, PRs) — é o RF-019, explicitamente pós-MVP.
- **Coleta de evidências e validação da feature** — são os RF-016/RF-017, feature 0008.
- **Resolução de conflitos** — a extensão apenas identifica que há conflito.

## Restrições conhecidas

- Nenhuma escrita no repositório sem autorização explícita (RF-018, arquitetura §8).
- Sem I/O de rede (ADR-005).
- Núcleo de parsing e detecção puro e testável, separado da borda que executa o Git
  (standards §6), à semelhança de 0005/0006.
- Robusto a workspace sem Git ou com Git indisponível: degrada para estado informativo.
