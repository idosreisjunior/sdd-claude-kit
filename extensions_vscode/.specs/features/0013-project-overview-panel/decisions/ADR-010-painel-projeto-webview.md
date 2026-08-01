# ADR-010 — Painel Projeto como WebviewView

- **Status:** Aceito
- **Data:** 2026-07-31
- **Origem:** questão Q1 da spec de 0013 — o resumo rico cabe no TreeView atual ou exige um webview?
- **Decidido em:** TASK-PROJ-001

---

## Contexto

O RF-005/REQ-PROJ-005 pede que o painel `Projeto` deixe de ser uma lista de links e passe a
apresentar um resumo vivo do projeto — saúde estrutural (Doctor), uso de contexto (Guardian) e
contadores de mudanças por status — em **layout visual** com cartões e barras. A view
`sddProject` é hoje um `TreeDataProvider` (`projectTreeProvider.ts`) que devolve cinco nós de
link.

As superfícies possíveis para o resumo:

- **TreeView** (`TreeDataProvider`): idiomático e barato, mas o vocabulário visual é rótulo +
  `description` + ícone por nó. Não há cartão, barra proporcional nem agrupamento visual — o
  layout rico do REQ-PROJ-005 (barra de contexto sobre o teto, cartões distintos) não é
  expressável sem forçar a metáfora de árvore.
- **WebviewView** (`WebviewViewProvider`): HTML/CSS livre dentro da Activity Bar. Permite os
  cartões e a barra, ao custo de um modelo de segurança explícito (CSP, nonce, escape) e de
  um provider que projeta dados no HTML — exatamente o que o dashboard da feature (0005/0003,
  ADR-005) já faz.

O ADR-009 (Project Doctor) rejeitou webview para a **lista de problemas** — pesada e sem
navegação por arquivo. Aquela decisão é sobre uma lista navegável; esta é sobre um **resumo
visual agregado**, onde o layout livre é justamente o valor.

## Decisão

**Renderizar o painel `Projeto` como `WebviewView`.** A view `sddProject` passa de
`TreeDataProvider` para `WebviewViewProvider`. O provider:

- coleta as entradas já disponíveis (último resultado do Doctor mantido em memória, última
  medição do Context Guardian via `lastUsage`, `index.yaml`, presença dos documentos);
- monta um **modelo puro** (`projectOverview.ts`, sem API do VS Code) e **renderiza um HTML
  puro** (`projectOverviewHtml.ts`), à semelhança de `dashboardModel.ts`/`dashboardHtml.ts`;
- segue o modelo de segurança do dashboard (ADR-005): **CSP com nonce, sem acesso de rede,
  `localResourceRoots` restrito, e todo texto escapado** antes de ir ao HTML;
- usa script apenas para o mínimo de interação — acionar comandos da extensão (rodar o Doctor,
  abrir um documento, medir contexto) via `postMessage` → `vscode.commands`.

O núcleo (modelo + render) é puro e testável fora do host; o provider é uma borda fina.

## Alternativas consideradas

| Alternativa | Por que não |
| --- | --- |
| Manter `TreeView` com nós ricos | Não expressa cartões nem a barra proporcional do REQ-PROJ-005; forçaria a metáfora de árvore para dados que não são hierárquicos |
| Painel misto (TreeView + status bar) | É o estado atual, cuja pobreza motivou a feature; dispersa o resumo em superfícies separadas |
| Abrir o resumo num `WebviewPanel` (aba do editor) | Tira o resumo da Activity Bar, onde ele precisa estar sempre à mão; o dashboard por feature já ocupa a aba do editor |

## Consequências

**Positivas**

- Layout livre: cartões, barra de contexto proporcional e agrupamento visual dos contadores.
- Reusa o padrão núcleo-puro + borda-fina e o modelo de segurança já provados no dashboard.
- O resumo vive na Activity Bar, sempre visível ao abrir a extensão.

**Negativas**

- Um `WebviewView` custa mais que um `TreeView` (HTML, ciclo de vida, mensagens). **Mitigação:**
  render sob demanda e a partir de dados já em memória (NFR-PROJ-003), sem varredura ao abrir.
- Introduz script no painel (antes não havia). **Mitigação:** CSP com nonce, escopo mínimo
  (apenas disparar comandos), sem rede, texto escapado (NFR-PROJ-004).
- Os `viewsWelcome` de `sddProject` (projeto não inicializado) precisam continuar válidos com a
  view como webview. **Mitigação:** verificar o comportamento na TASK-PROJ-005.

## Limite desta decisão

Cobre a **superfície** do painel Projeto (0013). Não redefine o dashboard por feature (0005),
que permanece um `WebviewPanel` na aba do editor, nem a superfície do Doctor (ADR-009), que
permanece o painel Problems — o painel Projeto apenas **resume** a contagem e oferece o atalho.
