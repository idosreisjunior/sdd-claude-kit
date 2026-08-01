# ADR-013 — Métricas: webview e persistência local por snapshot

- **Status:** Aceito
- **Data:** 2026-08-01
- **Origem:** questões Q1 e Q2 da spec de 0009 — superfície e persistência das métricas.
- **Decidido em:** TASK-METR-001

---

## Contexto

O RF-021/RF-022 pedem calcular métricas de uma feature e apresentá-las, e o RNF-004 exige que
os dados fiquem **locais**, sem telemetria, com a coleta **desativável**. Duas decisões:

- **Superfície** (Q1): webview (tabela/cartões, como o dashboard e a validação), canal de saída
  ou um `metrics.md`.
- **Persistência** (Q2): calcular sob demanda (sem estado) ou guardar snapshots ao longo do
  tempo para métricas temporais (delta entre medições).

## Decisão

**Webview para o relatório e persistência local por snapshot no `workspaceState`.**

- O relatório é um `WebviewPanel` com CSP+nonce (núcleo puro `metrics.ts` calcula; `metricsHtml.ts`
  renderiza), à semelhança do relatório de validação (ADR-012).
- A cada medição, a extensão calcula um `MetricsSnapshot` e o guarda no
  `context.workspaceState` sob a chave `metrics:<changeId>`, comparando com o snapshot anterior
  para exibir o **delta**. É armazenamento **local** e por-workspace, coerente com o RNF-004:
  nada sai da máquina; uma configuração (`sddClaudeKit.metrics.enabled`, padrão `true`) desativa
  todo o cálculo e a persistência.

## Alternativas consideradas

| Alternativa | Por que não |
| --- | --- |
| Canal de saída | Texto puro; perde a leitura em cartões e o delta destacado |
| `metrics.md` versionado | Métricas mudam a cada medição; poluiria o histórico do Git |
| Sem persistência | Impede o delta entre medições (Q2) — o autor pediu comparação temporal |
| Persistir série temporal completa | Escopo maior; o incremento guarda o **último** snapshot (delta vs. anterior), série completa fica para depois |

## Consequências

**Positivas**

- Leitura rica com delta; núcleo de cálculo/render puro e testável.
- Persistência local respeita a privacidade (RNF-004); desativável por configuração.

**Negativas**

- `workspaceState` é por-workspace e não versionado — trocar de máquina perde o histórico.
  **Aceitável:** métricas locais são auxiliares; a fonte da verdade continua em `.specs/`.
- Guardar só o último snapshot limita tendências. **Mitigação:** série temporal é incremento
  futuro; a chave por-feature já comporta evoluir para uma lista.

## Limite desta decisão

Cobre as métricas **por feature** (incremento 1). Agregações (projeto/período/equipe) e formatos
CSV/PDF (RF-022) são incrementos seguintes e reusam o núcleo de cálculo.
