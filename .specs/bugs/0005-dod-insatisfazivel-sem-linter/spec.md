# Bug: Artigo 10 da constituição gerada é insatisfazível em projeto sem linter

- **ID:** 0005-dod-insatisfazivel-sem-linter
- **Escopo dos identificadores:** DIL
- **Status:** DRAFT
- **Severidade:** média
- **Correção:** aplicada e verificada em 2026-07-29

---

## Comportamento observado

O Artigo 10 da constituição gerada por `/sdd-kit:init` exige:

> Uma tarefa só é concluída com: código implementado; testes relacionados
> aprovados; **lint aprovado**; build aprovado **quando aplicável**; …

`build` tem a ressalva "quando aplicável". `lint` não tem.

Num projeto sem linter — situação comum e legítima — `config.yaml` registra `lint: null`, e `null` significa *não executado*. Nenhuma tarefa consegue satisfazer o artigo.

A própria execução de `init` no dogfooding identificou a contradição e a registrou como questão dentro do artigo, em vez de gerar um documento internamente inconsistente.

## Comportamento esperado

Ou o artigo tem a mesma ressalva de `build`, ou distingue "não configurado" de "configurado e reprovado".

## Regra violada

`REQ-PF-008` — templates padronizados. Um template que gera regra insatisfazível não produz artefato utilizável.

## Reprodução

1. `/sdd-kit:init` em projeto sem script de lint.
2. Ler o Artigo 10 do `constitution.md` gerado ao lado de `lint: null` no `config.yaml`.

**Frequência:** determinística em qualquer projeto sem linter.
**Ambiente:** qualquer.
**Primeira ocorrência conhecida:** `TASK-PF-005`, quando o template foi escrito.

## Impacto

Médio. A consequência prática é pior que parecer: uma regra que ninguém consegue cumprir é uma regra que todo mundo aprende a ignorar. E a Definition of Done é justamente o artigo que o Artigo 13 deste repositório protege contra "aprovado por conveniência".

---

## Causa raiz

O texto do artigo foi copiado do PRD §32, que descreve o projeto do framework — onde lint sempre existe. O template generalizou o texto sem generalizar a premissa.

## Escopo da correção

### Incluído

- Ajustar o Artigo 10 do template para tratar validação não configurada.
- Aplicar a mesma revisão ao `standards.md` e às skills que citam a Definition of Done.

### Não incluído

- Fazer `init` configurar um linter. O framework não escolhe ferramenta pelo usuário.
- Alterar a constituição deste repositório, onde lint existe e o artigo é satisfazível.

---

## Cenários de regressão

### SCN-DIL-001 — A Definition of Done é satisfazível sem linter

DADO um projeto cujo `config.yaml` tem `lint: null`
QUANDO uma tarefa cumprir todos os demais itens da Definition of Done
ENTÃO o artigo deve poder ser satisfeito
E o relatório deve registrar "lint não executado", nunca "aprovado".

---

## Critérios de aceite

- [x] O Artigo 10 do template distingue validação não configurada de reprovada.
- [x] `init` num projeto sem linter gera constituição internamente consistente.
- [x] A distinção "não executado" vs "aprovado" permanece explícita.
- [x] Nenhum teste existente alterado.

---

## Correção aplicada

Aplicada em 2026-07-29.

| Arquivo | Mudança |
| --- | --- |
| `templates/pt-BR/project/constitution.md` | Artigo 10 reescrito |
| `examples/node-api/.specs/project/constitution.md` | Artefato regenerado |
| `tests/templates.test.ts` | `SCN-DIL-001` |

O artigo passou a falar em **"validações configuradas"** e a distinguir três
estados, numa tabela:

| Estado | Em `config.yaml` | Conclui a tarefa? |
| --- | --- | --- |
| Aprovada | comando definido, passou | Sim |
| Reprovada | comando definido, falhou | **Não** |
| Não configurada | `null` | Sim, **se registrada como tal** |

### A decisão que a Q1 pedia

A questão em aberto era: "não configurado" deveria bloquear a conclusão, ou
apenas ser registrado?

**Decidido: não bloqueia, mas precisa aparecer no relatório.** Um projeto sem
linter é legítimo, e uma regra que ninguém consegue cumprir é uma regra que
todo mundo aprende a ignorar — o artigo perderia força inclusive onde importa.

A regra contra passe silencioso continua intacta e é o que o teste verifica:
"não executado" jamais vira "aprovado". A diferença entre *passou* e *não
existe* é exatamente o que o artigo protege, e omitir a segunda no relatório
seria a mesma falha que ele proíbe.

O artigo fecha dizendo que, se a ausência de uma validação for inaceitável para
o projeto, o caminho é configurar a ferramenta — não afrouxar o relatório.

**Verificação por mutação:** com o Artigo 10 anterior, o teste falha.

---

## Questões pendentes

| # | Questão | Bloqueia | Prioridade |
| --- | --- | --- | --- |
| Q1 | "Não configurado" deveria bloquear a conclusão, ou apenas ser registrado? Bloquear força rigor e trava projetos legítimos; registrar é permissivo e pode virar desculpa. | correção | Média |

## Hipóteses assumidas

Nenhuma. A contradição é textual e verificável nos dois documentos gerados.
