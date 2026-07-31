# Padrões — {{PROJECT_NAME}}

Convenções obrigatórias para código, documentos e specs deste projeto.

{{guia: as seções 1 a 4 são convenções do método SDD e vêm prontas — as skills
dependem delas para gerar identificadores consistentes. As seções 5 em diante
são do seu projeto.

Prefira registrar a convenção que você já usa a inventar uma nova. Um padrão
que contraria o código existente só gera ruído em revisão.}}

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
| Specs e documentação | {{DOC_LANGUAGE}} |
| Código, identificadores, nomes de arquivo | {{CODE_LANGUAGE}} |
| Mensagens de commit | {{COMMIT_LANGUAGE}} |

## 6. Código

- {{CODE_CONVENTION}}

{{repetir: convenções reais do projeto — tipagem, tamanho de função, tratamento
de erro, o que é proibido importar de onde.

Registre o que é verificável. "Escreva código limpo" não é uma convenção; "sem
`any` implícito" é.}}

### Mensagens de erro

{{ERROR_MESSAGE_FORMAT}}

{{guia: uma mensagem de erro útil informa ação executada, resultado, arquivo
relacionado e correção sugerida. Exemplo:

```
✖ [validate] Requisito sem tarefa associada
  Arquivo: .specs/features/0001-auth/traceability.yaml
  Requisito: REQ-AUTH-004
  Correção: associe REQ-AUTH-004 a uma tarefa em tasks.md, ou remova o requisito.
```
}}

## 7. Testes

- {{TEST_CONVENTION}}

{{guia: onde os testes vivem, como são nomeados, o que exige teste. Uma regra
útil: o nome do teste referencia o cenário — `SCN-AUTH-001 — credenciais
válidas criam sessão`.}}

## 8. Commits

{{COMMIT_CONVENTION}}

{{guia: se o projeto usa Conventional Commits, registre os escopos válidos.
Se não usa, registre o formato que usa. Se não há formato, diga isso em vez de
inventar um que ninguém vai seguir.}}

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
