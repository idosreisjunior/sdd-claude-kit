# Feature: Claude Code Adapter — montar/copiar prompt e abrir no terminal

- **ID:** 0004-claude-code-adapter
- **Escopo dos identificadores:** CC
- **Estado:** ver `status.yaml` — a autoridade é ele
- **Requisitos de produto cobertos:** RF-011 (PRD §11); PRD §13.2, §22 (Claude Code Adapter)

---

## Objetivo

Dar à extensão a **ponte para o Claude Code**: a partir de uma mudança do painel
Features, o usuário compõe o prompt de uma ação do fluxo SDD, copia esse prompt e abre
a mudança no Claude Code no terminal integrado — sem sair do editor e sem que a
extensão dispare a ação por conta própria.

## Contexto

A fundação (0001) já **detecta** a CLI do Claude Code (`src/sdd/claudeCode.ts`,
ADR-002) e registrou o comando `sddClaudeKit.openInClaudeCode` como *stub*
(`TODO(0004)`). O gerenciamento (0002) e a interface (0003) tornaram o painel Features
e o dashboard úteis. Falta o passo que o PRD §13.2 descreve: escolher uma ação e
abri-la no terminal do Claude Code.

O épico é grande — o RF-011 lista onze ações e uma prévia com **tamanho estimado de
contexto**. Esta mudança entrega o **núcleo**: compor e copiar o prompt de uma ação, e
abrir a mudança no Claude Code. A prévia de tamanho de contexto e a seleção de arquivos
são do **Context Guardian (0005)**; a captura de resultado é do **Evidence Engine
(0008)**. Ver Escopo e Questões.

## Escopo

### Incluído (este incremento)

- **Compor o prompt** de uma ação do fluxo SDD sobre a mudança selecionada — um comando
  do plugin `sdd-kit` (ex.: `/sdd-kit:spec <id>`), por lógica pura e testável.
- **Copiar o prompt** para a área de transferência.
- **Abrir a mudança no Claude Code**: abrir/reutilizar um terminal integrado, iniciar a
  CLI detectada e deixar o prompt pronto para o usuário revisar e enviar.
- **Degradar** quando o Claude Code não é detectado: copiar o prompt e orientar
  (configurar `sddClaudeKit.claudeCode.path` ou instalar a CLI), sem quebrar.

### Não incluído

- **Tamanho estimado do contexto e seleção de arquivos** (RF-011, prévia) — Context
  Guardian, feature 0005. O prompt aqui é o comando da ação, não o contexto montado.
- **Captura de resultado** (diff, stdout, testes executados) — questão A2, adiada por
  **ADR-007** para a feature 0008.
- **Context packs** (RF-013) — fora do MVP enxuto.
- **Envio automático da ação SDD** — por princípio (constituição, "humano no
  controle"): a extensão prepara e abre; quem envia a ação é o usuário.
- Ações que exigem estado de "tarefa ativa" além de compor o comando (ex.: escolher
  *qual* próxima tarefa implementar) — pertencem ao Workflow Engine; aqui compomos
  `/sdd-kit:implement <id>` e o Claude Code resolve a seleção.

---

## Requisitos funcionais

### REQ-CC-001 — Compor o prompt de uma ação SDD

A extensão deve compor, para uma mudança e uma ação do fluxo SDD, o texto do prompt a
enviar ao Claude Code: o comando do plugin `sdd-kit` correspondente à ação, aplicado ao
identificador da mudança. Cada ação tem um rótulo e um objetivo legíveis em pt-BR.

#### SCN-CC-001 — Prompt composto a partir de mudança e ação

DADO uma mudança de identificador `0004-claude-code-adapter`
E a ação "Detalhar a especificação"
QUANDO o prompt é composto
ENTÃO o texto resultante é `/sdd-kit:spec 0004-claude-code-adapter`
E há um objetivo legível associado à ação.

#### SCN-CC-004 — Conjunto de ações fechado

DADO o conjunto de ações do fluxo SDD oferecidas
QUANDO uma ação é solicitada
ENTÃO apenas ações declaradas produzem prompt
E uma ação não declarada não é oferecida nem produz comando.

### REQ-CC-002 — Copiar o prompt

A partir de uma mudança no painel Features, o usuário deve poder escolher uma ação e
**copiar** o prompt composto para a área de transferência, para colá-lo onde quiser
(inclusive fora da extensão) — o RF-011 "copiar prompt", e a garantia do §7.6 (o fluxo
funciona sem a UI).

#### SCN-CC-002 — Copiar prompt da feature

DADO uma feature selecionada no painel Features
QUANDO o usuário escolhe uma ação e confirma "copiar"
ENTÃO o prompt composto vai para a área de transferência
E o usuário é informado do que foi copiado.

### REQ-CC-003 — Abrir a mudança no Claude Code

A extensão deve abrir a mudança no Claude Code: abrir/reutilizar um terminal integrado
na raiz do workspace, iniciar a CLI detectada (ou orientar quando ausente) e deixar o
prompt composto pronto para o usuário revisar e enviar. A extensão **não** envia a ação
sozinha.

#### SCN-CC-003 — Abrir no Claude Code com a CLI detectada

DADO que o Claude Code é detectado (via config ou PATH)
QUANDO o usuário aciona "Abrir no Claude Code" para uma feature
ENTÃO um terminal integrado abre e inicia a CLI
E o prompt composto fica pronto para revisão, sem ser enviado automaticamente.

#### SCN-CC-005 — Degradação quando o Claude Code não é detectado

DADO que o Claude Code não é detectado
QUANDO o usuário aciona "Abrir no Claude Code"
ENTÃO o prompt é copiado para a área de transferência
E o usuário é orientado a configurar `sddClaudeKit.claudeCode.path` ou instalar a CLI
E nenhuma exceção é lançada.

---

## Requisitos não funcionais

### NFR-CC-001 — Nada é executado sem ação humana

A extensão nunca envia a ação do fluxo SDD por conta própria: o prompt é preparado
(copiado e/ou digitado no terminal), e o envio é do usuário (constituição Art. 9;
"humano no controle"). Nenhum dado sai da máquina além do que o usuário enviar no seu
próprio terminal (RNF-003).

### NFR-CC-002 — Entrada de configuração como não confiável e compatibilidade

O caminho da CLI (`sddClaudeKit.claudeCode.path`) é tratado como **caminho**, citado com
segurança ao iniciar o terminal — nunca concatenado cru em uma linha de shell. Funciona
em Windows, Linux e WSL usando a API de terminal do VS Code, sem montar sintaxe de shell
específica de SO além da citação do caminho.

### NFR-CC-003 — Núcleo testável fora do host

A composição do prompt e a citação do caminho vivem em um módulo puro (`claudePrompt.ts`),
sem dependência da API do VS Code, com teste unitário. A borda (`extension.ts`) faz o IO
(clipboard, terminal, detecção) — verificada por F5.

---

## Critérios de aceite

- [ ] O prompt de uma ação é composto como `/sdd-kit:<ação> <id>` com objetivo legível
      (SCN-CC-001).
- [ ] Apenas ações declaradas produzem prompt (SCN-CC-004).
- [ ] O usuário copia o prompt de uma feature para a área de transferência (SCN-CC-002).
- [ ] "Abrir no Claude Code" abre o terminal com a CLI detectada e deixa o prompt pronto,
      sem enviar (SCN-CC-003, NFR-CC-001).
- [ ] Claude Code ausente: prompt copiado e orientação, sem exceção (SCN-CC-005).
- [ ] O caminho da CLI é citado com segurança; nada é executado sem ação humana
      (NFR-CC-001, NFR-CC-002).
- [ ] O núcleo (composição + citação) tem teste unitário e passa fora do host (NFR-CC-003).

---

## Questões pendentes

Nenhuma em aberto — Q1 (= questão arquitetural **A2** de `architecture.md`) resolvida por
**ADR-007** (`decisions/`):

- **Q1 / A2 (alta)** → **A captura de resultado do terminal fica FORA deste incremento.**
  O terminal integrado não expõe stdout de forma estável; o adapter é *fire-and-forget* +
  humano no controle. A captura de resultado (diff, testes, evidências) é da feature 0008,
  e as opções técnicas (pseudoterminal, `claude -p` com arquivo de saída) ficam registradas
  no ADR-007 para quando 0008 chegar.

## Hipóteses assumidas

Nenhuma pendente. A interpretação "prompt = comando da ação SDD" (e não o contexto montado
com arquivos) é uma decisão de escopo registrada acima e no ADR-007, não uma hipótese
silenciosa: o contexto montado é explicitamente da feature 0005 (Context Guardian).
