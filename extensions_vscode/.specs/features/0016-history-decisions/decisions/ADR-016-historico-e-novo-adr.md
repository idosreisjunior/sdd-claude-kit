# ADR-016 — Histórico em webview de timeline e alocação do "Novo ADR"

- **Status:** Aceito
- **Data:** 2026-08-01
- **Origem:** questões **Q2** (apresentação do histórico) e **Q5** (mecanismo do "Novo ADR") da
  spec de 0016-history-decisions.
- **Decidido em:** TASK-HIST-001

---

## Contexto

O RF-020 tem duas frentes já decididas em escopo (D-Q1/D-Q3/D-Q4): apresentar o histórico
agregado do subconjunto persistido e registrar decisões como ADRs. Faltam duas decisões de design:

- **Q2 — Como apresentar o histórico.** A extensão já tem três padrões de superfície: **webview
  read-only** com CSP+nonce (validação 0008 / métricas 0009), **canal de saída** de texto (Context
  Guardian 0005 / Escopo 0007) e **tree view** (painel Features). O histórico é uma lista
  cronológica estruturada, com categorias e marcações de indisponível — conteúdo que se beneficia
  de layout.
- **Q5 — Como o "Novo ADR" aloca o número e o slug.** ADRs têm numeração **global e sequencial**,
  nunca reutilizada (standards §2); os arquivos vivem espalhados em `decisions/` de cada mudança.
  Já existe precedente para reconciliar identificadores a partir do disco: `collectExistingIds`
  (varre os diretórios de mudança) e `sanitizeSlug` (deriva slug determinístico de um título).

## Decisão

**Q2 — Webview de timeline.** O histórico é apresentado num **WebviewPanel read-only**
(`enableScripts:false`, `localResourceRoots:[]`, CSP com nonce), no mesmo padrão de 0008/0009. O
render (`historyHtml.ts`) é **puro e testável** (como `metricsHtml`/`validationHtml`), recebendo o
modelo agregado por `aggregateHistory` (TASK-HIST-002) e produzindo o HTML — texto escapado,
timeline cronológico, categorias sem fonte marcadas como indisponíveis.

**Q5 — Reconciliação a partir do disco + slug determinístico.** O "Novo ADR" aloca o número
varrendo os `decisions/` de **todas** as mudanças do projeto (features, bugs, refactors, changes,
archive), extraindo os `ADR-NNN` e tomando `max + 1` — a borda coleta, o núcleo puro
`nextAdrNumber(existing)` decide. O `<slug>` vem de `adrSlug(title)`, regra determinística análoga
a `sanitizeSlug`. O arquivo é `decisions/ADR-NNN-<slug>.md`, montado do template
`adr/ADR-template.md` por `buildAdr` (TASK-HIST-003), **sem sobrescrever** um existente.

## Alternativas consideradas

| Alternativa | Por que não |
| --- | --- |
| **Q2: Canal de saída** (texto) | Mais simples, mas perde o layout do timeline e a distinção visual de categorias/indisponíveis. Diverge dos relatórios irmãos (0008/0009), que já firmaram o webview para "apresentar um relatório" |
| **Q2: Tree view** (filhos do item) | Integra à navegação, mas é limitada para conteúdo longo/rico e mistura "navegar" com "relatar". A árvore já é o menu de ações, não um relatório |
| **Q5: Número por contador em arquivo** (um `next_adr` central) | Introduz um estado central novo a manter e sincronizar — mais uma fonte de defasagem entre branches. Reconciliar a partir do disco não guarda estado e reusa o padrão de `collectExistingIds` |
| **Q5: Numeração por mudança** (ADR-001 dentro de cada feature) | Quebra a numeração **global** que o projeto já usa (ADR-001..016 atravessam as mudanças). Renumerar/duplicar corromperia a rastreabilidade |

## Consequências

**Positivas**

- Consistência visual e de código com 0008/0009; render puro coberto por teste.
- A numeração do ADR não guarda estado novo: reconcilia do disco, sem defasagem entre branches.
- Slug determinístico reusa a regra já validada (`sanitizeSlug`).

**Negativas**

- A varredura dos `decisions/` do projeto é I/O de disco na borda a cada "Novo ADR". **Mitigação:**
  é rápida (poucos diretórios) e só ocorre na ação explícita; o núcleo que decide o número é puro.
- Webview read-only não tem interação (sem filtros/ordenar por clique). **Mitigação:** é um
  relatório; a ordenação cronológica cobre o caso principal, como em 0008/0009.
- Concorrência: dois "Novo ADR" quase simultâneos poderiam mirar o mesmo número. **Mitigação:** a
  escrita não sobrescreve (SCN-HIST-004); o segundo detecta o arquivo e reporta o conflito.

## Limite desta decisão

Decide **a superfície** (webview de timeline) e **a alocação** (reconciliar do disco + slug
determinístico). **Não** define o layout visual exato do timeline (trabalho de TASK-HIST-002),
**não** especifica o conteúdo-seed de cada categoria, e **não** persiste eventos novos — o
subconjunto exibido é o já decidido em D-Q1/D-Q3.
