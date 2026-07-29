# ADR-006 — ADRs de escopo do projeto em `.specs/project/decisions/`

- **Status:** Aceito
- **Data:** 2026-07-29
- **Origem:** decisão tomada durante a Fase 0 (não prevista no PRD)

## Contexto

O PRD §13 define `decisions/` apenas **dentro** do diretório de cada mudança:

```
.specs/features/0001-user-authentication/decisions/ADR-001-auth-strategy.md
```

Porém, o próprio PRD §30 registra cinco decisões arquiteturais (ADR-001 a ADR-005) que **não pertencem a nenhuma feature**: "distribuir como plugin", "Markdown e YAML", "CLI opcional", "TypeScript", "sem telemetria". São decisões de escopo do projeto inteiro.

Sem um lugar para elas, essas decisões ficariam presas ao PRD — um documento que descreve o produto, não um registro versionado de decisões com contexto, alternativas e consequências.

## Decisão

Criar `.specs/project/decisions/` para ADRs de escopo do projeto, mantendo `<change>/decisions/` para ADRs de escopo de uma mudança específica.

**Critério de alocação:**

| A decisão afeta… | Onde vive |
| --- | --- |
| Apenas a implementação de uma mudança | `.specs/<tipo>/<id>/decisions/` |
| O projeto como um todo, ou sobrevive ao arquivamento da mudança | `.specs/project/decisions/` |

Numeração de `ADR-NNN` é **global e sequencial** entre os dois locais, para evitar colisão quando um ADR de feature for promovido a ADR de projeto durante o arquivamento (`/sdd-kit:archive` consolida decisões — PRD §9.9).

## Alternativas consideradas

| Alternativa | Por que não |
| --- | --- |
| Manter só o PRD §30 | PRD é o documento do produto, não um log de decisões; não acomoda decisões futuras nem mudanças de status (`Substituído por ADR-NNN`). |
| Forçar ADRs de projeto dentro de uma feature guarda-chuva | Artificial; a decisão morre quando a feature é arquivada. |
| Diretório `adr/` na raiz do repositório | Quebra o princípio de que as specs vivem sob `.specs/` e ficaria fora do arquivamento e da validação. |

## Consequências

**Positivas:** decisões de projeto ganham contexto, alternativas e consequências registrados; ficam versionadas e validáveis; `/sdd-kit:archive` tem destino claro ao consolidar decisões.

**Negativas:** é uma extensão à estrutura definida no PRD §13. **Ação:** o PRD deve ser atualizado na próxima revisão para incluir `project/decisions/` no diagrama, e os templates e o validador precisam conhecer os dois locais.
