# Tarefas — Publicação no Marketplace

Complexidade: **P** pequena (≤ meio dia) · **M** média (≈ 1 dia) · **G** grande.

> **Incremento 1**: preparar a extensão para o Marketplace (empacotamento, metadados, README,
> pipeline). A publicação em si é ato do autor (ícone PNG, conta/PAT, disparar o Release) —
> fora do escopo. Sem núcleos puros/testes: é config/docs/CI, verificado por ferramenta.

---

## Ordem de execução

```
TASK-PUB-001 (empacotamento+metadados) · TASK-PUB-002 (README) · TASK-PUB-003 (workflow)
```

Independentes; sem caminho crítico único.

---

## TASK-PUB-001 — Empacotamento enxuto e metadados

**Requisitos:** REQ-PUB-001
**Dependências:** —
**Complexidade:** P
**Status:** done

### Descrição

Reforçar o `.vscodeignore` (já exclui `.specs/`, `src/`, testes, `*.ts`, configs; adicionar
`*.vsix`, `tsbuildinfo`, `.gitkeep`) e acrescentar os metadados de Marketplace ao `package.json`
(`bugs`, `homepage`, `qna`, `galleryBanner`).

### Arquivos prováveis

- `.vscodeignore`
- `package.json`

### Testes esperados

- Nenhum automatizado — verificado por `vsce ls` (o pacote não vaza `.specs/`/`src`/testes).
  Registrado em `gaps`.

### Critério de conclusão

- `npx @vscode/vsce ls` não lista `.specs/`, `src/`, testes nem `PRD.md`; metadados presentes.

---

## TASK-PUB-002 — README como página do Marketplace

**Requisitos:** REQ-PUB-002, REQ-PUB-004
**Dependências:** —
**Complexidade:** P
**Status:** done

### Descrição

Revisar o `README` como página de descrição: badges (versão/CI/licença), recursos, requisitos,
tabela de **todos** os comandos e configurações vigentes, privacidade, e o **checklist de passos
manuais** de publicação (ícone PNG, conta/PAT, disparar o Release).

### Arquivos prováveis

- `README.md`

### Testes esperados

- Nenhum — documentação (`gaps`). Revisão manual.

### Critério de conclusão

- README lista os comandos por feature e as configs `sddClaudeKit.*` atuais, com o checklist.

---

## TASK-PUB-003 — Workflow de publicação sob demanda

**Requisitos:** REQ-PUB-003
**Dependências:** —
**Complexidade:** P
**Status:** done

### Descrição

Workflow `.github/workflows/publish.yml`: dispara em GitHub Release publicado (D-Q1); empacota e
publica no VS Code Marketplace (`vsce`) e no Open VSX (`ovsx`) (D-Q2), cada um protegido pelo seu
segredo (`VSCE_PAT`/`OVSX_PAT`); sem segredo, o passo é pulado e o job avisa — nada é publicado
sem credencial (NFR-PUB-002).

### Arquivos prováveis

- `.github/workflows/publish.yml`

### Testes esperados

- Nenhum automatizado — pipeline de CI. Verificado por YAML válido e revisão; a publicação real
  depende dos segredos do autor (`gaps`).

### Critério de conclusão

- `publish.yml` é YAML válido, dispara só em release e não publica sem os segredos.

---

## Resumo

| Complexidade | Quantidade |
| --- | --- |
| P | 3 |
| M | 0 |
| G | 0 |

Total: 3 tarefas · 3 concluídas · 0 pendentes.

**Caminho crítico:** — (tarefas independentes)

**Bloqueios ativos:** nenhum.

**Paralelizáveis agora:** nenhum — incremento 1 concluído.

> Incremento 1 (preparação para o Marketplace) implementado em 2026-08-01. Verificação: `vsce ls`
> (pacote limpo), `package.json`/`publish.yml` válidos. A **publicação** é ato do autor (ícone
> PNG, conta/PAT, disparar o Release) — documentada no README. 0010 fica **IN_PROGRESS** (parte
> automatizável completa; a publicação manual encerra o épico).