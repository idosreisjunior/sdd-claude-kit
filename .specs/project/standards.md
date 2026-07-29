# Padrões do projeto

Convenções obrigatórias para código, documentos e specs deste repositório.

---

## 1. Idioma

| Artefato | Idioma |
| --- | --- |
| Specs, documentação, README, comentários explicativos longos | pt-BR |
| Código, identificadores, nomes de arquivo e diretório | inglês |
| Mensagens de commit, branches, PRs | inglês |
| Textos exibidos ao usuário pelo framework | i18n (`pt-BR` + `en`) — RNF-008 |

Nenhuma string voltada ao usuário deve ser escrita direto no código sem passar pela camada de i18n.

## 2. Identificadores

Formato: `PREFIXO-ESCOPO-NNN`, com `NNN` sequencial de três dígitos dentro do escopo.

| Prefixo | Uso | Exemplo |
| --- | --- | --- |
| `RF-NNN` | Requisito funcional do produto (PRD) | `RF-001` |
| `RNF-NNN` | Requisito não funcional do produto (PRD) | `RNF-003` |
| `REQ-<ESCOPO>-NNN` | Requisito funcional de uma mudança | `REQ-PF-002` |
| `NFR-<ESCOPO>-NNN` | Requisito não funcional de uma mudança | `NFR-PF-001` |
| `SCN-<ESCOPO>-NNN` | Cenário de aceite | `SCN-PF-004` |
| `TASK-<ESCOPO>-NNN` | Tarefa | `TASK-PF-007` |
| `TEST-<ESCOPO>-NNN` | Teste esperado | `TEST-PF-003` |
| `ADR-NNN` | Decisão arquitetural | `ADR-006` |

Regras: identificadores **nunca são reutilizados** nem renumerados após criados. Se um requisito for removido, marque-o como `REMOVIDO` em vez de apagar o ID.

O `ESCOPO` é uma sigla curta em maiúsculas derivada da mudança (`0001-plugin-foundation` → `PF`).

## 3. Nomes de diretórios de mudança

`NNNN-slug-em-ingles-com-hifens` — quatro dígitos, sequencial global, definido por `index.yaml.next_id`.

## 4. Cenários

Gherkin em pt-BR, com as palavras-chave em maiúsculas:

```
#### SCN-PF-001 — Inicialização em projeto vazio

DADO um diretório sem `.specs`
QUANDO o usuário executar `/sdd-kit:init`
ENTÃO o framework deve criar `.specs` com `config.yaml` e `index.yaml`
E apresentar um resumo do diagnóstico.
```

Um cenário descreve **um** caminho. Caminhos alternativos são cenários separados.

## 5. Marcação de incerteza

| Marcador | Uso |
| --- | --- |
| `> HIPÓTESE: …` | Suposição assumida na ausência de informação. Precisa de confirmação humana. |
| `> QUESTÃO: …` | Ambiguidade identificada e não resolvida. |
| `> DECISÃO PENDENTE: …` | Escolha técnica adiada conscientemente, com prazo. |

Nunca omita uma dessas marcações para tornar um documento mais "limpo".

## 6. Código

- TypeScript com tipagem explícita nas fronteiras públicas; sem `any` implícito.
- Funções pequenas, com uma responsabilidade.
- Baixo acoplamento: scripts não importam de skills, agentes ou hooks (ver `architecture.md` §2).
- Sem I/O de rede em nenhum componente.
- Escrita em disco restrita a `.specs/` e a caminhos declarados em `paths`.
- Erros devem informar: ação executada, resultado, erro encontrado, arquivo relacionado e correção sugerida (RNF-007).

### Mensagens de erro

```
✖ [validate-specs] Requisito sem tarefa associada
  Arquivo: .specs/features/0001-plugin-foundation/traceability.yaml
  Requisito: REQ-PF-004
  Correção: adicione REQ-PF-004 a uma tarefa em tasks.md, ou remova o requisito.
```

## 7. Testes

- Todo comportamento especificado tem teste.
- Nome do teste referencia o cenário: `SCN-PF-001 — cria .specs em projeto vazio`.
- Testes determinísticos: sem rede, sem relógio real, sem dependência de ordem.
- Snapshots são permitidos para templates e arquivos gerados.

## 8. Commits

[Conventional Commits](https://www.conventionalcommits.org/), em inglês:

```
feat(skills): add init skill
fix(validator): detect duplicated requirement ids
docs(pt-BR): add installation guide
spec(0001): add technical design
chore(ci): add compatibility matrix
```

Escopos comuns: `skills`, `agents`, `hooks`, `scripts`, `templates`, `schemas`, `cli`, `docs`, `ci`, `spec`.

## 9. YAML

- Indentação de 2 espaços, sem tabs.
- Chaves em `snake_case`.
- **Datas em ISO 8601 e sempre entre aspas:** `created: "2026-07-29"`.
- Todo arquivo YAML do framework declara `version:` na primeira chave.
- Comentários explicam **por quê**, não **o quê**.

### Por que datas vão entre aspas

Sem aspas, o YAML converte `2026-07-29` em um objeto data nativo, não em string. JSON Schema não tem tipo data: a validação de `type: string` falha e o arquivo é rejeitado.

Descoberto em `TASK-PF-004`, quando os schemas rejeitaram os artefatos deste próprio repositório. É a armadilha que o [`ADR-002`](./decisions/ADR-002-markdown-e-yaml.md) já antecipava — "todo valor sensível deve ser citado".

A mesma regra vale para qualquer valor que o YAML reinterpreta: `no`/`yes`/`on`/`off` (viram booleanos), versões como `1.10` (viram número e perdem o zero), e strings que parecem sexagesimais.

## 10. Markdown

- Um `# H1` por documento.
- Blocos de código sempre com linguagem declarada.
- Tabelas para dados comparáveis; listas para sequências.
- Links relativos entre documentos do repositório.
- Sem HTML embutido.
