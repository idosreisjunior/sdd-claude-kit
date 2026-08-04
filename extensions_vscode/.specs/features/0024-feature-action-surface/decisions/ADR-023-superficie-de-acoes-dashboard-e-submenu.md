# ADR-023 — Ações no dashboard via command: URIs + submenu no menu de contexto

- **Status:** Aceito
- **Data:** 2026-08-03
- **Origem:** questão **Q3** (mecanismo do submenu, forma dos botões, agrupamento) da spec de
  0024-feature-action-surface.
- **Decidido em:** TASK-DASH-001

---

## Contexto

Os recursos da mudança (research, clarify, design, tarefas, histórico, ADR, validação, git, Claude
Code, GitHub, MCP) só apareciam no menu de contexto e na paleta. Duas frentes de descoberta:

- **Dashboard.** É um webview **sem scripts** (ADR-005, CSP `default-src 'none'`). Para um botão
  disparar um comando sem JavaScript, o VS Code oferece `command:` URIs em links, habilitados por
  `enableCommandUris`. O desafio: o comando precisa saber **sobre qual mudança** agir.
- **Menu de contexto.** Eram 16 itens soltos no clique-direito (grupos `sdd@1`…`sdd@16`).

## Decisão

**Dashboard — botões por `command:` URI com nó sintético.** Cada botão é uma âncora
`<a href="command:sddClaudeKit.<ação>?<args>">`, onde `args` é `encodeURIComponent(JSON.stringify([
{ kind: 'feature', change } ]))`. Esse objeto é **o mesmo formato do item da árvore** que todos os
handlers já resolvem via `featureChangeOf(node)` — então **nenhum handler muda**: o botão age sobre
a mudança do dashboard. A montagem (`actionHref`, lista de ações) é núcleo puro em `dashboardHtml.ts`
(testável). O webview habilita `enableCommandUris` com a **allowlist** dos comandos da extensão
(`FEATURE_ACTION_COMMANDS`), não `true` — só os comandos SDD podem ser disparados dali. Continua sem
scripts e com a CSP + nonce.

**Menu de contexto — submenu "SDD: Ações".** A contribuição `submenus` do package.json declara
`sddClaudeKit.featureActions` (rótulo "SDD: Ações"); o `view/item/context` passa a referenciá-lo
(`{ "submenu": … }`), e os 16 comandos migram para `menus["sddClaudeKit.featureActions"]` com grupos
(`fluxo`, `historia`, `validacao`, `git`, `claude`) que geram separadores. As ações inline
(dashboard, editar spec) seguem inline.

## Alternativas consideradas

| Alternativa | Por que não |
| --- | --- |
| **Habilitar scripts no webview + postMessage** | Fura o ADR-005 (webview sem scripts); mais superfície de segurança para um ganho que os `command:` URIs já dão |
| **`enableCommandUris: true`** (qualquer comando) | Abre a porta para disparar qualquer comando do VS Code a partir do HTML; a allowlist restringe ao necessário |
| **Alterar os 15 handlers para aceitar um id string** | Blast radius grande; o nó sintético `{ kind, change }` reusa o resolvedor existente sem tocar em handler |
| **Manter a lista plana no menu de contexto** | 16 itens soltos são difíceis de navegar; o submenu agrupa sem perder nenhuma ação |

## Consequências

**Positivas**

- Os recursos ficam **visíveis** no dashboard; o clique-direito fica organizado. Resolve o "não
  aparecem".
- Nenhum handler muda; núcleo de montagem puro e testado; webview segue sem scripts.
- Os `command:` URIs restritos por allowlist limitam a superfície.

**Negativas**

- O clique de fato num `command:` URI e a renderização do submenu são **integração com o host** — não
  cobertos por teste unitário (só a montagem pura é). **Mitigação:** revisão manual + a paridade de
  comandos (E2E TEST-E2E-002) garante que os comandos existem.
- O argumento vai serializado no href (inclui o `change`); é pequeno (5 campos) e URI-encodado.

## Limite desta decisão

Decide **o mecanismo dos botões** (command: URIs + nó sintético + allowlist) e **do submenu**
(contribuição `submenus`). **Não** adiciona comandos, **não** habilita scripts e **não** redesenha os
painéis além do submenu.
