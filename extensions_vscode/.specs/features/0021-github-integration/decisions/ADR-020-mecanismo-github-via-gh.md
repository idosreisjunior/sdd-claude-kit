# ADR-020 — Integração com GitHub via `gh` CLI (shell-out), sob confirmação

- **Status:** Aceito
- **Data:** 2026-08-02
- **Origem:** questão **Q1** (mecanismo, arquitetural) e as questões de design **Q4** (detecção) e
  **Q5** (gatilho) da spec de 0021-github-integration.
- **Decidido em:** TASK-GH-001

---

## Contexto

O RF-019 exige que a extensão fale com o GitHub (criar issue/PR). A extensão **nunca fez rede
própria**: ela *shell-out* para o `git` (0007, ADR-011) e detecta/usa a CLI do Claude Code (0004,
ADR-002). Introduzir comunicação com o GitHub é uma decisão de arquitetura — três caminhos:

- **`gh` CLI** (shell-out): a extensão executa `gh`, que já resolve autenticação, host, e a API.
  Sem rede própria, sem gerenciar token, sem dependência npm. Exige `gh` instalado/autenticado.
- **REST API** (`fetch`/octokit): a extensão fala HTTP, gerencia token e paginação. Rede +
  dependência + segredo a guardar.
- **Sessão de autenticação do VS Code** (`vscode.authentication.getSession('github')`) + REST:
  reusa a auth do editor, mas ainda faz HTTP e introduz o padrão de rede na extensão.

Publicar issue/PR é **outward-facing** (constituição Art. 9): nada sai sem confirmação explícita.

## Decisão

**Q1 — `gh` CLI (shell-out).** A extensão comunica-se com o GitHub **executando o `gh`**, no mesmo
padrão do adapter de Git (0007/ADR-011) e da detecção do Claude Code (0004/ADR-002). A extensão
**não fala HTTP** (NFR-GH-002), **não** gerencia token/segredo (o `gh` cuida da auth), e **não**
adiciona dependência. A criação é *fire-and-forget* + humano no controle: só publica sob
confirmação explícita e devolve o link (NFR-GH-001).

**Q4 — Detecção reusando o padrão do 0004.** A pré-condição é detectada reusando o padrão de
detecção da CLI (0004/`claudeCode.ts`): `gh` presente no PATH. Autenticação e remoto GitHub são
verificados de forma tolerante — a borda tenta a operação e, em falha (`gh` ausente, não
autenticado, sem remoto GitHub), informa a pré-condição faltante e **não publica** (SCN-GH-004), em
vez de reimplementar toda a checagem.

**Q5 — Comando no item da feature.** O gatilho é uma ação **"GitHub"** no item da feature (painel
Features), como as demais ações — a issue/PR é criada **a partir da feature** (título, requisitos,
evidências).

## Alternativas consideradas

| Alternativa | Por que não |
| --- | --- |
| **REST API** (fetch/octokit) | Introduz rede própria, uma dependência e o gerenciamento de token/segredo — tudo o que a extensão evitou até aqui; o `gh` já resolve auth e host |
| **Sessão de auth do VS Code + REST** | Reusa a auth do editor, mas ainda faz HTTP e traz o padrão de rede; o `gh` mantém a extensão sem rede, coerente com 0007 |
| **Q4: reimplementar a checagem de auth/remoto** | Duplicaria o que o `gh` já reporta; tentar-e-reportar é mais simples e robusto (mensagens do próprio `gh`) |
| **Q5: comando na paleta apenas** | A ação é "da feature" (usa spec/evidências); o item da feature é o lugar natural, como as demais ações |

## Consequências

**Positivas**

- Mantém a extensão **sem rede própria** e sem segredo a guardar — coerente com 0007/0004.
- Reusa a experiência de auth do `gh` (o usuário já autentica uma vez).
- Núcleo "gerar descrição" fica puro e testável; só a execução do `gh` é borda.

**Negativas**

- **Depende do `gh` instalado/autenticado.** **Mitigação:** detecção + mensagem de pré-condição
  (SCN-GH-004), como o 0004 faz com o Claude Code; o `gh` é comum no público-alvo.
- **Erros do `gh` são texto** (não estruturados). **Mitigação:** a borda reporta a saída do `gh` e o
  link em sucesso; não infere estado além disso.
- Publicar é irreversível-ish (issue/PR criados). **Mitigação:** só sob confirmação explícita
  (Art. 9), com a descrição revisável antes.

## Limite desta decisão

Decide **o mecanismo** (`gh` CLI), **a detecção** (padrão do 0004 + tentar-e-reportar) e **o gatilho**
(item da feature). **Não** define o formato exato do corpo (D-Q3/TASK-GH-002), **não** implementa as
demais operações do RF-019 (associar issue, branch, acompanhar revisão, importar comentários,
atualizar status), e **não** atualiza o `status.yaml` ao criar (D-Q6).
