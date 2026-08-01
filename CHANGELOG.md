# Changelog

Todas as mudanças relevantes deste projeto são documentadas aqui.

O formato segue [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/) e o projeto adota [Versionamento Semântico](https://semver.org/lang/pt-BR/).

## [Não publicado]

### Adicionado

- Estrutura inicial do repositório (Fase 0 — Fundação).
- `PRD.md` — Product Requirements Document, versão 1.0.
- `CLAUDE.md` — instruções de trabalho para o Claude Code neste repositório.
- Licença Apache 2.0, README, guia de contribuição, código de conduta, política de segurança e roadmap.
- Estrutura `.specs/` com `config.yaml`, `index.yaml` e documentos de projeto (visão, constituição, contexto, arquitetura, glossário, padrões).
- ADR-001 a ADR-005 registrando as decisões técnicas iniciais.
- Feature `0001-plugin-foundation` com especificação, design e plano de tarefas.

### Corrigido

- Lint do repositório raiz (`eslint .`) deixava de passar por relintar o subprojeto da extensão (`extensions_vscode/**`) com a config do root, que não define os globals de Node dos scripts `.mjs`/`.cjs` — quebrando o CI com `no-undef` (`require`/`console`/`process`). A extensão tem lint e CI próprios; o root passa a ignorá-la.
