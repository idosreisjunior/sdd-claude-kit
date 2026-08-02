# Bug: Template tasks.md sem o campo "evidências necessárias" (RF-010)

- **ID:** 0019-tasks-evidence-field
- **Escopo dos identificadores:** TEVF
- **Estado:** ver `status.yaml` — a autoridade é ele
- **Severidade:** baixa

---

## Comportamento observado

O template de tarefas `plugins/sdd-kit/templates/pt-BR/_shared/tasks.md` (e a cópia sincronizada
`extensions_vscode/templates/pt-BR/_shared/tasks.md`) define, por bloco de tarefa, **dez** campos:
identificador e título (cabeçalho `## TASK-… — …`), requisitos, dependências, complexidade, status,
descrição, arquivos prováveis, testes esperados e critério de conclusão. **Não há** o campo
"evidências necessárias". Assim, todo `tasks.md` gerado pelo fluxo nasce com dez campos.

## Comportamento esperado

Cada bloco de tarefa do template deve conter os **onze** campos que o RF-010 exige — incluindo
**"evidências necessárias"**.

## Regra violada

**RF-010** (PRD §10): "Cada tarefa deverá possuir: identificador; título; descrição; arquivos
prováveis; dependências; requisitos relacionados; critérios de conclusão; testes esperados;
complexidade; status; **evidências necessárias**." O template omite o último.

## Reprodução

1. Abrir `plugins/sdd-kit/templates/pt-BR/_shared/tasks.md`.
2. Localizar o bloco de tarefa (`## {{TASK_ID}} — {{TASK_TITLE}}` e as sub-seções).
3. Contar os campos: há dez; não existe nenhuma seção/rótulo para "evidências necessárias".

**Frequência:** determinística (o template é fixo).
**Ambiente:** independente de SO — é conteúdo de arquivo.
**Primeira ocorrência conhecida:** desde a criação do template `_shared/tasks.md`.

## Impacto

- Todo `tasks.md` gerado pelo fluxo fica em desacordo com o RF-010.
- O analisador de tarefas (0018, RF-010) não pode checar os onze campos sem sinalizar todo
  `tasks.md` como incompleto — por isso o 0018 checa só dez (D-Q2b). Contorno em vigor.
- Baixa severidade: nada quebra em runtime; é conformidade do framework com o próprio requisito.

---

## Causa raiz

O template `_shared/tasks.md` nunca incluiu uma seção para "evidências necessárias" — omissão desde
a sua criação. Não há bug de código; é o conteúdo do template que está incompleto perante o RF-010.

## Escopo da correção

### Incluído

- Acrescentar o campo **"evidências necessárias"** ao template-fonte
  `plugins/sdd-kit/templates/pt-BR/_shared/tasks.md` e **sincronizar** a cópia embutida na extensão.

### Não incluído

- **Alterar o analisador do 0018** para checar os onze campos — sinalizaria todo `tasks.md` legado;
  fica para uma mudança própria.
- **Regenerar os `tasks.md` existentes** — permanecem com dez campos até serem refeitos pelo fluxo.

---

## Cenários de regressão

### SCN-TEVF-001 — Template contém o campo

DADO o template `_shared/tasks.md`
QUANDO se procura pela seção `### Evidências necessárias` no bloco de tarefa
ENTÃO ela existe.

### SCN-TEVF-002 — Fonte e cópia sincronizadas

DADO o template-fonte no plugin e a cópia embutida na extensão
QUANDO se roda a verificação de sincronização (`check-templates`)
ENTÃO as duas são idênticas (manifesto consistente).

---

## Critérios de aceite

- [ ] Existe um teste que **falha antes da correção e passa depois** — verifica que o template
      `_shared/tasks.md` contém a seção `### Evidências necessárias` (SCN-TEVF-001).
- [ ] `check-templates` confirma fonte e cópia idênticas (SCN-TEVF-002).
- [ ] Nenhum teste existente foi alterado para acomodar a correção.
- [ ] O bloco de tarefa do template passa a ter os onze campos do RF-010.

---

## Decisão (Q1) — formato do campo

Respondida pelo autor em 2026-08-02: o campo entra como **seção de conteúdo `### Evidências
necessárias`**, ao lado de "Testes esperados" e "Critério de conclusão", com uma orientação
`{{guia: …}}`. Os metadados `**Requisitos:**`/`**Status:**` são para valores curtos; "evidências
necessárias" é descritivo, então segue o padrão de seção.

## Questões pendentes

Nenhuma pendente — Q1 (formato do campo) foi decidida acima.

## Hipóteses assumidas

Nenhuma em aberto.
