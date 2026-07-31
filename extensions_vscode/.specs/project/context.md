# Contexto técnico — sdd-claude-kit-vscode

> Resultado da inicialização SDD. Revise antes de confiar.

Última atualização: 2026-07-31 · Método: scaffold criado + leitura de PRD.md e package.json

---

## Estado atual

Projeto greenfield: esqueleto de extensão VS Code recém-criado (feature
`0001-project-foundation`). Ativa, registra a Activity Bar e comandos base; a
lógica de negócio de cada épico ainda é `DRAFT` no backlog (`index.yaml`).

## Tipo de projeto

Extensão para Visual Studio Code, em TypeScript, empacotada com a API de
extensões (`vscode`). Frontend de editor + integração com CLI (Claude Code) e Git.

## Linguagens e tecnologias

| Item | Valor | Confiança |
| --- | --- | --- |
| Linguagem principal | TypeScript (compilado para CommonJS) | detectado |
| Runtime | Node.js >= 20 · VS Code >= 1.90 (`engines`) | detectado |
| Gerenciador de pacotes | npm | detectado (scripts em package.json) |
| Compilador | `tsc` (typescript) | detectado (devDependencies) |
| Lint | ESLint + @typescript-eslint | detectado (devDependencies, eslint.config.js) |
| Testes | `node:test` sobre `out/` | > HIPÓTESE: runner escolhido no scaffold; sem testes ainda |

## Estrutura de diretórios

| Caminho | Conteúdo |
| --- | --- |
| `src/` | Código-fonte TypeScript da extensão |
| `src/sdd/` | Diagnóstico do projeto (detecção de .specs, Git) |
| `src/views/` | Providers de árvore da Activity Bar |
| `resources/` | Ícones e assets estáticos |
| `.specs/` | Governança SDD do próprio projeto |
| `out/` | Saída de compilação (ignorada no Git) |

## Comandos

| Comando | Valor | Origem |
| --- | --- | --- |
| Build | `npm run compile` (`tsc -p ./`) | package.json → scripts |
| Teste | `npm test` (`node --test ./out/test`) | package.json → scripts |
| Lint | `npm run lint` (`eslint src`) | package.json → scripts |

**Estado da validação (2026-07-31, após `npm install`):** `build` (tsc), `lint`
(eslint) e `test` (`node --test`, **16 testes**) **passam** (exit 0), assim como
`check-templates` (frescor dos templates embutidos). Cobertura: lógica pura da
inicialização, do detector do workspace e da detecção do Claude Code testadas.
Falta apenas o comportamento no host do editor (verificação por F5).
`node_modules` é ignorado no Git: um clone novo precisa de `npm install` antes de
validar.

## Padrões de arquitetura observados

Módulos por responsabilidade (`sdd/`, `views/`), providers de `TreeDataProvider`
para a UI, tudo registrado em `context.subscriptions` na ativação. Comandos que
pertencem a outras features estão registrados mas apenas informam — marcados com
`TODO(<feature-id>)`.

## Documentação existente

- `PRD.md` — fonte da verdade do produto (25 RFs, 7 RNFs, MVP, backlog).
- `README.md` — como desenvolver e o estado atual.

## Riscos iniciais identificados

| # | Risco | Onde é tratado |
| --- | --- | --- |
| 1 | Comportamento no host do editor ainda não verificado (comandos/UI/FS) | verificação por F5 (evidência Fase 2) |
| 2 | `publisher` do package.json é placeholder (`idosreisjunior`) | confirmar antes de publicar (feature 0010) |
| 3 | Amplitude do PRD vs. foco do MVP | backlog fatiado por épico; só 0001 detalhado |
