# ADR-009 — Templates organizados por idioma

- **Status:** Aceito
- **Data:** 2026-07-29
- **Origem:** NFR-PF-004 de `0001-plugin-foundation`
- **Decidido em:** `TASK-PF-005`

## Contexto

A RNF-008 do PRD exige que os textos exibidos ao usuário sejam preparados para internacionalização, com `pt-BR` e `en` como idiomas iniciais. A NFR-PF-004 traduz isso para esta feature: "textos de usuário devem estar separados da lógica, de forma que a tradução para `en` não exija reescrever skills ou scripts".

Para código, a técnica usual é extrair strings para um catálogo e referenciá-las por chave. Para os templates, isso não funciona: um `vision.md` ou um `constitution.md` é **prosa inteira**. Não existe estrutura da qual separar o texto — o texto *é* o documento.

Aplicar extração de strings a documentos produziria um catálogo com parágrafos inteiros como valores, sem nenhum ganho de manutenção e com perda total de legibilidade para quem traduz.

## Decisão

Escopar os templates por idioma no caminho, não por catálogo de strings:

```
plugins/sdd-kit/templates/
├── README.md            ← documentação para contribuidores, não é template
└── pt-BR/
    ├── config.yaml
    ├── project/{vision,constitution,context,architecture,glossary,standards}.md
    ├── feature/  bug/  refactor/  adr/
```

**Regra única:** tudo sob `templates/<idioma>/` é template; arquivos soltos em `templates/` são documentação. Traduzir é acrescentar `templates/en/` com a mesma árvore.

As skills resolvem o caminho por `${CLAUDE_PLUGIN_ROOT}/templates/<project.language>/…`, lendo `project.language` de `.specs/config.yaml`.

## Alternativas consideradas

| Alternativa | Por que não |
| --- | --- |
| **Catálogo de strings** (`i18n/pt-BR.json` + templates neutros) | Documentos são prosa; o catálogo teria parágrafos como valores. Ilegível para tradutores e sem ganho de manutenção |
| **Um template por documento, com blocos por idioma** | Cada arquivo cresce com o número de idiomas e fica ilegível. Diffs de tradução poluem o template original |
| **`templates/project/vision.pt-BR.md`** (sufixo no nome) | Equivalente em capacidade, mas espalha os idiomas por toda a árvore. Com diretório, adicionar `en/` é uma cópia da subárvore |
| **Só pt-BR agora, reestruturar na Fase 6** | Toda skill referencia caminhos de template. Reestruturar depois quebra as quatro skills da Fase 1 e todas as da Fase 2. Decidir agora custa um diretório; decidir depois custa uma migração |

## Consequências

**Positivas**

- Traduzir é copiar uma subárvore e traduzir Markdown — trabalho que um tradutor faz sem ler código.
- Nenhuma skill precisa mudar quando um idioma é adicionado: o caminho já é parametrizado.
- Diffs de tradução ficam isolados por idioma.

**Negativas**

- Duplicação estrutural: uma mudança de estrutura precisa ser replicada em cada idioma. **Mitigação:** um teste que compare a árvore de arquivos entre idiomas e falhe quando divergirem. Fica para `TASK-PF-012`.
- Altera o layout de `templates/` mostrado em `design.md` §6 e no PRD §14, que não previam o nível de idioma. O design foi atualizado; o PRD deve ser corrigido na próxima revisão.

## Lacuna aberta por esta decisão

`config.schema.json` aceita `project.language: en`, mas `templates/en/` não existe na Fase 1.

Um `/sdd-kit:init --language en` não deve gerar documentos em pt-BR em silêncio. A skill precisa detectar a ausência do diretório, informar que o idioma ainda não tem templates e pedir decisão ao usuário — nunca fazer fallback calado.

Isso vira critério de conclusão de `TASK-PF-007`.
