# ADR-006 — Base do editor de specs: CustomTextEditor

- **Status:** Aceito
- **Data:** 2026-07-31
- **Origem:** questão Q1 (`spec.md`) — base do editor: CustomTextEditor ou Webview panel? Deixada em aberto pelo ADR-005.
- **Decidido em:** TASK-EDIT-001

---

## Contexto

O editor (RF-006) precisa **alterar** o conteúdo de um documento `.specs` e salvá-lo
sem perda (NFR-EDIT-001). O arquivo é a fonte de verdade (arquitetura §1) e também é
lido/escrito pela CLId e por edição manual. Há duas bases no VS Code:

- **CustomTextEditor** (`CustomTextEditorProvider`): liga um webview a um
  `TextDocument`. O VS Code cuida do ciclo de vida do documento — estado "sujo",
  salvar, desfazer/refazer, mudanças externas, EOL. A extensão sincroniza o webview
  com o documento e aplica edições via `WorkspaceEdit`.
- **Webview panel** (`createWebviewPanel`): HTML livre, **desligado** de qualquer
  documento. Para editar, a extensão teria que reimplementar salvar, sujo,
  desfazer e a reconciliação com mudanças externas — cada um uma chance de dessync
  e perda de dados.

A tensão: o webview dá layout livre (útil para o formulário estruturado futuro), mas
reimplementar o ciclo de vida do documento é onde os defeitos de perda moram — a
mesma família dos bugs 0006/0011 (transformação de conteúdo quebrando o arquivo).

## Decisão

**Usar um `CustomTextEditor` para editar `spec.md`**, registrado com prioridade
`option` (o editor de texto padrão continua o default; o usuário abre o editor SDD
por "Reabrir com…" ou pela ação no painel). O documento/arquivo permanece a fonte
de verdade; o webview é uma **projeção** dele.

- **Sincronização sem perda (NFR-EDIT-001):** o webview edita o Markdown num
  `<textarea>` e envia o texto ao provider, que aplica um `WorkspaceEdit`
  substituindo o documento inteiro; mudanças no documento (inclusive externas)
  reprojetam no webview. Um guard evita o eco (não reaplicar a edição que o próprio
  webview originou). **Sem transformação estrutural** do conteúdo — o texto salvo é
  o texto editado. O EOL do documento é preservado (normaliza `\n` do textarea para
  o `eol` do `TextDocument` antes de aplicar).
- **Webview seguro (NFR-EDIT-002):** CSP com `nonce` para `style-src` e
  `script-src` (o script faz só a mensageria de sincronização), sem rede,
  `localResourceRoots` restrito.
- **Visão consciente de SDD (REQ-EDIT-003):** ao lado do textarea, um painel
  renderizado destaca cabeçalhos e identificadores (REQ-*, SCN-*, TASK-*, NFR-*),
  gerado por função pura testável.

### Decisões acessórias (Q2, Q3)

- **Q2 — documentos do primeiro incremento:** apenas `spec.md`. É o documento mais
  usado e o de estrutura mais rica; `request.md` e os demais entram depois.
- **Q3 — formulário estruturado (incremento futuro):** quando chegar, editará
  **blocos delimitados** ou usará fontes estruturadas, **nunca** parse-e-serialize
  de toda a estrutura do Markdown — essa é a origem da perda (lição 0006/0011). Fica
  registrado como direção; não é construído aqui.

## Alternativas consideradas

| Alternativa | Por que não |
| --- | --- |
| Webview panel com edição própria | Reimplementa salvar/sujo/desfazer/mudança externa — cada um um risco de dessync e perda (NFR-EDIT-001) |
| CustomTextEditor como default (sem `option`) | Sequestraria a abertura de todo `spec.md`, tirando o editor de texto nativo do usuário sem escolha |
| Formulário estruturado já no primeiro incremento | Exige o contrato de ida-e-volta Markdown↔campos, de alto risco; merece decisão própria (Q3) |

## Consequências

**Positivas**

- O VS Code cuida do ciclo de vida do documento; menos superfície para perda.
- Base testável: render SDD-aware e HTML do webview são funções puras.
- Convive com o editor nativo (prioridade `option`), sem sequestrar arquivos.

**Negativas**

- O `CustomTextEditor` exige script no webview (mensageria). **Mitigação:** CSP com
  `nonce` em `script-src`, script mínimo e inline, coberto por TEST-EDIT-002.
- Substituir o documento inteiro a cada edição afeta granularidade de desfazer e
  posição do cursor. **Mitigação:** aceitável no primeiro incremento; refinar para
  edição incremental (diff) num incremento seguinte, se incomodar.
- O layout livre que o formulário estruturado quer é mais natural num webview panel.
  **Mitigação:** o `CustomTextEditor` também hospeda um webview — o formulário, quando
  vier, cabe na mesma base.

## Limite desta decisão

Cobre a **base de edição do `spec.md`** (Markdown + visão SDD-aware). Não decide o
formulário estruturado (Q3, incremento futuro), o diff de versões, nem a edição dos
documentos produzidos por outras features (research/design/tarefas/evidências/
validação) — que dependem de 0004/0007/0008.
