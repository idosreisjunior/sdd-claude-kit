# Padrões — sdd-claude-kit-vscode

Convenções obrigatórias para código, documentos e specs deste projeto.

---

## 1. Identificadores

Formato: `PREFIXO-ESCOPO-NNN`, com `NNN` sequencial de três dígitos dentro do
escopo.

| Prefixo | Uso | Exemplo |
| --- | --- | --- |
| `REQ-<ESCOPO>-NNN` | Requisito funcional | `REQ-FOUND-001` |
| `NFR-<ESCOPO>-NNN` | Requisito não funcional | `NFR-FOUND-001` |
| `SCN-<ESCOPO>-NNN` | Cenário de aceite | `SCN-FOUND-004` |
| `TASK-<ESCOPO>-NNN` | Tarefa | `TASK-FOUND-007` |
| `TEST-<ESCOPO>-NNN` | Teste esperado | `TEST-FOUND-003` |
| `ADR-NNN` | Decisão arquitetural | `ADR-001` |

O `ESCOPO` é uma sigla curta em maiúsculas derivada da mudança
(`0001-project-foundation` → `FOUND`).

**Identificadores nunca são reutilizados nem renumerados após criados.**

> Os requisitos de produto do PRD usam `RF-NNN`/`RNF-NNN` (globais). Os
> requisitos de feature usam `REQ-<ESCOPO>-NNN` e **referenciam** o `RF` de
> origem no texto. Não confunda os dois espaços.

## 2. Diretórios de mudança

`NNNN-slug-em-ingles-com-hifens` — quatro dígitos, sequencial global, definido
por `index.yaml.next_id`. Slugs contêm apenas `[a-z0-9-]`.

## 3. Cenários

Gherkin, palavras-chave em maiúsculas (DADO / QUANDO / ENTÃO / E). Um cenário
descreve **um** caminho; caminhos alternativos são cenários separados.

## 4. Marcação de incerteza

| Marcador | Uso |
| --- | --- |
| `> HIPÓTESE: …` | Suposição assumida na ausência de informação |
| `> QUESTÃO: …` | Ambiguidade identificada e não resolvida |
| `> DECISÃO PENDENTE: …` | Escolha técnica adiada conscientemente, com prazo |

---

## 5. Idioma

| Artefato | Idioma |
| --- | --- |
| Specs e documentação | pt-BR |
| Código, identificadores, nomes de arquivo, símbolos | inglês |
| Rótulos de UI voltados ao usuário | pt-BR (coerente com o PRD) |
| Mensagens de commit | inglês |

## 6. Código

- **TypeScript `strict`** (ver `tsconfig.json`); sem `any` implícito.
- `noUnusedLocals`/`noUnusedParameters` ligados: nada de importe/variável morta.
- Sem ponto e vírgula final (`semi: never`) e `eqeqeq` obrigatório (ESLint).
- Toda subscription (comando, provider, watcher, status bar) vai para
  `context.subscriptions` — nada de listener vazando.
- Código que pertence a outra feature entra como `TODO(<feature-id>): …`, nunca
  como implementação silenciosa fora do escopo da tarefa atual.
- A API do VS Code fica confinada à borda (`extension.ts`, `views/`); a lógica
  de domínio deve ser testável sem o host do editor.

### Mensagens de erro

Ação executada, resultado, arquivo relacionado e correção sugerida:

```
✖ [doctor] Feature sem status.yaml
  Arquivo: .specs/features/0002-feature-management/
  Correção: crie status.yaml a partir do template, em DRAFT.
```

## 7. Testes

- Testes em `src/test/`, compilados para `out/test/`, executados por `npm test`
  (`node --test`).
- Nomeie o teste referenciando o cenário coberto (ex.: `SCN-FOUND-001 — …`).
- A lógica de domínio (fora da borda da API do VS Code) deve ter teste unitário.

## 8. Commits

> DECISÃO PENDENTE: adotar Conventional Commits? Escopos candidatos: `foundation`,
> `features`, `ui`, `claude`, `context`, `doctor`, `git`, `evidence`, `metrics`,
> `publish`. Decidir antes da primeira implementação real (feature 0001).

## 9. YAML

- Indentação de 2 espaços, sem tabs. Chaves em `snake_case`.
- **Datas em ISO 8601 e sempre entre aspas:** `created: "2026-07-31"`.
- Todo arquivo YAML do framework declara `version:` na primeira chave.

## 10. Markdown

- Um `# H1` por documento. Blocos de código sempre com linguagem declarada.
- Tabelas para dados comparáveis; listas para sequências.
- Links relativos entre documentos; sem HTML embutido.
