# Tarefas — Template tasks.md sem o campo "evidências necessárias" (RF-010)

Complexidade: **P** pequena (≤ meio dia) · **M** média (≈ 1 dia) · **G** grande
(deve ser dividida antes de começar).

> Bug com causa raiz conhecida e escopo fechado — uma tarefa: acrescentar a seção ao template-fonte,
> sincronizar e adicionar o teste de regressão (que falha antes e passa depois). Sem design técnico
> (não há decisão arquitetural; o formato — seção `### Evidências necessárias` — foi decidido na spec).

---

## Ordem de execução

```
TASK-TEVF-001 (adicionar a seção ao template + sync + teste de regressão) ✅
```

Caminho crítico: **TASK-TEVF-001** (tarefa única, concluída).

---

## TASK-TEVF-001 — Acrescentar "Evidências necessárias" ao template tasks.md e sincronizar

**Requisitos:** RF-010 (SCN-TEVF-001, SCN-TEVF-002)
**Dependências:** —
**Complexidade:** P
**Status:** done

### Descrição

Acrescentar a seção **`### Evidências necessárias`** ao bloco de tarefa do template-fonte
`plugins/sdd-kit/templates/pt-BR/_shared/tasks.md` (ao lado de "Testes esperados"/"Critério de
conclusão", com uma orientação `{{guia: …}}` explicando que ali vão as evidências que a tarefa
precisa produzir — RF-010). **Sincronizar** para a cópia embutida na extensão
(`npm run sync-templates`; manifesto 21 → 21, hash muda). Adicionar um teste de regressão que
verifica que o template contém a seção (falha antes, passa depois — SCN-TEVF-001).

### Arquivos prováveis

- `plugins/sdd-kit/templates/pt-BR/_shared/tasks.md` (fonte)
- `extensions_vscode/templates/pt-BR/_shared/tasks.md` (sincronizado)
- `extensions_vscode/templates/.sync-manifest.json`
- `src/test/tasksTemplate.test.ts` (novo)

### Testes esperados

- TEST-TEVF-001 — o template `_shared/tasks.md` contém a seção `### Evidências necessárias`

### Critério de conclusão

- A seção existe no bloco de tarefa do template-fonte; `check-templates` confirma fonte e cópia
  idênticas (SCN-TEVF-002); TEST-TEVF-001 passa (e falharia sem a correção); nenhum teste existente
  alterado; `npm run compile`/`lint`/`test` limpos.

---

## Resumo

| Complexidade | Quantidade |
| --- | --- |
| P | 1 |
| M | 0 |
| G | 0 |

Total: 1 tarefa · 1 concluída · 0 pendentes.

**Caminho crítico:** TASK-TEVF-001 ✅ (concluído)

**Bloqueios ativos:** nenhum — Q1 (formato) decidida na spec.

**Paralelizáveis agora:** nenhum — tarefa única concluída.

> Corrigido em 2026-08-02. A seção `### Evidências necessárias` foi acrescentada ao template-fonte
> `_shared/tasks.md` (agora com os 11 campos do RF-010) e sincronizada (21 arquivos idênticos).
> Verificação: TEST-TEVF-001 passa (falharia sem a correção — a cópia sincronizada não tinha a
> seção); `check-templates`, compile, lint e **129 testes** limpos. Fora da ordem formal (Fase 1).
