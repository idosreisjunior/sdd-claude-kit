# ADR-017 — Research: nova ação no adapter 0004 + esqueleto por template (híbrido)

- **Status:** Aceito
- **Data:** 2026-08-01
- **Origem:** questões **Q1** (mecanismo da análise) e **Q2** (template do `research.md`) da spec
  de 0017-research.
- **Decidido em:** TASK-RES-001

---

## Contexto

O RF-007 pede uma etapa de **research antes da spec**, analisando oito frentes (estrutura do
projeto, arquivos relacionados, dependências, padrões existentes, documentação local, riscos,
soluções já implementadas, APIs/integrações). O material fica em `research.md`, revisável antes de
ser incorporado à spec. As forças em jogo:

- **A análise é trabalho de linguagem natural.** Como no 0014/0015, a extensão não faz research por
  heurística; a análise é do agente. O modelo híbrido (esqueleto por template + reuso do 0004 para
  o conteúdo por IA) já está firmado (ADR-014/ADR-015).
- **Mas a ação `research` não existe no 0004.** O adapter (`claudePrompt.ts`, ADR-007) expõe um
  **conjunto fechado** de ações — `spec/clarify/design/tasks/implement/verify`. Diferente de
  `design` e `clarify` (que já estavam no conjunto), `research` **não está**. Reusar o padrão exige
  primeiro **acrescentá-la** ao conjunto.
- **A skill de destino é de Fase 2.** `/sdd-kit:research` não existe hoje; a camada assistida só
  funciona ponta a ponta na Fase 2, como no 0014/0015.
- **Restrição de rede.** A extensão não faz I/O de rede; a análise por IA passa pelo Claude Code
  (RNF-004, NFR-RES-001).

O eixo: entregar a estrutura hoje sem inventar arquitetura, reusando o padrão do 0014/0015 — o que
implica uma pequena e justificada extensão do conjunto de ações do 0004.

## Decisão

Adotar o **mesmo modelo híbrido do ADR-014/ADR-015**, com uma adição ao adapter 0004:

1. **Nova ação `research` no conjunto do 0004 (Q1).** Acrescentar `research` a `SddAction` e a
   `ACTIONS` em `claudePrompt.ts`, de forma que `composePrompt('research', id)` produza
   `/sdd-kit:research <id>`. O conjunto continua **fechado e explícito** — apenas ganha o membro que
   faltava para cobrir a etapa de research do fluxo SDD. A extensão **não** reimplementa terminal
   nem lê stdout (ADR-007). A camada assistida ativa-se quando a skill `/sdd-kit:research` (Fase 2)
   existir.

2. **Esqueleto por template, escrito pela extensão (Q2 = sim, template novo).** A extensão gera um
   `research.md`-esqueleto a partir de um **novo template `feature/research.md`**, com as **oito
   frentes do RF-007 como seções** (D-Q6) e lacunas marcadas. Fonte no plugin, sincronizada para a
   extensão (`.sync-manifest.json`), como todos os templates. Não sobrescreve um `research.md`
   existente sem confirmação (SCN-RES-003).

3. **Pré-condição e gatilho.** A ação **"Research"** é oferecida no item da feature (D-Q3) e fica
   disponível **assim que a mudança existe** (D-Q4) — sem exigir `REQ-*` nem aprovação, pois o
   research é a etapa mais cedo do fluxo. A incorporação à spec é manual (D-Q5).

## Alternativas consideradas

| Alternativa | Por que não |
| --- | --- |
| **Mecanismo próprio de análise** (heurística/varredura na extensão) | A qualidade seria pobre para "riscos", "padrões existentes", "soluções já implementadas" — exige compreensão, não varredura. Além disso duplicaria o que o Claude Code faz. Descartada |
| **Não acrescentar `research` ao 0004** (usar uma ação genérica existente, ex.: `spec`) | Confundiria o prompt (o usuário pediria research e receberia `/sdd-kit:spec`); quebra a correspondência ação→skill. A extensão limpa é acrescentar o membro que falta |
| **Só delegar, sem escrever research.md** | Deixa 0017 sem efeito observável até a Fase 2 e sem um lugar estruturado para o material revisável (RF-007) |
| **Estrutura embutida em código** | Diverge do padrão de templates sincronizados (spec/design/clarifications); dificulta ajustar as frentes sem recompilar |

## Consequências

**Positivas**

- Reusa o padrão do 0014/0015; entrega a estrutura das oito frentes hoje.
- O conjunto de ações do 0004 fica **completo** para o fluxo SDD (research incluído), com a
  correspondência ação→skill preservada.
- Núcleo testável: a montagem do esqueleto e a nova ação são puras e cobertas por teste
  (TEST-RES-001/002).

**Negativas**

- **Toca um módulo de outra feature** (0004 `claudePrompt.ts`). **Mitigação:** é uma adição
  aditiva a um conjunto explícito, coberta pela suíte do 0004, decidida aqui em ADR — não uma
  mudança fora de escopo silenciosa (CLAUDE.md).
- A análise por IA **só funciona quando `/sdd-kit:research` (Fase 2) existir**. **Mitigação:** o
  esqueleto das oito frentes já orienta o preenchimento manual; a ação fica visível.
- Mais um par de templates a sincronizar. **Mitigação:** mecanismo `.sync-manifest.json` existente
  (TASK-RES-002 atualiza o manifesto).

## Limite desta decisão

Decide **o mecanismo** (nova ação `research` no 0004 + esqueleto por template) e **onde vive o
template** (`feature/research.md`, sincronizado). **Não** define o texto-seed de cada frente
(trabalho de TASK-RES-002), **não** implementa a skill `/sdd-kit:research` (Fase 2) e **não** decide
como o material é incorporado à spec — que permanece manual (D-Q5).
