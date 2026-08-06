# ADR-036 — Sidebar como WebviewView, no lugar da TreeView

- **Status:** Aceito
- **Data:** 2026-08-05
- **Origem:** design da feature 0036-cockpit-ui-redesign. Formaliza a decisão Q1.
- **Decidido em:** clarify (escolha do usuário) · formalizado no design.

---

## Contexto

O mockup `01-sidebar-cockpit` descreve uma sidebar com hierarquia visual própria: cartões
por mudança, badge de status colorido pelo ciclo de vida, barra de progresso e
agrupamento com densidade controlada.

A sidebar atual é uma `TreeView` (`FeaturesTreeProvider`). **A API de `TreeView` do VS
Code não expõe estilização por CSS** — um `TreeItem` aceita `label`, `description`,
`iconPath` (com `ThemeIcon` e `ThemeColor`), `tooltip` e `contextValue`, e nada além
disso. Não é uma limitação da nossa implementação: é o contrato da plataforma. Não existe
caminho que faça a `TreeView` corresponder ao mockup.

Em contrapartida, a `TreeView` entrega de graça um conjunto de comportamentos que os
usuários esperam de uma árvore e que são caros de reproduzir: navegação por teclado com
foco visível, seleção (simples e múltipla), menu de contexto por item ligado a
`contextValue`, `reveal()` para trazer um item à vista, e integração com leitores de tela.

A escolha, portanto, é entre **fidelidade visual** e **comportamento gratuito e correto**.

## Decisão

**Substituir a `TreeView` da sidebar por uma `WebviewView`**, implementando o mockup `01`,
e **reimplementar explicitamente** as operações que a plataforma dava prontas.

- A contribuição em `package.json` passa de `view` de árvore para `webviewView`.
- `src/views/sidebarViewProvider.ts` hospeda a superfície; `src/sdd/sidebarModel.ts`
  concentra o estado (lista, item selecionado, item em foco, modo `list` | `welcome`) como
  núcleo puro, sem a API do VS Code.
- As operações reimplementadas são **requisito verificável**, não intenção:
  REQ-COCK-006 com SCN-COCK-007 (teclado) e SCN-COCK-008 (ações por item), cobertas por
  e2e no host real.
- As ações por item continuam sendo **os mesmos comandos já registrados**. O webview envia
  `{type:'invoke', id, command}` e a borda executa o comando existente com o nó da
  mudança — nenhuma lógica de ação é reescrita, só o gatilho.
- O estado de boas-vindas (projeto sem `.specs/`) passa a ser um **modo desta mesma
  superfície**, o que permite remover o `viewsWelcome` em markdown do `package.json`
  (Q4/Q7) sem que nada abra sozinho no editor.
- A sidebar é o **último** passo da migração (design §2), depois de a biblioteca de
  componentes já ter sido exercitada por vários painéis.

## Alternativas consideradas

| Alternativa | Por que não |
| --- | --- |
| **Manter a `TreeView` e redesenhar só o que a API permite** (ícones próprios, `ThemeColor` por status, descrições) | Preserva acessibilidade e comportamento de graça, e custa quase nada — mas a sidebar jamais corresponderia ao mockup `01`. Recusada pelo usuário em Q1, com a consequência explicitada |
| **Híbrido: árvore nativa para features + webview para a visão do projeto** | Metade da sidebar com identidade e metade sem é exatamente o defeito que esta feature existe para corrigir |
| **`TreeItem` com `ThemeIcon` codificando o status** | Comunica status, mas não dá hierarquia, progresso nem densidade; continua sem corresponder ao mockup |
| **Manter as duas superfícies e deixar o usuário escolher** | Dobra a superfície a manter e testar, para uma decisão que o usuário não pediu para tomar |

## Consequências

**Positivas**

- A sidebar — a superfície mais vista da extensão — passa a ter a identidade do Cockpit.
- Boas-vindas deixam de ser markdown não estilizável e viram um estado da própria sidebar.
- O estado da sidebar vira núcleo puro testável (`sidebarModel`), o que hoje não é.

**Negativas**

- **Acessibilidade deixa de ser garantida pela plataforma.** Teclado, foco, seleção e
  leitor de tela passam a ser responsabilidade nossa, e é aqui que uma regressão é mais
  provável e menos visível. **Mitigação:** REQ-COCK-006 torna isso verificável; e2e
  específico; a sidebar vai por último, então pode ser abortada sem perder o resto da
  mudança.
- **`reveal()` some.** Trazer um item à vista programaticamente passa a exigir
  implementação própria (rolar até o item, focá-lo). **Mitigação:** o `sidebarModel`
  carrega o item alvo no estado, e o cliente rola até ele.
- **Menu de contexto nativo por item some.** O menu do VS Code ligado a `contextValue` não
  existe em webview. **Mitigação:** as ações passam a ser botões no cartão do item — mais
  descobríveis, na verdade, mas diferentes do que o usuário conhece hoje.
- Perde-se a consistência com as demais árvores do VS Code, que o usuário reconhece.

## Limite desta decisão

Decide **a superfície da sidebar** e a responsabilidade que vem junto. **Não** decide a
stack do cliente (ADR-037), **não** altera os comandos existentes nem o que eles fazem, e
**não** muda a navegação entre as superfícies da extensão.
