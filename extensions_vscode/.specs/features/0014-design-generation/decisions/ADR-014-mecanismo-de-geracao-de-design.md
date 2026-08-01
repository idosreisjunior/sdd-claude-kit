# ADR-014 — Geração do design: esqueleto por template + ação do adapter 0004 (híbrido)

- **Status:** Aceito
- **Data:** 2026-08-01
- **Origem:** questões **Q1** (reusar o adapter do Claude Code 0004 vs. componente novo) e **Q2**
  (onde vive o template do `design.md`) da spec de 0014-design-generation.
- **Decidido em:** TASK-DSGN-001

---

## Contexto

O RF-009 pede que a extensão **gere ou auxilie** a geração do `design.md` da feature, com as
seções: visão da solução, componentes afetados, fluxo de dados, contratos, APIs, banco de dados,
segurança, tratamento de erros, observabilidade, testes, migração, rollback, riscos e
alternativas consideradas. Duas forças tornavam a decisão não óbvia:

- **O adapter 0004 já cobre "delegar ao Claude Code".** `claudePrompt.ts` tem a ação `design`:
  `composePrompt('design', id)` → `/sdd-kit:design <id>`, copiada para o clipboard, com o
  terminal aberto. Por **ADR-007**, esse adapter é *fire-and-forget* e **humano no controle**: a
  extensão não escreve arquivos nem lê stdout — quem gera o conteúdo é o Claude Code (CLI).
- **A skill que geraria o conteúdo ainda não existe.** `/sdd-kit:design` é de Fase 2; hoje só há
  `init/new/spec/tasks`. Delegar puramente ao 0004 deixaria 0014 **sem efeito visível até a Fase 2**.
- **A extensão pode escrever arquivos.** O `init` (`initTemplates.ts`) já materializa `.specs/` a
  partir de templates. Nada impede a extensão de escrever um `design.md`-esqueleto a partir de um
  template — o que entrega o "auxiliar" do RF-009 e as **lacunas marcadas** (D-Q6) desde já, sem
  depender da Fase 2.
- **Restrição de rede.** A extensão não faz I/O de rede; qualquer geração por IA passa pelo
  Claude Code (RNF-004, NFR-DSGN-002).

O eixo da decisão: entregar valor hoje ("auxiliar" = esqueleto) sem fechar a porta para o
conteúdo assistido por IA ("gerar" = Claude Code) quando a Fase 2 chegar — e sem duplicar a
integração de terminal já resolvida em 0004/ADR-007.

## Decisão

Adotar um **modelo híbrido**, em duas camadas que não se sobrepõem:

1. **Esqueleto por template, escrito pela extensão (Q2 = sim, template novo).** A extensão gera um
   `design.md`-esqueleto a partir de um **novo template `feature/design.md`**, com todas as seções
   do RF-009 e as sem informação **marcadas como lacuna** (D-Q6). A fonte do template vive em
   `plugins/sdd-kit/templates/pt-BR/feature/design.md` e é **sincronizada** para
   `extensions_vscode/templates/pt-BR/feature/design.md` pelo mecanismo existente
   (`.sync-manifest.json`), como todos os demais templates. A escrita reusa o caminho do `init`
   (`initTemplates.ts`); se já existir `design.md`, **confirma antes de sobrescrever** e preserva
   o conteúdo atual quando o usuário recusa (D-Q5).

2. **Conteúdo assistido por IA, reusando a ação `design` do 0004 (Q1 = reuso).** Para "gerar"
   conteúdo, a extensão **não reimplementa** a integração: reusa `composePrompt('design', id)` do
   adapter 0004, que compõe `/sdd-kit:design <id>`, copia e abre o terminal — coerente com ADR-007
   (a extensão não escreve o conteúdo gerado nem lê stdout). Essa camada fica **plenamente
   funcional quando a skill `/sdd-kit:design` (plugin, Fase 2)** existir.

3. **Pré-condição e gatilho.** A ação é oferecida no **dashboard da feature** (D-Q3) e só fica
   disponível quando a spec está aprovada — **`approval != null`** no `status.yaml` (D-Q4).

Assim, "auxiliar" (esqueleto com lacunas) funciona já; "gerar" (conteúdo por IA) reusa o 0004 e
ativa-se na Fase 2. A estrutura das seções vive **no template**, não embutida em código.

## Alternativas consideradas

| Alternativa | Por que não |
| --- | --- |
| **Só delegar ao Claude Code** (reuso puro do 0004: dashboard + gate, sem escrever design.md) | Coerente com ADR-007, mas deixa 0014 **sem valor observável até a Fase 2** (a skill `/sdd-kit:design` não existe). Empurra estrutura, lacunas e sobrescrita para o plugin, adiando o RF-009 inteiro |
| **Só esqueleto por template** (extensão escreve, sem nenhuma integração com IA) | Funciona hoje, mas entrega **apenas a estrutura vazia** — cobre o "auxiliar" e ignora o "gerar" do RF-009. Fecharia a porta para o conteúdo assistido sem motivo |
| **Extensão gera o conteúdo por IA diretamente** (chamada de rede própria) | Viola "sem rede" (RNF-004, NFR-DSGN-002) e duplica o que 0004/ADR-007 já resolvem via terminal. Descartada de imediato |
| **Estrutura das seções embutida em código** (sem template) | Diverge do padrão do projeto (spec/bug/change/refactor todos por template sincronizado) e dificulta ajustar as seções sem recompilar. O template é o lugar natural |

## Consequências

**Positivas**

- Entrega o "auxiliar" do RF-009 **hoje** (esqueleto com lacunas), sem depender da Fase 2.
- **Não duplica** a integração de terminal: o "gerar" reusa a ação `design` do 0004 (ADR-007).
- A estrutura das seções vive no template, ajustável sem recompilar; segue o padrão de sync.
- Núcleo testável fora do host: pré-condição (`approval != null`) e montagem do esqueleto são puras.

**Negativas**

- O conteúdo assistido por IA **só funciona quando `/sdd-kit:design` (Fase 2) existir**.
  **Mitigação:** o esqueleto já é útil sozinho; a ação de "gerar" fica visível e, até lá, apenas
  compõe o prompt (como as demais ações do 0004 cuja skill ainda não chegou).
- Dois artefatos de template a manter em sincronia (plugin → extensão). **Mitigação:** é o
  mecanismo `.sync-manifest.json` já existente; a TASK-DSGN-002 atualiza o manifesto (fileCount
  18 → 19 e hashes) ao adicionar `feature/design.md`.
- Possível confusão sobre "quem escreve o quê": a extensão escreve o **esqueleto**; o Claude Code
  escreve o **conteúdo**. **Mitigação:** este ADR delimita as duas camadas explicitamente.

## Limite desta decisão

Decide **o mecanismo** (esqueleto por template + reuso do 0004) e **onde vive o template**
(`feature/design.md`, sincronizado). **Não** define o conteúdo/seed de cada seção do template
(trabalho de TASK-DSGN-002), **não** implementa a skill `/sdd-kit:design` (plugin, Fase 2) e
**não** decide captura de resultado — que permanece fora, como em ADR-007.
