# Verificação dos critérios de aceite — 0001-plugin-foundation

Avaliado em 2026-07-29, durante `TASK-PF-016`. Reavaliado no mesmo dia, depois do dogfooding com execução real das skills.

Legenda: ✅ aprovado · ⚠️ aprovado com ressalva · ❌ reprovado

> **Conclusão: a feature pode ser promovida a `VERIFIED`.** Nenhum critério
> reprovado. A única ressalva não impede o funcionamento.

---

## Critérios de aceite

| # | Critério | Resultado | Evidência |
| --- | --- | --- | --- |
| 1 | O plugin pode ser instalado a partir deste repositório | ⚠️ | `marketplace add ./` + `install` + `details` executados; 4 skills descobertas. **O caminho GitHub não foi testado** — o repositório não está publicado |
| 2 | `/sdd-kit:init` cria `.specs` válida em projeto vazio e existente | ✅ | **Executada de verdade** em projeto Node limpo: criou 8 arquivos, `config.yaml` valida contra o schema |
| 3 | `/sdd-kit:init` não sobrescreve arquivos sem confirmação | ✅ | Na primeira execução headless, apresentou o diagnóstico e **parou sem criar nada**, aguardando confirmação |
| 4 | `/sdd-kit:new` cria mudança com id único, `request.md`, `spec.md`, `status.yaml` em `DRAFT` e entrada no índice | ✅ | Executada: alocou `0001`, criou os três arquivos, atualizou o índice e incrementou `next_id` |
| 5 | `/sdd-kit:spec` gera requisitos com cenários e critérios, marcando lacunas | ✅ | Reprovado na primeira execução (bug `0003`); **corrigido e reverificado**: 2 requisitos, ambos com origem declarada, 4 operações não pedidas viraram questão |
| 6 | `/sdd-kit:tasks` gera tarefas pequenas com dependências e cobertura | ✅ | Executada: 8 tarefas, nenhuma `G`, todo requisito coberto, nenhuma dependência pendente, sem ciclos |
| 7 | Transições de estado registradas com data e motivo | ✅ | `TEST-PF-018` valida em artefatos reais; na execução, o salto `DRAFT → PLANNED` foi registrado no motivo, nomeando os estados pulados |
| 8 | Modo `advisory` não bloqueia; `strict` informa que não está implementado | ✅ | `TEST-PF-024` nas quatro skills |
| 9 | `config.yaml` e `status.yaml` validam contra os schemas | ✅ | Bug `0004` corrigido e **reverificado por execução**: o `status.yaml` gerado sobre este repositório trouxe `blocked_by` com `Q1`, `Q2`, `Q5` — identificadores, não prosa — e valida |
| 10 | Existe projeto de exemplo percorrendo `init → new → spec → tasks` | ✅ | `examples/node-api`, com `TEST-PF-021`; `npm test` do exemplo passa |
| 11 | Lint, testes e build passam em Ubuntu, Windows e macOS no CI | ✅ | Matriz **executada e verde** nos três sistemas, mais Node 22 em Ubuntu. A primeira execução falhou em Windows por CRLF — defeito real, corrigido |
| 12 | O plugin opera sobre as specs deste próprio repositório | ✅ | `new` e `spec` executadas sobre `.specs/` deste repositório, gerando a feature `0007`. Os 70 invariantes passam sobre o artefato gerado pela skill |

**11 aprovados · 1 com ressalva · 0 reprovados**

---

## O que mudou depois do dogfooding

A avaliação anterior tinha 5 aprovados, 6 com ressalva e 1 reprovado. As seis ressalvas compartilhavam uma causa: *"as skills nunca foram invocadas numa sessão viva"*.

Essa limitação foi superada. `claude -p` inicia uma sessão nova, que carrega o plugin — o obstáculo era a sessão em andamento, não o ambiente. Quatro critérios saíram de ressalva para aprovado por **execução real**.

O mesmo dogfooding encontrou cinco defeitos, todos registrados em `.specs/bugs/`:

| Bug | Estado |
| --- | --- |
| `0002` — referência a artigo inexistente | corrigido, com regressão |
| `0003` — `spec` expandia o pedido em CRUD completo | corrigido, **reverificado por execução** |
| `0004` — `status.yaml` gerado violava o schema | corrigido, regressão por mutação |
| `0005` — Artigo 10 insatisfazível sem linter | corrigido, regressão por mutação |
| `0006` — `reason` quebrava o YAML com aspas | corrigido, com regressão |

O `0003` era o mais grave: violava o Artigo 2, que é a regra central do framework. Sem executar as skills, ele não teria sido encontrado — nenhum teste estrutural pega expansão de escopo.

## O dogfooding literal

As skills foram executadas sobre `.specs/` **deste repositório**, criando a feature `0007-sdd-workflow-completion` para a Fase 2. Resultado:

| | |
| --- | --- |
| Requisitos | 8 funcionais, para as 8 coisas do pedido — **mapeamento 1:1** |
| Origem declarada | 11 de 11 requisitos |
| Cenários | 17 · Questões: 12 · Hipóteses marcadas: 5 |
| `status.yaml` | Valida; `blocked_by` com identificadores |
| Invariantes | Os 70 passam sobre o artefato gerado |

A correção do `0003` se sustentou numa solicitação diferente e mais longa: nenhuma operação foi acrescentada por completude, e os 3 NFRs vieram de `standards.md`, do Artigo 7 e do `ADR-007` — não da solicitação, que não declarava nenhum.

**A feature saiu como `0007`, não `0002`.** Identificadores são globais e sequenciais, e `0002`–`0006` foram consumidos pelos bugs do dogfooding anterior. A skill alocou o próximo livre e não reutilizou nenhum, que é o comportamento correto — a expectativa de "0002" vinha da descrição de `TASK-PF-016`, escrita quando só existia `0001`.

## A ressalva restante

**Critério 1** — a instalação foi exercitada por caminho local. O caminho `marketplace add idosreisjunior/sdd-claude-kit` só funciona depois da publicação.

---

## Definition of Done

| Item | Estado |
| --- | --- |
| Código implementado | ✅ 4 skills, 2 schemas, 19 templates, 2 manifestos |
| Testes relacionados aprovados | ✅ 201 testes |
| Lint aprovado | ✅ exit 0 |
| Build aprovado | ✅ `tsc --noEmit`, exit 0 |
| Documentação atualizada | ✅ 2 guias, exemplo, README, CONTRIBUTING |
| Rastreabilidade atualizada | ✅ 14 requisitos com implementação; nenhum arquivo citado inexistente |
| Critérios de aceite avaliados | ✅ este documento |
| Sem erros críticos de validação | ✅ |
| Tarefa relacionada a uma especificação | ✅ |
| Mudanças de arquitetura documentadas | ✅ ADR-001 a ADR-009 |

Definition of Done e critérios de aceite, ambos cumpridos.

---

## A matriz de CI

Publicada e executada. **A primeira execução falhou em Windows** enquanto Ubuntu e macOS passavam: o git converte LF em CRLF no checkout, e dois regexes dos testes assumiam `\n`.

Vale registrar o que isso significa. O defeito estava lá desde `TASK-PF-012`, passou por 201 testes verdes em Linux, e **nenhuma execução local o encontraria**. `NFR-PF-001` deixou de ser uma afirmação sobre portabilidade e passou a ser uma verificação — que falhou de primeira, como devia.

## A ressalva restante

**Critério 1** — a instalação foi exercitada por caminho local. Agora que o repositório está publicado, `claude plugin marketplace add idosreisjunior/sdd-claude-kit` pode ser verificado; até que seja, a ressalva fica.
