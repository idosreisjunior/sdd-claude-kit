# Constituição do projeto — {{PROJECT_NAME}}

> Regras invioláveis. Se uma tarefa exigir violar um artigo desta constituição,
> **pare** e proponha uma emenda antes de implementar.

Versão: 1.0

{{guia: os artigos 1 a 10 abaixo são o núcleo do método SDD e vêm prontos. Leia,
ajuste ao seu contexto e remova o que não se aplica — esta é a SUA constituição,
não a do framework. Os artigos 11 e 12 são espaço para as suas próprias regras.

Uma constituição que ninguém consegue cumprir não protege nada. Prefira poucos
artigos que você vai realmente respeitar.}}

---

## Artigo 1 — A especificação vem antes do código

Nenhuma mudança de comportamento entra no repositório sem uma especificação
correspondente em `.specs/`.

Exceções permitidas: correção de typo, formatação, link quebrado e correção de
bug cujo comportamento correto já esteja especificado.

## Artigo 2 — Não inventar requisitos

Quando faltar informação, o Claude deve escolher uma destas ações — nunca
preencher a lacuna em silêncio:

1. Registrar uma **questão pendente** na spec.
2. Registrar uma **hipótese explícita**, marcada com `> HIPÓTESE:` e sujeita a
   confirmação humana.
3. **Interromper** e perguntar, quando a decisão for crítica: segurança, dados,
   contrato público ou arquitetura.

## Artigo 3 — Aprovação humana antes da implementação

Nos modos `guided` e `strict`, a implementação exige uma spec com status
`APPROVED`. A aprovação registra data, responsável e a versão aprovada.

Alterações relevantes na spec após a aprovação **invalidam** a aprovação.

## Artigo 4 — Uma tarefa por vez

A implementação avança tarefa por tarefa. Cada tarefa possui resultado
verificável. Tarefas que não cabem em uma unidade verificável devem ser
divididas antes de começar.

## Artigo 5 — Specs são a fonte da verdade

Decisões relevantes vivem em arquivos versionados, não no histórico da conversa.
O que não está em `.specs/` não é uma decisão do projeto.

## Artigo 6 — Rastreabilidade obrigatória

Toda implementação mantém a cadeia:

```
Requisito → Cenário → Tarefa → Arquivo → Teste
```

Requisitos sem tarefa, tarefas sem requisito e arquivos sem rastreio são
defeitos de processo e devem ser reportados pela validação.

## Artigo 7 — Contexto sob demanda

Documentos extensos não são carregados permanentemente. Cada etapa carrega
somente o contexto de que precisa. O `CLAUDE.md` permanece curto e aponta para
os documentos.

## Artigo 8 — Interromper diante de decisão arquitetural não prevista

Ao encontrar uma decisão arquitetural fora do design aprovado, a implementação
para e um ADR é proposto. Não se resolve arquitetura no meio de uma tarefa.

## Artigo 9 — Segurança por padrão

1. Nenhum segredo é gravado em `.specs`.
2. Comandos vindos de configuração são **entrada não confiável**.
3. Hooks que bloqueiam ações ou executam comandos são opt-in.

## Artigo 10 — Definition of Done

Uma tarefa só é concluída com: código implementado; testes relacionados
aprovados; lint aprovado; build aprovado quando aplicável; documentação
atualizada; rastreabilidade atualizada; critérios de aceite avaliados; vínculo
com uma spec; mudanças de arquitetura documentadas.

**Nunca marque uma tarefa como concluída com validação falhando ou não
executada.** "Não executado" é reportado como "não executado", jamais como
"aprovado".

## Artigo 11 — {{PROJECT_RULE_TITLE}}

{{PROJECT_RULE_BODY}}

{{guia: regras específicas do seu projeto. Exemplos reais:

- "Nenhuma migração de banco é irreversível: toda migração tem rollback testado."
- "Nenhuma dependência nova sem aprovação de um mantenedor."
- "Toda rota pública exige teste de autorização."
- "Dados de usuário nunca aparecem em log, nem em ambiente de desenvolvimento."

Remova este artigo se não houver nada a acrescentar. Uma regra genérica que
ninguém consulta é pior que nenhuma regra.}}

---

## Emendas

Alterar esta constituição exige um ADR em `.specs/project/decisions/` e
aprovação de {{APPROVER}}.

| Versão | Data | Mudança |
| --- | --- | --- |
| 1.0 | {{DATE}} | Versão inicial |
