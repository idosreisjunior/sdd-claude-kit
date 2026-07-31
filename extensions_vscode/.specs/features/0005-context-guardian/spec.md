# Feature: Context Guardian — estimar, classificar e compor o contexto

- **ID:** 0005-context-guardian
- **Escopo dos identificadores:** CTX
- **Estado:** ver `status.yaml` — a autoridade é ele
- **Requisitos de produto cobertos:** RF-012 (PRD §11); PRD §13.3 (indicador de contexto), §22

---

## Objetivo

Dar ao usuário o **guarda de contexto**: estimar quantos tokens uma mudança carregaria,
classificar esse tamanho contra o teto configurado nas faixas do PRD (normal / atenção /
risco / bloqueio) e mostrar a **composição** (quais arquivos pesam), começando pelo
indicador da barra de status que a fundação (0001) deixou como *stub*.

## Contexto

A fundação (0001) criou o indicador da barra de status com um *stub*
(`SDD Context: — / 200k`, `TODO(0005-context-guardian)`) e a configuração já traz o teto
e os três limiares (`maxTokens`, `warningThreshold`, `riskThreshold`, `blockThreshold`,
PRD §23). Falta a lógica que os usa: contar (estimar), classificar e compor.

O RF-012 é grande e o RF-013 (context packs) é um bloco à parte. Esta mudança entrega o
**núcleo**: estimar, classificar e compor. Sugestão de resumos, separação de tarefas,
limites por modelo e context packs ficam para incrementos seguintes (ver Escopo). A
estratégia de contagem (heurística vs. tokenizer) é a **questão A3**, resolvida por
**ADR-008**.

## Escopo

### Incluído (este incremento)

- **Estimar tokens** de um texto por heurística local (sem rede), sempre como estimativa.
- **Classificar** um uso (`usado`/`teto`) nas quatro faixas configuradas.
- **Compor** o contexto de uma mudança: os documentos que o fluxo SDD carrega (docs de
  projeto + artefatos da mudança), com total, detalhamento por arquivo e sinalização de
  arquivos **grandes** e **binários**.
- Dar vida ao **indicador da barra de status** e a um comando **"Medir contexto"** a
  partir de uma feature do painel.

### Não incluído

- **Context packs (RF-013)** — incremento seguinte.
- **Sugestão de resumos, separação de tarefas, limites por modelo** (RF-012 avançado).
- **Seleção automática dos arquivos de uma execução real do Claude Code** — depende de
  integração com a sessão do modelo; aqui o contexto medido é o conjunto de documentos
  do fluxo SDD.
- **Contagem exata de tokens** — por ADR-008 e pelo risco do PRD, a extensão apresenta
  **estimativas**, nunca números exatos.

---

## Requisitos funcionais

### REQ-CTX-001 — Estimar tokens de um texto

A extensão deve estimar o número de tokens de um texto por uma heurística local
determinística (ADR-008), rotulada como estimativa. Texto vazio estima zero.

#### SCN-CTX-001 — Estimativa determinística e proporcional

DADO dois textos, um claramente maior que o outro
QUANDO cada um é estimado
ENTÃO a estimativa do maior é maior que a do menor
E a estimativa de um texto vazio é zero
E a mesma entrada sempre produz a mesma estimativa.

### REQ-CTX-002 — Classificar o uso contra o teto

A extensão deve classificar um uso (`usado`, `teto`) em uma das quatro faixas do PRD
§12/§13.3, a partir das frações configuradas: **normal** (< atenção), **atenção**
(≥ atenção e < risco), **risco** (≥ risco e < bloqueio) e **bloqueio** (≥ bloqueio).

#### SCN-CTX-002 — Faixas nas fronteiras

DADO os limiares padrão (atenção 0,70; risco 0,85; bloqueio 0,95) e um teto de 200k
QUANDO o uso é 100k, 150k, 180k e 195k
ENTÃO as faixas são normal, atenção, risco e bloqueio, respectivamente
E o valor exatamente no limiar entra na faixa mais alta (≥).

### REQ-CTX-003 — Compor o contexto de uma mudança

A extensão deve compor o contexto de uma mudança a partir de um conjunto de arquivos
(docs de projeto + artefatos da mudança): o **total** de tokens estimados, o
detalhamento por arquivo **ordenado do maior para o menor**, e a sinalização de arquivos
**grandes** (acima de um limite) e **binários** (que não contam para a estimativa).

#### SCN-CTX-003 — Composição com arquivo grande e binário

DADO um conjunto com um arquivo de texto comum, um arquivo grande e um binário
QUANDO a composição é calculada
ENTÃO o total soma os tokens dos arquivos de texto contáveis
E o arquivo grande e o binário são sinalizados
E as entradas são ordenadas do maior para o menor.

### REQ-CTX-004 — Indicar na barra de status e detalhar sob demanda

A partir de uma feature do painel, o usuário deve poder **medir o contexto** da mudança;
o resultado atualiza o indicador da barra de status (tokens estimados e faixa) e uma
visão de detalhe apresenta a composição.

#### SCN-CTX-004 — Medir o contexto de uma feature

DADO uma feature no painel Features
QUANDO o usuário aciona "Medir contexto"
ENTÃO o indicador da barra de status mostra a estimativa e a faixa da mudança
E a composição por arquivo é apresentada, marcada como estimativa.

---

## Requisitos não funcionais

### NFR-CTX-001 — Estimativa honesta

O valor é sempre apresentado como **estimativa**, nunca como contagem exata (risco do PRD
"medição de tokens imprecisa"). A contagem é **local**, sem rede e sem telemetria
(RNF-003, RNF-004; ADR-008).

### NFR-CTX-002 — Leitura robusta

Arquivo ausente, ilegível, inválido ou binário não pode quebrar a medição: o arquivo é
sinalizado (binário/indisponível) e a composição segue, nunca uma exceção (NFR herdada de
0002/0003).

### NFR-CTX-003 — Núcleo testável fora do host

Estimativa, classificação e composição vivem em um módulo puro (`contextGuardian.ts`), sem
API do VS Code, com teste unitário. A borda (`extension.ts`) faz o IO e a barra de status —
verificada por F5.

### NFR-CTX-004 — Não bloquear a UI

As leituras são assíncronas; diretórios ignorados (`config.yaml` / PRD §23) são
respeitados; arquivos grandes são sinalizados a partir do tamanho (`stat`), **sem serem
lidos por inteiro** (RNF-001, RF-012 "impedir inclusão de arquivos grandes").

---

## Critérios de aceite

- [ ] A estimativa é determinística, proporcional e zero para vazio (SCN-CTX-001).
- [ ] As quatro faixas são corretas nas fronteiras, com `≥` entrando na faixa mais alta
      (SCN-CTX-002).
- [ ] A composição soma os arquivos contáveis, sinaliza grandes/binários e ordena do maior
      para o menor (SCN-CTX-003).
- [ ] "Medir contexto" atualiza a barra de status (estimativa + faixa) e mostra a
      composição, marcada como estimativa (SCN-CTX-004, NFR-CTX-001).
- [ ] Arquivo ausente/binário/inválido não quebra a medição (NFR-CTX-002).
- [ ] Arquivo grande é sinalizado pelo tamanho, sem ser lido por inteiro (NFR-CTX-004).
- [ ] O núcleo (estimar/classificar/compor) tem teste unitário e passa fora do host
      (NFR-CTX-003).

---

## Questões pendentes

Nenhuma em aberto — Q1 (= questão arquitetural **A3**) resolvida por **ADR-008**
(`decisions/`):

- **Q1 / A3 (média)** → **Heurística local** de contagem de tokens (proporcional ao
  comprimento do texto), rotulada como estimativa; sem tokenizer real nem rede. Um
  tokenizer preciso ou o número real vindo do Claude Code ficam como evolução futura, sem
  bloquear o núcleo.

## Hipóteses assumidas

Nenhuma pendente. A escolha de medir "os documentos do fluxo SDD" (e não a sessão real do
modelo) é decisão de escopo registrada acima, não hipótese silenciosa: a integração com a
sessão do modelo é explicitamente adiada.
