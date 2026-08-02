# Tarefas — Research assistido (RF-007)

Complexidade: **P** pequena (≤ meio dia) · **M** média (≈ 1 dia) · **G** grande
(deve ser dividida antes de começar).

> Plano montado a partir dos requisitos, **sem design técnico prévio** (clarify/design são de
> Fase 2). As duas pendências de design — Q1 (acrescentar a ação `research` ao adapter 0004 vs.
> outro mecanismo) e Q2 (template do `research.md`) — são resolvidas em **TASK-RES-001 (ADR-017)**,
> reusando o padrão híbrido do 0014/0015. Diferença do 0014/0015: a ação `research` **não existe**
> no 0004 e precisa ser acrescentada (TASK-RES-002).

---

## Ordem de execução

```
TASK-RES-001 (ADR-017: mecanismo + ação research no 0004 + template) ✅
        │
        ▼
TASK-RES-002 (núcleo: esqueleto das 8 frentes + ação research no 0004 + sync) ✅
        │
        ▼
TASK-RES-003 (ação "Research" na borda: escrita + confirmação de sobrescrita + reuso 0004) ✅
```

Caminho crítico: **TASK-RES-001 → TASK-RES-002 → TASK-RES-003** (linear; nada paralelizável).

---

## TASK-RES-001 — ADR-017: mecanismo do research e a ação `research` no 0004

**Requisitos:** REQ-RES-002, NFR-RES-001
**Dependências:** —
**Complexidade:** P
**Status:** done

### Descrição

Resolver e registrar em ADR: **(Q1)** a análise delega ao Claude Code **acrescentando a ação
`research` ao conjunto fechado do adapter 0004** (`composePrompt('research', id)` →
`/sdd-kit:research`), reusando ADR-007/ADR-014 — a alternativa (mecanismo próprio) é descartada;
**(Q2)** a estrutura do `research.md` (oito frentes do RF-007) vem de um novo template
`templates/pt-BR/feature/research.md`. Modelo híbrido: a extensão scaffolda o esqueleto (hoje) e
delega a análise ao Claude Code (Fase 2).

### Arquivos prováveis

- `.specs/features/0017-research/decisions/ADR-017-mecanismo-de-research.md`

### Testes esperados

- Nenhum — decisão/documentação (ver `gaps`).

### Critério de conclusão

- ADR-017 escrito, decidindo Q1 e Q2; questões Q1/Q2 marcadas como resolvidas. ✅

---

## TASK-RES-002 — Núcleo puro: esqueleto das 8 frentes, ação `research` no 0004 e sync

**Requisitos:** REQ-RES-001, REQ-RES-002, NFR-RES-003, NFR-RES-001
**Dependências:** TASK-RES-001
**Complexidade:** M
**Status:** done

### Descrição

Adicionar o template `feature/research.md` no **plugin** e **sincronizá-lo** (`.sync-manifest.json`).
`researchGenerator.ts` (novo), puro, sem a API do VS Code: `buildResearchSkeleton(template, change)`
resolve o template com as **oito frentes do RF-007 como seções** (D-Q6) e lacunas marcadas, sem
inventar conteúdo. Acrescentar a ação **`research`** ao conjunto do adapter 0004 (`claudePrompt.ts`:
`SddAction` + `ACTIONS`), habilitando `composePrompt('research', id)` → `/sdd-kit:research`.

### Arquivos prováveis

- `plugins/sdd-kit/templates/pt-BR/feature/research.md` (fonte)
- `extensions_vscode/templates/pt-BR/feature/research.md` (sincronizado)
- `extensions_vscode/templates/.sync-manifest.json`
- `src/sdd/researchGenerator.ts`
- `src/sdd/claudePrompt.ts` (acrescentar a ação `research`)

### Testes esperados

- TEST-RES-001 — `buildResearchSkeleton`: contém as oito frentes do RF-007 como seções; sem `{{` residual
- TEST-RES-002 — a ação `research` está em `ACTIONS`; `composePrompt('research', id)` = `/sdd-kit:research <id>`

### Critério de conclusão

- TEST-RES-001 e TEST-RES-002 passam; nenhum import de `vscode`/rede em `researchGenerator.ts`;
  manifesto de sync consistente; a suíte do 0004 (`claudePrompt`) segue verde.

---

## TASK-RES-003 — Ação "Research" na borda: escrita e confirmação de sobrescrita

**Requisitos:** REQ-RES-001, REQ-RES-002, NFR-RES-002
**Dependências:** TASK-RES-002
**Complexidade:** M
**Status:** done

### Descrição

Expor a ação **"Research"** no item da feature (D-Q3): disponível assim que a mudança existe (D-Q4,
sem exigir `REQ-*` nem aprovação). Acionada, escreve o `research.md`-esqueleto; se o arquivo já
existir, **pede confirmação antes de sobrescrever** e mantém o conteúdo atual se o usuário recusar
(SCN-RES-003). Oferece também "Analisar com o Claude Code", reusando `launchClaudeAction` sobre a
nova ação `research` do 0004 (ADR-017). Comando em `extension.ts` e `package.json`. A incorporação
à spec é manual (D-Q5).

### Arquivos prováveis

- `src/extension.ts`
- `package.json`

### Testes esperados

- Nenhum automatizado — o gatilho, o diálogo de confirmação e a escrita em disco são integração com
  o host do VS Code; a lógica de montagem vive no núcleo puro (TASK-RES-002). Revisão manual (ver `gaps`).

### Critério de conclusão

- No item da feature, "Research" cria o `research.md` das oito frentes; sobre um existente pede
  confirmação e, se recusada, não altera o arquivo. `npm run compile`/`lint`/`test` limpos.

---

## Resumo

| Complexidade | Quantidade |
| --- | --- |
| P | 1 |
| M | 2 |
| G | 0 |

Total: 3 tarefas · 3 concluídas · 0 pendentes.

**Caminho crítico:** TASK-RES-001 ✅ → TASK-RES-002 ✅ → TASK-RES-003 ✅ (concluído)

**Bloqueios ativos:** nenhum — Q1 e Q2 resolvidas por ADR-017 (TASK-RES-001).

**Paralelizáveis agora:** nenhum — as três tarefas do plano estão concluídas.

> Plano implementado em 2026-08-02, fora da ordem formal do fluxo (sem approve/design — Fase 1),
> como no 0009/0014/0015/0016. Verificação: `compile`, `lint` e **126 testes** limpos;
> `check-templates` com 21 arquivos idênticos. A ação `research` foi acrescentada ao adapter 0004
> (`claudePrompt.ts` + teste), justificada pelo ADR-017. A camada assistida ("Analisar com o
> Claude Code") só funciona ponta a ponta quando a skill `/sdd-kit:research` (Fase 2) existir — o
> esqueleto das oito frentes funciona desde já. Incorporação à spec é manual (D-Q5).
