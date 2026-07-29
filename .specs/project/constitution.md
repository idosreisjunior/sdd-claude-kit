# Constituição do projeto — SDD Claude Kit

> Regras invioláveis. Se uma tarefa exigir violar um artigo desta constituição, **pare** e proponha uma emenda antes de implementar.

Versão: 1.0 · Fonte: `PRD.md` §7, §20, §30, §32.

---

## Artigo 1 — A especificação vem antes do código

Nenhuma mudança de comportamento entra no repositório sem uma especificação correspondente em `.specs/`.

Exceções permitidas: correção de typo, formatação, link quebrado e correção de bug cujo comportamento correto já esteja especificado.

## Artigo 2 — Não inventar requisitos

Quando faltar informação, o Claude deve escolher uma destas ações — nunca preencher a lacuna silenciosamente:

1. Registrar uma **questão pendente** na spec.
2. Registrar uma **hipótese explícita**, marcada com `> HIPÓTESE:` e sujeita a confirmação humana.
3. **Interromper** e perguntar, quando a decisão for crítica (segurança, dados, contrato público, arquitetura).

## Artigo 3 — Aprovação humana antes da implementação

No modo `guided` (padrão) e `strict`, a implementação exige uma spec com status `APPROVED`. A aprovação registra data, responsável e a versão aprovada.

Alterações relevantes na spec após a aprovação **invalidam** a aprovação.

## Artigo 4 — Uma tarefa por vez

A implementação avança tarefa por tarefa. Cada tarefa possui resultado verificável. Tarefas que não cabem em uma unidade verificável devem ser divididas antes de começar.

## Artigo 5 — Specs são a fonte da verdade

Decisões relevantes vivem em arquivos versionados, não no histórico da conversa. O que não está em `.specs/` não é uma decisão do projeto.

## Artigo 6 — Rastreabilidade obrigatória

Toda implementação mantém a cadeia:

```
Requisito → Cenário → Tarefa → Arquivo → Teste
```

Requisitos sem tarefa, tarefas sem requisito e arquivos sem rastreio são defeitos de processo e devem ser reportados pela validação.

## Artigo 7 — Contexto sob demanda

Documentos extensos não são carregados permanentemente. Cada skill e cada agente carrega somente o contexto da sua etapa. `CLAUDE.md` permanece curto e aponta para os documentos.

## Artigo 8 — Adoção gradual, nunca bloqueio por padrão

O modo padrão é `guided`. O modo `advisory` nunca bloqueia nada. Hooks que bloqueiam ou executam comandos são **opt-in** e sempre desativáveis.

## Artigo 9 — Segurança por padrão

1. Nenhum segredo é gravado em `.specs`.
2. O framework não envia dados para serviços controlados pelo projeto. Sem telemetria.
3. `validation.commands` e qualquer configuração vinda do projeto do usuário são **entrada não confiável**.
4. Todo comando que o framework pode executar é documentado antes de ser disponibilizado.

## Artigo 10 — Portabilidade e formatos abertos

Specs são Markdown e YAML, legíveis e editáveis sem o plugin. Sem banco de dados. Funciona em Windows, Linux, macOS e WSL.

## Artigo 11 — Separação entre geração e validação

O que a IA **gera** (requisitos, design, tarefas, código) é sempre separado do que é **validado deterministicamente** (schemas, IDs, estados, cobertura de rastreabilidade). Validação nunca depende de julgamento do modelo.

## Artigo 12 — Interromper diante de decisão arquitetural não prevista

Ao encontrar uma decisão arquitetural fora do design aprovado, a implementação para e um ADR é proposto. Não se resolve arquitetura no meio de uma tarefa.

## Artigo 13 — Definition of Done

Uma tarefa só é concluída com: código implementado; testes relacionados aprovados; lint aprovado; build aprovado quando aplicável; documentação atualizada; rastreabilidade atualizada; critérios de aceite avaliados; sem erros críticos de validação; vínculo com uma spec; mudanças de arquitetura documentadas.

**Nunca marque uma tarefa como concluída com validação falhando ou não executada.** "Não executado" é reportado como "não executado", jamais como "aprovado".

## Artigo 14 — Dogfooding

Este repositório usa o SDD Claude Kit para se desenvolver. Se o processo for insuportável para nós, será insuportável para os usuários.

---

## Emendas

Alterar esta constituição exige um ADR em `.specs/project/decisions/` e aprovação de um mantenedor.

| Versão | Data | Mudança |
| --- | --- | --- |
| 1.0 | 2026-07-29 | Versão inicial, derivada do PRD 1.0 |
