# ADR-040 — A identidade vem do CSS; o cliente, só onde há necessidade

- **Status:** Aceito
- **Data:** 2026-08-05
- **Origem:** implementação da feature 0036, ao levantar o quadro completo das superfícies.
- **Substitui:** **ADR-037**. Incorpora e generaliza ADR-038 e ADR-039, que permanecem no
  histórico como o caminho percorrido.
- **Decidido em:** implementação; escolha do usuário após interrupção.

---

## Contexto

O ADR-037 decidiu migrar **todas** as superfícies de webview para esbuild + Preact, com o
argumento de que a 0036 as reescreveria de qualquer forma, e de que uma stack única
tornaria REQ-COCK-002 estrutural em vez de disciplinar.

A implementação corroeu essa premissa em três etapas:

1. **ADR-038** tirou histórico, métricas e validação: rodam com `enableScripts: false`, e
   carregar um cliente exigiria ligar scripts — contra NFR-COCK-002.
2. **ADR-039** tirou o Board: os testes dele afirmam o mecanismo de entrega, e migrá-lo
   exigiria reescrevê-los — a regressão que o `design.md` §11 proíbe.
3. O levantamento completo mostrou que **visão do projeto** e **dashboard de feature**
   também são criados com `enableScripts: false`. São somente-leitura pelo mesmo critério
   do ADR-038.

O quadro real das oito superfícies não-wizard:

| Superfície | `enableScripts` | Cliente |
| --- | --- | --- |
| Histórico, Métricas, Validação | `false` | nenhum |
| Visão do projeto, Dashboard de feature | `false` | nenhum |
| Board | `true` | o inline que já existe |
| Editor de spec | `true` | a decidir na TASK-COCK-014 |
| Sidebar | — (vira `WebviewView`) | novo, Preact |

Ou seja: o ADR-037 restou aplicável a **duas** superfícies, uma delas escrita do zero. A
"stack única" não vai acontecer, e continuar recortando o ADR-037 exceção a exceção o
transformaria numa decisão que ninguém consegue ler sem caçar outros três documentos.

O próprio ADR-039 antecipou isto: *"se a terceira exceção aparecer, o ADR-037 deve ser
reconsiderado por inteiro em vez de recortado de novo"*.

## Decisão

**A identidade visual é entregue pelo CSS e pelas classes compartilhadas. Cliente
JavaScript é consequência de necessidade de interação, não de uniformidade de stack.**

Duas camadas, com responsabilidades distintas:

- **`uiCss.ts` + `themeTokens.ts` — a identidade.** Servem a TODAS as superfícies, com ou
  sem cliente. É aqui que `Card`, `StatusBadge`, `PanelHeader`, `EmptyState` e `StatTile`
  existem de fato, como contrato de classes. É o que cumpre REQ-COCK-001 e REQ-COCK-002.
- **`src/webview/ui/*.tsx` — a conveniência.** Componentes Preact que montam a marcação
  daquelas classes, para quem já tem cliente. Não são a fonte da identidade; são um atalho
  para produzi-la.

O critério de ter cliente passa a ser um só, verificável e sem exceção:

> A superfície precisa **reagir ao usuário sem reabrir**? Se não, não carrega runtime.

Aplicado: cinco superfícies sem cliente, o Board com o cliente que já tem (ADR-039), o
editor de spec e a sidebar com cliente porque são interativos.

## Alternativas consideradas

| Alternativa | Por que não |
| --- | --- |
| **Manter o ADR-037 e anotar as restrições** | Quem ler o 037 daqui a seis meses encontra uma decisão que nunca foi cumprida e precisa reconstruir a verdade a partir de três outros ADRs. Uma decisão registrada que não descreve o que se fez é pior que nenhuma |
| **Reabrir a spec da 0036** (as decisões Q2/Q3 do usuário não descrevem mais o que vai acontecer) | Rigoroso e defensável — foi oferecido ao usuário. Recusado porque o que mudou é o COMO, não o o quê: os requisitos REQ-COCK-001/002 seguem exatos e são o que o usuário pediu. Reabrir a spec por mudança de meio seria confundir as duas camadas |
| **Forçar a migração de todos assim mesmo** | Exigiria ligar scripts em cinco painéis (contra NFR-COCK-002) e reescrever os testes do Board (contra design §11). Comprar uniformidade com segurança e com rede de teste |
| **Abandonar os componentes Preact e ficar só no CSS** | A sidebar é interativa e nova; escrevê-la em `document.createElement` seria pior. E o wizard já usa a mesma stack |

## Consequências

**Positivas**

- O registro passa a descrever o que existe. O critério "reage sem reabrir?" resolve os
  casos futuros sem precisar de mais um ADR por superfície.
- A identidade fica onde de fato está — no CSS —, o que explica por que superfícies sem
  runtime ficam idênticas às com runtime.
- Nenhuma superfície é migrada sem ganho para quem usa.

**Negativas**

- **Três formas de produzir marcação convivem** (string no host, cliente inline, componente
  Preact) e vão continuar convivendo. **Mitigação:** o contrato é o CSS, e TEST-COCK-001
  varre todos os módulos que o emitem; divergir de aparência exige divergir de classe, que
  é visível na revisão.
- A biblioteca `src/webview/ui/*.tsx` serve hoje a uma superfície escrita e uma por
  escrever, o que é pouco para o custo dela. **Mitigação:** o custo já foi pago, e o wizard
  a adota quando a 0035 fechar — momento em que passa a servir a três.
- O `design.md` §2 e §3 descrevem a migração como o ADR-037 a imaginava e ficam
  desatualizados. **Mitigação:** apontados para este ADR na seção 14.

## Limite desta decisão

Decide **de onde vem a identidade** e **quando existe cliente**. Não altera a camada de
tokens (ADR-035), a natureza da sidebar (ADR-036), nem qualquer requisito da spec —
REQ-COCK-001 e REQ-COCK-002 seguem exatamente como aprovados.
