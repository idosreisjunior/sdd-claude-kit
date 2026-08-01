# Solicitação original

- **ID:** 0005-context-guardian
- **Tipo:** feature
- **Criada em:** 2026-07-31
- **Origem:** Backlog do MVP (Épico 5 — Context Guardian, RF-012/RF-013) + solicitação do usuário

---

## Texto da solicitação

> "start the next feature 0005" → iniciar a feature **0005 — Context Guardian**.

Contexto do backlog (PRD, Épico 5 — Context Guardian): contar tokens, selecionar
arquivos, aplicar exclusões, mostrar composição, emitir alertas, sugerir redução.
Cobre o **RF-012** (Context Guardian) e o **RF-013** (Context packs).

## Interpretação

O RF-012 é grande (dez responsabilidades) e o RF-013 (context packs) é um bloco à
parte. Esta mudança entrega o **núcleo do Context Guardian**: estimar o tamanho do
contexto de uma mudança, classificá-lo contra o teto configurado nas quatro faixas do
PRD (normal / atenção / risco / bloqueio) e mostrar a composição — dando vida ao
indicador da barra de status que a fundação (0001) deixou como *stub*
(`TODO(0005-context-guardian)`).

A **estratégia de contagem de tokens** é a questão arquitetural **A3**
(`architecture.md`): heurística local vs. tokenizer real. Resolvida nesta feature por
ADR-008.

## O que esta mudança entrega

- Estimar tokens de um texto/arquivo por **heurística local** (sem rede, sem
  telemetria), sempre rotulada como estimativa.
- Classificar o uso contra o teto (`sddClaudeKit.context.maxTokens`) nas faixas
  configuradas (`warningThreshold`, `riskThreshold`, `blockThreshold`).
- Compor o contexto de uma mudança: os documentos que o fluxo SDD carrega (docs de
  projeto + artefatos da mudança), com detalhamento por arquivo e sinalização de
  arquivos grandes e binários.
- Dar vida ao **indicador da barra de status** e a um comando "Medir contexto" a partir
  de uma feature do painel.

## O que esta mudança deliberadamente não entrega

- **Context packs (RF-013)** — conjuntos reutilizáveis de contexto; bloco à parte, fica
  para um incremento seguinte.
- **Sugestão de resumos, separação de tarefas e limites por modelo** (RF-012, itens
  avançados) — dependem do núcleo desta mudança; ficam para depois.
- **Seleção automática dos arquivos de uma execução real do Claude Code** — depende de
  integração mais profunda com o que o Claude Code carrega; aqui o contexto medido é o
  conjunto de documentos do fluxo SDD, não a sessão do modelo.
- **Contagem exata de tokens** — por decisão (ADR-008) e pelo risco do PRD ("medição de
  tokens imprecisa"), a extensão apresenta **estimativas**, nunca números exatos.

Motivo do corte: entregar o núcleo útil e testável (estimar + classificar + compor) sem
depender de context packs nem de integração com a sessão do modelo, e separar a decisão
de contagem (A3) numa ADR.

## Restrições conhecidas

- Sem rede e sem telemetria (RNF-003, RNF-004); a estimativa é local.
- Leitura robusta e compatível com Windows/Linux/WSL (`workspace.fs`), herdada de 0001.
- Não bloquear a UI: leituras assíncronas, diretórios ignorados respeitados, arquivos
  grandes sinalizados sem serem carregados por inteiro (RNF-001, RF-012).
