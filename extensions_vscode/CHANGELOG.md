# Changelog

Todas as mudanças relevantes desta extensão são registradas aqui.

O formato segue [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/) e o projeto adota
[Versionamento Semântico](https://semver.org/lang/pt-BR/).

## [0.2.6] — 2026-08-04

Busca e filtros no Painel SDD.

### Adicionado

- **Barra de busca e filtros** no Painel SDD: uma **busca** filtra os cartões por id ou título
  (case-insensitive) e **chips de tipo** (feature/bug/refactor/change) filtram por tipo — tudo ao
  vivo. O overview mostra "N exibidas" quando há filtro, e a barra (e o foco da busca) permanecem nas
  atualizações em tempo real. Busca acessível (`aria-label`) e chips com estado (`aria-pressed`)
  (feature 0028, ADR-026).

---

## [0.2.5] — 2026-08-04

Integridade da escrita do Painel SDD (correções da revisão do 0026).

### Corrigido

- A transição por arrastar agora escreve os arquivos com mais cuidado: **preserva o fim de linha**
  (LF/CRLF) e um eventual **comentário inline** na linha `status:`; só grava quando `status:` e
  `history:` existem (sem transição parcial); a escrita é **all-or-nothing** entre `status.yaml` e
  `index.yaml` (se a do índice falhar, o `status.yaml` é restaurado); e soltar um cartão na **própria
  coluna** do estado atual não dispara transição (bug 0027).

---

## [0.2.4] — 2026-08-04

Painel SDD interativo.

### Adicionado

- **Arrastar-para-transicionar** no Painel SDD: arraste um cartão entre as colunas do kanban para
  **transicionar o estado** da mudança. A extensão valida contra a máquina de estados (só transições
  válidas; quando a coluna admite mais de um estado, você escolhe), pede um **motivo** e escreve o
  `status.yaml` (nova entrada de histórico + status) e o `index.yaml`, **preservando** comentários e
  formatação dos arquivos. O board atualiza na hora (feature 0026, ADR-025).

---

## [0.2.3] — 2026-08-04

Painel visual com cara de sistema.

### Adicionado

- **Painel SDD (Kanban + Overview ao vivo)** — o comando **"SDD: Painel (Kanban)"** (botão no topo
  dos painéis Projeto/Features, ou pela paleta) abre um quadro das mudanças em colunas por status
  SDD, com **overview** (total de mudanças e % concluídas) e barra de progresso das tarefas em cada
  cartão. **Atualiza em tempo real** conforme os `.specs` mudam. Um botão **"Tarefas"** em cada
  cartão mostra o kanban das tarefas daquela mudança (pendente/em progresso/concluída). Clicar num
  cartão abre o dashboard. Este incremento é **somente leitura** — arrastar cartões para transicionar
  o estado vem depois (feature 0025, ADR-024).

---

## [0.2.2] — 2026-08-03

Descoberta dos recursos. Nenhum comando novo nem mudança de comportamento — os comandos que já
existiam ficam **visíveis** sem depender do clique-direito.

### Adicionado

- Seção **"Ações"** no dashboard da feature: botões para os comandos da mudança (Research,
  Clarificar, Gerar design, Tarefas, Histórico, Novo ADR, Validar, Coletar evidências, Métricas,
  Git, Abrir no Claude Code, Medir contexto, GitHub, MCP, Editar spec), agrupados por seção. Cada
  botão dispara o comando via `command:` URI **sobre aquela mudança** — sem scripts no webview, com
  a CSP preservada e os `command:` URIs restritos por allowlist (feature 0024, ADR-023).

### Alterado

- Menu de contexto de uma feature reorganizado no submenu **"SDD: Ações"**, agrupado por seção
  (Fluxo, Decisões e histórico, Validação, Git, Claude Code e integrações) — antes eram 16 itens
  soltos. Todos os comandos preservados (feature 0024).

### Interno

- Camada de **testes de integração (E2E)** no Extension Development Host real, sob `xvfb` no CI
  (feature 0023, ADR-022). Complementa a suíte unitária; não afeta o pacote publicado (só
  `devDependencies`).

---

## [0.2.1] — 2026-08-03

Correção de documentação. Nenhuma mudança de comportamento, comando ou configuração.

### Corrigido

- A tabela de **Comandos** do `README` (página do Marketplace) parava na feature 0009 e não
  listava os comandos acrescentados na `0.2.0`. Passa a incluir os dez comandos restantes —
  "Gerar design" (0014), "Clarificar" (0015), "Histórico" e "Novo ADR" (0016), "Research" (0017),
  "Tarefas" (0018), "SQL Guard" (0020), "GitHub" (0021) e "MCP" (0022) — cobrindo os 24 comandos
  do `package.json` (REQ-PUB-002).

---

## [0.2.0] — 2026-08-02

Segunda iteração de recursos, materializando o backlog **pós-MVP** do PRD (Fases 2 e 3). Cada
recurso abaixo tem uma feature rastreável (`00NN`) em `.specs/` e um ADR para a decisão
arquitetural. Todos os acréscimos são compatíveis com a `0.1.0` — nenhuma configuração ou comando
existente mudou de comportamento.

### Adicionado

**Fluxo assistido — passos híbridos (Fase 2)**

Cada comando abaixo, no item da feature, gera um arquivo-esqueleto na pasta da mudança e oferece
**delegar a elaboração ao Claude Code** (prompt copiado e pronto no terminal, sem enviar; sem a CLI,
copia e orienta). Nada é sobrescrito sem confirmação.

- Comando **"Research"** — esqueleto `research.md` com as oito frentes de pesquisa, antes da spec
  (feature 0017, ADR-017).
- Comando **"Clarificar"** — esqueleto `clarifications.md` com as categorias de ambiguidade; exige
  uma spec com requisitos (feature 0015, ADR-015).
- Comando **"Gerar design"** — esqueleto `design.md` a partir da spec **aprovada** (feature 0014,
  ADR-014).

**Análise e histórico (Fase 2)**

- Comando **"Tarefas"** — analisa o `tasks.md` e publica no painel Problems as tarefas grandes (G) e
  os campos obrigatórios ausentes; oferece gerar/refinar com o Claude Code (feature 0018, ADR-018).
- Comando **"Histórico"** — linha do tempo da mudança em webview: transições de estado, ADRs e
  commits relacionados (feature 0016, ADR-016).
- Comando **"Novo ADR"** — cria um ADR numerado na pasta da mudança, a partir do template (feature 0016).

**Integrações e guardas (Fase 3)**

- Comando **"SQL Guard"** — no editor SQL, analisa o script por heurística e marca no painel Problems
  riscos como `DELETE`/`UPDATE`/`TRUNCATE` sem `WHERE`, varredura completa e divisão por zero; sem
  rede, sem executar SQL (feature 0020, ADR-019).
- Comando **"GitHub"** — monta a descrição da feature (requisitos + validação + evidências) e cria
  **issue ou Pull Request** via `gh`, só sob confirmação; sem `gh`, informa a pré-condição e não
  publica; a extensão não abre rede própria (feature 0021, ADR-020).
- Comando **"MCP"** — assistente de criação de servidor MCP: gera um `mcp.md` com os nove aspectos do
  RF-025 (objetivo, ferramentas, recursos, schemas, autenticação, permissões, testes, documentação,
  publicação) e oferece delegar a definição ao Claude Code (feature 0022, ADR-021).

### Corrigido

- Template de `tasks.md` sem o campo **"Evidências necessárias"** — o gerador de tarefas passa a
  incluí-lo, alinhando o template aos campos exigidos pelo RF-010 (bug 0019).

### Privacidade

- Sem mudança na postura: nenhum I/O de rede na extensão. A criação de issue/PR (0021) roda pelo
  `gh` local; a delegação ao Claude Code passa pela CLI local — a extensão não faz chamadas próprias.

---

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
