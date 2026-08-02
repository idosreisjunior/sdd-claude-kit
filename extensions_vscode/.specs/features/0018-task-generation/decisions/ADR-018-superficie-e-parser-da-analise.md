# ADR-018 — Análise das tarefas: diagnósticos no Problems + parser próprio

- **Status:** Aceito
- **Data:** 2026-08-02
- **Origem:** questões **Q1** (superfície da análise) e **Q3** (parser do `tasks.md`) da spec de
  0018-task-generation.
- **Decidido em:** TASK-TGEN-001

---

## Contexto

O RF-010 pede alertar sobre tarefas excessivamente grandes; a spec (D-Q2) ampliou para também
sinalizar tarefas sem algum dos onze campos obrigatórios. A análise produz, portanto, uma **lista
de achados por tarefa** (tarefa X é G; tarefa Y sem o campo Z), cada um localizável no `tasks.md`.
Duas decisões:

- **Q1 — Superfície.** A extensão já usa três padrões: **diagnósticos no painel Problems** (Project
  Doctor 0006, ADR-009), **webview de relatório** (validação 0008 / métricas 0009) e **canal de
  saída** (Escopo 0007). Um achado de análise de tarefa aponta para uma **linha específica** do
  `tasks.md` — o que casa naturalmente com diagnósticos clicáveis.
- **Q3 — Parser.** Já existe `parseTasksPlan` (0007), mas o seu modelo `TaskPlan` carrega o que o
  Escopo precisa (id, arquivos previstos), **não** a complexidade nem a presença dos onze campos.

## Decisão

**Q1 — Diagnósticos no painel Problems.** Cada achado vira um `vscode.Diagnostic` sobre o
`tasks.md`, com severidade e a **linha da tarefa** afetada — reusando o padrão e a mecânica do
Project Doctor (0006/ADR-009: `DiagnosticCollection`, publicação por URI). O **núcleo puro**
(`taskAnalysis.ts`) devolve os achados com `{ kind, taskId, line, message }`; a **borda** os
traduz para a Diagnostics API (como `publishDoctor`). Assim o núcleo é testável sem o host e não
há webview/HTML a manter.

**Q3 — Parser próprio em `taskAnalysis.ts`.** A análise usa um parser focado: divide o `tasks.md`
em blocos por cabeçalho de tarefa (`## TASK-<ESCOPO>-NNN — …`), extrai a **complexidade**
(`**Complexidade:** P|M|G`) e detecta a **presença dos rótulos dos onze campos** do RF-010 por
bloco. **Não** reusa o modelo de `parseTasksPlan` (que não os carrega); pode espelhar a divisão em
blocos, mas mantém o seu próprio resultado. Estender o `TaskPlan` do 0007 sobrecarregaria o modelo
do Escopo por um consumidor diferente.

## Alternativas consideradas

| Alternativa | Por que não |
| --- | --- |
| **Q1: Webview de relatório** (0008/0009) | Bom para um relatório estático, mas perde a navegação clicável até a tarefa; o achado é intrinsecamente "vá até esta linha", que é o que o Problems dá de graça |
| **Q1: Canal de saída** (0007) | Simples, mas sem localização clicável nem integração com o editor; o pior para "corrija esta tarefa" |
| **Q3: Estender `parseTasksPlan` (0007)** | Acrescentaria complexidade/campos ao `TaskPlan`, que o Escopo não usa — acoplamento e peso no modelo de outra feature por um consumidor distinto |
| **Q3: Reusar o parser do plugin `/sdd-kit:tasks`** | É um script do plugin (JS/JSDoc), não um módulo da extensão; a extensão precisa do seu próprio núcleo puro TS testável |

## Consequências

**Positivas**

- Achados clicáveis no Problems, integrados ao editor; padrão já validado (0006).
- Núcleo puro testável (parser + classificação) sem webview a manter — mais simples que 0014–0017.
- O 0007 fica intacto; sem acoplamento cruzado de modelos.

**Negativas**

- Duas formas de parsear `tasks.md` no projeto (0007 e 0018). **Mitigação:** propósitos distintos
  (arquivos previstos vs. complexidade/campos); ambos pequenos e testados. Um follow-up poderia
  unificar a divisão em blocos se surgir um terceiro consumidor.
- Diagnósticos exigem a linha da tarefa. **Mitigação:** o parser já divide por cabeçalho; a linha
  do cabeçalho é o âncora natural do diagnóstico.

## Limite desta decisão

Decide **a superfície** (diagnósticos no Problems) e **o parser** (próprio, em `taskAnalysis.ts`).
**Não** define o texto exato das mensagens de diagnóstico (trabalho de TASK-TGEN-002/003), **não**
altera o `parseTasksPlan` do 0007, e **não** implementa a geração — que reusa a ação `tasks` do
0004, já existente (REQ-TGEN-002).
