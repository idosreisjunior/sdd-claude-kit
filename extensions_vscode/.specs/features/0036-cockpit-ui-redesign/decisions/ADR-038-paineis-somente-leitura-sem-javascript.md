# ADR-038 — Painéis somente-leitura mantêm-se sem JavaScript

- **Status:** Aceito
- **Data:** 2026-08-05
- **Origem:** descoberto durante a implementação da TASK-COCK-011, antes de escrever código.
- **Relação com o ADR-037:** **restringe** o alcance dele. Preserva o ADR-016.
- **Decidido em:** implementação; escolha do usuário após interrupção.

---

## Contexto

O ADR-037 decidiu migrar **todas** as superfícies de webview para esbuild + Preact. Ao
começar pela primeira delas (histórico), apareceu um conflito que o design não previu.

Três painéis são criados com `enableScripts: false`:

| Painel | Onde |
| --- | --- |
| Histórico e decisões | `extension.ts`, `sddHistory` |
| Relatório de validação | `extension.ts`, `sddValidation` |
| Métricas | `extension.ts`, `sddMetrics` |

Não é descuido. O ADR-016 escolheu isso deliberadamente para painéis somente-leitura, e é
uma postura **mais forte** do que CSP com nonce: não existe script para escapar, então a
superfície de ataque é o próprio HTML e nada além dele.

Carregar um cliente Preact exige `enableScripts: true`. Isso colide de frente com:

> **NFR-COCK-002** — O redesenho não enfraquece a postura de segurança já estabelecida.

Cumprir o ADR-037 ao pé da letra violaria o NFR-COCK-002. Os dois foram aprovados na mesma
mudança, então não há hierarquia entre eles que resolva o empate — é decisão nova.

## Decisão

**Os painéis somente-leitura permanecem sem JavaScript e recebem a identidade visual pelo
CSS compartilhado.**

- `enableScripts: false` é preservado nos três.
- Eles consomem `componentsCss()` — a MESMA folha dos componentes Preact — e produzem
  marcação no host usando as MESMAS classes (`ui-card`, `ui-badge`, `ui-panel-header`,
  `ui-empty`, `ui-tile`).
- `renderStaticPanelHtml` emite o documento desses painéis: CSP **sem `script-src`**, já
  que não há script algum a autorizar.
- A migração para Preact (ADR-037) fica valendo para as superfícies **interativas**: Board,
  dashboard, visão do projeto, editor de spec, sidebar e wizard.

O critério que separa os dois grupos é objetivo e não opinativo: **a superfície precisa
reagir ao usuário sem reabrir?** Se sim, é interativa e ganha cliente. Se não, é leitura e
não deve carregar runtime nenhum.

## Alternativas consideradas

| Alternativa | Por que não |
| --- | --- |
| **Migrar mesmo assim, ligando `enableScripts`** | Cumpriria o ADR-037 literalmente, mas três superfícies que hoje não executam JavaScript passariam a executar, e o NFR-COCK-002 precisaria de uma exceção declarada. Trocar postura de segurança por uniformidade de stack é um mau negócio quando a uniformidade não entrega nada ao usuário: os três painéis não têm interação para justificar um runtime |
| **Tirar os três do escopo da 0036** | Deixaria a mistura de layout que a feature existe para eliminar. Eles já receberam os tokens na TASK-COCK-005, então a cor já está coerente — parar aí seria deixar o trabalho pela metade sem ganho |
| **Componentes que renderizam nos dois modos** (isomórficos, via `preact-render-to-string`) | Unificaria a marcação de verdade, mas acrescenta dependência de build e faz o host importar Preact para gerar string. Custo desproporcional para seis componentes simples; reavaliar se a biblioteca crescer |
| **Duplicar o CSS num arquivo para os estáticos** | Duas folhas divergindo é exatamente o defeito que REQ-COCK-002 combate |

## Consequências

**Positivas**

- NFR-COCK-002 preservado sem exceção: nenhuma superfície fica menos segura do que era.
- Três painéis ganham a identidade visual sem carregar um byte de runtime.
- O critério "interativo vs. leitura" dá uma regra clara para as próximas superfícies, em
  vez de decidir caso a caso.

**Negativas**

- **Duas formas de produzir marcação:** componente `.tsx` para superfície interativa,
  string no host para estática. **Mitigação:** o contrato é o CSS — as classes são as
  mesmas, definidas uma vez em `uiCss.ts`, e o teste-guarda TEST-COCK-001 já varre esse
  arquivo. A divergência possível é de marcação, não de aparência.
- Um componente novo precisa ser pensado nos dois modos, ou declarado como exclusivo de um
  deles. **Mitigação:** anotar no próprio componente quando ele depender de interação.
- O ADR-037 deixa de valer para todas as superfícies, o que torna a leitura dele
  incompleta isoladamente. **Mitigação:** este ADR é referenciado lá e no `design.md`.

## Limite desta decisão

Decide **quais superfícies carregam cliente** e como as demais recebem a identidade.
**Não** altera a biblioteca de componentes (ADR-037), a camada de tokens (ADR-035), a
natureza da sidebar (ADR-036), nem qualquer comportamento observável.
