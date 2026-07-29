# Roadmap — SDD Claude Kit

Este roadmap segue a seção 25 do [PRD](./PRD.md). As entregas de cada fase são rastreadas por features em `.specs/`.

Legenda: ⬜ não iniciado · 🟨 em andamento · ✅ concluído

---

## Fase 0 — Fundação 🟨

Feature: [`0001-plugin-foundation`](./.specs/features/0001-plugin-foundation/) (parcial)

| Entrega | Status |
| --- | --- |
| Repositório Git | ✅ |
| Licença Apache 2.0 | ✅ |
| README inicial | ✅ |
| PRD | ✅ |
| Constituição do projeto | ✅ |
| Arquitetura inicial | ✅ |
| Estrutura `.specs` | ✅ |
| Guia de contribuição | ✅ |
| Código de conduta | ✅ |
| Política de segurança | ✅ |
| Repositório publicado no GitHub | ⬜ |

## Fase 1 — Plugin mínimo ⬜

Feature: `0001-plugin-foundation`

| Entrega | Status |
| --- | --- |
| Manifesto do plugin (`plugin.json`) | ⬜ |
| Marketplace (`marketplace.json`) | ⬜ |
| Skill `init` | ⬜ |
| Skill `new` | ⬜ |
| Skill `spec` | ⬜ |
| Skill `tasks` | ⬜ |
| Templates iniciais | ⬜ |
| Projeto de exemplo | ⬜ |

## Fase 2 — Fluxo SDD completo ⬜

| Entrega | Status |
| --- | --- |
| Skills `clarify`, `design`, `approve` | ⬜ |
| Skills `implement`, `verify`, `archive` | ⬜ |
| Máquina de estados do workflow | ⬜ |
| Rastreabilidade básica | ⬜ |

## Fase 3 — Agentes especializados ⬜

Project Discovery · Requirements Analyst · Solution Architect · Task Planner · Implementation Agent · Test Engineer · Spec Auditor

## Fase 4 — Validação e hooks ⬜

Schemas · validador · atualização automática de índices · modos `advisory`/`guided`/`strict` · hooks opcionais

## Fase 5 — CLI ⬜

Pacote npm · comandos básicos · testes · integração com CI · relatório de rastreabilidade · migração de schemas

## Fase 6 — Comunidade ⬜

Documentação em inglês · templates de issue e PR · GitHub Discussions · releases · changelog · good first issues · exemplos adicionais

---

## Critérios de conclusão do MVP

Ver [PRD §27](./PRD.md#27-critérios-de-sucesso-do-mvp). Resumidamente: o fluxo completo `init → new → clarify → design → tasks → approve → implement → verify → archive` funcionando, com validação, rastreabilidade, um exemplo completo, documentação suficiente, testes aprovados e compatibilidade Windows/Linux/macOS/WSL.
