# ADR-021 — Assistente de MCP: nova ação `mcp` no adapter 0004 + esqueleto por template (híbrido)

- **Status:** Aceito
- **Data:** 2026-08-02
- **Origem:** decisão **D-Q1** (mecanismo) da spec de 0022-mcp-creation-assistant, confirmada pelo
  usuário; e a formalização da nova ação no adapter do Claude Code (0004).
- **Decidido em:** TASK-MCP-001

---

## Contexto

O RF-025 pede um **assistente para definir um servidor MCP**, percorrendo nove aspectos (objetivo,
ferramentas, recursos, schemas, autenticação, permissões, testes, documentação, publicação). As
decisões de escopo já fixaram: **padrão híbrido** (D-Q1), saída = **documento `mcp.md`** de decisões
(D-Q2), **definir, não fazer** (D-Q3), gatilho **no item da feature** (D-Q4), alvo técnico **agnóstico**
(D-Q5), **entrega única** (D-Q6). As forças em jogo:

- **"Definir" é trabalho de linguagem natural.** Como em research (0017), design (0014) e clarify
  (0015), a extensão não elabora o conteúdo por heurística; a elaboração é do agente. O modelo
  híbrido (esqueleto por template + reuso do 0004 para o conteúdo por IA) já está firmado
  (ADR-014/015/017) e há infraestrutura pronta (`runHybridStep`, `buildSkeleton`, templates
  sincronizados).
- **Mas a ação `mcp` não existe no 0004.** O adapter (`claudePrompt.ts`, ADR-007) expõe um
  **conjunto fechado** de ações — `research/spec/clarify/design/tasks/implement/verify`. `mcp` **não
  está**. Reusar o padrão exige primeiro **acrescentá-la** ao conjunto, como se fez com `research`
  (ADR-017).
- **A skill de destino é de Fase 2.** `/sdd-kit:mcp` não existe hoje; a camada assistida só funciona
  ponta a ponta quando a skill existir — como no 0014/0015/0017.
- **Restrição de rede.** A extensão não faz I/O de rede; a elaboração por IA passa pelo Claude Code
  (NFR-MCP-001).
- **Precedente contra embutir a estrutura em código.** O ADR-017 já descartou "estrutura embutida em
  código" em favor de templates sincronizados, para ajustar as seções sem recompilar.

O eixo: entregar a estrutura dos nove aspectos hoje, sem inventar arquitetura, reusando o padrão do
0017 — o que implica uma pequena e justificada extensão do conjunto de ações do 0004.

## Decisão

Adotar o **mesmo modelo híbrido do ADR-017**, com uma adição ao adapter 0004:

1. **Nova ação `mcp` no conjunto do 0004 (mecanismo).** Acrescentar `mcp` a `SddAction` e a `ACTIONS`
   em `claudePrompt.ts`, de forma que `composePrompt('mcp', id)` produza `/sdd-kit:mcp <id>`. O
   conjunto continua **fechado e explícito** — apenas ganha o membro que cobre a etapa de criação de
   MCP. A extensão **não** reimplementa terminal nem lê stdout (ADR-007). A camada assistida ativa-se
   quando a skill `/sdd-kit:mcp` (Fase 2) existir.

2. **Esqueleto por template, escrito pela extensão.** A extensão gera um `mcp.md`-esqueleto a partir
   de um **novo template `feature/mcp.md`**, com os **nove aspectos do RF-025 como seções**, na ordem
   do texto, e cada aspecto marcado como pendente. Fonte no plugin, sincronizada para a extensão
   (`.sync-manifest.json`), como todos os templates. Reusa `runHybridStep`/`buildSkeleton`; não
   sobrescreve um `mcp.md` existente sem confirmação (SCN-MCP-002 do fluxo é o preenchimento; a
   guarda de sobrescrita é a do passo híbrido).

3. **Fonte única dos aspectos + relato de pendências, no núcleo puro.** Um módulo puro
   (`mcpAspects.ts`) declara os **nove aspectos** (`MCP_ASPECTS`) e expõe `pendingAspects(md)` —
   quais aspectos ainda estão sem decisão. É a lógica mcp-específica testável (NFR-MCP-001,
   TEST-MCP-001/002) e permite à borda informar o progresso ("N de 9 aspectos pendentes"). Os
   títulos das seções do template espelham `MCP_ASPECTS`.

4. **Gatilho.** A ação **"MCP"** é oferecida no item da feature (D-Q4) e fica disponível assim que a
   mudança existe. O `mcp.md` vive na pasta da mudança, como design.md/research.md.

## Alternativas consideradas

| Alternativa | Por que não |
| --- | --- |
| **Gerar um servidor MCP funcional** (código, manifest, dependências) | Vai além de "ajudar a definir" (RF-025); expansão por completude, fora do escopo (D-Q2/Q3). O alvo técnico é, inclusive, agnóstico (D-Q5) |
| **Formulário próprio em webview** | Mais peso de UI e um caminho fora do padrão dos demais passos assistidos; o documento revisável em Markdown é mais simples e versionável |
| **Não acrescentar `mcp` ao 0004** (reusar uma ação genérica) | Quebra a correspondência ação→skill: o usuário pediria "MCP" e receberia `/sdd-kit:<outra>`. A extensão limpa é acrescentar o membro que falta (como `research`) |
| **Estrutura embutida em código** (sem template) | Diverge do padrão de templates sincronizados e do precedente do ADR-017; dificulta ajustar os aspectos sem recompilar. O núcleo puro guarda só a *lista* dos aspectos e o relato de pendências, não a redação das seções |

## Consequências

**Positivas**

- Reusa o padrão do 0017; entrega a estrutura dos nove aspectos hoje.
- O conjunto de ações do 0004 ganha `mcp`, com a correspondência ação→skill preservada.
- Núcleo testável: `MCP_ASPECTS` e `pendingAspects` são puros e cobertos (TEST-MCP-001/002); a borda
  pode relatar o progresso de preenchimento.

**Negativas**

- **Toca um módulo de outra feature** (0004 `claudePrompt.ts`). **Mitigação:** adição aditiva a um
  conjunto explícito, coberta pela suíte do 0004, decidida aqui em ADR — não uma mudança fora de
  escopo silenciosa (CLAUDE.md). O teste que fixa a lista `ACTIONS` é atualizado junto (TASK-MCP-003).
- A elaboração por IA **só funciona quando `/sdd-kit:mcp` (Fase 2) existir**. **Mitigação:** o
  esqueleto dos nove aspectos já orienta o preenchimento manual; a ação fica visível.
- Mais um template a sincronizar. **Mitigação:** mecanismo `.sync-manifest.json` existente.

## Limite desta decisão

Decide **o mecanismo** (nova ação `mcp` no 0004 + esqueleto por template + núcleo puro dos aspectos)
e **onde vive o template** (`feature/mcp.md`, sincronizado). **Não** redige o texto-seed de cada
aspecto além do guia (trabalho de TASK-MCP-002), **não** implementa a skill `/sdd-kit:mcp` (Fase 2) e
**não** gera um servidor MCP funcional (fora de escopo, D-Q2/Q3).
