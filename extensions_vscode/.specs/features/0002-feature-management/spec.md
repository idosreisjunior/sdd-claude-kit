# Feature: Gerenciamento de features

- **ID:** 0002-feature-management
- **Escopo dos identificadores:** FEAT
- **Estado:** ver `status.yaml` — a autoridade é ele
- **Requisitos de produto cobertos:** RF-003, RF-004 (PRD §11); PRD §10, §13.1

---

## Objetivo

Dar função ao painel Features: ler as mudanças de `.specs/index.yaml`, listá-las
agrupadas por status, abrir seus documentos e (adiante) criar novas features.

## Contexto

A fundação (0001) deixou o painel Features como uma casca com um nó guia. Esta
feature o torna útil — é o primeiro recurso que mostra o estado real do projeto
na interface.

## Escopo

### Incluído

- Ler o índice e listar as features agrupadas por status (RF-004).
- Abrir a `spec.md` de uma feature ao clicar.
- Criar feature por formulário (RF-003) — via ADR-004 (scaffolder determinístico).
- Progresso de tarefas `done/total` por feature.

### Não incluído

- Dashboard da feature (RF-005) e editor visual (RF-006) — feature 0003.
- Filtros avançados (responsável, tag, módulo) — incremento posterior.

---

## Requisitos funcionais

### REQ-FEAT-001 — Ler o índice de mudanças

A extensão deve ler `.specs/index.yaml` e extrair, de cada mudança, id, tipo,
título, status e caminho.

#### SCN-FEAT-001 — Índice válido

DADO um `.specs/index.yaml` com mudanças
QUANDO o painel Features é carregado
ENTÃO cada mudança é lida com seus campos.

### REQ-FEAT-002 — Listar agrupado por status

O painel deve exibir as features **agrupadas por status** (Rascunho, Em
desenvolvimento, Bloqueadas, Em validação, Concluídas, Canceladas), omitindo
grupos vazios.

#### SCN-FEAT-002 — Agrupamento

DADO mudanças em estados diferentes
QUANDO o painel é carregado
ENTÃO cada uma aparece sob o grupo correspondente ao seu status
E grupos sem mudanças não são exibidos.

### REQ-FEAT-003 — Abrir a spec ao clicar

Clicar em uma feature deve abrir o seu `spec.md`.

#### SCN-FEAT-003 — Abrir spec

DADO uma feature listada no painel
QUANDO o usuário clica nela
ENTÃO o `spec.md` correspondente é aberto no editor.

### REQ-FEAT-004 — Criar feature (formulário)

O usuário deve poder criar uma feature por formulário (tipo, título, slug,
escopo), com alocação de identificador, criação da pasta e dos documentos
iniciais e registro no índice em `DRAFT` (RF-003).

> Implementado — ver TASK-FEAT-006 e **ADR-004**. O formulário é um scaffolder
> determinístico: aloca o id reconciliando com o disco, escreve `status.yaml` por
> substituição de template e insere a entrada do `index.yaml` por edição textual
> (preserva comentários). O rascunho inteligente da spec é delegado a
> `/sdd-kit:spec`.

### REQ-FEAT-005 — Progresso de tarefas

O painel deve mostrar o progresso de tarefas de cada feature, a partir dos
contadores em `status.yaml`.

> Implementado — ver TASK-FEAT-007 (`done/total` no item, via `parseTaskProgress`).

---

## Requisitos não funcionais

### NFR-FEAT-001 — Leitura robusta

Índice ausente, YAML inválido ou estrutura inesperada não podem quebrar o painel:
o resultado é uma lista vazia com um nó informativo, nunca uma exceção.

---

## Critérios de aceite

- [x] As mudanças de `index.yaml` são lidas com todos os campos (SCN-FEAT-001).
- [x] As features aparecem agrupadas por status, sem grupos vazios (SCN-FEAT-002).
- [x] Clicar em uma feature abre sua `spec.md` (SCN-FEAT-003).
- [x] Índice ausente/ inválido mostra nó informativo, sem quebrar (NFR-FEAT-001).
- [x] O painel mostra o progresso `done/total` por feature (REQ-FEAT-005).
- [x] Criar feature pelo formulário aloca id e escreve arquivos lidos pela CLI
  (REQ-FEAT-004, ADR-004); a renderização/UI fica para a verificação no host.

---

## Questões pendentes

Nenhuma em aberto.

> Q1 (alocação de id/slug e serialização do YAML na criação) foi resolvida por
> **ADR-004** (`decisions/`). A4 (parser de YAML) foi resolvida por **ADR-003**.

## Hipóteses assumidas

> HIPÓTESE: o mapeamento estado SDD → grupo do painel adotado é: DRAFT/CLARIFIED/
> DESIGNED/PLANNED → Rascunho; APPROVED/IN_PROGRESS → Em desenvolvimento; BLOCKED
> → Bloqueadas; VERIFIED → Em validação; ARCHIVED → Concluídas; CANCELLED →
> Canceladas. Sujeito a revisão quando o dashboard (0003) existir.
