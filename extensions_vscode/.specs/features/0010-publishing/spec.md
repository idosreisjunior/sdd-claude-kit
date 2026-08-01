# Feature: Publicação no Marketplace

- **ID:** 0010-publishing
- **Escopo dos identificadores:** PUB
- **Estado:** ver `status.yaml` — a autoridade é ele

---

## Objetivo

Deixar a extensão pronta para o VS Code Marketplace — metadados, empacotamento enxuto,
documentação e pipeline de publicação — sem publicar automaticamente.

## Contexto

A extensão já tem `publisher`, `license`, `categories`, `keywords` e `repository`, mas o
`package.json` não traz os metadados de Marketplace (ícone, links de bugs/homepage), o `.vsix`
inclui `.specs/` e `src/` (peso desnecessário), o `README` está desatualizado (descreve só a
fundação) e não há pipeline de publicação. A publicação em si é ato do autor (conta de
publisher, PAT, ativos) — a extensão apenas se prepara. É o encerramento do MVP (Épico 10).

## Escopo

### Incluído

- Metadados de Marketplace no `package.json` (links, gallery banner, qna).
- `.vscodeignore` enxugando o `.vsix` (sem `.specs/`, `src/`, testes, configs de dev).
- `README` revisado como página do Marketplace (comandos, configurações, estado atuais).
- Workflow de **publicação sob demanda** (GitHub Actions), protegido por `VSCE_PAT`.
- Checklist dos passos manuais do autor.

### Não incluído

- **Publicar** a extensão (ação externa do autor).
- Criar o **ícone PNG** (ativo binário do autor).
- Agregações de relatório — fora deste incremento.

---

## Decisões de escopo (2026-08-01)

| # | Decisão | Efeito |
| --- | --- | --- |
| D-Q1 | O workflow de publicação dispara no evento **GitHub Release publicado** (`release: types: [published]`). | REQ-PUB-003. |
| D-Q2 | Publica em **VS Code Marketplace (vsce) e Open VSX (ovsx)** — cada um com seu segredo (`VSCE_PAT`, `OVSX_PAT`); sem o segredo, o passo aborta. | REQ-PUB-003; NFR-PUB-002. |
| D-Q3 | O `README` traz **badges** (versão do Marketplace e status do CI) no topo. | REQ-PUB-002. |

---

## Requisitos funcionais

### REQ-PUB-001 — Empacotamento enxuto e metadados

O `.vsix` deve conter apenas o necessário para executar a extensão (não `.specs/`, `src/`,
testes, nem configs de desenvolvimento), via `.vscodeignore`, e o `package.json` deve trazer os
metadados de Marketplace viáveis (links de bugs/homepage, gallery banner, qna).

#### SCN-PUB-001 — O pacote não vaza fontes nem specs

DADO o `.vscodeignore` configurado
QUANDO o `.vsix` é empacotado
ENTÃO ele não inclui `.specs/`, `src/`, arquivos de teste nem `tsconfig`/configs de dev.

### REQ-PUB-002 — README como página do Marketplace

O `README` deve refletir o estado atual (todos os comandos e configurações) e servir de página
de descrição no Marketplace.

#### SCN-PUB-002 — README atualizado

DADO o conjunto atual de comandos e configurações
QUANDO o `README` é revisado
ENTÃO lista os comandos por feature e as configurações `sddClaudeKit.*` vigentes.

### REQ-PUB-003 — Pipeline de publicação sob demanda

Deve existir um workflow de publicação que empacota e publica a extensão **apenas sob ação
explícita** e **apenas com o segredo `VSCE_PAT` presente** — nunca em push comum.

#### SCN-PUB-003 — Publicação não dispara sozinha

DADO o workflow de publicação
QUANDO ocorre um push comum sem o gatilho de release
ENTÃO o workflow de publicação não executa a publicação.

#### SCN-PUB-004 — Sem segredo, sem publicação

DADO que o segredo `VSCE_PAT` não está configurado
QUANDO o workflow de publicação é acionado
ENTÃO a publicação falha/aborta com mensagem clara, sem publicar.

### REQ-PUB-004 — Checklist de passos manuais

A documentação deve listar os passos que só o autor pode executar: criar o ícone PNG, ter a
conta de publisher, gerar o `VSCE_PAT`, e disparar a publicação.

#### SCN-PUB-005 — Passos manuais documentados

DADO a preparação para publicação
QUANDO o autor consulta a documentação
ENTÃO encontra o checklist dos passos manuais e como executá-los.

---

## Requisitos não funcionais

### NFR-PUB-001 — Pacote verificável

O conteúdo do `.vsix` é verificável (`vsce ls`) e não contém fontes/specs/testes.

### NFR-PUB-002 — Nenhuma publicação sem credenciais/ação

Nenhuma publicação ocorre sem o segredo `VSCE_PAT` e sem o gatilho explícito de release.

---

## Critérios de aceite

- [x] O `.vsix` empacotado não inclui `.specs/`, `src/` nem testes (REQ-PUB-001).
- [x] O `README` lista os comandos e configurações atuais (REQ-PUB-002).
- [x] O workflow publica só sob release e só com `VSCE_PAT` (REQ-PUB-003, NFR-PUB-002).
- [x] O checklist de passos manuais está documentado (REQ-PUB-004).

> **Publicado (2026-08-01):** `idosreisjunior.sdd-claude-kit-vscode v0.1.0` no VS Code
> Marketplace. Publisher `idosreisjunior` criado; `VSCE_PAT` configurado; Release `v0.1.0`
> disparou `publish.yml` (run 30715541304, conclusão `success`). Open VSX pulado (sem `OVSX_PAT`).
> Encerra o Épico 10.

---

## Questões pendentes

Nenhuma pendente. Q1–Q3 foram respondidas em 2026-08-01 — ver **Decisões de escopo**.

## Hipóteses assumidas

Nenhuma em aberto. O ícone PNG do Marketplace e a conta/PAT de publisher são providos pelo autor
(passos manuais documentados); esta mudança prepara e automatiza, sem criar o ativo binário nem
publicar.
