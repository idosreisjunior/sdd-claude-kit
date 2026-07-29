# ADR-003 — CLI opcional, não obrigatória

- **Status:** Aceito
- **Data:** 2026-07-29
- **Origem:** PRD §30

## Contexto

O framework precisa de validação determinística (schemas, IDs duplicados, itens órfãos, cobertura). Essa validação poderia ser exposta como CLI obrigatória, instalada via npm, ou embutida no plugin.

Exigir `npm install -g` antes de usar o framework criaria uma barreira de entrada relevante — especialmente para usuários que trabalham em projetos Python, Go ou de dados.

## Decisão

A CLI **não é requisito** para usar o framework. O plugin é autossuficiente para o fluxo completo `init → archive`.

A CLI (Fase 5) será um invólucro sobre os **mesmos scripts** usados pelo plugin, voltada a automação local e CI/CD.

## Alternativas consideradas

| Alternativa | Por que não |
| --- | --- |
| CLI obrigatória | Barreira de entrada; contraria o princípio de adoção gradual (PRD §7.4) e o não objetivo "obrigar o uso da CLI" (§5). |
| Sem CLI nunca | Impede validação em CI/CD e códigos de saída para pipelines (PRD §4.2). |
| Lógica duplicada entre plugin e CLI | Divergência garantida entre os dois caminhos. |

## Consequências

**Positivas:** barreira de entrada baixa; experimentação rápida; a inteligência (plugin) fica separada da validação determinística (scripts).

**Negativas:** os scripts precisam funcionar sem depender do contexto do Claude Code — entrada por argumentos e arquivos, saída por stdout e código de saída. Isso é uma restrição de design desde a Fase 1, não algo a acomodar depois.

**Restrição derivada:** nenhum script pode assumir que está rodando dentro do Claude Code, ler variáveis de ambiente específicas do plugin ou depender de estado da conversa.
