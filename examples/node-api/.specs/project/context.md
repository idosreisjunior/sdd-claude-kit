# Contexto técnico — customer-api

> Resultado da descoberta automática. Revise antes de confiar.

Última atualização: 2026-07-29 · Método: `/sdd-kit:init`

---

## Estado atual

Projeto novo, com uma única rota (`/health`) e testes cobrindo-a. Não está em produção.

## Tipo de projeto

API HTTP em Node.js, sem framework — usa `node:http` da biblioteca padrão.

## Linguagens e tecnologias

| Item | Valor | Confiança |
| --- | --- | --- |
| Linguagem principal | JavaScript (ESM) | detectado — `"type": "module"` em `package.json` |
| Runtime | Node.js ≥ 20 | detectado — campo `engines` |
| Gerenciador de pacotes | npm | > HIPÓTESE: há `package.json` mas nenhum lockfile; npm é o padrão do Node |
| Framework HTTP | nenhum | detectado — `node:http` importado em `src/server.js`, sem dependências |
| Framework de testes | `node:test` | detectado — script `test` executa `node --test` |
| Dependências de runtime | nenhuma | detectado — `package.json` não declara `dependencies` |

## Estrutura de diretórios

| Caminho | Conteúdo |
| --- | --- |
| `src/` | Código da API |
| `src/routes/` | Uma função por rota |
| `tests/` | Testes com o runner nativo do Node |

## Comandos

| Comando | Valor | Origem |
| --- | --- | --- |
| Build | — | não detectado |
| Teste | `npm test` | `package.json`, campo `scripts.test` |
| Lint | — | não detectado |

**`lint` e `build` ficaram nulos porque este projeto não os tem.** A descoberta não inventou `npm run lint`: um comando presumido faria a verificação reportar sucesso sobre nada — ver `constitution.md`, Art. 13.

## Persistência e infraestrutura

Nenhuma. Não há banco de dados nem estado além da memória do processo.

> QUESTÃO: o cadastro de clientes vai exigir persistência. Onde? Isso precisa ser decidido antes do design da feature `0001`.

## Padrões de arquitetura observados

Rotas como funções puras que recebem `(req, res)` e devolvem `true` quando tratam a requisição; `server.js` percorre a lista até alguma responder. Sem camadas nem injeção de dependências — o projeto ainda é pequeno demais para justificá-las.

## Documentação existente

Apenas `README.md`.

## Riscos iniciais identificados

| # | Risco | Onde é tratado |
| --- | --- | --- |
| 1 | Sem persistência definida — a primeira feature que guardar dados precisa decidir isso | Questão em aberto na spec de `0001` |
| 2 | Sem linter configurado; a Definition of Done não é integralmente executável | Não bloqueia; `config.yaml` registra `lint: null` honestamente |
| 3 | O roteamento por lista percorrida não escala além de poucas rotas | Aceitável agora; revisitar quando houver mais de ~10 rotas |
