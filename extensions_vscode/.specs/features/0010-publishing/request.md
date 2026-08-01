# Solicitação original

- **ID:** 0010-publishing
- **Tipo:** feature
- **Criada em:** 2026-08-01
- **Origem:** Backlog do MVP (Épico 10 do PRD); materializada a pedido do usuário para especificar e implementar.

---

## Texto da solicitação

> Seguir para o Épico 10 — publicação: preparar a extensão para o Marketplace (ícone, metadados,
> documentação, pipeline de publicação).

## Interpretação

A feature deixa a extensão **pronta para ser publicada** no VS Code Marketplace: metadados de
Marketplace no `package.json`, um `.vscodeignore` que enxuga o `.vsix`, um `README` que serve de
página de descrição, e um **workflow de publicação** (empacota e publica sob demanda). É
preparação e automação — a **publicação em si não é feita pela extensão nem por esta mudança**:
depende de ativos e credenciais do autor (conta de publisher, PAT, ícone PNG) e é uma ação
externa explícita.

## O que esta mudança entrega

- Metadados de Marketplace no `package.json` (o que for possível sem novos ativos binários).
- `.vscodeignore` para reduzir o `.vsix` ao necessário (sem `.specs/`, `src/`, configs de dev).
- `README` revisado como página do Marketplace (comandos, configurações, estado atuais).
- Workflow de **publicação** (GitHub Actions) que empacota e publica **sob demanda**, protegido
  por um segredo (`VSCE_PAT`) — não roda sem ele.
- Um checklist dos **passos manuais** que só o autor pode fazer.

## O que esta mudança deliberadamente NÃO entrega

- **Publicar a extensão** — ação externa irreversível; exige a conta/PAT do autor e é feita por
  ele, nunca automaticamente por esta mudança.
- **O ícone PNG** do Marketplace — é um ativo binário que precisa ser criado pelo autor (o SVG
  da Activity Bar não serve como ícone de Marketplace).
- Publicação no **Open VSX** e agregações de relatório — fora deste incremento.

## Restrições conhecidas

- Nenhuma publicação sem ação/credenciais explícitas do autor.
- O `.vsix` não deve conter `.specs/`, `src/`, `node_modules` de dev, nem arquivos de teste.
- Sem I/O de rede na extensão (ADR-005); o workflow de publicação roda no CI, não na extensão.
