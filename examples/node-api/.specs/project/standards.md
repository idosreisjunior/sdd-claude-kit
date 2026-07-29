# Padrões — customer-api

Convenções obrigatórias para código, documentos e specs deste projeto.


---

## 1. Identificadores

Formato: `PREFIXO-ESCOPO-NNN`, com `NNN` sequencial de três dígitos dentro do
escopo.

| Prefixo | Uso | Exemplo |
| --- | --- | --- |
| `REQ-<ESCOPO>-NNN` | Requisito funcional | `REQ-AUTH-001` |
| `NFR-<ESCOPO>-NNN` | Requisito não funcional | `NFR-AUTH-001` |
| `SCN-<ESCOPO>-NNN` | Cenário de aceite | `SCN-AUTH-004` |
| `TASK-<ESCOPO>-NNN` | Tarefa | `TASK-AUTH-007` |
| `TEST-<ESCOPO>-NNN` | Teste esperado | `TEST-AUTH-003` |
| `ADR-NNN` | Decisão arquitetural | `ADR-006` |

O `ESCOPO` é uma sigla curta em maiúsculas derivada da mudança
(`0001-user-authentication` → `AUTH`).

**Identificadores nunca são reutilizados nem renumerados após criados.** Se um
requisito for removido, marque-o como `REMOVIDO` em vez de apagar o ID —
qualquer coisa que apontava para ele continua fazendo sentido.

## 2. Diretórios de mudança

`NNNN-slug-em-ingles-com-hifens` — quatro dígitos, sequencial global, definido
por `index.yaml.next_id`.

Slugs contêm apenas `[a-z0-9-]`: sem acentos, espaços ou caracteres inválidos em
Windows.

## 3. Cenários

Gherkin, com as palavras-chave em maiúsculas:

```
#### SCN-AUTH-001 — Credenciais válidas

DADO que o usuário possui uma conta ativa
QUANDO informar e-mail e senha válidos
ENTÃO o sistema deve criar uma sessão
E redirecionar o usuário para o painel.
```

Um cenário descreve **um** caminho. Caminhos alternativos são cenários
separados.

## 4. Marcação de incerteza

| Marcador | Uso |
| --- | --- |
| `> HIPÓTESE: …` | Suposição assumida na ausência de informação. Precisa de confirmação humana |
| `> QUESTÃO: …` | Ambiguidade identificada e não resolvida |
| `> DECISÃO PENDENTE: …` | Escolha técnica adiada conscientemente, com prazo |

Nunca omita uma dessas marcações para tornar um documento mais "limpo".

---

## 5. Idioma

| Artefato | Idioma |
| --- | --- |
| Specs e documentação | pt-BR |
| Código, identificadores, nomes de arquivo | inglês |
| Mensagens de commit | inglês |

## 6. Código

- Módulos ESM (`import`/`export`), nunca CommonJS.
- Tipos documentados por JSDoc — o projeto não usa TypeScript.
- Sem dependências de runtime: apenas a biblioteca padrão do Node.
- Uma rota por arquivo em `src/routes/`, exportando uma função `(req, res)`.

> QUESTÃO: há outras convenções que a leitura do código não revela?


### Mensagens de erro

Respostas de erro são JSON com a chave `error` e um código em `snake_case`:

```json
{ "error": "not_found" }
```

> QUESTÃO: erros de validação devem detalhar qual campo falhou?


## 7. Testes

- Testes em `tests/`, com o runner nativo (`node --test`).
- Um arquivo de teste por módulo testado.

> QUESTÃO: qual cobertura mínima é exigida, se alguma?


## 8. Commits

> QUESTÃO: o projeto adota algum formato de mensagem de commit? Não há
> histórico suficiente para inferir.


## 9. YAML

- Indentação de 2 espaços, sem tabs.
- Chaves em `snake_case`.
- **Datas em ISO 8601 e sempre entre aspas:** `created: "2026-07-29"`.
- Todo arquivo YAML do framework declara `version:` na primeira chave.

Sem aspas, o YAML converte `2026-07-29` em objeto data nativo e a validação por
schema falha. A mesma regra vale para `no`/`yes`/`on`/`off`, que viram
booleanos, e para versões como `1.10`, que viram número e perdem o zero.

## 10. Markdown

- Um `# H1` por documento.
- Blocos de código sempre com linguagem declarada.
- Tabelas para dados comparáveis; listas para sequências.
- Links relativos entre documentos do repositório.
- Sem HTML embutido.
