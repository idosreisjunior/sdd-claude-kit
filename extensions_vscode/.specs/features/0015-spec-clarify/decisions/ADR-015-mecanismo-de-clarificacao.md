# ADR-015 — Clarificação: esqueleto por template + ação do adapter 0004 (híbrido)

- **Status:** Aceito
- **Data:** 2026-08-01
- **Origem:** questões **Q1** (delegar a análise ao Claude Code vs. análise própria) e **Q2**
  (onde vive o template do `clarifications.md`) da spec de 0015-spec-clarify.
- **Decidido em:** TASK-CLAR-001

---

## Contexto

O RF-008 pede que a extensão **analise a spec** de uma mudança e identifique nove categorias de
lacuna (requisitos ambíguos, critérios de aceite ausentes, conflitos, regras incompletas, casos
extremos, dependências não definidas, decisões técnicas prematuras, riscos de segurança, impactos
em dados), registrando "as respostas" em `clarifications.md`. As forças em jogo:

- **A análise é intrinsecamente trabalho de linguagem natural.** Identificar "ambiguidade",
  "conflito" ou "risco de segurança" numa spec exige compreensão — a extensão **não** faz isso por
  heurística com fidelidade. Diferente até do 0014 (onde o esqueleto já tem valor sozinho), aqui o
  valor central do RF-008 é a *análise*, que é do agente.
- **O adapter 0004 já cobre "delegar ao Claude Code".** `claudePrompt.ts` tem a ação `clarify`:
  `composePrompt('clarify', id)` → `/sdd-kit:clarify <id>`, copiada e com o terminal aberto. Por
  ADR-007, o adapter é *fire-and-forget* e **humano no controle**.
- **A skill que faria a análise ainda não existe.** `/sdd-kit:clarify` é de Fase 2; hoje só há
  `init/new/spec/tasks`. Delegar puramente ao 0004 deixaria 0015 sem efeito visível até a Fase 2.
- **Já existe um padrão para isto: o 0014 (ADR-014).** Esqueleto por template escrito pela
  extensão (funciona hoje) + reuso da ação do 0004 para o conteúdo por IA (Fase 2). Reaproveitar
  esse padrão evita divergência de arquitetura entre etapas irmãs do fluxo (`clarify`/`design`).
- **Restrição de rede.** A extensão não faz I/O de rede; a análise por IA passa pelo Claude Code
  (RNF-004, NFR-CLAR-001).

O eixo da decisão: entregar estrutura hoje sem fechar a porta para a análise assistida por IA,
reusando o padrão do 0014 em vez de inventar um novo.

## Decisão

Adotar o **mesmo modelo híbrido do ADR-014**, em duas camadas:

1. **Esqueleto por template, escrito pela extensão (Q2 = sim, template novo).** A extensão gera um
   `clarifications.md`-esqueleto a partir de um **novo template `feature/clarifications.md`**, com
   as **nove categorias do RF-008 como seções fixas** (D-Q5), cada uma com espaço para achados e
   para a resolução/resposta. A fonte vive em `plugins/sdd-kit/templates/pt-BR/feature/clarifications.md`
   e é **sincronizada** para `extensions_vscode/templates/pt-BR/feature/clarifications.md` pelo
   mecanismo existente (`.sync-manifest.json`). Se já existir `clarifications.md`, **confirma antes
   de sobrescrever** e preserva o conteúdo atual quando o usuário recusa (SCN-CLAR-004).

2. **Análise por IA, reusando a ação `clarify` do 0004 (Q1 = reuso).** A extensão **não**
   reimplementa análise nem terminal: reusa `composePrompt('clarify', id)` do adapter 0004, que
   compõe `/sdd-kit:clarify <id>`, copia e abre o terminal — coerente com ADR-007. Essa camada
   fica plenamente funcional quando a skill `/sdd-kit:clarify` (plugin, Fase 2) existir.

3. **Pré-condição e gatilho.** A ação "Clarificar" é oferecida no **item da feature** (D-Q3) e só
   fica disponível quando a spec tem requisitos (`REQ-*` presentes, D-Q4). A ação **não promove**
   o estado da mudança — clarificar levanta lacunas, não as resolve.

Assim, a estrutura das nove categorias funciona já; a análise reusa o 0004 e ativa-se na Fase 2.

## Alternativas consideradas

| Alternativa | Por que não |
| --- | --- |
| **Análise heurística própria na extensão** (detectar ambiguidade/conflito/risco por regras) | A qualidade seria pobre e enganosa — "ambiguidade" e "risco de segurança" exigem compreensão, não *regex*. Daria falsa confiança num relatório fraco. Descartada |
| **Só delegar ao Claude Code** (sem escrever clarifications.md) | Coerente com ADR-007, mas deixa 0015 sem efeito observável até a Fase 2 e sem um lugar estruturado para registrar "as respostas" (RF-008) |
| **Novo mecanismo, diferente do 0014** | `clarify` e `design` são etapas irmãs do fluxo; divergir a arquitetura entre elas aumenta custo de manutenção sem ganho. Reusar o padrão do ADR-014 é o caminho |
| **Estrutura das categorias embutida em código** | Diverge do padrão de templates sincronizados (spec/design/…); dificulta ajustar as seções sem recompilar |
| **Promover `DRAFT → CLARIFIED` ao gerar** | Afirmaria "ambiguidades resolvidas" quando a ação só as *levanta*. A transição de estado é do fluxo de status (D-Q4) |

## Consequências

**Positivas**

- Entrega a estrutura das nove categorias **hoje**, sem depender da Fase 2.
- **Não duplica** integração de terminal nem inventa arquitetura: reusa a ação `clarify` do 0004 e
  o padrão do ADR-014.
- Estrutura no template, ajustável sem recompilar; segue o mecanismo de sync.
- Núcleo testável fora do host: pré-condição (`hasRequirements`) e montagem do esqueleto são puras.

**Negativas**

- A análise por IA **só funciona quando `/sdd-kit:clarify` (Fase 2) existir**. **Mitigação:** o
  esqueleto das nove categorias já orienta o preenchimento manual; a ação de analisar fica visível
  e, até lá, apenas compõe o prompt (como as demais ações do 0004 sem skill).
- Mais um par de templates a manter em sincronia (plugin → extensão). **Mitigação:** é o mecanismo
  `.sync-manifest.json`; a TASK-CLAR-002 atualiza o manifesto ao adicionar `feature/clarifications.md`.
- Risco de o esqueleto vazio ser confundido com "clarificação feita". **Mitigação:** as seções
  nascem com marcador de lacuna; o valor real vem da análise (manual ou via Claude Code).

## Limite desta decisão

Decide **o mecanismo** (esqueleto por template + reuso do 0004) e **onde vive o template**
(`feature/clarifications.md`, sincronizado). **Não** define o texto-seed de cada categoria
(trabalho de TASK-CLAR-002), **não** implementa a skill `/sdd-kit:clarify` (plugin, Fase 2) e
**não** decide a promoção de estado — que permanece com o fluxo de status.
