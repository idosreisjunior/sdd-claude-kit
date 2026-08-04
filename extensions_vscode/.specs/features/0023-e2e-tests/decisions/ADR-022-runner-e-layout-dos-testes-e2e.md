# ADR-022 — Testes E2E: @vscode/test-cli + electron, suíte isolada, CI sob xvfb

- **Status:** Aceito
- **Data:** 2026-08-03
- **Origem:** questão **Q3** (runner, layout, CI e fixtures) da spec de 0023-e2e-tests.
- **Decidido em:** TASK-E2E-001

---

## Contexto

A extensão precisa exercitar a **borda** (ativação, comandos, diagnósticos) num host real do VS
Code. A suíte unitária usa `node --test` sobre `out/test/` e **não** pode carregar o módulo `vscode`
(só existe dentro do host). Três decisões:

- **Q3a — Runner.** Rodar testes dentro do VS Code exige baixar e lançar o *Extension Development
  Host*. O padrão oficial atual é `@vscode/test-electron` (baixa/inicia o host) orquestrado por
  `@vscode/test-cli` (config declarativa + Mocha embutido). A alternativa é escrever o runner à mão
  com `runTests` + um `index.ts` que instancia o Mocha.
- **Q3b — Isolamento.** Os testes E2E importam `vscode` e usam a UI do Mocha (`suite`/`test`); a
  suíte unitária usa `node:test`. Misturá-las em `out/test` quebraria `node --test` (tentaria rodar
  arquivos que fazem `require('vscode')`).
- **Q3c — CI.** O host precisa de um display; em Linux headless isso é `xvfb`.

## Decisão

**Q3a — `@vscode/test-cli` + `@vscode/test-electron` com Mocha.** Config declarativa em
`.vscode-test.mjs` (`files: 'out/e2e/**/*.test.js'`, `workspaceFolder` de fixture). Evita manter um
runner artesanal; é o caminho documentado e mantido pela equipe do VS Code. Script `npm run
test:e2e` (com `pretest:e2e` compilando).

**Q3b — Suíte isolada em `src/e2e` → `out/e2e`.** Fora de `out/test`, então `node --test ./out/test`
não a executa (NFR-E2E-001). O `tsconfig` já compila todo `src`; os testes E2E compilam junto, sem
config extra de build. `@types/mocha` entra como `devDependency`.

**Q3c — CI: passo adicional no job `extension`, em ubuntu, sob `xvfb-run`.** Reusa o job existente
(mesmo `working-directory`, mesmo `npm ci`) em vez de um job novo — um passo `xvfb-run -a npm run
test:e2e` depois do `compile`. O runner baixa o VS Code de teste; nenhuma outra rede.

**Fixtures.** Um workspace mínimo em `test-fixtures/e2e-workspace/` com uma estrutura `.specs`
(config + index + docs de projeto) para o Project Doctor, e um `sample.sql` para o SQL Guard. Fica
fora do pacote publicado (`.vscodeignore`).

## Alternativas consideradas

| Alternativa | Por que não |
| --- | --- |
| **Runner artesanal** (`runTests` + `index.ts` com Mocha manual) | Mais código de infraestrutura para manter; `@vscode/test-cli` entrega o mesmo com config declarativa |
| **E2E junto da unitária em `out/test`** | Quebraria `node --test` (arquivos que fazem `require('vscode')`); mistura dois runners no mesmo diretório |
| **Job de CI separado** | Duplicaria `checkout`/`setup-node`/`npm ci`; o job `extension` já tem o ambiente pronto — um passo a mais é mais barato |
| **Cobrir webviews/custom editor/comandos interativos agora** | Exige stubs de QuickPick/modal e inspeção de webview — frágil e custoso; o smoke dá o maior sinal por menor custo (incremento 1) |

## Consequências

**Positivas**

- Prova, num host real, que a extensão ativa e que os comandos declarados existem — fecha o maior
  `gap` de borda acumulado.
- Config declarativa, mantida pela equipe do VS Code; suíte unitária intocada e ainda rápida.
- CI cobre o gate real em Linux; o desenvolvedor pode rodar localmente onde houver display.

**Negativas**

- O runner baixa o VS Code de teste (rede + tempo no CI). **Mitigação:** cache do npm já existe; o
  download do host é do próprio runner, aceitável no job.
- Em ambientes headless sem `xvfb` (ex.: WSL sem display) a suíte não roda localmente. **Mitigação:**
  o gate autoritativo é o CI (ubuntu + `xvfb`); localmente é opcional.
- Novos `devDependencies` (`@vscode/test-cli`, `@vscode/test-electron`, `mocha`, `@types/mocha`).
  **Mitigação:** todos `devDependencies`, fora do `.vsix` publicado (`.vscodeignore`).

## Limite desta decisão

Decide **o runner**, **o isolamento** da suíte, **o wiring de CI** e **a forma das fixtures**. **Não**
define o conteúdo exato dos testes smoke (TASK-E2E-003) e **não** amplia o escopo para webviews,
custom editor ou comandos interativos — isso é incremento futuro.
