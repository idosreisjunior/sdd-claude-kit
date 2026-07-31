# ADR-005 — Base de renderização do dashboard: Webview panel

- **Status:** Aceito
- **Data:** 2026-07-31
- **Origem:** questão Q1 (`spec.md`) — dashboard/editor como Webview panel ou Custom Editor (`CustomTextEditor`)?
- **Decidido em:** TASK-UI-001

---

## Contexto

O dashboard da feature (RF-005, §13.2) precisa de um layout rico — seções,
contadores, listas de bloqueios e histórico — que uma `TreeView` não comporta. O
VS Code oferece duas superfícies para isso:

- **Webview panel** (`window.createWebviewPanel`): uma aba de HTML arbitrário,
  independente de arquivo. Serve para exibir/compôr dados de **várias** fontes.
- **Custom Editor** (`CustomTextEditor`/`CustomEditor`): liga um HTML a **um**
  documento do workspace, para **editá-lo**. É a superfície natural do RF-006
  (editar um `spec.md`), mas é atada a um único arquivo.

A tensão: o dashboard **agrega** `status.yaml` + `traceability.yaml` + `spec.md` +
a entrada do `index.yaml` de uma mudança — não é a edição de um arquivo. Escolher a
base do dashboard também insinua a base do editor (RF-006), mas as duas têm
necessidades diferentes (agregar-para-ler vs. editar-um-arquivo).

## Decisão

**Usar um Webview panel para o dashboard read-only (RF-005).** Um painel por
mudança, reutilizado por `id` (reabrir a mesma feature revela o painel existente em
vez de duplicar). O HTML é gerado a partir de um **modelo tipado e puro**
(`dashboardModel.ts`, sem API do VS Code, testável), e a renderização
(`dashboardHtml.ts`) aplica **CSP com `nonce`**, sem rede e sem execução de código
do projeto (`localResourceRoots` restrito) — NFR-UI-002.

**A base do editor (RF-006) NÃO é decidida aqui.** Quando o editor chegar, um
`CustomTextEditor` (atado ao arquivo editado) é o candidato natural e será decidido
no próprio incremento — são superfícies distintas para necessidades distintas.

### Decisões acessórias (Q2, Q3)

- **Q2 — de onde vêm as contagens:** de fontes **estruturadas** onde existem, nunca
  parseando a estrutura do Markdown. Tarefas → `status.yaml` (bloco `tasks`, já lido
  em 0002). Requisitos, cenários, testes e arquivos de implementação →
  `traceability.yaml`. Objetivo → seção `## Objetivo` do `spec.md` (extração simples
  por cabeçalho). Critérios de aceite → contagem das linhas de checkbox
  (`- [ ]`/`- [x]`) do `spec.md` (contagem por regex, não parse de estrutura). Onde a
  fonte faltar, o campo é marcado como indisponível (REQ-UI-003).
- **Q3 — ações do §13.2 (research, design, implementar…):** **não** aparecem neste
  incremento. O dashboard é somente-leitura; os botões de ação pertencem ao Workflow
  Engine e ao adapter (features 0004+) e seriam controles mortos aqui.

## Alternativas consideradas

| Alternativa | Por que não |
| --- | --- |
| Custom Editor (`CustomTextEditor`) para o dashboard | É atado a **um** documento e voltado à **edição**; o dashboard agrega várias fontes e é read-only. Força o modelo errado |
| Só `TreeView` (sem webview) | Não comporta o layout do §13.2 (seções, contadores, listas); a árvore é lista, não página |
| Preview de Markdown gerado | Perderíamos controle de layout e de CSP; gerar Markdown para depois renderizar é um desvio sem ganho sobre HTML direto |

## Consequências

**Positivas**

- Layout livre e coerente com o §13.2; base testável (modelo puro + render puro).
- Segurança explícita (CSP/nonce, sem rede) verificável no render, sem depender do host.
- Não acopla a decisão do editor (RF-006) à do dashboard.

**Negativas**

- Webview não herda o tema/estilo dos componentes nativos automaticamente.
  **Mitigação:** usar as variáveis CSS de tema do VS Code (`--vscode-*`) no HTML.
- Um webview mal-configurado é superfície de risco. **Mitigação:** CSP com `nonce`,
  `localResourceRoots` restrito, nenhum conteúdo remoto — coberto por TEST-UI-002.

## Limite desta decisão

Cobre a **base do dashboard read-only (RF-005)**. Não decide a base do editor visual
(RF-006), a estimativa de tokens/tempo (0005), os commits (0007) nem as evidências
como dados vivos (0008) — esses campos aparecem como pendentes até as features donas
existirem.
