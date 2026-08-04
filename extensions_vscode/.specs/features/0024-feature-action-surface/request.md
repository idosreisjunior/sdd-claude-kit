# Solicitação original

- **ID:** 0024-feature-action-surface
- **Tipo:** feature
- **Criada em:** 2026-08-03
- **Origem:** /sdd-kit:new

---

## Texto da solicitação

> O visual da extensão está simples e parece que os recursos novos não aparecem. Melhorar a
> visibilidade dos recursos (design, clarify, research, tarefas, histórico, ADR, GitHub, MCP) em
> duas frentes: botões no dashboard da feature e reorganização do menu de contexto.

## Interpretação

Na 0.2.x, os nove recursos pós-MVP (0014–0022) foram todos adicionados como **ações no menu de
clique-direito** de uma mudança no painel Features (grupos `sdd@9`…`sdd@16`) e na paleta. **Nenhum
elemento novo foi acrescentado aos painéis**, então a UI "parece a mesma" da 0.1.0 — os recursos
existem, mas ficam escondidos. Além disso, o clique-direito virou uma lista plana de 16 ações.

Esta mudança melhora a **descoberta** em duas frentes, sem adicionar comandos novos:

1. Uma seção **"Ações"** no **dashboard da feature**, com botões que disparam os comandos da mudança
   — os recursos passam a estar à vista, sem depender do clique-direito.
2. As ações do **menu de contexto** reorganizadas num **submenu "SDD: Ações"** agrupado.

## O que esta mudança entrega

- Botões de ação no dashboard (via `command:` URIs), agindo sobre a mudança do dashboard.
- Submenu "SDD: Ações" no menu de contexto da feature, com as ações agrupadas por seção.

## O que esta mudança deliberadamente não entrega

- **Novos comandos ou mudança de comportamento** — apenas expõe os comandos que já existem.
- **Scripts no webview** — o dashboard continua sem JavaScript; a interação usa `command:` URIs.

## Restrições conhecidas

- Segurança do webview (ADR-005): sem scripts, CSP com nonce; os `command:` URIs restritos à lista
  de comandos da extensão (`enableCommandUris` com allowlist), não a qualquer comando do VS Code.
- Sem rede (RNF-004); compatibilidade Windows/Linux/WSL (RNF-002).
