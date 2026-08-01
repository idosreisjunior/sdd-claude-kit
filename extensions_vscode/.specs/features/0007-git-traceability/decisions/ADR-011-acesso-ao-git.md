# ADR-011 — Acesso ao Git por execução do binário, com parser puro

- **Status:** Aceito
- **Data:** 2026-07-31
- **Origem:** questão Q1 da spec de 0007 — como a extensão lê o estado do Git?
- **Decidido em:** TASK-TRACE-001

---

## Contexto

A feature 0007 (RF-018/RF-014) precisa ler o estado do Git do workspace: branch, arquivos
alterados/não rastreados/em conflito e o diff da mudança. As opções de acesso:

- **Executar o binário `git`** (`status --porcelain=v2 --branch`, `diff --numstat`,
  `rev-parse`) e fazer parsing puro da saída. Formatos `--porcelain`/`--numstat` são estáveis
  e desenhados para máquina. O parsing vira função pura, testável fora do host; a borda apenas
  executa o processo.
- **API da extensão Git nativa do VS Code** (`vscode.extensions.getExtension('vscode.git')`).
  Idiomática e sem spawnar processo, mas a API é tipada de forma frouxa, muda entre versões, e
  a lógica que a consome só é testável com o host do editor — contrária ao padrão núcleo-puro
  que 0005 (Context Guardian) e 0006 (Project Doctor) já seguem.

## Decisão

**Executar o binário `git` e fazer parsing puro da saída.** Uma borda fina (`gitAdapter.ts`)
roda apenas comandos de **leitura** via `node:child_process`, no diretório do workspace, e
devolve a saída crua. O parsing (`gitParse.ts`) e a detecção de escopo (`scopeCheck.ts`) são
**puros** — sem a API do VS Code — e cobertos por testes. Nenhum comando de escrita
(commit/checkout/stage/push) é executado (RF-018, NFR-TRACE-001); nenhum I/O de rede
(ADR-005, NFR-TRACE-004).

## Alternativas consideradas

| Alternativa | Por que não |
| --- | --- |
| API `vscode.git` | Tipagem frouxa e instável entre versões; lógica só testável com o host; contraria o padrão núcleo-puro de 0005/0006 |
| Biblioteca (`simple-git`) | Dependência extra para o que três comandos e um parser resolvem; ainda esconderia o parsing testável |

## Consequências

**Positivas**

- Parsing e detecção puros e testáveis, como o resto da extensão.
- Controle total sobre os comandos — só leitura, formatos estáveis (`--porcelain=v2`,
  `--numstat`).
- Sem dependência nova.

**Negativas**

- Spawnar processo tem custo e depende do `git` no PATH. **Mitigação:** a borda trata
  ausência/erro do `git` como estado indefinido (a extensão já detecta a presença de `.git`);
  degrada para informativo (NFR-TRACE-003).
- Parsing do `porcelain=v2` é detalhado (campos posicionais). **Mitigação:** parser robusto
  que ignora linhas desconhecidas e é coberto por testes.

## Limite desta decisão

Cobre a **leitura** do estado do Git no incremento 1 (adapter + detecção de escopo). Sugestões
de branch/commit (RF-018) e navegação de rastreabilidade (RF-015) são incrementos seguintes e
reusam o mesmo adapter — a decisão de acesso já estará tomada. Escrita no repositório continua
fora de escopo (RF-018).
