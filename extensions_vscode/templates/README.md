# Templates do SDD Claude Kit

Documentação para contribuidores. **Este arquivo não é um template.**

## Organização

```
templates/
├── README.md          ← este arquivo
└── <idioma>/          ← pt-BR, en, …
    ├── config.yaml
    ├── index.yaml     ← índice de mudanças, criado vazio por init
    ├── project/       ← documentos criados por /sdd-kit:init
    ├── _shared/       ← comum a todos os tipos de mudança
    │   ├── request.md
    │   ├── tasks.md
    │   ├── status.yaml
    │   └── traceability.yaml
    ├── feature/spec.md
    ├── bug/spec.md
    ├── refactor/spec.md
    ├── change/spec.md      ← mudança arquitetural
    └── adr/ADR-template.md
```

Os quatro diretórios de tipo — `feature`, `bug`, `refactor`, `change` — correspondem exatamente aos valores de `type` em `status.schema.json` e aos diretórios `.specs/{features,bugs,refactors,changes}/`. O prefixo `_` em `_shared` sinaliza que ele **não** é um tipo.

Regra única: **tudo sob `templates/<idioma>/` é template; arquivos soltos em `templates/` são documentação.** Ver [ADR-009](../../../.specs/project/decisions/ADR-009-templates-por-idioma.md).

### Por que `_shared/` existe

`request.md`, `tasks.md`, `status.yaml` e `traceability.yaml` são idênticos entre os quatro tipos — só o campo `type` muda, e ele é um marcador. Duplicá-los por tipo significaria quatro cópias divergindo a cada correção.

`spec.md` é o único genuinamente diferente, e a diferença não é cosmética:

| Tipo | Pergunta que organiza o documento | Critério de aceite central |
| --- | --- | --- |
| `feature` | Que comportamento novo é exigido? | Todo requisito tem critério correspondente |
| `bug` | Que regra **já especificada** foi violada? | Teste que falha antes e passa depois; nenhum teste existente alterado |
| `refactor` | O comportamento observável **não** pode mudar | A suíte existente passa sem nenhuma alteração |
| `change` | Que estrutura ou contrato muda, e quem depende disso? | Existe ADR; migração tem critério de encerramento; rollback descrito |

Uma skill monta o diretório de uma mudança combinando `_shared/*` com o `spec.md` do tipo.

As skills resolvem o caminho por `${CLAUDE_PLUGIN_ROOT}/templates/<project.language>/…`, lendo `project.language` de `.specs/config.yaml`.

## Marcadores

Existe **uma única família de marcadores**, toda em chaves duplas. Isso torna a verificação trivial: se sobrou `{{` num documento gerado, algo não foi preenchido.

| Marcador | Significado |
| --- | --- |
| `{{NOME_DO_VALOR}}` | Substituir pelo valor. Sempre em `MAIÚSCULAS_COM_UNDERSCORE` |
| `{{guia: … }}` | Instrução para quem preenche. **Remover** do documento gerado |
| `{{opcional: … }}` | Bloco a manter só se aplicável. Remover quando não se aplica |
| `{{repetir: … }}` | Bloco a repetir por item. Remover o marcador ao expandir |

### Por que não `${…}`

`${…}` é reservado: o Claude Code substitui `${CLAUDE_PLUGIN_ROOT}`, `${CLAUDE_SKILL_DIR}`, `${CLAUDE_PROJECT_DIR}` e `${user_config.*}` **em qualquer ponto do conteúdo de uma skill**. Um marcador nesse formato seria consumido antes de chegar ao template.

Chaves duplas não colidem com nada no Claude Code nem em Markdown. Em YAML, exigem aspas — ver abaixo.

### Marcadores em YAML vão entre aspas

```yaml
name: "{{PROJECT_NAME}}"     # correto
name: {{PROJECT_NAME}}       # ERRO: YAML inválido
```

Sem aspas, `{` abre um mapping em fluxo e o arquivo deixa de ser YAML válido — o template nem chega a ser lido. Com aspas, a substituição produz `name: "minha-api"`, uma string válida.

Vale para valores e para itens de lista: `- "{{SOURCE_PATH}}"`.

Marcadores dentro de comentários (`# {{guia: … }}`) não precisam de aspas: o YAML ignora a linha inteira.

É a mesma armadilha das datas sem aspas — o YAML reinterpretando escalares. Descoberto em `TASK-PF-005`, quando o próprio template não parseava.

### Verificação

Um documento gerado está completo quando não contém `{{`:

```bash
grep -rn '{{' .specs/ && echo "marcadores não preenchidos" || echo "ok"
```

Esta verificação vira teste automatizado em `TASK-PF-012`.

## Regras de escrita

- **Datas sempre entre aspas** em YAML: `created: "2026-07-29"`. Sem aspas o YAML produz um objeto data e a validação por schema falha. Ver `standards.md` §9.
- **Sem HTML embutido** (`standards.md` §10). É por isso que os guias usam `{{guia: …}}` e não comentários HTML.
- **Estrutura idêntica entre idiomas.** Adicionar uma seção em `pt-BR/` exige adicioná-la em todos os outros idiomas; caso contrário os documentos gerados divergem conforme o idioma.
- Todo YAML gerado deve validar contra o schema correspondente em `../schemas/`.

## Adicionar um idioma

1. Copiar a subárvore: `cp -r templates/pt-BR templates/<novo>`.
2. Traduzir o conteúdo, preservando marcadores e nomes de seção estruturais.
3. Acrescentar o idioma ao enum `project.language` em `schemas/config.schema.json`.
4. Verificar que a árvore de arquivos é idêntica à de `pt-BR/`.
