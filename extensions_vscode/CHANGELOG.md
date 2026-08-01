# Changelog

Todas as mudanças relevantes desta extensão são registradas aqui.

O formato segue [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/) e o projeto adota
[Versionamento Semântico](https://semver.org/lang/pt-BR/).

## [0.1.0] — 2026-08-01

Primeira versão publicada — consolida o desenvolvimento das iterações `0.0.1`–`0.0.7`, todas
internas. O próprio desenvolvimento foi organizado com o método SDD, em `.specs/`; cada
recurso abaixo tem uma feature rastreável (`00NN`) e ADRs para as decisões arquiteturais.

### Adicionado

**Estrutura e interface (Épicos 1–3)**

- Ativação da extensão e **Activity Bar SDD** (feature 0001).
- Painel **Projeto** — resumo vivo em webview: saúde estrutural (Project Doctor), contexto
  (Context Guardian) e contadores de mudanças por status; documentos de projeto acessíveis
  (feature 0013, ADR-010).
- Painel **Features** — mudanças de `.specs/index.yaml` agrupadas por status, com progresso
  de tarefas (feature 0002).
- Comando **"Inicializar projeto"** — cria a estrutura `.specs/` com prévia e confirmação,
  sem sobrescrever (feature 0001).
- Comando **"Nova feature"** — formulário determinístico de criação de mudança (feature 0002).
- **Dashboard da feature** — cartões de progresso, requisitos, cenários, tarefas e testes;
  abre ao clicar numa feature (feature 0003).
- **Editor de spec** visual para `spec.md`, como editor padrão (feature 0012, ADR-006).
- **Welcome views** clicáveis nos painéis (Inicializar SDD / Nova feature).

**Claude Code e contexto (Épicos 4–5)**

- Comando **"Abrir no Claude Code"** — compõe o prompt do fluxo SDD, copia e abre o terminal
  com a CLI detectada, sem enviar (feature 0004, ADR-002/ADR-007).
- Comando **"Medir contexto"** e indicador na status bar — **Context Guardian**: estima tokens
  por heurística local, classifica por faixas (feature 0005, ADR-008).

**Diagnóstico (Épico 6)**

- Comando **"Diagnosticar projeto"** — **Project Doctor**: valida a estrutura e publica os
  problemas no painel Problems (feature 0006, ADR-009).

**Git e rastreabilidade (Épico 7)**

- Comando **"Verificar escopo (Git)"** — compara os arquivos alterados com os previstos e
  alerta sobre não previstos, sensíveis, remoções, limite de diff e dependências novas
  (feature 0007, ADR-011).
- Comando **"Navegar rastreabilidade"** — requisito → cenário/tarefa/arquivo/teste, abrindo
  o artefato (feature 0007).
- Comando **"Sugerir commit (Git)"** — sugere nome de branch e mensagem, sem nunca commitar
  (feature 0007).

**Evidências e validação (Épico 8)**

- Comando **"Validar mudança"** — classifica cada requisito (atendido / parcial / não testado /
  não atendido / não aplicável) num webview (feature 0008, ADR-012).
- Comando **"Coletar evidências"** — reúne validação, git, commits e progresso num
  `evidence.md`, sem sobrescrever conteúdo humano e sem executar comandos (feature 0008).

**Métricas (Épico 9)**

- Comando **"Métricas da feature"** — métricas locais (tarefas, % validado, testes, arquivos,
  duração, contexto estimado) num webview com delta vs. a medição anterior; exporta MD/JSON.
  Local, sem telemetria (feature 0009, ADR-013).

**Publicação (Épico 10)**

- Preparação para o Marketplace: metadados no `package.json`, `.vscodeignore` enxuto, `README`
  como página de descrição, workflow de publicação (Marketplace + Open VSX, em GitHub Release,
  protegido por segredos) e ícone placeholder (feature 0010).

**Configurações**

- `sddClaudeKit.context.*` (teto e faixas do contexto), `sddClaudeKit.scope.*` (arquivos
  sensíveis, limites, manifestos), `sddClaudeKit.metrics.enabled` (coleta local desativável),
  `sddClaudeKit.metrics.telemetry` (desligada por padrão), `sddClaudeKit.claudeCode.path`.

### Alterado

- Clicar numa feature no painel Features abre o **dashboard visual** (antes abria o `spec.md`
  em texto); o editor visual de spec passou a ser o padrão ao abrir um `spec.md`.
- Ícone da Activity Bar: documento de especificação com uma faísca de IA (monocromático).

### Corrigido

- Painel **Projeto** (webview) renderizava sem estilo — a CSP `default-src 'none'` bloqueava as
  variáveis de tema do VS Code num `WebviewView`. Correção: liberar `webview.cspSource` no
  `style-src`, mantendo o nonce (feature 0013).
- **Título com aspas** quebrava o `status.yaml` gerado pelo formulário — escape com `yamlDquote`
  ao escrever o YAML, preservando o texto cru no Markdown (bug 0011).
- Lint do repositório raiz relintava o subprojeto da extensão; o root passa a ignorar
  `extensions_vscode/**` (a extensão tem lint e CI próprios).

### Privacidade

- Sem telemetria obrigatória; métricas locais (por-workspace) e desativáveis; nenhum I/O de
  rede na extensão (RNF-004, ADR-005).

---

> Histórico anterior: as versões `0.0.1`–`0.0.7` foram iterações de desenvolvimento não
> publicadas, consolidadas na entrada acima. O detalhe por feature vive em `.specs/`.
