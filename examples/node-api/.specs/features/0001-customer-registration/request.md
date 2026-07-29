# Solicitação original

- **ID:** 0001-customer-registration
- **Tipo:** feature
- **Criada em:** 2026-07-29
- **Origem:** `/sdd-kit:new feature "criar cadastro de clientes"`

---

## Texto da solicitação

> criar cadastro de clientes

## Interpretação

Uma solicitação de cinco palavras. Ela diz **o quê** de forma genérica e não diz
nada sobre regras, campos, permissões ou persistência.

A spec derivada é deliberadamente curta e cheia de perguntas. Esse é o resultado
correto — inventar seis requisitos plausíveis a partir daqui produziria um
documento que parece pronto e que ninguém pediu.

## O que esta mudança entrega

Um endpoint para registrar clientes na API.

## O que esta mudança deliberadamente não entrega

Nada foi excluído ainda: o escopo depende das respostas às questões em aberto.
Registrar exclusões antes de saber o que está incluído seria fingir precisão.

## Restrições conhecidas

- O projeto não tem persistência (ver `architecture.md` §5). Cadastrar clientes
  exige decidir isso, e a decisão é arquitetural.
- Não há autenticação (ver `architecture.md` §6). Um cadastro público é uma
  decisão, não um padrão.
