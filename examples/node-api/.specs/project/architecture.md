# Arquitetura — customer-api

Versão: 1.0 · Atualizado em: 2026-07-29

> Gerado por `/sdd-kit:init`. As seções que a leitura do código respondeu estão
> preenchidas; as que dependem de decisão humana ficaram como questão em aberto.

---

## 1. Visão geral

Servidor HTTP sem framework. `server.js` percorre uma lista de rotas até que uma
delas trate a requisição; nenhuma tratando, responde 404.

```
     requisição HTTP
           │
      ┌────▼─────┐
      │ server.js│  percorre routes[]
      └────┬─────┘
           │ (req, res) → boolean
   ┌───────▼────────┐
   │ src/routes/*.js│  cada rota devolve true se tratou
   └────────────────┘
```

## 2. Componentes e responsabilidades

| Componente | Responsabilidade | Não faz |
| --- | --- | --- |
| `src/server.js` | Criar o servidor, despachar para as rotas, responder 404 | Não conhece regra de negócio nem formato de payload |
| `src/routes/*.js` | Tratar uma rota específica e escrever a resposta | Não conhece outras rotas nem a ordem de despacho |

### Regra de dependência

`server.js` importa rotas; rotas **não** importam `server.js` nem umas às outras.
A dependência aponta em um sentido só.

## 3. Fluxos principais

### Requisição atendida

```
GET /health → server.js → health() devolve true → 200 {"status":"ok"}
```

### Requisição sem rota

```
GET /qualquer → server.js → nenhuma rota devolve true → 404 {"error":"not_found"}
```

## 4. Contratos

Respostas são JSON. Erros seguem `{ "error": "<código_snake_case>" }`.

> QUESTÃO: há consumidores externos desta API hoje? Se houver, o formato de
> resposta vira contrato público e mudanças nele exigem versionamento.

## 5. Persistência

Nenhuma. O processo não guarda estado entre requisições.

> QUESTÃO: a feature `0001-customer-registration` precisa persistir clientes.
> Qual mecanismo? Essa decisão é arquitetural e exige ADR antes do design.

## 6. Segurança

> QUESTÃO: a API terá autenticação? Hoje todas as rotas são públicas, o que é
> aceitável para `/health` e não é para cadastro de clientes.

## 7. Observabilidade

Nenhuma além de `console.log` na subida do servidor.

## 8. Limites explícitos

- Nenhuma dependência de runtime. Só a biblioteca padrão do Node.
- Rotas não conhecem umas às outras.

## 9. Decisões arquiteturais

Nenhum ADR registrado ainda. As questões das seções 5 e 6 devem produzir os
primeiros.

## 10. Questões arquiteturais em aberto

| # | Questão | Impacto | Quando decidir |
| --- | --- | --- | --- |
| A1 | Qual mecanismo de persistência? | Bloqueia o design de `0001-customer-registration` | Antes do design da feature |
| A2 | Haverá autenticação e autorização? | Define se o cadastro é público | Antes do design da feature |
| A3 | O roteamento por lista percorrida escala? | Manutenção, acima de ~10 rotas | Quando houver mais rotas |
