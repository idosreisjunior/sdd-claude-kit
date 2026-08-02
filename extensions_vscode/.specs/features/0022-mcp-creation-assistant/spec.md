# Feature: Assistente de criação de MCPs (RF-025)

- **ID:** 0022-mcp-creation-assistant
- **Escopo dos identificadores:** MCP
- **Estado:** ver `status.yaml` — a autoridade é ele

---

## Objetivo

Ajudar o desenvolvedor a **definir** um servidor MCP percorrendo os nove aspectos
do RF-025 (objetivo, ferramentas, recursos, schemas, autenticação, permissões,
testes, documentação, publicação), capturando as decisões num documento revisável
(`mcp.md`) e oferecendo delegar a elaboração ao Claude Code.

## Contexto

O RF-025 do PRD da extensão prevê, para uma etapa futura, um assistente de criação
de servidores MCP. Hoje a extensão não oferece nenhum apoio a isso: quem quer expor
um MCP monta tudo manualmente, sem um roteiro dos aspectos que precisam ser
decididos. O valor do assistente é dar esse roteiro — reduzir o "não sei por onde
começar" a uma sequência de decisões explícitas — coerente com o que a extensão já
faz para spec, design e research.

O texto do RF-025 usa o verbo **"ajudar a definir"** e nomeia os nove aspectos, mas
não diz como o assistente opera. Essa lacuna foi resolvida nas **decisões de escopo**
abaixo: o assistente segue o **padrão híbrido** já usado em research (0017), design
(0014) e clarify (0015) — scaffoldar um esqueleto do artefato e oferecer delegar ao
Claude Code — e produz um **documento de decisões** (`mcp.md`), não um servidor MCP
funcional.

## Escopo

### Incluído

- Gerar um esqueleto de **`mcp.md`** com uma seção por aspecto dos **nove** do RF-025.
- Marcar como pendente cada aspecto sem decisão — o documento é honesto quanto a lacunas.
- Oferecer **delegar a elaboração ao Claude Code** (padrão híbrido), deixando o prompt pronto.

### Não incluído

- **Gerar um servidor MCP funcional** (código, manifest, dependências) — D-Q2: a saída é o
  documento de decisões; o scaffold de código é um incremento futuro, fora deste escopo.
- **Executar testes, configurar autenticação ou publicar** o MCP — D-Q3: o assistente
  *define/documenta*, não *faz*.
- **Gerenciar MCPs existentes** (listar, editar, remover) — fora do texto do RF-025.
- **Fixar SDK/linguagem/transport** — D-Q5: o alvo técnico é uma das decisões que o próprio
  `mcp.md` captura; a extensão não o impõe.

---

## Decisões de escopo

Tomadas ao refinar a spec, a partir da confirmação da hipótese pelo usuário. Uma
decisão sem rastro é indistinguível de uma suposição (constituição, Art. 5).

- **D-Q1 (mecanismo)** — **padrão híbrido**: a borda scaffolda o `mcp.md` de um template
  sincronizado e oferece delegar a elaboração ao Claude Code, como research/design/clarify
  (reuso de `runHybridStep`). Decisão arquitetural — a formalização (novo action `mcp` no
  adapter do Claude Code) e a necessidade de um ADR são avaliadas em `/sdd-kit:tasks`.
- **D-Q2 (saída)** — um **documento de decisões `mcp.md`** na pasta da mudança. Scaffold de
  código do MCP fica **fora de escopo** (incremento futuro).
- **D-Q3 (definir vs fazer)** — apenas **definir/documentar**: o assistente não executa
  testes, não configura auth nem publica. Decorre de D-Q2.
- **D-Q4 (gatilho)** — comando **no item da feature**, coerente com o padrão híbrido (o
  `mcp.md` vive na pasta da mudança, como design.md/research.md).
- **D-Q5 (alvo técnico)** — **agnóstico**: SDK/linguagem/transport são conteúdo do `mcp.md`,
  não algo fixado pela extensão. (Moot para scaffold, que saiu de escopo.)
- **D-Q6 (incremento)** — **entrega única**: um documento cobrindo os nove aspectos, sem
  fatiamento.

---

## Requisitos funcionais

### REQ-MCP-001 — Gerar o esqueleto de decisões do MCP (`mcp.md`)

Um núcleo puro monta um `mcp.md` revisável com uma seção para cada um dos nove aspectos
do RF-025 (objetivo, ferramentas, recursos, schemas, autenticação, permissões, testes,
documentação, publicação), na ordem do texto. Aspectos sem decisão informada aparecem
marcados como pendentes — o documento é honesto sobre lacunas, não as esconde, e é
produzido mesmo incompleto.

#### SCN-MCP-001 — Esqueleto com os nove aspectos

DADO que o usuário aciona o assistente de criação de MCP numa feature
QUANDO o `mcp.md` é gerado
ENTÃO ele contém uma seção para cada um dos nove aspectos do RF-025, na ordem do texto.

#### SCN-MCP-002 — Aspectos incompletos não quebram o documento

DADO que um ou mais dos nove aspectos ficam sem decisão
QUANDO o `mcp.md` é gerado
ENTÃO cada aspecto pendente aparece marcado como tal
E o documento é produzido mesmo assim, sem erro.

### REQ-MCP-002 — Oferecer delegar a elaboração ao Claude Code

Depois de scaffoldar o `mcp.md`, a borda oferece delegar a elaboração ao Claude Code
(padrão híbrido): compõe e copia o prompt da ação, e deixa-o pronto no terminal da CLI
detectada — **sem enviar** (o usuário revisa e confirma). Com a CLI ausente, o prompt é
copiado e a orientação é exibida.

#### SCN-MCP-003 — Delegação deixa o prompt pronto

DADO que o `mcp.md` foi scaffoldado e o Claude Code está detectado
QUANDO o usuário escolhe delegar a elaboração
ENTÃO o prompt da ação é copiado e deixado pronto no terminal, sem ser enviado.

#### SCN-MCP-004 — Claude Code ausente

DADO que o Claude Code não está detectado
QUANDO o usuário escolhe delegar a elaboração
ENTÃO o prompt é copiado
E a extensão orienta como prosseguir manualmente, sem falhar.

---

## Requisitos não funcionais

### NFR-MCP-001 — Coerência com os padrões da extensão

A lógica que estrutura os nove aspectos e monta o `mcp.md` vive num **núcleo puro**, sem
a API do VS Code nem I/O, testável fora do host; a borda apenas orquestra. Nada é
executado nem enviado para fora sem confirmação explícita (constituição, Art. 8/9).

---

## Critérios de aceite

- [ ] O `mcp.md` gerado tem exatamente os nove aspectos do RF-025, na ordem do texto (SCN-MCP-001).
- [ ] Aspectos sem decisão aparecem marcados como pendentes, sem quebrar (SCN-MCP-002).
- [ ] A montagem do `mcp.md` tem cobertura de teste no núcleo puro (NFR-MCP-001).
- [ ] A borda oferece delegar ao Claude Code, deixando o prompt pronto sem enviar (SCN-MCP-003).
- [ ] Sem a CLI, o prompt é copiado e a orientação é exibida (SCN-MCP-004).

---

## Questões pendentes

| # | Questão | Bloqueia | Prioridade |
| --- | --- | --- | --- |
| — | Nenhuma questão em aberto. Q1/Q2 foram confirmadas pelo usuário e Q3/Q4/Q5/Q6 decorrem delas (ver Decisões de escopo). | — | — |

## Hipóteses assumidas

> Nenhuma hipótese pendente. A hipótese do padrão híbrido (esqueleto + delegação ao Claude
> Code, saída = documento `mcp.md`) foi **confirmada** pelo usuário e virou a decisão D-Q1/D-Q2.
