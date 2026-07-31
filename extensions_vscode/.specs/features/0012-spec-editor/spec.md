# Feature: Editor de especificações (RF-006)

- **ID:** 0012-spec-editor
- **Escopo dos identificadores:** EDIT
- **Estado:** ver `status.yaml` — a autoridade é ele
- **Requisitos de produto cobertos:** RF-006 (PRD §11); PRD §13.2

---

## Objetivo

Permitir **editar** os documentos do SDD dentro do editor, com uma visão consciente
da estrutura (requisitos, cenários, critérios) — não só ler (0003) nem editar
Markdown cru à mão. É a contraparte de edição do dashboard.

## Contexto

Hoje os artefatos `.specs` são editados como texto cru. Isso é frágil: erros de
sintaxe passam despercebidos (o bug 0011 — aspas quebrando YAML — é dessa família),
e a estrutura (REQ/SCN/critérios) não é visível durante a edição. O dashboard (0003)
mostra o estado; falta a superfície para **mudar** o conteúdo com segurança.

O ADR-005 (0003) deliberadamente **não** decidiu a base do editor — deixou para este
incremento (candidato a `CustomTextEditor`). Este é o épico do PRD com mais modos
(formulário, Markdown, renderizado, diff) e mais documentos; será entregue em
incrementos.

## Escopo

### Incluído (primeiro incremento — proposto, sujeito ao ADR)

- **Base do editor** (decisão Q1) para os documentos Markdown de uma mudança.
- **Edição Markdown** do `spec.md` com salvamento seguro no arquivo (fonte de
  verdade).
- **Visualização renderizada consciente de SDD**: destaca os identificadores
  (REQ-*, SCN-*, TASK-*) e a estrutura de seções, para navegar a spec enquanto edita.

### Não incluído (incrementos seguintes / dependências)

- **Formulário estruturado** (editar requisitos/cenários por campos) — exige um
  contrato de ida-e-volta com o Markdown; alto risco de perda de dados (lição do
  bug 0006/0011). Incremento próprio, com decisão própria (Q3).
- **Comparação de versões (diff)** — incremento seguinte.
- Documentos que **outras features produzem**: research (0007+), clarificações,
  design, tarefas, evidências (0008), validação (0008) — editáveis quando existirem.
- Edição dos YAML de máquina (`status.yaml`, `index.yaml`) por formulário —
  arriscado; a serialização deve casar com os schemas (ver 0002/ADR-004).

---

## Requisitos funcionais

### REQ-EDIT-001 — Abrir um documento de spec no editor

O usuário deve poder abrir um documento `.specs` (começando por `spec.md`) numa
superfície de edição da extensão, a partir do painel Features ou do próprio arquivo.

#### SCN-EDIT-001 — Abrir o editor

DADO uma mudança com `spec.md`
QUANDO o usuário aciona "Editar spec"
ENTÃO o documento abre na superfície de edição da extensão.

### REQ-EDIT-002 — Editar e salvar Markdown com segurança

O usuário deve poder editar o Markdown e salvar; o conteúdo salvo deve ser
exatamente o texto editado, sem transformação com perda (a CLI continua lendo).

#### SCN-EDIT-002 — Salvar preserva o conteúdo

DADO um `spec.md` aberto no editor
QUANDO o usuário edita e salva
ENTÃO o arquivo em disco contém exatamente o texto editado
E nenhuma seção ou identificador é perdido.

### REQ-EDIT-003 — Visão consciente de SDD

A visualização deve destacar os identificadores (REQ-*, SCN-*, TASK-*, NFR-*) e a
estrutura de seções, para orientar a edição.

#### SCN-EDIT-003 — Identificadores destacados

DADO um `spec.md` com requisitos e cenários
QUANDO o documento é visualizado
ENTÃO os identificadores e cabeçalhos aparecem destacados/navegáveis.

---

## Requisitos não funcionais

### NFR-EDIT-001 — Sem perda de dados no salvamento

Salvar nunca pode corromper nem truncar o documento. O texto salvo é o texto do
editor; qualquer transformação (ex.: normalização) é reversível e verificada.

### NFR-EDIT-002 — Superfície segura

Se a base for webview, aplicam-se as regras do NFR-UI-002 (CSP + nonce, sem rede,
sem execução de código do projeto). A leitura/escrita usa `workspace.fs`
(Windows/Linux/WSL).

---

## Critérios de aceite

- [ ] "Editar spec" abre o documento na superfície da extensão (SCN-EDIT-001).
- [ ] Editar e salvar preserva o conteúdo exatamente (SCN-EDIT-002, NFR-EDIT-001).
- [ ] Identificadores e seções aparecem destacados (SCN-EDIT-003).
- [ ] Se webview, a superfície aplica CSP + nonce (NFR-EDIT-002).

---

## Questões pendentes

| # | Questão | Bloqueia | Prioridade |
| --- | --- | --- | --- |
| Q1 | Base do editor: **CustomTextEditor** (atado ao arquivo, edição nativa) ou **Webview panel** com edição própria? Deixada em aberto pelo ADR-005. Candidato a ADR. | REQ-EDIT-001/002 (base) | alta |
| Q2 | Quais documentos entram no primeiro incremento — só `spec.md`, ou também `request.md`? | escopo do incremento | média |
| Q3 | O formulário estruturado (incremento futuro) parseia o Markdown para campos, ou edita blocos delimitados? A lição do 0006/0011 é evitar parse frágil com perda. | REQ (form, futuro) | média |

## Hipóteses assumidas

> HIPÓTESE: o primeiro incremento é **Markdown + visualização renderizada** (dois dos
> quatro modos do PRD); formulário estruturado e diff são incrementos seguintes.

> HIPÓTESE: o arquivo em disco permanece a fonte de verdade; o editor lê e escreve
> nele via `workspace.fs`, sem estado paralelo.

> HIPÓTESE: a base provável é `CustomTextEditor` (o PRD/§13.2 e o ADR-005 apontam
> para isso), a confirmar por Q1.
