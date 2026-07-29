# Tarefas — Cadastro de clientes

> Plano gerado por `/sdd-kit:tasks` com **três questões críticas em aberto** na
> spec. O usuário foi avisado do custo: tarefas construídas sobre regras
> indefinidas serão refeitas quando as respostas chegarem.
>
> A mudança **não** foi promovida a `PLANNED`. Ver a seção final.

Complexidade: **P** pequena (≤ meio dia) · **M** média (≈ 1 dia) · **G** grande
(deve ser dividida antes de começar).

---

## Ordem de execução

```
TASK-CUST-001 (ADR: persistência)
TASK-CUST-002 (ADR: autorização)
        │
        └──▶ TASK-CUST-003 ──▶ TASK-CUST-004 ──▶ TASK-CUST-005
```

`TASK-CUST-001` e `TASK-CUST-002` são paralelizáveis e bloqueiam todo o resto.

---

## TASK-CUST-001 — Decidir e registrar o mecanismo de persistência

**Requisitos:** REQ-CUST-001
**Dependências:** nenhuma
**Complexidade:** P
**Status:** pending

### Descrição

Responder Q1 e registrar em ADR. O projeto não tem persistência; cadastrar
clientes é a primeira funcionalidade que guarda estado.

Tarefa de decisão — não escreve código.

### Arquivos prováveis

- `.specs/project/decisions/ADR-001-*.md`
- `.specs/project/architecture.md` (§5)

### Testes esperados

Nenhum — tarefa de decisão.

### Critério de conclusão

- ADR registrado com contexto, alternativas e consequências.
- Q1 fechada em `spec.md`.
- `architecture.md` §5 e a questão A1 atualizadas.

---

## TASK-CUST-002 — Decidir e registrar o modelo de autorização

**Requisitos:** REQ-CUST-001
**Dependências:** nenhuma
**Complexidade:** P
**Status:** pending

### Descrição

Responder Q2 e registrar em ADR. Hoje todas as rotas são públicas — aceitável
para `/health`, decisão explícita para cadastro.

### Arquivos prováveis

- `.specs/project/decisions/ADR-002-*.md`
- `.specs/project/architecture.md` (§6)

### Testes esperados

Nenhum — tarefa de decisão.

### Critério de conclusão

- ADR registrado.
- Q2 fechada em `spec.md`.
- Se o cadastro for autenticado, os requisitos correspondentes entram na spec.

---

## TASK-CUST-003 — Definir o modelo de cliente

**Requisitos:** REQ-CUST-001
**Dependências:** TASK-CUST-001
**Complexidade:** M
**Status:** pending

### Descrição

Responder Q3, Q4 e Q5, e implementar o modelo com validação.

### Arquivos prováveis

- `src/customers/customer.js`

### Testes esperados

- `TEST-CUST-001` — dados válidos produzem um cliente
- `TEST-CUST-002` — cada campo obrigatório ausente é rejeitado

### Critério de conclusão

- Campos e obrigatoriedade definidos na spec, não no código.
- Regra de unicidade implementada, se houver.
- Testes aprovados.

---

## TASK-CUST-004 — Implementar a rota de cadastro

**Requisitos:** REQ-CUST-001
**Dependências:** TASK-CUST-002, TASK-CUST-003
**Complexidade:** M
**Status:** pending

### Descrição

Criar a rota seguindo a convenção de `src/routes/`: função `(req, res)` que
devolve `true` quando trata a requisição.

### Arquivos prováveis

- `src/routes/customers.js`
- `src/server.js` (registrar na lista de rotas)

### Testes esperados

- `TEST-CUST-003` — cadastro válido responde com o identificador (SCN-CUST-001)
- `TEST-CUST-004` — cadastro inválido é rejeitado (SCN-CUST-002)

### Critério de conclusão

- Cenários SCN-CUST-001 e SCN-CUST-002 passam.
- Erros seguem `{ "error": "<código>" }` (`standards.md` §6).
- A rota não importa outras rotas (`architecture.md`, regra de dependência).

---

## TASK-CUST-005 — Atualizar a documentação do projeto

**Requisitos:** REQ-CUST-001
**Dependências:** TASK-CUST-004
**Complexidade:** P
**Status:** pending

### Descrição

Refletir a nova rota e as decisões tomadas em `architecture.md` e no `README.md`.

### Arquivos prováveis

- `.specs/project/architecture.md`
- `README.md`

### Testes esperados

Nenhum automatizado.

### Critério de conclusão

- `architecture.md` §5 e §6 refletem as decisões dos ADRs.
- O glossário define "cliente" (hoje uma questão em aberto).

---

## Resumo

| Complexidade | Quantidade |
| --- | --- |
| P | 3 |
| M | 2 |
| G | 0 |

Total: 5 tarefas · 0 concluídas · 5 pendentes.

**Caminho crítico:** `001 → 003 → 004 → 005`

**Paralelizáveis agora:** `TASK-CUST-001` e `TASK-CUST-002`

### Transição de estado não aplicada

`SCN-PF-012` promoveria a mudança a `PLANNED`. Duas condições impediram:

1. **Três questões críticas em aberto** (Q1, Q2, Q3). Um plano sobre regras
   indefinidas não é planejamento, é rascunho.
2. A transição `DRAFT → PLANNED` é **inválida** na máquina de estados: pula
   `CLARIFIED` e `DESIGNED`.

O estado permanece `DRAFT`. O plano foi gravado assim mesmo — ele tem valor
independentemente do estado, e as duas primeiras tarefas são justamente as que
destravam o resto.
