# ADR-004 — TypeScript para scripts e CLI

- **Status:** Aceito
- **Data:** 2026-07-29
- **Origem:** PRD §30

## Contexto

Os scripts determinísticos e a futura CLI precisam rodar em Windows, Linux, macOS e WSL (RNF-001), manipular YAML e JSON, e ser fáceis de receber contribuições da comunidade.

## Decisão

**TypeScript sobre Node.js (≥ 20)** para scripts e CLI. Distribuição da CLI via npm.

## Alternativas consideradas

| Alternativa | Por que não |
| --- | --- |
| Shell script (bash) | Não funciona nativamente em Windows sem WSL; viola RNF-001. |
| Python | Exigiria runtime Python em projetos Node; e vice-versa. Nenhum runtime é universal, mas Node é o mais provável no público-alvo (usuários de Claude Code). |
| Go (binário compilado, sem runtime) | Elimina a dependência de runtime, mas reduz drasticamente o número de contribuidores potenciais e complica a distribuição multiplataforma via GitHub. |
| JavaScript sem tipos | Viola RNF-006 (manutenibilidade, "código com tipagem"). |

## Consequências

**Positivas:** compatibilidade multiplataforma; ecossistema npm; tipagem; boa integração com JSON e YAML; base ampla de contribuidores.

**Negativas:** exige Node.js instalado para as validações. **Mitigação:** validações são opcionais no modo `advisory` e o fluxo básico do plugin não depende delas.

## Questão resolvida

Se os scripts embarcados no plugin seriam TypeScript compilado ou JS puro com JSDoc.

Resolvida em `TASK-PF-011` por [ADR-007](./ADR-007-scripts-do-plugin-em-javascript.md): **JavaScript com JSDoc no plugin, TypeScript compilado na CLI.**

O motivo é uma restrição da plataforma, não preferência: plugins de marketplace são copiados como estão, sem `npm install` e sem build. A tipagem exigida por este ADR é preservada — `tsc --checkJs` valida JSDoc com o mesmo compilador e o mesmo rigor.
