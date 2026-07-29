# Feature: Cadastro de clientes

- **ID:** 0001-customer-registration
- **Escopo dos identificadores:** CUST
- **Status:** DRAFT

---

## Objetivo

Permitir que um cliente seja registrado na API.

## Contexto

A API hoje tem apenas `/health`. Não há persistência nem autenticação — ver
`architecture.md`, §5 e §6. Cadastrar clientes é a primeira funcionalidade que
guarda estado, e por isso força duas decisões arquiteturais que o projeto ainda
não tomou.

## Escopo

### Incluído

- Registrar um cliente por meio de uma requisição HTTP.
- Rejeitar dados inválidos.

### Não incluído

- Consultar, atualizar ou excluir clientes. Não foram pedidos; cada um é uma
  mudança própria.

---

## Requisitos funcionais

### REQ-CUST-001 — Registrar um cliente

O sistema deve permitir registrar um cliente a partir de dados enviados por HTTP.

#### SCN-CUST-001 — Dados válidos

DADO que os dados do cliente são válidos
QUANDO uma requisição de cadastro for enviada
ENTÃO o sistema deve registrar o cliente
E responder com o identificador atribuído.

#### SCN-CUST-002 — Dados inválidos

DADO que os dados do cliente estão incompletos ou malformados
QUANDO uma requisição de cadastro for enviada
ENTÃO o sistema deve rejeitar o cadastro
E responder com um código de erro.

---

## Requisitos não funcionais

Nenhum registrado ainda.

A solicitação não trouxe exigência de desempenho, segurança ou compatibilidade,
e o projeto não tem padrão que imponha alguma. Preencher esta seção por simetria
com a de requisitos funcionais seria inventar escopo.

---

## Critérios de aceite

- [ ] Um cliente com dados válidos é registrado e recebe identificador.
- [ ] Dados inválidos são rejeitados sem registrar nada.
- [ ] Testes automatizados cobrem os dois cenários.

Os critérios param aqui de propósito: sem as respostas às questões abaixo, não
há como escrever critérios sobre campos, unicidade, permissões ou persistência.

---

## Questões pendentes

| # | Questão | Bloqueia | Prioridade |
| --- | --- | --- | --- |
| Q1 | **Onde os clientes são armazenados?** O projeto não tem persistência. É decisão arquitetural e exige ADR. | design | **Crítica** |
| Q2 | **Quem pode cadastrar?** Não há autenticação. Um endpoint público de cadastro é uma decisão, não um padrão. | design | **Crítica** |
| Q3 | Quais campos compõem um cliente, e quais são obrigatórios? | REQ-CUST-001 | **Crítica** |
| Q4 | Cliente é pessoa física, empresa, ou os dois? Muda o modelo de dados e as regras de validação. | REQ-CUST-001 | Alta |
| Q5 | Existe regra de unicidade — e-mail, CPF, CNPJ? Se existir, duplicata bloqueia ou apenas alerta? | SCN-CUST-002 | Alta |
| Q6 | A resposta de erro deve indicar qual campo falhou? `standards.md` §6 deixou isso em aberto. | SCN-CUST-002 | Média |

**Três questões críticas em aberto.** Esta mudança não deve sair de `DRAFT`
antes de respondê-las — ver `constitution.md`, Art. 2.

## Hipóteses assumidas

Nenhuma. As lacunas foram registradas como questões em vez de preenchidas com
suposições: cada uma delas é uma decisão de negócio ou de arquitetura, não um
detalhe que possa ser inferido.
