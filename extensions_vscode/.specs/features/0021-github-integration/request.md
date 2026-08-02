# Solicitação original

- **ID:** 0021-github-integration
- **Tipo:** feature
- **Criada em:** 2026-08-02
- **Origem:** /sdd-kit:new

---

## Texto da solicitação

> Integração com GitHub (RF-019) — permitir criar issue a partir da feature, associar issue existente, criar branch, criar Pull Request, gerar descrição do PR, incluir requisitos e evidências, acompanhar revisão, importar comentários e atualizar o status da feature.

## Interpretação

Materializar o RF-019 do PRD da extensão: integração com o GitHub, com nove operações. Duas
tensões de peso definem o recorte:

1. **Mecanismo.** A extensão **nunca fez rede própria** — ela *shell-out* para o `git` (0007,
   ADR-011) e detecta a CLI do Claude Code (0004, ADR-002). O caminho natural é o **`gh` CLI**
   (sem rede própria, sem gerenciar token/auth, sem dependência), mas há alternativas (REST API,
   sessão de autenticação do VS Code). Decisão de arquitetura — ADR.
2. **Escopo.** Nove operações são muitas para um incremento. As mais concretas e de maior valor:
   **gerar a descrição** (requisitos + evidências) e **criar issue/PR** a partir da feature. As
   demais (associar issue existente, criar branch, acompanhar revisão, importar comentários,
   atualizar o status automaticamente) ficam como questão de recorte.

O núcleo "gerar a descrição" é **puro e testável**, reusando o padrão do `buildEvidenceMarkdown`
(0008) e do `buildCommitSuggestion` (0007). As chamadas ao GitHub são a borda.

## O que esta mudança entrega

- **Gerar a descrição** (issue/PR) a partir da feature — requisitos (spec) e evidências
  (validação/evidence.md).
- **Criar issue e/ou PR** no GitHub a partir da feature (via o mecanismo do ADR).

## O que esta mudança deliberadamente não entrega

- As **demais operações** do RF-019 (associar issue existente, acompanhar revisão, importar
  comentários, atualizar status automaticamente, criar branch) — recorte a decidir; provavelmente
  incrementos futuros.
- **Rede própria na extensão** se o ADR escolher o `gh` CLI — nesse caso a extensão não fala HTTP.

## Restrições conhecidas

- Compatibilidade Windows/Linux/WSL (RNF-002); privacidade (RNF-004: nada obrigatório para fora
  além do que o usuário publicar explicitamente).
- Exige repositório Git com remoto GitHub; e a ferramenta do mecanismo escolhido (ex.: `gh`
  instalado e autenticado) — detecção como no 0004 (Claude Code).
- Publicar issue/PR é ato **outward-facing**: exige confirmação explícita do usuário (constituição
  Art. 9 — humano no controle).
