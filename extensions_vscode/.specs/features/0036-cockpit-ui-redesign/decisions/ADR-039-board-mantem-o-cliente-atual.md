# ADR-039 — O Board mantém o cliente que já tem

- **Status:** Aceito
- **Data:** 2026-08-05
- **Origem:** descoberto ao iniciar a TASK-COCK-006, antes de escrever código.
- **Relação com o ADR-037:** **restringe** ainda mais o alcance dele, depois do ADR-038.
- **Decidido em:** implementação; escolha do usuário após interrupção.

---

## Contexto

O ADR-037 decidiu migrar as superfícies interativas para Preact; o ADR-038 já havia tirado
as somente-leitura de lá. Ao começar pelo Board — a maior e mais visível — apareceu um
conflito com uma regra do próprio design desta feature.

`src/test/boardHtml.test.ts` afirma cinco coisas sobre o documento do Board:

```js
assert.match(html, /<script nonce="abc123">/)          // script inline, sem src
assert.match(html, /const INITIAL = /)                 // variável do script inline
assert.match(html, /acquireVsCodeApi\(\)/)             // chamada dentro do HTML
assert.match(html, /<div id="app"><\/div>/)            // a raiz se chama #app
assert.equal((html.match(/<\/script>/g) || []).length, 1)
```

Carregar um bundle quebra as cinco: a tag de script ganha `src`, a inicialização sai do
HTML, a raiz do `renderPanelHtml` se chama `#root` e passam a existir duas tags de script
(bloco de dados + bundle).

E o `design.md` §11 desta feature diz, sobre a migração painel a painel:

> um teste que exija mudança de expectativa é **regressão**, não ajuste. Reverter o passo e
> investigar.

Essa regra existe para impedir que a migração vire reescrita disfarçada, afrouxando os
testes até o novo código passar. Reescrever esses cinco `assert` para migrar o Board seria
desarmar exatamente o alarme instalado para proteger o Board.

**O que torna o caso ambíguo:** os cinco não descrevem comportamento observável. Descrevem
o mecanismo de entrega que o ADR-037 quis substituir. As outras asserções do mesmo arquivo
— CSP, nonce, dado escapado — são garantias e valem independentemente do mecanismo.

Havia, portanto, duas leituras defensáveis, e a decisão é sobre risco, não sobre semântica
de teste.

## Decisão

**O Board mantém o cliente inline que já tem e recebe a identidade visual pelo CSS e pelas
classes compartilhadas** — a mesma técnica dos painéis somente-leitura (ADR-038), aqui por
motivo diferente.

- `boardHtml.ts` continua emitindo seu documento e seu script inline. Os cinco `assert`
  permanecem verdadeiros e intocados.
- O CSS do Board passa a consumir `componentsCss()` e as classes `ui-*`, de modo que
  cartão, badge de status, cabeçalho e estado vazio fiquem idênticos aos das demais
  superfícies (REQ-COCK-002, SCN-COCK-003).
- As seis funcionalidades já entregues — arrastar para transicionar, filtro e busca, feed
  de atividade, ordenação, ordem e recolhimento de colunas — **não são reescritas**, então
  não há risco de regressão nelas.
- A migração do Board para Preact fica para uma mudança própria, se e quando houver razão
  independente para pagá-la.

O critério que decide a superfície agora tem três casos, e todos são objetivos:

| Superfície | Cliente | Por quê |
| --- | --- | --- |
| Somente-leitura (histórico, métricas, validação) | nenhum | não reage ao usuário; `enableScripts: false` é mais forte (ADR-038) |
| Board | inline, o que já existe | reescrever seis features testadas não paga o ganho (este ADR) |
| Demais interativas (visão do projeto, editor de spec, sidebar) | Preact | ADR-037 |

## Alternativas consideradas

| Alternativa | Por que não |
| --- | --- |
| **Migrar, com exceção em ADR distinguindo asserção de MECANISMO da de GARANTIA** | Era defensável e foi oferecida ao usuário: preservaria CSP/nonce/escape literalmente e reescreveria só as cinco de mecanismo. Recusada porque o ganho — consistência de stack — não justifica reescrever seis funcionalidades de comportamento com a rede de testes parcialmente recolhida, justamente na superfície mais usada |
| **Adiar o Board e migrar os outros primeiro** | Chegaria ao Board com a biblioteca mais madura, mas adia indefinidamente a mudança visual que motivou a feature inteira, e não resolve o conflito — só o empurra |
| **Afrouxar a regra do §11 para toda a feature** | Trocaria uma proteção real por conveniência. A regra já pegou um caso legítimo; enfraquecê-la para passar por ele destruiria o valor dela nos próximos |
| **Reescrever o Board em Preact preservando `#app`, o nome `INITIAL` e o script inline** | Contorcionismo para fazer o teste passar sem mudar o teste — pior que as duas opções honestas, porque esconderia a substituição em vez de declará-la |

## Consequências

**Positivas**

- Risco de regressão no Board cai a praticamente zero: nenhuma linha de comportamento é
  tocada, e os cinco `assert` continuam sendo uma rede real.
- O usuário vê o Board com a identidade nova sem esperar uma migração grande.
- A regra do §11 permanece intacta e continua valendo como alarme.

**Negativas**

- **A stack não fica unificada**, que era o objetivo declarado do ADR-037. Restam três
  formas de produzir superfície na extensão. **Mitigação:** o contrato compartilhado é o
  CSS e as classes; a divergência é de marcação, não de aparência, e o teste-guarda
  TEST-COCK-001 cobre o CSS dos três modos.
- O Board não ganha os componentes Preact reais, então uma mudança futura no `Card` precisa
  ser refletida à mão no CSS dele se a marcação divergir. **Mitigação:** as classes são as
  mesmas; mudar o `Card` é mudar `uiCss.ts`, que os dois consomem.
- O ADR-037 fica reduzido a três superfícies (visão do projeto, editor de spec, sidebar), o
  que enfraquece a justificativa original dele — "as superfícies vão ser reescritas de
  qualquer forma" vale para menos superfícies do que se supunha. **Mitigação:** registrado
  aqui; se a terceira exceção aparecer, o ADR-037 deve ser reconsiderado por inteiro em vez
  de recortado de novo.

## Limite desta decisão

Decide **o cliente do Board**. Não altera o comportamento dele, não muda a biblioteca de
componentes, não afrouxa a regra do `design.md` §11 — que permanece valendo, inclusive
tendo sido o que forçou esta decisão.
