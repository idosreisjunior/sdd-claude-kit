# Feature: Painel Projeto — resumo vivo (saúde, contexto, contadores)

- **ID:** 0013-project-overview-panel
- **Escopo dos identificadores:** PROJ
- **Estado:** ver `status.yaml` — a autoridade é ele

---

## Objetivo

Transformar o painel `Projeto` da Activity Bar de uma lista estática de links num resumo
vivo do estado do projeto — saúde estrutural, uso de contexto e distribuição das mudanças —
mantendo o acesso aos documentos de projeto.

## Contexto

Hoje o painel `Projeto` (`ProjectTreeProvider`) devolve apenas cinco nós de link para
`vision.md`, `constitution.md`, `architecture.md`, `standards.md` e `config.yaml`. Ao abrir
a extensão, a impressão é de uma interface vazia: nada comunica o estado do projeto. Os
dados que dariam vida a esse painel **já existem** — o Project Doctor (feature 0006) produz
diagnósticos estruturais e o Context Guardian (feature 0005) estima o uso de contexto — mas
vivem em superfícies separadas (painel Problems e status bar), sem um lugar que os reúna.
Esta feature cria essa superfície agregadora, reutilizando os núcleos puros existentes.

## Escopo

### Incluído

- Seção de **saúde estrutural** com a contagem de erros/avisos do Doctor e atalho para
  rodar o diagnóstico. O painel exibe o **último** resultado disponível; não roda o Doctor
  ao abrir (D-Q2).
- Seção de **contexto** com a última medição estimada (tokens vs. teto) e a faixa do
  Guardian (D-Q3).
- Seção de **contadores de mudanças por status**, derivada de `index.yaml`, na ordem do
  fluxo SDD (D-Q4).
- Os **links de documentos de projeto**, preservados e agrupados abaixo do resumo.
- Apresentação em **layout visual** (cartões e barras), não apenas lista de texto (D-Q1).

### Não incluído

- Edição de documentos no painel — é função do editor de spec (0012) e do editor de texto.
- Disparo de lint/test/build ou de CI a partir do painel.
- Execução automática do Project Doctor ao abrir o painel (D-Q2).
- Telemetria/métricas — é a feature 0009 (RNF-004 mantém a coleta desligada por padrão).

---

## Decisões de escopo (2026-07-31)

As quatro questões levantadas na criação foram respondidas pelo autor. Ficam registradas
aqui para dar rastro à decisão (constituição, Art. 5); as de natureza arquitetural serão
formalizadas em ADR no `design.md`.

| # | Decisão | Efeito na spec |
| --- | --- | --- |
| D-Q1 | O painel é renderizado como **webview** (layout rico com cartões/barras), não como `TreeView`. | Requisito de apresentação visual + NFR-PROJ-004 (segurança do webview). **Requer ADR no design** (segue o precedente do dashboard, ADR-005). |
| D-Q2 | O Doctor **não** roda ao abrir o painel: exibe-se o **último** resultado, e a execução é **sob demanda** por atalho. | REQ-PROJ-001 e NFR-PROJ-003 firmados; questão crítica encerrada. |
| D-Q3 | O contexto exibido é a **última medição feita** (de qualquer feature), já mantida em memória; não se introduz um "contexto do projeto" agregado. | REQ-PROJ-002 firmado. |
| D-Q4 | Os contadores seguem a **ordem do fluxo SDD** (DRAFT → CLARIFIED → DESIGNED → PLANNED → APPROVED → IN_PROGRESS → BLOCKED → VERIFIED → ARCHIVED → CANCELLED), exibindo só os status presentes. | REQ-PROJ-003 firmado. |

---

## Requisitos funcionais

### REQ-PROJ-001 — Cabeçalho de saúde estrutural

O painel deve apresentar a saúde estrutural do projeto como a contagem de erros e avisos do
**último** diagnóstico do Project Doctor (feature 0006) disponível, com um atalho para
executar o diagnóstico sob demanda. O painel não executa o Doctor automaticamente ao abrir
(D-Q2). Quando não houver um resultado disponível, o painel deve indicar isso explicitamente,
sem apresentar zero como se fosse "sem problemas".

#### SCN-PROJ-001 — Projeto com problemas estruturais

DADO um projeto inicializado cujo último diagnóstico do Doctor acusou 2 erros e 3 avisos
QUANDO o painel Projeto é renderizado com esse resultado
ENTÃO a seção de saúde mostra "2 erros, 3 avisos"
E oferece a ação de rodar o Project Doctor.

#### SCN-PROJ-002 — Projeto sem problemas estruturais

DADO um projeto inicializado cujo último diagnóstico do Doctor não acusou nenhum problema
QUANDO o painel Projeto é renderizado com esse resultado
ENTÃO a seção de saúde comunica "nenhum problema estrutural".

#### SCN-PROJ-003 — Diagnóstico ainda não executado

DADO um projeto inicializado em que o Doctor ainda não foi executado nesta sessão
QUANDO o painel Projeto é renderizado
ENTÃO a seção de saúde indica "diagnóstico não executado" e oferece o atalho para rodá-lo
E não apresenta "0 erros" como se fosse um resultado.

### REQ-PROJ-002 — Indicador de contexto no painel

O painel deve apresentar o estado do Context Guardian (feature 0005): a **última** medição
de uso estimado de tokens em relação ao teto configurado e a faixa correspondente, sempre
rotulada como estimativa. Sem uma medição disponível, deve indicar isso em vez de exibir um
valor falso.

#### SCN-PROJ-004 — Contexto medido

DADO que existe uma medição de contexto (uso estimado 140k de teto 200k, faixa "atenção")
QUANDO o painel Projeto é renderizado
ENTÃO a seção de contexto mostra a estimativa "~140k / 200k" e a faixa "atenção".

#### SCN-PROJ-005 — Contexto ainda não medido

DADO que nenhuma medição de contexto foi feita nesta sessão
QUANDO o painel Projeto é renderizado
ENTÃO a seção de contexto indica "— / 200k" e que a medição ainda não foi feita.

### REQ-PROJ-003 — Contadores de mudanças por status

O painel deve apresentar a quantidade de mudanças agrupadas por status, derivada de
`index.yaml`, na ordem do fluxo SDD (D-Q4), exibindo apenas os status presentes. Índice
ausente ou ilegível resulta em um estado informativo, nunca em erro.

#### SCN-PROJ-006 — Distribuição por status

DADO um `index.yaml` com mudanças em DRAFT, IN_PROGRESS e VERIFIED
QUANDO o painel Projeto é renderizado
ENTÃO a seção de contadores mostra a quantidade em cada status presente
E os status aparecem na ordem do fluxo SDD (DRAFT antes de IN_PROGRESS, antes de VERIFIED).

#### SCN-PROJ-007 — Índice ausente ou ilegível

DADO um projeto sem `index.yaml` legível
QUANDO o painel Projeto é renderizado
ENTÃO a seção de contadores mostra um estado informativo, sem quebrar o painel.

### REQ-PROJ-004 — Documentos de projeto preservados

O painel deve continuar oferecendo o acesso aos documentos de projeto existentes
(visão, constituição, arquitetura, padrões, configuração), agrupados abaixo do resumo.
Um documento ausente não deve ser oferecido como link quebrado.

#### SCN-PROJ-008 — Documento ausente

DADO um projeto sem `vision.md`
QUANDO o painel Projeto é renderizado
ENTÃO o documento ausente não aparece como link navegável (ou é sinalizado como ausente)
E os documentos existentes continuam navegáveis.

### REQ-PROJ-005 — Apresentação visual em cartões

O painel deve apresentar o resumo em layout visual — cada seção (saúde, contexto,
contadores) como um cartão, com barras onde couber (ex.: uso de contexto e proporção por
status) — e não apenas como uma lista de linhas de texto (D-Q1).

#### SCN-PROJ-009 — Layout em cartões

DADO um projeto inicializado com resultado do Doctor, medição de contexto e mudanças no índice
QUANDO o painel Projeto é renderizado
ENTÃO cada uma das três seções aparece como um cartão distinto
E a seção de contexto exibe uma barra proporcional ao uso estimado sobre o teto.

---

## Requisitos não funcionais

### NFR-PROJ-001 — Somente leitura

A renderização do painel não deve alterar nenhum arquivo do workspace nem de `.specs/`.
A única escrita admissível é a coleção de diagnósticos do Doctor, e apenas quando o usuário
aciona explicitamente o atalho de rodar o diagnóstico (comportamento já existente da 0006).

### NFR-PROJ-002 — Robustez a dados ausentes ou inválidos

Qualquer fonte ausente, ilegível ou malformada (index, status, resultado do Doctor, medição
do contexto) resulta em um estado informativo na seção correspondente — o painel nunca lança
exceção nem fica em branco por causa de um dado ruim (herda NFR-FEAT-001).

### NFR-PROJ-003 — Custo de abertura contido

Renderizar o painel não deve varrer o repositório inteiro nem ler arquivos grandes. O painel
exibe o **último** resultado do Doctor e a **última** medição do contexto disponíveis; não
dispara varredura pesada nem medição/diagnóstico automático ao ser aberto (D-Q2).

### NFR-PROJ-004 — Segurança do webview

Sendo renderizado como webview (D-Q1), o painel deve seguir o modelo de segurança do
dashboard (ADR-005): Content-Security-Policy com nonce, sem acesso de rede, `localResourceRoots`
restrito, e todo texto vindo dos artefatos escapado antes de ir ao HTML. Scripts, se houver,
limitam-se ao mínimo necessário para a interação (ex.: acionar comandos da extensão).

> O uso de webview em `sddProject` é decisão arquitetural nova (o painel era `TreeView`) e
> **deve ser formalizado em ADR no `design.md`**, à semelhança do ADR-005.

---

## Critérios de aceite

- [ ] A seção de saúde reflete erros/avisos do último diagnóstico do Doctor, distingue
      "sem problemas" de "não executado" (REQ-PROJ-001) e oferece o atalho de diagnóstico,
      sem rodar o Doctor ao abrir (D-Q2).
- [ ] A seção de contexto mostra a última medição e a faixa quando há medição, e o estado
      "não medido" quando não há (REQ-PROJ-002).
- [ ] A seção de contadores reflete a distribuição por status do `index.yaml` na ordem do
      fluxo SDD e sobrevive a índice ausente/ilegível (REQ-PROJ-003).
- [ ] Os documentos de projeto continuam acessíveis e ausências não viram links quebrados
      (REQ-PROJ-004).
- [ ] O resumo é apresentado em cartões, com barra no uso de contexto (REQ-PROJ-005).
- [ ] Nenhuma renderização do painel altera arquivos (NFR-PROJ-001) nem lança exceção diante
      de dado ruim (NFR-PROJ-002); o webview respeita CSP+nonce e não acessa a rede
      (NFR-PROJ-004).

---

## Questões pendentes

Nenhuma pendente. As quatro questões levantadas na criação (Q1–Q4) foram respondidas em
2026-07-31 — ver a seção **Decisões de escopo**. A decisão D-Q1 (webview) exige um ADR na
fase de design; isso é uma tarefa de design registrada, não uma questão em aberto.

## Hipóteses assumidas

Nenhuma em aberto. As duas hipóteses registradas na criação foram resolvidas em 2026-07-31:

- A hipótese de exibir o **último** resultado do Doctor e a **última** medição do contexto,
  sem recalcular ao renderizar, foi **confirmada** (D-Q2, D-Q3).
- A hipótese de manter um `TreeView` foi **substituída**: o autor optou por um webview rico
  (D-Q1).
