# Constituição do projeto — sdd-claude-kit-vscode

> Regras invioláveis. Se uma tarefa exigir violar um artigo desta constituição,
> **pare** e proponha uma emenda antes de implementar.

Versão: 1.0

---

## Artigo 1 — A especificação vem antes do código

Nenhuma mudança de comportamento entra no repositório sem uma especificação
correspondente em `.specs/`.

Exceções permitidas: correção de typo, formatação, link quebrado e correção de
bug cujo comportamento correto já esteja especificado.

## Artigo 2 — Não inventar requisitos

Quando faltar informação, escolha uma destas ações — nunca preencha a lacuna em
silêncio:

1. Registrar uma **questão pendente** na spec.
2. Registrar uma **hipótese explícita**, marcada com `> HIPÓTESE:`.
3. **Interromper** e perguntar, quando a decisão for crítica.

## Artigo 3 — Aprovação humana antes da implementação

Nos modos `guided` e `strict`, a implementação exige uma spec `APPROVED`. A
aprovação registra data, responsável e a versão aprovada. Alterações relevantes
após a aprovação a invalidam.

## Artigo 4 — Uma tarefa por vez

A implementação avança tarefa por tarefa, cada uma com resultado verificável.

## Artigo 5 — Specs são a fonte da verdade

Decisões relevantes vivem em arquivos versionados, não no histórico da conversa.
O que não está em `.specs/` não é uma decisão do projeto.

## Artigo 6 — Rastreabilidade obrigatória

Toda implementação mantém a cadeia:

```
Requisito → Cenário → Tarefa → Arquivo → Teste
```

## Artigo 7 — Contexto sob demanda

Cada etapa carrega somente o contexto de que precisa. Este princípio é também um
requisito do produto (RF-012, Context Guardian) — o projeto pratica o que a
extensão promete.

## Artigo 8 — Interromper diante de decisão arquitetural não prevista

Ao encontrar uma decisão arquitetural fora do design aprovado, a implementação
para e um ADR é proposto.

## Artigo 9 — Segurança por padrão

1. Nenhum segredo é gravado em `.specs`.
2. Comandos vindos de configuração são **entrada não confiável**.
3. Hooks que bloqueiam ações ou executam comandos são opt-in.
4. Nenhum código sai para serviço externo sem ação/config explícita (RNF-003).

## Artigo 10 — Definition of Done

Uma tarefa só é concluída com: código implementado; testes relacionados
aprovados; **as validações configuradas aprovadas**; documentação atualizada;
rastreabilidade atualizada; critérios de aceite avaliados; vínculo com uma spec;
mudanças de arquitetura documentadas.

| Estado | Em `config.yaml` | Conclui a tarefa? |
| --- | --- | --- |
| Aprovada | comando definido, executou, passou | Sim |
| Reprovada | comando definido, executou, falhou | **Não** |
| Não configurada | `null` | Sim, **se registrada como tal** |

**Nunca marque uma tarefa como concluída com validação configurada falhando ou
não executada.** Enquanto `npm install` não rodar, build/lint/test estão
"não executados" — e assim devem ser reportados.

## Artigo 11 — Fiel ao próprio método (regra do projeto)

Esta extensão prega governança de desenvolvimento com IA; portanto **usa** o SDD
para se construir. Em concreto, herdando os princípios do PRD (§7) e a Definição
de Pronto (§25):

1. **Spec first / evidência antes de conclusão:** nenhuma funcionalidade é dada
   como pronta sem estar ligada a um requisito, ter critérios de aceite, testes
   e evidências registradas.
2. **CLI como base (§7.6):** nada que a extensão faça pode quebrar o uso pela CLI
   e pelos arquivos. Todo recurso precisa funcionar, no essencial, sem a UI.
3. **Arquivos como fonte de verdade (§7.7):** o storage do VS Code nunca
   substitui `.specs/`.
4. **Humano no controle (§7.5):** nenhuma ação destrutiva ou commit acontece sem
   confirmação explícita.
5. **Escopo do MVP:** contra o risco de crescimento de escopo (PRD §21), nenhuma
   feature além do MVP entra sem revisão explícita da prioridade.

---

## Emendas

Alterar esta constituição exige um ADR em `.specs/project/decisions/` e
aprovação do responsável pelo produto (PRD: Ismael Júnior).

| Versão | Data | Mudança |
| --- | --- | --- |
| 1.0 | 2026-07-31 | Versão inicial |
