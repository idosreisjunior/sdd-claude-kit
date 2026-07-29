# Verificação dos critérios de aceite — 0001-plugin-foundation

Avaliado em 2026-07-29, durante `TASK-PF-016`. Reavaliado no mesmo dia, depois do dogfooding com execução real das skills.

Legenda: ✅ aprovado · ⚠️ aprovado com ressalva · ❌ reprovado

> **Conclusão: a feature não pode ser promovida a `VERIFIED`.** Um critério
> segue reprovado. O detalhamento está abaixo.

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
| 9 | `config.yaml` e `status.yaml` validam contra os schemas | ⚠️ | 17 testes cobrem. O `status.yaml` **gerado** violou o schema em `blocked_by` (bug `0004`) — corrigido, mas a correção é do guia do template e não foi reverificada por execução |
| 10 | Existe projeto de exemplo percorrendo `init → new → spec → tasks` | ✅ | `examples/node-api`, com `TEST-PF-021`; `npm test` do exemplo passa |
| 11 | Lint, testes e build passam em Ubuntu, Windows e macOS no CI | ❌ | **Verificado apenas em Linux.** A matriz nunca executou — sem commits nem remote quando foi declarada (Q10) |
| 12 | O plugin opera sobre as specs deste próprio repositório | ⚠️ | As skills foram executadas de verdade, mas num projeto de teste limpo, não sobre `.specs/` deste repositório |

**8 aprovados · 3 com ressalva · 1 reprovado**

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

## As três ressalvas restantes

**Critério 1** — a instalação foi exercitada por caminho local. O caminho `marketplace add idosreisjunior/sdd-claude-kit` só funciona depois da publicação.

**Critério 9** — a correção do `0004` está no guia do template. Os testes provam que um `blocked_by` bem formado valida e que o guia agora declara o formato; não provam que a skill passará a preencher certo. Fecha com uma reexecução.

**Critério 12** — as skills rodaram sobre um projeto de teste, não sobre `.specs/` deste repositório. É o dogfooding literal que `TASK-PF-016` descreve e que ainda não foi feito.

---

## Definition of Done

| Item | Estado |
| --- | --- |
| Código implementado | ✅ 4 skills, 2 schemas, 19 templates, 2 manifestos |
| Testes relacionados aprovados | ✅ 194 testes |
| Lint aprovado | ✅ exit 0 |
| Build aprovado | ✅ `tsc --noEmit`, exit 0 |
| Documentação atualizada | ✅ 2 guias, exemplo, README, CONTRIBUTING |
| Rastreabilidade atualizada | ✅ 14 requisitos com implementação; nenhum arquivo citado inexistente |
| Critérios de aceite avaliados | ✅ este documento |
| Sem erros críticos de validação | ✅ |
| Tarefa relacionada a uma especificação | ✅ |
| Mudanças de arquitetura documentadas | ✅ ADR-001 a ADR-009 |

A Definition of Done está cumprida; os critérios de aceite, não. A DoD mede se o trabalho foi feito com rigor; os critérios medem se o produto faz o que prometeu. O critério 11 exige três sistemas operacionais e só um foi testado.

---

## O que falta para `VERIFIED`

1. **Publicar o repositório** e confirmar a matriz de CI verde nos três sistemas. Fecha o critério 11 e a questão Q10 — é o único item **reprovado**.
2. **Executar as skills sobre `.specs/` deste repositório**, criando a feature `0002` da Fase 2. Fecha o critério 12.
3. **Reexecutar o fluxo** depois da correção do `0004`, confirmando que o `blocked_by` gerado valida. Fecha o critério 9.
4. Reavaliar este documento.
