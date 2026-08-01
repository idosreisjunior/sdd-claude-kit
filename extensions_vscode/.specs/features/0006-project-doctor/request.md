# Solicitação original

- **ID:** 0006-project-doctor
- **Tipo:** feature
- **Criada em:** 2026-07-31
- **Origem:** Backlog do MVP (Épico 6 — Project Doctor, RF-002) + solicitação do usuário

---

## Texto da solicitação

> "start the next feature 0006" → iniciar a feature **0006 — Project Doctor**.

Contexto do backlog (PRD, Épico 6 — Project Doctor): validar a estrutura, identificar
documentos ausentes, verificar tarefas, verificar requisitos, apresentar diagnósticos.
Cobre o **RF-002**, que pede um resultado apresentado "em um painel semelhante ao sistema
de Problems do VS Code".

## Interpretação

O RF-002 lista onze checagens, algumas semânticas ("divergências entre tarefas e
especificação", "documentos desatualizados") e outras que pertencem a features vizinhas
(Git — 0007; validação/rastreabilidade profunda — 0008). Esta mudança entrega o **núcleo
estrutural**: verificar a saúde de `.specs` (arquivos obrigatórios, status das mudanças,
coerência índice↔disco, presença de spec) e apresentar o resultado no **painel Problems**
via a Diagnostics API do VS Code.

Por decisão de arquitetura (§2), o Project Doctor **aponta, não corrige**.

## O que esta mudança entrega

- Diagnóstico estrutural puro de `.specs`: arquivos de projeto obrigatórios ausentes;
  mudança sem `status.yaml` ou com status inválido; status divergente entre `index.yaml`
  e o `status.yaml`; `spec.md` ausente; diretório de mudança no disco não registrado no
  índice; ausência de Git; Claude Code não detectado.
- Apresentação no **painel Problems** (Diagnostics API), com severidade, mensagem e
  sugestão de correção, acionada por um comando a partir do painel Projeto.

## O que esta mudança deliberadamente não entrega

- **Checagens semânticas** (tarefas sem critérios de aceite, divergência tarefa↔spec,
  documentos desatualizados, órfãos de rastreabilidade profundos) — pertencem ao Evidence
  + Validation Engine (feature 0008).
- **Riscos de Git** (branch, alterações pendentes) — Git Adapter (feature 0007).
- **Correção automática** — arquitetura §2: o Doctor não corrige sozinho.
- **Verificação de links para arquivos inexistentes dentro do Markdown** — incremento
  futuro.

Motivo do corte: entregar o diagnóstico estrutural útil e testável, sem invadir 0007/0008.

## Restrições conhecidas

- Somente leitura: nenhum arquivo é alterado (arquitetura §2, §8).
- Leitura robusta e compatível com Windows/Linux/WSL (`workspace.fs`), herdada de 0001/0002.
- Sem rede e sem telemetria (RNF-003/004).
