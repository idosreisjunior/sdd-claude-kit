# Tarefas — Geração do design técnico (RF-009)

Complexidade: **P** pequena (≤ meio dia) · **M** média (≈ 1 dia) · **G** grande
(deve ser dividida antes de começar).

> Plano montado a partir dos requisitos, **sem design técnico prévio** (clarify/design são de
> Fase 2). As pendências de design Q1/Q2 foram resolvidas por **TASK-DSGN-001 (ADR-014)**, que
> fixou o **modelo híbrido**: a extensão escreve um `design.md`-esqueleto a partir de um novo
> template `feature/design.md` e reusa a ação `design` do adapter 0004 para o conteúdo assistido
> por IA (Fase 2). As tarefas 002/003 seguem essa decisão.

---

## Ordem de execução

```
TASK-DSGN-001 (ADR-014: mecanismo + template) ✅
        │
        ▼
TASK-DSGN-002 (núcleo puro: pré-condição + esqueleto do template + sync) ✅
        │
        ▼
TASK-DSGN-003 (ação no dashboard: disponibilidade + confirmação de sobrescrita + reuso 0004) ✅
```

Caminho crítico: **TASK-DSGN-001 → TASK-DSGN-002 → TASK-DSGN-003** (linear; nada paralelizável).

---

## TASK-DSGN-001 — ADR-014: mecanismo da geração de design e template do `design.md`

**Requisitos:** REQ-DSGN-002, NFR-DSGN-002
**Dependências:** —
**Complexidade:** P
**Status:** done

### Descrição

Resolver as duas decisões de design da spec e registrá-las em ADR: **(Q1)** o "gerar" reusa a
ação `design` do adapter 0004 (`/sdd-kit:design`, RF-011, ADR-007), sem reimplementar terminal;
**(Q2)** a estrutura do `design.md` (seções do RF-009) vem de um novo template
`templates/pt-BR/feature/design.md`. Modelo **híbrido**: a extensão escreve o esqueleto (auxiliar,
hoje) e delega o conteúdo por IA ao Claude Code (gerar, Fase 2).

### Arquivos prováveis

- `.specs/features/0014-design-generation/decisions/ADR-014-mecanismo-de-geracao-de-design.md`

### Testes esperados

- Nenhum — decisão/documentação (ver `gaps`).

### Critério de conclusão

- ADR-014 escrito, decidindo Q1 e Q2; questões Q1/Q2 marcadas como resolvidas. ✅

---

## TASK-DSGN-002 — Núcleo puro: pré-condição, esqueleto por template e sync do template

**Requisitos:** REQ-DSGN-001, REQ-DSGN-002, NFR-DSGN-001, NFR-DSGN-002
**Dependências:** TASK-DSGN-001
**Complexidade:** M
**Status:** done

### Descrição

Adicionar o template `feature/design.md` no **plugin** e **sincronizá-lo** para a extensão
(`.sync-manifest.json`: fileCount 18 → 19 e hashes). `designGenerator.ts` (novo), puro, sem a API
do VS Code: `canGenerateDesign(status)` decide a disponibilidade pela pré-condição
**`approval != null`** (D-Q4); `buildDesignSkeleton(template, change)` resolve o template do RF-009
mantendo as seções sem informação **marcadas como lacuna** (D-Q6), sem inventar conteúdo. Sem I/O
de rede (o "gerar" por IA é o reuso do 0004, não aqui).

### Arquivos prováveis

- `plugins/sdd-kit/templates/pt-BR/feature/design.md` (fonte)
- `extensions_vscode/templates/pt-BR/feature/design.md` (sincronizado)
- `extensions_vscode/templates/.sync-manifest.json`
- `src/sdd/designGenerator.ts`

### Testes esperados

- TEST-DSGN-001 — `canGenerateDesign`: `approval == null` → indisponível; `approval != null` → disponível
- TEST-DSGN-002 — `buildDesignSkeleton`: contém todas as seções do RF-009; seções sem informação marcadas como lacuna

### Critério de conclusão

- TEST-DSGN-001 e TEST-DSGN-002 passam; nenhum import de `vscode` nem de rede em `designGenerator.ts`;
  manifesto de sync consistente.

---

## TASK-DSGN-003 — Ação no dashboard: disponibilidade por aprovação, sobrescrita e reuso do 0004

**Requisitos:** REQ-DSGN-001, REQ-DSGN-003, NFR-DSGN-003
**Dependências:** TASK-DSGN-002
**Complexidade:** M
**Status:** done

### Descrição

Expor a ação "Gerar design" na **feature** (D-Q3). Descoberta na implementação: o dashboard é um
webview **read-only** (`enableScripts:false`, sem botões), então a ação é um **comando no item da
feature** no painel Features — o mesmo padrão de todas as ações do 0004/0008/0009 —, não um botão
dentro do webview. Habilitada só quando `canGenerateDesign` (TASK-DSGN-002) for verdadeiro; sem
aprovação, informa a pré-condição e não gera (SCN-DSGN-002). Acionada, escreve o `design.md`-esqueleto
do template (reusando `workspace.fs`); se o arquivo já existir, **pede confirmação antes de
sobrescrever** e mantém o conteúdo atual se o usuário recusar (D-Q5, SCN-DSGN-004). Oferece também
"Preencher com o Claude Code", reusando o novo helper `launchClaudeAction` sobre `composePrompt('design', id)`
do 0004 (ADR-014). Comando em `extension.ts` e `package.json`; caminhos de `.specs/` idênticos em
Windows/Linux/WSL (NFR-DSGN-003).

### Arquivos prováveis

- `src/sdd/featureDashboard.ts`
- `src/sdd/dashboardHtml.ts`
- `src/sdd/dashboardModel.ts`
- `src/extension.ts`
- `package.json`

### Testes esperados

- TEST-DSGN-003 — `extractScope` lê o escopo do cabeçalho da spec (núcleo puro, adicionado nesta
  tarefa para preencher `{{ID_SCOPE}}` sem palpite).
- O gatilho no item da feature, o diálogo de confirmação e a escrita em disco seguem sem teste
  automatizado — integração com o host do VS Code, coberta por revisão manual (ver `gaps`).

### Critério de conclusão

- No dashboard, a ação aparece habilitada só com a spec aprovada; sem aprovação, desabilitada e
  explicada. Gerar sobre um `design.md` existente pede confirmação e, se recusada, não altera o
  arquivo. `npm run compile`/`lint`/`test` limpos.

---

## Resumo

| Complexidade | Quantidade |
| --- | --- |
| P | 1 |
| M | 2 |
| G | 0 |

Total: 3 tarefas · 3 concluídas · 0 pendentes.

**Caminho crítico:** TASK-DSGN-001 ✅ → TASK-DSGN-002 ✅ → TASK-DSGN-003 ✅ (concluído)

**Bloqueios ativos:** nenhum — Q1 e Q2 resolvidas por ADR-014 (TASK-DSGN-001).

**Paralelizáveis agora:** nenhum — as três tarefas do plano estão concluídas.

> Plano implementado em 2026-08-01, fora da ordem formal do fluxo (sem approve/design — Fase 1),
> como no 0009. Verificação: `compile`, `lint` e **118 testes** limpos; `check-templates` com 19
> arquivos idênticos à fonte. A camada assistida por IA ("Preencher com o Claude Code") só
> funciona ponta a ponta quando a skill `/sdd-kit:design` (plugin, Fase 2) existir — o esqueleto
> funciona desde já (ADR-014).
