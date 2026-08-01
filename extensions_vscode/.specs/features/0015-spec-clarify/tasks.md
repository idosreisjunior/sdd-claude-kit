# Tarefas — Clarificação da especificação (RF-008)

Complexidade: **P** pequena (≤ meio dia) · **M** média (≈ 1 dia) · **G** grande
(deve ser dividida antes de começar).

> Plano montado a partir dos requisitos, **sem design técnico prévio** (clarify/design são de
> Fase 2). As duas pendências de design — Q1 (delegar a análise ao Claude Code vs. componente
> próprio) e Q2 (template do `clarifications.md`) — são resolvidas em **TASK-CLAR-001 (ADR-015)**,
> reusando o padrão híbrido já estabelecido no 0014 (ADR-014).

---

## Ordem de execução

```
TASK-CLAR-001 (ADR-015: mecanismo + template) ✅
        │
        ▼
TASK-CLAR-002 (núcleo puro: pré-condição + esqueleto das 9 categorias + sync) ✅
        │
        ▼
TASK-CLAR-003 (ação "Clarificar": disponibilidade + confirmação de sobrescrita + reuso 0004) ✅
```

Caminho crítico: **TASK-CLAR-001 → TASK-CLAR-002 → TASK-CLAR-003** (linear; nada paralelizável).

---

## TASK-CLAR-001 — ADR-015: mecanismo da clarificação e template do `clarifications.md`

**Requisitos:** REQ-CLAR-002, NFR-CLAR-001
**Dependências:** —
**Complexidade:** P
**Status:** done

### Descrição

Resolver as duas decisões de design da spec e registrá-las em ADR, reusando o padrão híbrido do
0014 (ADR-014): **(Q1)** a análise delega ao Claude Code pela ação `clarify` do adapter 0004
(`/sdd-kit:clarify`, RF-011), sem análise heurística própria; **(Q2)** a estrutura do
`clarifications.md` (nove categorias do RF-008) vem de um novo template
`templates/pt-BR/feature/clarifications.md`. A extensão scaffolda o esqueleto (funciona hoje) e
delega a análise por IA ao Claude Code (Fase 2).

### Arquivos prováveis

- `.specs/features/0015-spec-clarify/decisions/ADR-015-mecanismo-de-clarificacao.md`
- `templates/pt-BR/feature/clarifications.md` (se o ADR decidir por template)

### Testes esperados

- Nenhum — decisão/documentação (ver `gaps`).

### Critério de conclusão

- ADR-015 escrito, decidindo Q1 e Q2; questões Q1/Q2 marcadas como resolvidas. ✅

---

## TASK-CLAR-002 — Núcleo puro: pré-condição e esqueleto do `clarifications.md`

**Requisitos:** REQ-CLAR-001, REQ-CLAR-002, NFR-CLAR-003, NFR-CLAR-001
**Dependências:** TASK-CLAR-001
**Complexidade:** M
**Status:** done

### Descrição

Adicionar o template `feature/clarifications.md` no **plugin** e **sincronizá-lo** para a extensão
(`.sync-manifest.json`). `clarifyGenerator.ts` (novo), puro, sem a API do VS Code:
`hasRequirements(specMd)` decide a pré-condição (a spec tem `REQ-*`, D-Q4);
`buildClarificationsSkeleton(template, change)` resolve o template com as **nove categorias do
RF-008 como seções**, cada uma com espaço para achados e resolução (D-Q5), sem inventar conteúdo.
Sem I/O de rede (a análise por IA é o reuso do 0004, não aqui).

### Arquivos prováveis

- `plugins/sdd-kit/templates/pt-BR/feature/clarifications.md` (fonte)
- `extensions_vscode/templates/pt-BR/feature/clarifications.md` (sincronizado)
- `extensions_vscode/templates/.sync-manifest.json`
- `src/sdd/clarifyGenerator.ts`

### Testes esperados

- TEST-CLAR-001 — `hasRequirements`: spec sem `REQ-*` → falso; com `REQ-*` → verdadeiro
- TEST-CLAR-002 — `buildClarificationsSkeleton`: contém as nove categorias do RF-008 como seções

### Critério de conclusão

- TEST-CLAR-001 e TEST-CLAR-002 passam; nenhum import de `vscode`/rede em `clarifyGenerator.ts`;
  manifesto de sync consistente.

---

## TASK-CLAR-003 — Ação "Clarificar": disponibilidade por requisitos, sobrescrita e reuso do 0004

**Requisitos:** REQ-CLAR-001, REQ-CLAR-002, NFR-CLAR-002
**Dependências:** TASK-CLAR-002
**Complexidade:** M
**Status:** done

### Descrição

Expor a ação **"Clarificar"** no item da feature (painel Features, D-Q3): habilitada só quando a
spec tem requisitos (`hasRequirements`, TASK-CLAR-002); sem requisitos, informa e não produz
(SCN-CLAR-002), sem promover o estado. Acionada, escreve o `clarifications.md`-esqueleto; se o
arquivo já existir, **pede confirmação antes de sobrescrever** e mantém o conteúdo atual se o
usuário recusar (SCN-CLAR-004). Oferece também "Analisar com o Claude Code", reusando
`composePrompt('clarify', id)` do 0004 (ADR-015). Comando em `extension.ts` e `package.json`;
caminhos de `.specs/` idênticos em Windows/Linux/WSL (NFR-CLAR-002).

### Arquivos prováveis

- `src/extension.ts`
- `package.json`

### Testes esperados

- Nenhum automatizado — o gatilho, o diálogo de confirmação e a escrita em disco são integração
  com o host do VS Code; a lógica de disponibilidade/montagem vive no núcleo puro (TASK-CLAR-002).
  Verificação por revisão manual (ver `gaps`).

### Critério de conclusão

- No item da feature, a ação aparece habilitada só com a spec tendo requisitos; sem eles,
  desabilitada e explicada, sem mudar o estado. Clarificar sobre um `clarifications.md` existente
  pede confirmação e, se recusada, não altera o arquivo. `npm run compile`/`lint`/`test` limpos.

---

## Resumo

| Complexidade | Quantidade |
| --- | --- |
| P | 1 |
| M | 2 |
| G | 0 |

Total: 3 tarefas · 3 concluídas · 0 pendentes.

**Caminho crítico:** TASK-CLAR-001 ✅ → TASK-CLAR-002 ✅ → TASK-CLAR-003 ✅ (concluído)

**Bloqueios ativos:** nenhum — Q1 e Q2 resolvidas por ADR-015 (TASK-CLAR-001).

**Paralelizáveis agora:** nenhum — as três tarefas do plano estão concluídas.

> Plano implementado em 2026-08-01, fora da ordem formal do fluxo (sem approve/design — Fase 1),
> como no 0009/0014. Verificação: `compile`, `lint` e **120 testes** limpos; `check-templates` com
> 20 arquivos idênticos à fonte. A ação "Clarificar" é um comando no item da feature (o dashboard é
> webview read-only), reusando `launchClaudeAction` e `extractScope` do 0014. A camada assistida
> por IA ("Analisar com o Claude Code") só funciona ponta a ponta quando a skill `/sdd-kit:clarify`
> (plugin, Fase 2) existir — o esqueleto das nove categorias funciona desde já (ADR-015).
