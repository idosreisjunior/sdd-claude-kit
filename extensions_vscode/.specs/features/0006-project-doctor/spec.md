# Feature: Project Doctor — diagnóstico estrutural de `.specs`

- **ID:** 0006-project-doctor
- **Escopo dos identificadores:** PD
- **Estado:** ver `status.yaml` — a autoridade é ele
- **Requisitos de produto cobertos:** RF-002 (PRD §11); arquitetura §2 (Project Doctor)

---

## Objetivo

Dar ao usuário um **diagnóstico da saúde estrutural** do projeto SDD: apontar arquivos
obrigatórios ausentes, mudanças com status ausente/inválido, incoerências entre o
`index.yaml` e os `status.yaml`, specs ausentes e diretórios órfãos — apresentados no
**painel Problems** do VS Code, com sugestão de correção. O Doctor **aponta, não corrige**.

## Contexto

A fundação (0001) diagnostica o workspace (tem `.specs`? Git? Claude Code?) e o
gerenciamento (0002) lê o índice. Falta a verificação que olha *dentro* de `.specs` e diz
o que está quebrado, no lugar idiomático do editor: o painel Problems.

O RF-002 é grande e mistura checagens estruturais, semânticas e de Git. Esta mudança
entrega o **núcleo estrutural**; o semântico é do Evidence/Validation (0008) e os riscos de
Git são do Git Adapter (0007) — ver Escopo. A **superfície** de apresentação é a questão Q1,
resolvida por **ADR-009** (Diagnostics API / painel Problems).

## Escopo

### Incluído (este incremento)

- Diagnóstico estrutural puro de `.specs`, com severidade e sugestão:
  - arquivo de projeto obrigatório ausente (config, index, constitution, architecture,
    standards, vision, glossary);
  - mudança do índice sem `status.yaml`, ou com status fora do conjunto válido;
  - status divergente entre `index.yaml` e o `status.yaml` da mudança;
  - `spec.md` ausente numa mudança do índice;
  - diretório de mudança no disco não registrado no `index.yaml` (órfão);
  - ausência de Git (aviso); Claude Code não detectado (informativo).
- Apresentação no **painel Problems** (Diagnostics API), acionada por um comando.

### Não incluído

- **Checagens semânticas** (tarefa sem critério de aceite, divergência tarefa↔spec,
  documento desatualizado, órfãos de rastreabilidade) — feature 0008.
- **Riscos de Git** (branch, alterações pendentes) — feature 0007.
- **Correção automática** — o Doctor não corrige (arquitetura §2).
- **Verificação de links Markdown para arquivos inexistentes** — incremento futuro.

---

## Requisitos funcionais

### REQ-PD-001 — Diagnosticar a estrutura do projeto

A extensão deve produzir, a partir de um retrato do projeto (arquivos presentes, mudanças do
índice, status em disco, diretórios de mudança, Git, Claude Code), uma lista de diagnósticos
com **severidade** (erro / aviso / informativo), **mensagem** em pt-BR, o **caminho** a que
se referem e uma **sugestão de correção**.

#### SCN-PD-001 — Projeto saudável não gera erros nem avisos

DADO um projeto com todos os arquivos obrigatórios, todas as mudanças com `status.yaml`
válido e coerente com o índice, e sem diretórios órfãos
QUANDO o diagnóstico roda
ENTÃO não há diagnósticos de erro nem de aviso
E, no máximo, um informativo (ex.: Claude Code não detectado).

#### SCN-PD-002 — Mudança sem `status.yaml`

DADO uma mudança listada no `index.yaml` sem `status.yaml` no disco
QUANDO o diagnóstico roda
ENTÃO é gerado um **erro** apontando o `status.yaml` ausente da mudança
E a sugestão indica criar o arquivo a partir do template, em DRAFT.

#### SCN-PD-003 — Status divergente entre índice e disco

DADO uma mudança cujo status no `index.yaml` difere do status no `status.yaml`
QUANDO o diagnóstico roda
ENTÃO é gerado um **aviso** nomeando os dois valores
E a sugestão indica reconciliar o índice com o `status.yaml`.

#### SCN-PD-004 — Diretório de mudança órfão

DADO um diretório de mudança no disco (ex.: `features/0099-x`) não registrado no `index.yaml`
QUANDO o diagnóstico roda
ENTÃO é gerado um **aviso** apontando o diretório órfão
E a sugestão indica registrá-lo no índice ou removê-lo.

#### SCN-PD-005 — Arquivo de projeto obrigatório ausente

DADO um projeto sem `.specs/project/constitution.md`
QUANDO o diagnóstico roda
ENTÃO é gerado um **erro** apontando o arquivo obrigatório ausente.

### REQ-PD-002 — Apresentar no painel Problems

A extensão deve apresentar os diagnósticos no **painel Problems** do VS Code (Diagnostics
API), cada um ancorado ao arquivo pertinente, acionada por um comando a partir do painel
Projeto. Rodar de novo substitui os diagnósticos anteriores (sem duplicar).

#### SCN-PD-006 — Diagnóstico aparece no Problems

DADO um projeto com ao menos um problema estrutural
QUANDO o usuário aciona "Diagnosticar projeto"
ENTÃO os diagnósticos aparecem no painel Problems, ancorados aos arquivos
E rodar de novo não duplica os itens.

---

## Requisitos não funcionais

### NFR-PD-001 — Aponta, não corrige

O Project Doctor é somente-leitura: identifica e sugere, mas **não altera** nenhum arquivo
(arquitetura §2, §8).

### NFR-PD-002 — Leitura robusta

Arquivo ausente, `status.yaml`/`index.yaml` inválido ou estrutura inesperada não podem
quebrar o diagnóstico: viram um diagnóstico (ausente/inválido), nunca uma exceção
(NFR herdada de 0002/0003).

### NFR-PD-003 — Núcleo testável fora do host

A lógica de diagnóstico vive em um módulo puro (`projectDoctor.ts`), sem API do VS Code, com
teste unitário. A borda (`extension.ts`) coleta o retrato do disco e publica na Diagnostics
API — verificada por F5.

---

## Critérios de aceite

- [ ] Projeto saudável não gera erro nem aviso (SCN-PD-001).
- [ ] Mudança sem `status.yaml` gera erro apontando o arquivo (SCN-PD-002).
- [ ] Status divergente índice↔disco gera aviso nomeando os dois valores (SCN-PD-003).
- [ ] Diretório de mudança órfão gera aviso (SCN-PD-004).
- [ ] Arquivo de projeto obrigatório ausente gera erro (SCN-PD-005).
- [ ] Os diagnósticos aparecem no painel Problems e rodar de novo não duplica (SCN-PD-006).
- [ ] Nada é alterado no disco (NFR-PD-001).
- [ ] Artefato ausente/inválido não quebra o diagnóstico (NFR-PD-002).
- [ ] O núcleo (`diagnose`) tem teste unitário e passa fora do host (NFR-PD-003).

---

## Questões pendentes

Nenhuma em aberto — Q1 resolvida por **ADR-009** (`decisions/`):

- **Q1 (média)** → **Superfície = Diagnostics API / painel Problems.** É o que o RF-002 pede
  ("painel semelhante ao Problems") e o lugar idiomático do editor; uma TreeView ou webview
  próprios seriam mais trabalho e menos integrados à navegação.

## Hipóteses assumidas

Nenhuma pendente. O recorte "estrutural agora, semântico em 0008, Git em 0007" é decisão de
escopo registrada acima, não hipótese silenciosa.
