# ADR-002 — Estratégia de detecção do Claude Code

- **Status:** Aceito
- **Data:** 2026-07-31
- **Origem:** Q1 da spec de `0001-project-foundation` — como detectar o Claude Code de forma confiável em Windows, Linux e WSL?
- **Decidido em:** TASK-FOUND-004

---

## Contexto

O diagnóstico do workspace (RF-001, REQ-FOUND-002) precisa saber se o Claude Code
está disponível, para habilitar ações como "Abrir no Claude Code" (RF-011, feature
0004). A detecção tem de valer nos três ambientes suportados (RNF-002): Windows,
Linux e WSL.

As forças em jogo:

- **Segurança (RNF-003, constituição Art. 9).** A extensão deve pedir permissões
  mínimas e não executar comandos sem necessidade. Rodar um shell só para
  descobrir se um binário existe amplia a superfície de risco (injeção de
  argumentos, herança de ambiente, timeouts).

- **Confiabilidade multiplataforma.** O nome do executável muda: `claude` com bit
  de execução no POSIX; `claude.exe`/`claude.cmd` (shim do npm) resolvido por
  `PATHEXT` no Windows.

- **Testabilidade (standards §6).** A decisão precisa ser exercitável fora do host
  do editor, sem depender do que está instalado na máquina de quem roda o teste.

- **WSL.** Quando o host da extensão roda dentro do WSL (Remote-WSL), o `PATH`
  já é o do Linux e enxerga a instalação do WSL. Quando se abre uma pasta do WSL
  como caminho UNC do Windows (sem Remote-WSL), o host é o Windows e só enxerga o
  `PATH` do Windows — que pode não ter o Claude Code instalado no WSL.

O que torna a decisão difícil: a forma "óbvia" (rodar `which`/`where`) executa um
processo e ainda assim só enxerga o `PATH` do host — mesmo alcance de uma varredura,
com mais risco.

## Decisão

**Detectar o Claude Code varrendo o `PATH` do ambiente do host em busca de um
executável `claude`, sem executar nenhum processo.** Em concreto:

1. Se `sddClaudeKit.claudeCode.path` estiver configurado e apontar para um
   executável, usar esse caminho (precedência sobre o `PATH`).
2. Senão, dividir a variável `PATH` (`;` no Windows, `:` no POSIX) e, para cada
   diretório, procurar os nomes candidatos:
   - POSIX: `claude` (com bit de execução);
   - Windows: `claude` + cada extensão de `PATHEXT` (`.EXE`, `.CMD`, …).
3. A verificação de "é executável" usa `fs.access(path, X_OK)` — leitura do
   sistema de arquivos, **sem spawnar shell**.
4. A detecção **nunca lança nem trava**: qualquer erro de acesso é tratado como
   "não encontrado".

A lógica de decisão fica em `src/sdd/claudeCode.ts`, pura e sem a API do VS Code,
recebendo `platform`, `PATH`, `PATHEXT`, o caminho configurado e um probe
injetável — o que a torna testável nos três perfis de plataforma.

## Alternativas consideradas

| Alternativa | Por que não |
| --- | --- |
| Executar `which claude` / `where claude` | Executa um processo (superfície de risco, quoting, timeout) e enxerga o mesmo `PATH` da varredura — mais custo, mesmo alcance. Contraria a preferência por não executar comandos (Art. 9) |
| Sondar caminhos de instalação fixos (`~/.local/bin`, npm global, Homebrew…) | Frágil entre métodos de instalação (npm, instalador nativo, nvm, brew) e versões; envelhece mal |
| Exigir que o usuário configure o caminho sempre | Piora a experiência no caso comum, em que o binário está no `PATH`. Mantido apenas como override opcional |
| Usar a integração de shell/terminal do VS Code para capturar a saída | Captura de stdout do terminal é instável e assíncrona; não é contrato confiável |

## Consequências

**Positivas**

- Sem execução de processo: menor superfície de risco e sem timeouts (Art. 9, RNF-003).
- Determinístico e testável: a lógica pura é exercida com `platform`/`PATH`/probe
  injetados, cobrindo Windows e POSIX sem depender da máquina.
- Cobre os nomes reais por plataforma (`PATHEXT` no Windows, bit de execução no POSIX).
- Override explícito via `sddClaudeKit.claudeCode.path` para instalações fora do `PATH`.

**Negativas**

- A detecção reflete o `PATH` do **host da extensão**. Abrir uma pasta do WSL como
  caminho UNC do Windows (sem Remote-WSL) pode não enxergar um Claude Code
  instalado só no WSL. **Mitigação:** documentar o uso de Remote-WSL como caminho
  recomendado e oferecer o override `sddClaudeKit.claudeCode.path`; cabe ao usuário.
- `fs.access(X_OK)` no Windows não distingue executável de arquivo comum (o bit não
  existe). **Mitigação:** os nomes candidatos já são restritos a `claude` + `PATHEXT`,
  então um `claude.txt` qualquer no `PATH` não seria considerado.

## Limite desta decisão

Esta decisão cobre **detectar a presença** do Claude Code, não **como executar
ações** nele (montar/copiar prompt, abrir no terminal) — isso é a feature 0004
(RF-011). Também não valida a **versão** do Claude Code encontrado; se um dia uma
versão mínima passar a importar, será uma nova decisão.
