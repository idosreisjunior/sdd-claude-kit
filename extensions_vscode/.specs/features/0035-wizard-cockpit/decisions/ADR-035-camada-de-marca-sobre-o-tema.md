# ADR-035 — Camada de marca (tokens --sdd-*) derivada do tema do VS Code

- **Status:** Aceito
- **Data:** 2026-08-05
- **Origem:** design da feature 0035-wizard-cockpit.
- **Decidido em:** design (implementação em TASK-WIZ-*).

---

## Contexto

O redesenho pede uma identidade visual profissional (violeta como marca, coral para as
ações "com o Claude Code") sem quebrar a aderência ao tema do VS Code, que hoje é total
(todas as cores vêm de `--vscode-*`). Cores fixas quebrariam o tema claro e a
personalização do usuário; abandonar o acento de marca devolveria a interface crua atual.

## Decisão

**Uma camada de tokens `--sdd-*` gerada a partir de `--vscode-*`, com o acento de marca
por cima.**

- Um módulo puro `themeTokens.ts` emite o CSS dos tokens (`--sdd-surface`, `--sdd-border`,
  `--sdd-text`, `--sdd-accent`, `--sdd-ai`, cores de status do ciclo de vida, …), cada um
  **derivado** de uma variável `--vscode-*` (ex.: `--sdd-surface: var(--vscode-editorWidget-background)`).
- O **acento de marca** (gradientes violeta e coral) é aplicado como camada de destaque —
  botões primários, stepper, cabeçalhos — como cor própria, não substituindo o tema do
  conteúdo. Verificado para contraste em tema claro e escuro (NFR-WIZ-002).
- Os mockups em `docs/ui-redesign/` (dark-first) e o `STYLE-CONTRACT.md` são a referência;
  a tabela de mapeamento token→`--vscode-*` já está lá.

## Alternativas consideradas

| Alternativa | Por que não |
| --- | --- |
| **Cores fixas (paleta dark hardcoded)** | Quebra o tema claro e a personalização; contraria a aderência total já adotada |
| **Só `--vscode-*`, sem acento de marca** | Devolve a interface crua e sem hierarquia — é o problema que a feature resolve |
| **Tema/telas exclusivas para dark** | Exclui usuários de tema claro; não é aceitável para uma extensão de marketplace |

## Consequências

**Positivas**

- Identidade visual consistente e profissional que respeita claro/escuro e a
  personalização; camada de tokens centralizada e testável.

**Negativas**

- O acento de marca precisa de contraste conferido nos dois temas.
  **Mitigação:** validação de contraste no polimento (Q2); tokens de status com
  fallback legível.
- Mais uma camada de CSS a manter. **Mitigação:** um único módulo `themeTokens.ts`,
  puro e coberto por teste.

## Limite desta decisão

Decide **a estratégia de cor** (tokens `--sdd-*` derivados + acento de marca). **Não**
decide a stack (ADR-034) nem a natureza da superfície (ADR-033); não redesenha o Board e
a sidebar nesta feature (Q3 — iteração seguinte).
