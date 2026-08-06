# ADR-034 — esbuild + Preact para o webview do wizard

- **Status:** Aceito
- **Data:** 2026-08-05
- **Origem:** design da feature 0035-wizard-cockpit. Resolve parcialmente a questão
  arquitetural A1 (`architecture.md` §10 — `tsc` puro vs. bundler).
- **Decidido em:** design; refinado na implementação (TASK-WIZ-002).

---

## Contexto

O wizard tem 8 telas ricas e interativas — muito além do que uma template-string
comporta com clareza (o Board, com uma única view, já é o maior arquivo de UI do
projeto). O build atual é `tsc` puro, sem bundler; `architecture.md` §10 registrava A1
("`tsc` puro vs. `esbuild`/bundler") como questão em aberto. Escrever 8 views como
concatenação de strings produziria um `wizardHtml.ts` gigante e frágil.

## Decisão

**Introduzir `esbuild` para empacotar o cliente do wizard, escrito em Preact.**

- Um passo `esbuild` (`esbuild.mjs`) gera um único `out/webview/wizard.js`, consumido
  pelo `WebviewPanel` com o nonce da CSP. O passo entra no `compile`
  (`tsc -p ./ && node esbuild.mjs`) e, por consequência, no `vscode:prepublish`; o `tsc`
  segue compilando a extensão (a borda Node). O diretório `src/webview` é **excluído** do
  `tsc` — só o esbuild o compila.
- **JSX transpilado pelo próprio esbuild** (`jsx: 'automatic'`, `jsxImportSource:
  'preact'`). Isso dispensa a biblioteca `htm` cogitada no design: o htm existia para
  evitar uma etapa de transform de JSX, mas o esbuild já faz esse transform nativamente,
  sem passo extra. Menos uma dependência.
- **Escopo restrito ao wizard.** Preact (~10 KB) cobre só o `src/webview/wizard/*`. Os
  demais painéis (Projeto, Dashboard, Histórico, Métricas, Validação) **permanecem em
  vanilla/template-string** — não justificam o custo.
- O núcleo puro (`wizardModel`, `wizardStepGuards`) continua em TS compilado por `tsc` e
  é importado tanto pela borda quanto pelo bundle do cliente (lógica única — o esbuild
  inclui o mesmo `.ts` no bundle do webview).

## Alternativas consideradas

| Alternativa | Por que não |
| --- | --- |
| **Vanilla + template-string** (como hoje) | `wizardHtml.ts` cresceria a um tamanho ingerível para 8 views com estado; manutenção e revisão ruins |
| **Preact + htm (sem JSX)** | O esbuild já transpila JSX sem etapa extra; o htm vira dependência redundante |
| **React** | Runtime maior; benefício marginal sobre Preact para um webview; peso desnecessário no `.vsix` |
| **Lit / Web Components** | Bom, mas o time já raciocina em componentes de função; Preact+JSX tem menor atrito |
| **Bundler para todos os painéis** | Reescreveria superfícies estáveis sem ganho; aumenta o risco e o escopo |

## Consequências

**Positivas**

- 8 views mantíveis como componentes JSX; lógica de estado única e testável; bundle
  pequeno (~17 KB com Preact); resolve A1 no escopo do wizard.

**Negativas**

- Nova dependência de build (`esbuild`) e de runtime do webview (`preact`), ambas em
  `devDependencies` porque são empacotadas no bundle (não entram como `node_modules` no
  `.vsix`). **Mitigação:** dependências pequenas; escopo isolado ao wizard.
- Dois pipelines (`tsc` para a borda, `esbuild` para o cliente).
  **Mitigação:** um único script `compile` encadeia os dois; `src/webview` fora do `tsc`.

## Limite desta decisão

Decide **a stack e o build do cliente do wizard**. **Não** estende o bundler aos demais
painéis, **não** altera a natureza da superfície (ADR-033) nem a camada visual (ADR-035).
A A1 permanece aberta para o restante da extensão.
