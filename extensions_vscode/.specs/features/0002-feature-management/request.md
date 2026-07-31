# Solicitação original

- **ID:** 0002-feature-management
- **Tipo:** feature
- **Criada em:** 2026-07-31
- **Origem:** decomposição do PRD (Épico 2 §24, RF-003/RF-004)

---

## Texto da solicitação

> Gerenciamento visual de features: criar, listar, ver status e progresso das
> features dentro do painel da extensão.

## Interpretação

Depois da fundação (0001), esta feature dá **função** ao painel Features: ler as
mudanças de `.specs/index.yaml`, exibi-las agrupadas por status, permitir abrir
seus documentos e, adiante, criar novas features por formulário (RF-003).

## O que esta mudança entrega

- Leitura do índice e listagem das features agrupadas por status no painel.
- Abrir a spec de uma feature ao clicar.
- (Incrementos seguintes) criar feature por formulário e mostrar progresso de tarefas.

## O que esta mudança deliberadamente não entrega

- Dashboard rico da feature (RF-005) e editor de specs (RF-006) — feature 0003.
- Transição de status pela UI — depende de regras da máquina de estados; incremento próprio.

## Restrições conhecidas

- A estrutura lida é a mesma da CLL do plugin; a extensão não pode assumir um
  formato próprio de `.specs`.
- Leitura tolerante a falhas: índice ausente ou inválido não pode quebrar o painel.
