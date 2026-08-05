# ADR-037 — Bundler e biblioteca de componentes para todos os painéis

- **Status:** Aceito
- **Data:** 2026-08-05
- **Origem:** design da feature 0036-cockpit-ui-redesign. Formaliza as decisões Q2 e Q3.
- **Relação com o ADR-034:** **estende** e **revisa uma recusa explícita** dele. Fecha a
  questão arquitetural A1 (`architecture.md` §10) para a extensão inteira.
- **Decidido em:** clarify (escolha do usuário) · formalizado no design.

---

## Contexto

O ADR-034 introduziu `esbuild` + Preact **restrito ao wizard** e listou, entre as
alternativas recusadas:

> **Bundler para todos os painéis** — Reescreveria superfícies estáveis sem ganho;
> aumenta o risco e o escopo.

E encerrou dizendo: *"A A1 permanece aberta para o restante da extensão."*

Este ADR decide o contrário. Isso exige justificativa, porque reverter uma recusa
registrada sem dizer o que mudou é como não tê-la registrado.

**O que mudou:** a premissa "sem ganho" dependia de as superfícies permanecerem estáveis.
A feature 0036 as redesenha por completo — as sete, mais a sidebar e as boas-vindas. Elas
vão ser reescritas de qualquer forma. A pergunta deixou de ser *"vale reescrever painéis
estáveis para ganhar um bundler?"* e passou a ser *"os painéis que serão reescritos devem
sair em template-string ou em componentes?"*.

Some-se a isso REQ-COCK-002, que exige cartão, badge, cabeçalho e estado vazio com
**definição única**. Sem marcação compartilhada, "definição única" fica restrito a folha
de estilo: cada painel continua escrevendo seu próprio HTML, e a consistência volta a
depender de disciplina — que é precisamente o que produziu o estado atual, em que nove
superfícies divergiram de uma.

## Decisão

**Estender `esbuild` + Preact a todas as superfícies de webview da extensão, com uma
biblioteca interna de componentes compartilhada.**

- `esbuild.mjs` passa de um entrypoint para **um bundle por painel**, cada um com teto de
  tamanho próprio que falha o build quando estourado.
- `src/webview/ui/` reúne os componentes: `Card`, `StatusBadge`, `PanelHeader`,
  `EmptyState`, `Toolbar`, `StatTile`. Assinaturas em `design.md` §4.
- Cada `*Html.ts` deixa de montar marcação e passa a emitir apenas o **documento**: CSP
  com nonce, o payload como bloco de dados JSON e a tag do bundle. A montagem visual migra
  para o cliente Preact.
- Os componentes importam de `src/sdd/` **somente tipos**. Um import de valor arrasta
  `js-yaml` (via `yamlUtils`) para dentro do bundle — erro real cometido e corrigido na
  0035, que inflou o bundle do wizard de 21 kB para 136 kB. Toda derivação acontece no
  host e viaja pronta no payload.
- A migração é **incremental, painel a painel**, com a regra do `design.md` §11: um teste
  que exija mudança de expectativa é regressão, não ajuste.
- **O wizard fica de fora por ora.** A 0035 está `IN_PROGRESS` com sete tarefas abertas
  nos mesmos arquivos; ele adota a biblioteca depois que ela fechar.

## Alternativas consideradas

| Alternativa | Por que não |
| --- | --- |
| **Manter vanilla/template-string e compartilhar só CSS** | Era a opção Q2-b, recusada pelo usuário. Atenderia REQ-COCK-001, mas não REQ-COCK-002 com marcação compartilhada — a consistência voltaria a depender de disciplina, que é a causa do problema atual |
| **Manter o ADR-034 como está e migrar só os painéis com mockup** | Deixaria quatro superfícies em outra stack: duas linguagens de UI convivendo indefinidamente, e a biblioteca de componentes utilizável só pela metade |
| **Um único bundle para todos os painéis** | Todo painel carregaria o código de todos os outros, e um erro em qualquer um derrubaria os dez. Um bundle por painel isola falha e tamanho |
| **Web Components em vez de Preact** | Seriam consumíveis também pelas template-strings, evitando a migração — mas o projeto já tem Preact e JSX em uso e testado no wizard; introduzir um segundo modelo de componente para evitar migrar seria trocar um custo por outro maior |
| **React** | Runtime maior sem benefício sobre Preact aqui; já recusado no ADR-034 pelo mesmo motivo |

## Consequências

**Positivas**

- Uma stack de UI só na extensão inteira; A1 deixa de estar aberta.
- REQ-COCK-002 vira estrutural: a consistência passa a ser consequência de importar o
  mesmo componente, não de lembrar de copiar o mesmo CSS.
- Os `*Html.ts` encolhem drasticamente — `boardHtml.ts` tem 529 linhas hoje, quase todas
  marcação e CSS que passam a ser componentes.
- `renderPanelHtml` vira ponto único de CSP/nonce/escape: um teste cobre as dez
  superfícies em vez de dez testes que podem divergir.

**Negativas**

- **Sete módulos que funcionam e estão cobertos por teste são reescritos.** É o custo
  central, e o risco concentra-se no Board, que acumula seis features de comportamento
  (arrastar, filtro, feed, ordenação, ordem e colapso de colunas). **Mitigação:** migração
  incremental com os testes existentes como contrato imutável; o Board vai primeiro, por
  ser o mais coberto.
- Dez bundles a construir e a manter sob teto de tamanho. **Mitigação:** teto por bundle
  que falha o build; chunk comum se o esbuild permitir sob CSP.
- O `.vsix` cresce com o Preact replicado por bundle, se não houver chunk comum.
  **Mitigação:** Preact tem ~10 KB; mensurável no build e sujeito ao teto.
- Durante a migração, painéis migrados e não migrados convivem — a mistura visual que a
  feature combate fica temporariamente pior antes de melhorar. **Mitigação:** os tokens
  `--sdd-*` entram em **todos** os painéis no primeiro passo, antes das migrações, para
  que a divergência restante seja de layout e não de cor.

## Limite desta decisão

Decide **a stack e a organização do cliente** de todas as superfícies de webview.
**Não** decide a natureza da superfície da sidebar (ADR-036), **não** altera a camada
visual (ADR-035), **não** enfraquece a postura de segurança (ADR-024) e **não** muda
nenhum comportamento observável da extensão.
