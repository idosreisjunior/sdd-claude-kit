# Verificação dos critérios de aceite — 0001-plugin-foundation

Avaliado em 2026-07-29, durante `TASK-PF-016`. Estado da mudança: `DESIGNED`.

Legenda: ✅ aprovado · ⚠️ aprovado com ressalva · ❌ reprovado · ⬜ não avaliado

> **Conclusão: a feature não pode ser promovida a `VERIFIED`.** Um critério está
> reprovado e seis têm ressalva. O detalhamento está abaixo.

---

## Critérios de aceite

| # | Critério | Resultado | Evidência |
| --- | --- | --- | --- |
| 1 | O plugin pode ser instalado a partir deste repositório | ⚠️ | `marketplace add ./` + `install` + `details` executados; 4 skills descobertas. **O caminho GitHub não foi testado** — o repositório não está publicado |
| 2 | `/sdd-kit:init` cria `.specs` válida em projeto vazio e existente | ⚠️ | A instrução cobre `SCN-PF-002` a `SCN-PF-005`, verificado por `TEST-PF-024` e testes estruturais. **A skill nunca foi executada** |
| 3 | `/sdd-kit:init` não sobrescreve arquivos sem confirmação | ⚠️ | Declarado na instrução e verificado por teste estrutural. Não exercitado |
| 4 | `/sdd-kit:new` cria mudança com id único, `request.md`, `spec.md`, `status.yaml` em `DRAFT` e entrada no índice | ⚠️ | Artefatos produzidos **seguindo a instrução à mão** (bug `0002`): id alocado, índice atualizado, `next_id` incrementado, validado por `TEST-PF-013`. A skill não foi invocada |
| 5 | `/sdd-kit:spec` gera requisitos com cenários e critérios, marcando lacunas | ⚠️ | Demonstrado em `examples/node-api`: 1 requisito, 2 cenários, 6 questões, 0 NFR inventados. Produzido à mão a partir da instrução |
| 6 | `/sdd-kit:tasks` gera tarefas pequenas com dependências e cobertura | ⚠️ | Demonstrado no exemplo: 5 tarefas, nenhuma `G`, todo requisito coberto. Verificado por `TEST-PF-016` |
| 7 | Transições de estado registradas com data e motivo | ✅ | `TEST-PF-018` valida, em artefatos reais, que toda entrada de `history` tem `date` e `reason`, que o estado é o da última entrada, e que **cada transição é válida na máquina de estados** |
| 8 | Modo `advisory` não bloqueia; `strict` informa que não está implementado | ✅ | `TEST-PF-024` verifica a seção "Modo de governança" nas quatro skills, incluindo a regra de não fingir bloqueio |
| 9 | `config.yaml` e `status.yaml` validam contra os schemas | ✅ | 17 testes em `schemas.test.ts`, com casos negativos falhando **no campo esperado** |
| 10 | Existe projeto de exemplo percorrendo `init → new → spec → tasks` | ✅ | `examples/node-api`, com `TEST-PF-021`. O exemplo roda: `npm test` passa |
| 11 | Lint, testes e build passam em Ubuntu, Windows e macOS no CI | ❌ | **Verificado apenas em Linux.** A matriz de CI foi declarada mas nunca executou — o repositório não tem commits nem remote (Q10) |
| 12 | O plugin opera sobre as specs deste próprio repositório | ⚠️ | Instalado e as 4 skills descobertas via `plugin details`. **Invocação viva não foi possível**: skills de plugin recém-instalado não carregam numa sessão em andamento |

**5 aprovados · 6 com ressalva · 1 reprovado**

---

## A ressalva que atravessa seis critérios

Os critérios 2 a 6 e 12 têm a mesma limitação: **as skills nunca foram invocadas
numa sessão viva.**

O plugin instala e é descoberto — isso foi verificado com o CLI oficial. Mas
skills de um plugin instalado durante uma sessão só carregam na sessão seguinte,
e não há como reiniciar a sessão de dentro dela.

O que foi feito no lugar: seguir as instruções dos `SKILL.md` à mão para produzir
os artefatos de `examples/node-api` e do bug `0002`. Isso verifica que as
instruções são **seguíveis** e que os artefatos resultantes são válidos. Não
verifica que o Claude, lendo aquelas instruções sem supervisão, produz o mesmo
resultado.

A distinção importa e não deve ser apagada: comportamento de skill é instrução em
linguagem natural, e continua registrado como lacuna na matriz de rastreabilidade.

---

## Cenários

| Cenário | Verificação | Resultado |
| --- | --- | --- |
| SCN-PF-001 | `marketplace add` → `install` → `details` executados | ✅ |
| SCN-PF-002 a SCN-PF-005 | Declarados na instrução; testes estruturais | ⚠️ |
| SCN-PF-006 a SCN-PF-008 | Declarados; artefatos produzidos à mão validam | ⚠️ |
| SCN-PF-009 a SCN-PF-011 | Demonstrados no exemplo | ⚠️ |
| SCN-PF-012 a SCN-PF-014 | `TEST-PF-016`, `TEST-PF-017` sobre artefatos reais | ✅ |
| SCN-PF-015, SCN-PF-016 | `TEST-PF-018` | ✅ |
| SCN-PF-017 | `TEST-PF-013` | ✅ |
| SCN-PF-018 | `TEST-PF-008`, snapshots | ✅ |
| SCN-PF-019, SCN-PF-020 | `TEST-PF-024`, nas quatro skills | ✅ |
| SCN-PF-021 | `templates/en/` não existe; a instrução manda parar | ✅ |

---

## Definition of Done

| Item | Estado |
| --- | --- |
| Código implementado | ✅ 4 skills, 2 schemas, 18 templates, 2 manifestos |
| Testes relacionados aprovados | ✅ 159 testes |
| Lint aprovado | ✅ exit 0 |
| Build aprovado | ✅ `tsc --noEmit`, exit 0 |
| Documentação atualizada | ✅ 2 guias, exemplo, README, CONTRIBUTING |
| Rastreabilidade atualizada | ✅ 14 requisitos com implementação; nenhum arquivo citado inexistente |
| Critérios de aceite avaliados | ✅ este documento |
| Sem erros críticos de validação | ✅ |
| Tarefa relacionada a uma especificação | ✅ |
| Mudanças de arquitetura documentadas | ✅ ADR-001 a ADR-009 |

**A Definition of Done está cumprida. Os critérios de aceite, não.**

Não é contradição: a DoD mede se o trabalho foi feito com rigor; os critérios de
aceite medem se o produto faz o que foi prometido. O critério 11 exige três
sistemas operacionais e só um foi testado.

---

## O que falta para `VERIFIED`

1. **Publicar o repositório** e confirmar a matriz de CI verde nos três sistemas.
   Fecha o critério 11 e a questão Q10.
2. **Executar as skills numa sessão nova**, com o plugin instalado, e comparar o
   que elas geram com `examples/node-api`. Converte as seis ressalvas em
   aprovação ou em bugs.
3. Reavaliar este documento depois disso.
