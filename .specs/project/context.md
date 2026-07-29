# Contexto técnico do projeto

> Documento equivalente ao que a skill `/sdd-kit:discover` produzirá em projetos de usuário (RF-002). Aqui foi preenchido manualmente, já que o framework ainda não existe.

Última atualização: 2026-07-29 · Método: análise manual durante a Fase 0.

---

## Estado atual

Repositório recém-criado. **Não há código de aplicação ainda** — apenas documentação, especificações e a estrutura de diretórios. Nenhuma dependência instalada.

## Tipo de projeto

Framework / plugin para Claude Code, distribuído por GitHub. Monorepo com workspaces npm.

## Linguagens e tecnologias

| Item | Valor | Confiança |
| --- | --- | --- |
| Linguagem principal (scripts/CLI) | TypeScript / JavaScript (Node.js ≥ 20) | Decidido — ADR-004 |
| Formato das especificações | Markdown + YAML | Decidido — ADR-002 |
| Formato dos schemas | JSON Schema | Decidido — ADR-002 |
| Gerenciador de pacotes | npm (workspaces) | > HIPÓTESE: não avaliamos pnpm; revisar em `TASK-PF-011` |
| Framework de testes | Vitest | > HIPÓTESE: recomendado pelo PRD §22, ainda não configurado |
| Parser de comandos da CLI | Commander ou CAC | Em aberto — decisão da Fase 5 |
| Validação de schema | JSON Schema ou Zod | Em aberto — decisão da Fase 4 |

## Estrutura de diretórios

| Caminho | Conteúdo | Estado |
| --- | --- | --- |
| `.claude-plugin/` | Manifesto de marketplace | Vazio |
| `plugins/sdd-kit/` | O plugin (skills, agents, hooks, scripts, templates, schemas) | Vazio |
| `packages/cli/` | CLI opcional | Vazio — Fase 5 |
| `.specs/` | Especificações deste repositório | Populado |
| `docs/pt-BR/`, `docs/en/` | Documentação de usuário | Vazio |
| `examples/` | 5 projetos de exemplo | Vazio |
| `tests/` | Testes do framework | Vazio |
| `.github/` | Workflows, templates de issue e PR | Vazio |

## Comandos

| Comando | Valor | Estado |
| --- | --- | --- |
| Build | `npm run build` (`tsc --noEmit`) | Configurado — exit 0 |
| Teste | `npm test` (`vitest run --passWithNoTests`) | Configurado — **sem testes escritos ainda** |
| Lint | `npm run lint` (`eslint .`) | Configurado — exit 0 |
| Validação de manifesto | `npm run validate-plugin` | Configurado — CLI oficial, `--strict` |

Verificados em Linux, Node v20.20.2. Windows e macOS entram na matriz de CI (`TASK-PF-013`).

O exit 0 de `npm test` significa "nada a executar", não "tudo passou" — `--passWithNoTests` sai em `TASK-PF-012`.

## Persistência e infraestrutura

Nenhuma. O framework não possui banco de dados, serviço, rede ou telemetria (ADR-005, constituição Art. 9).

## Padrões de arquitetura

Ver `architecture.md`. Resumo: dependências fluem para dentro, na direção de `.specs`; geração por IA é separada de validação determinística; scripts são a única camada que escreve em `.specs` de forma programática.

## Documentação existente

`PRD.md` (fonte da verdade do produto), `README.md`, `CLAUDE.md`, `CONTRIBUTING.md`, `SECURITY.md`, `CODE_OF_CONDUCT.md`, `ROADMAP.md`, `CHANGELOG.md`.

## Riscos iniciais identificados

| # | Risco | Onde é tratado |
| --- | --- | --- |
| 1 | Nenhum toolchain configurado — a Definition of Done não é executável hoje | `TASK-PF-011` |
| 2 | Formato de plugin/skill do Claude Code pode mudar | PRD §29 risco 5; validar contra a documentação oficial antes de escrever os manifestos |
| 3 | Escopo do MVP grande para um mantenedor | PRD §29 risco 7; feature `0001` entrega apenas o esqueleto do fluxo |
| 4 | Numeração sequencial de specs conflita entre branches | Questão A4 em `architecture.md` |
