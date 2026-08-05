# Tarefas — Identidade visual do Cockpit nas telas existentes

Complexidade: **P** pequena (≤ meio dia) · **M** média (≈ 1 dia) · **G** grande
(deve ser dividida antes de começar).

---

## Ordem de execução

```
FUNDAÇÃO (a base de que tudo depende)
  TASK-COCK-001 (esbuild multi-entrypoint) [OK] ─► TASK-COCK-002 (renderPanelHtml + tokens) [OK]
                                                      │
                                                      ▼
                                              TASK-COCK-003 (biblioteca de componentes) [OK]
  TASK-COCK-004 (teste-guarda de tokens) [OK] ─► TASK-COCK-005 (tokens em TODOS os painéis) [OK]
                                                      │
        ┌─────────────────────────────────────────────┴──────────────┐
        ▼                                                            ▼
MIGRAÇÃO DOS PAINÉIS (paralelizáveis entre si)              TRILHA DA SIDEBAR
  TASK-COCK-006 (Board: casca e colunas)                    TASK-COCK-015 (sidebarModel)
     ├─► TASK-COCK-007 (Board: interações)                        │
     └─► TASK-COCK-008 (Board: feed)                              │
  TASK-COCK-009 (dashboard) ──────────────────────────────────────┤
  TASK-COCK-010 (visão do projeto)                                ▼
  TASK-COCK-011 (histórico)                          TASK-COCK-016 (WebviewView)
  TASK-COCK-012 (métricas)                                  ├─► TASK-COCK-017 (teclado/ações)
  TASK-COCK-013 (validação)                                 └─► TASK-COCK-018 (boas-vindas)
  TASK-COCK-014 (editor de spec)                                  │
        │                                                         │
        └──────────────────► TASK-COCK-019 (contraste) ◄──────────┘
                                     │
                                     ▼
                             TASK-COCK-020 (não-regressão final)

Caminho crítico: 001 → 002 → 003 → 009 → 016 → 017 → 019 → 020
```

A sidebar depende de `TASK-COCK-009` de propósito: o design (§2) manda exercitar a
biblioteca de componentes em painéis reais **antes** de encarar o passo de maior risco.

---

## TASK-COCK-001 — esbuild com um bundle por painel

**Requisitos:** REQ-COCK-002
**Dependências:** —
**Complexidade:** M
**Status:** done

### Descrição

Estender `esbuild.mjs` de um entrypoint (o wizard) para um bundle por superfície, cada um
com teto de tamanho próprio que falha o build quando estourado. O teto existente de 60 kB
do wizard permanece; os novos nascem com o seu. Nenhuma superfície muda de aparência
nesta tarefa — é só a capacidade de build (ADR-037).

### Arquivos prováveis

- `esbuild.mjs`
- `package.json` (scripts, se necessário)

### Testes esperados

- Nenhum. É configuração de build, verificada pelo próprio `compile` e exercitada pelas
  tarefas seguintes, que não compilam sem ela.

### Critério de conclusão

- `npm run compile` gera um bundle por entrypoint declarado.
- Um bundle acima do seu teto falha o build com a causa provável nomeada.
- O bundle do wizard continua sendo gerado e dentro do teto.

### Evidências necessárias

- Log do build listando os bundles e seus tamanhos.

---

## TASK-COCK-002 — renderPanelHtml: documento único com CSP, nonce e payload

**Requisitos:** REQ-COCK-001, NFR-COCK-002
**Dependências:** TASK-COCK-001
**Complexidade:** M
**Status:** done

### Descrição

Criar a função única que emite o documento de qualquer painel: `default-src 'none'`,
`style-src`/`script-src` com nonce, o bloco de tokens `--sdd-*` e o payload como
`<script type="application/json">` com `<` neutralizado. Criar `src/webview/ui/tokens.ts`
reexportando `themeTokensCss()` mais o CSS base compartilhado.

Ser um ponto único é o que torna a segurança verificável: um teste cobre as dez
superfícies em vez de dez testes que podem divergir (design §8).

### Arquivos prováveis

- `src/sdd/panelHtml.ts`
- `src/webview/ui/tokens.ts`
- `src/test/panelHtml.test.ts`

### Testes esperados

- TEST-COCK-002

### Critério de conclusão

- O documento aplica CSP com nonce em `style` e `script`.
- Texto de artefato com `</script>` no conteúdo não fecha a tag nem aparece cru.
- O bloco de tokens `--sdd-*` está presente no documento.
- TEST-COCK-002 passa.

### Evidências necessárias

- Saída do teste TEST-COCK-002.

---

## TASK-COCK-003 — Biblioteca de componentes em src/webview/ui/

**Requisitos:** REQ-COCK-002, NFR-COCK-001, NFR-COCK-004
**Dependências:** TASK-COCK-002
**Complexidade:** M
**Status:** done

### Descrição

Implementar `Card`, `StatusBadge`, `PanelHeader`, `EmptyState`, `Toolbar` e `StatTile`
com as assinaturas do design §4. Os componentes importam de `src/sdd/` **apenas tipos** —
um import de valor arrasta o `js-yaml` para o bundle (erro cometido e corrigido na 0035).
Rótulos acessíveis e operação por teclado fazem parte do componente, não de quem o usa.

### Arquivos prováveis

- `src/webview/ui/Card.tsx`, `StatusBadge.tsx`, `PanelHeader.tsx`, `EmptyState.tsx`,
  `Toolbar.tsx`, `StatTile.tsx`
- `src/test/uiComponents.test.ts`

### Testes esperados

- TEST-COCK-003, TEST-COCK-004

### Critério de conclusão

- `StatTile` sem valor disponível renderiza a nota explicativa, nunca `0`.
- `StatusBadge` com status desconhecido cai no token de rascunho, sem quebrar.
- Nenhum import de componente arrasta dependência pesada para o bundle, VERIFICADO por
  medição: um bundle de prova com os seis componentes fica em ~20 kB e não contém js-yaml.
  (O critério original dizia "nenhum componente importa valor de `src/sdd/`". Era estrito
  demais e proibia o próprio padrão da tarefa: `uiModel` existe para ser lógica pura
  compartilhada, e importá-lo é seguro porque ele só depende de `themeTokens`, que não
  importa nada. A regra real é sobre o que a importação ARRASTA, não sobre de onde vem.)
- TEST-COCK-003 e TEST-COCK-004 passam.

### Evidências necessárias

- Saída dos testes; tamanho do bundle antes e depois.

---

## TASK-COCK-004 — Teste-guarda: nenhuma cor de conteúdo fora dos tokens

**Requisitos:** REQ-COCK-001
**Dependências:** —
**Complexidade:** P
**Status:** done

### Descrição

Escrever o teste que varre os módulos de HTML de painel e falha se algum referenciar
`--vscode-*` para cor de conteúdo ou fixar hex fora da camada de marca declarada em
`themeTokens.ts`. É o critério de aceite de REQ-COCK-001 virando verificação automática.

Escrito **antes** da TASK-COCK-005 de propósito: ele começa falhando e define quando ela
está pronta.

### Arquivos prováveis

- `src/test/tokenGuard.test.ts`

### Testes esperados

- TEST-COCK-001

### Critério de conclusão

- O teste falha no estado atual do repositório, nomeando os módulos infratores.
- A lista de exceções permitidas (camada de marca) é explícita e justificada no teste.

### Evidências necessárias

- Saída do teste falhando, com a lista dos módulos.

---

## TASK-COCK-005 — Tokens --sdd-* em todos os painéis

**Requisitos:** REQ-COCK-001
**Dependências:** TASK-COCK-004
**Complexidade:** M
**Status:** done

### Descrição

Aplicar a camada de tokens nos sete módulos de painel, **sem** mudar layout. Vem antes das
migrações por decisão do design (§12): assim a divergência que resta durante a migração é
de layout e não de cor, e a mistura visual não piora mais do que o necessário.

### Arquivos prováveis

- `src/sdd/boardHtml.ts`, `dashboardHtml.ts`, `projectOverviewHtml.ts`, `historyHtml.ts`,
  `metricsHtml.ts`, `validationHtml.ts`, `specEditorHtml.ts`

### Testes esperados

- TEST-COCK-001 (o guarda da tarefa anterior passa a verde)

### Critério de conclusão

- TEST-COCK-001 passa.
- A suíte existente passa sem alteração de expectativa (design §11).
- Nenhum layout mudou — só cor, borda e superfície.

### Evidências necessárias

- Saída de TEST-COCK-001 e da suíte; capturas antes/depois de um painel.

---

## TASK-COCK-006 — Board: casca e colunas em Preact

**Requisitos:** REQ-COCK-003, REQ-COCK-002
**Dependências:** TASK-COCK-003, TASK-COCK-005
**Complexidade:** M
**Status:** pending

### Descrição

Migrar a estrutura do Painel SDD para um cliente Preact seguindo o mockup
`03-board-kanban`: cabeçalho, colunas e cartões de mudança, compostos com `PanelHeader`,
`Card` e `StatusBadge`. `boardHtml.ts` deixa de montar marcação e passa a emitir só o
documento via `renderPanelHtml`.

O Board vai primeiro entre os painéis por ser o mais coberto por teste — é onde a rede é
mais densa (design §11).

### Arquivos prováveis

- `src/webview/board/`, `src/sdd/boardHtml.ts`

### Testes esperados

- TEST-COCK-010

### Critério de conclusão

- O Board renderiza colunas e cartões pelo cliente Preact, no visual do mockup.
- A suíte existente do Board passa **sem alteração de expectativa**; um teste que exija
  mudança é regressão e obriga a reverter o passo (design §11).
- TEST-COCK-010 passa.

### Evidências necessárias

- Captura do Board; saída da suíte; diff mostrando a redução de `boardHtml.ts`.

---

## TASK-COCK-007 — Board: interações preservadas

**Requisitos:** REQ-COCK-003, NFR-COCK-003
**Dependências:** TASK-COCK-006
**Complexidade:** M
**Status:** pending

### Descrição

Reconectar no cliente Preact as interações já entregues: arrastar para transicionar
(0026), filtro e busca (0028), ordenação (0030), ordem das colunas (0033) e recolhimento
(0034). O comportamento é o de hoje — só o suporte muda.

### Arquivos prováveis

- `src/webview/board/`, `src/sdd/boardPanel.ts`

### Testes esperados

- TEST-COCK-010

### Critério de conclusão

- Arrastar, filtrar, buscar, ordenar, reordenar e recolher continuam funcionando como
  antes, verificado contra os testes das features de origem.
- Nenhum teste existente teve expectativa alterada.
- SCN-COCK-004 satisfeito.

### Evidências necessárias

- Saída da suíte completa; captura com filtro aplicado e coluna recolhida.

---

## TASK-COCK-008 — Board: feed de atividade

**Requisitos:** REQ-COCK-003, NFR-COCK-003
**Dependências:** TASK-COCK-006
**Complexidade:** M
**Status:** pending

### Descrição

Migrar o feed de atividade (0029) com o seu filtro e a paginação (0031) para o cliente
Preact, usando `Card` e `EmptyState`.

### Arquivos prováveis

- `src/webview/board/`, `src/sdd/boardHtml.ts`

### Testes esperados

- TEST-COCK-010

### Critério de conclusão

- O feed lista, filtra e pagina como antes; sem atividade, mostra o estado vazio do design
  system.
- Nenhum teste existente teve expectativa alterada.

### Evidências necessárias

- Saída da suíte; captura do feed com filtro e do estado vazio.

---

## TASK-COCK-009 — Dashboard de feature conforme o mockup 13

**Requisitos:** REQ-COCK-004, REQ-COCK-002
**Dependências:** TASK-COCK-003, TASK-COCK-005
**Complexidade:** M
**Status:** pending

### Descrição

Migrar o dashboard para Preact seguindo `13-feature-dashboard`: objetivo, progresso,
contagens em `StatTile`, bloqueios e linha do tempo do histórico. Campo indisponível
mostra a nota explicativa, não um zero enganoso.

### Arquivos prováveis

- `src/webview/dashboard/`, `src/sdd/dashboardHtml.ts`

### Testes esperados

- TEST-COCK-003, TEST-COCK-010

### Critério de conclusão

- O dashboard corresponde ao mockup 13.
- Mudança sem `traceability.yaml` mostra os campos indisponíveis com a nota e não
  apresenta erro (SCN-COCK-005).
- Nenhum teste existente teve expectativa alterada.

### Evidências necessárias

- Captura do dashboard, inclusive com contagem indisponível; saída da suíte.

---

## TASK-COCK-010 — Visão do projeto

**Requisitos:** REQ-COCK-001, REQ-COCK-002
**Dependências:** TASK-COCK-003, TASK-COCK-005
**Complexidade:** M
**Status:** pending

### Descrição

Migrar o painel Projeto (saúde, contexto, contadores) para Preact com os componentes
compartilhados, alinhando-o ao bloco correspondente do mockup `01-sidebar-cockpit`.

### Arquivos prováveis

- `src/webview/project/`, `src/sdd/projectOverviewHtml.ts`

### Testes esperados

- TEST-COCK-010

### Critério de conclusão

- O painel usa os componentes compartilhados; nenhum teste existente teve expectativa
  alterada.

### Evidências necessárias

- Captura do painel; saída da suíte.

---

## TASK-COCK-011 — Histórico e decisões, derivado do mockup 13

**Requisitos:** REQ-COCK-007, REQ-COCK-002
**Dependências:** TASK-COCK-003, TASK-COCK-005
**Complexidade:** P
**Status:** pending

### Descrição

Migrar o painel de histórico usando o bloco de linha do tempo do `13-feature-dashboard`
em tela cheia — a derivação declarada no design §3. Registrar a origem no próprio módulo.

### Arquivos prováveis

- `src/webview/history/`, `src/sdd/historyHtml.ts`

### Testes esperados

- TEST-COCK-010

### Critério de conclusão

- A origem do layout (`13-feature-dashboard`) está declarada no módulo (REQ-COCK-007).
- Nenhum teste existente teve expectativa alterada.

### Evidências necessárias

- Captura; saída da suíte.

---

## TASK-COCK-012 — Métricas, derivado do mockup 13

**Requisitos:** REQ-COCK-007, REQ-COCK-002
**Dependências:** TASK-COCK-003, TASK-COCK-005
**Complexidade:** P
**Status:** pending

### Descrição

Migrar o painel de métricas reusando os `StatTile` e a barra de progresso do
`13-feature-dashboard` — a única tela aprovada com números agregados (design §3).

### Arquivos prováveis

- `src/webview/metrics/`, `src/sdd/metricsHtml.ts`

### Testes esperados

- TEST-COCK-003, TEST-COCK-010

### Critério de conclusão

- A origem do layout está declarada no módulo (REQ-COCK-007).
- Métrica indisponível mostra a nota, não `0`.
- Nenhum teste existente teve expectativa alterada.

### Evidências necessárias

- Captura; saída da suíte.

---

## TASK-COCK-013 — Relatório de validação, derivado do mockup 12

**Requisitos:** REQ-COCK-007, REQ-COCK-002
**Dependências:** TASK-COCK-003, TASK-COCK-005
**Complexidade:** P
**Status:** pending

### Descrição

Migrar o relatório de validação a partir de `12-wizard-8-verify`, que já apresenta
critérios de aceite e comandos de validação nos três estados — é o mesmo conteúdo em outra
superfície (design §3). Os três estados (não configurada, executada sem efeito, aprovada)
continuam distinguíveis.

### Arquivos prováveis

- `src/webview/validation/`, `src/sdd/validationHtml.ts`

### Testes esperados

- TEST-COCK-010

### Critério de conclusão

- A origem do layout está declarada no módulo (REQ-COCK-007).
- Os três estados de validação continuam visualmente distintos.
- Nenhum teste existente teve expectativa alterada.

### Evidências necessárias

- Captura dos três estados; saída da suíte.

---

## TASK-COCK-014 — Editor de spec, derivado do mockup 06

**Requisitos:** REQ-COCK-007, REQ-COCK-002
**Dependências:** TASK-COCK-003, TASK-COCK-005
**Complexidade:** M
**Status:** pending

### Descrição

Migrar o editor de spec a partir de `06-wizard-2-spec`, que já lista requisitos e cenários
com a hierarquia necessária (design §3). É um `CustomTextEditor`, e não um painel comum —
o ciclo de edição e sincronização com o documento precisa continuar intacto.

### Arquivos prováveis

- `src/webview/specEditor/`, `src/sdd/specEditorHtml.ts`, `src/sdd/specEditor.ts`

### Testes esperados

- TEST-COCK-010

### Critério de conclusão

- A origem do layout está declarada no módulo (REQ-COCK-007).
- Editar pelo editor visual continua sincronizando com o documento como antes.
- Nenhum teste existente teve expectativa alterada.

### Evidências necessárias

- Captura; saída da suíte; demonstração de edição sincronizada.

---

## TASK-COCK-015 — sidebarModel: estado puro da sidebar

**Requisitos:** REQ-COCK-006, REQ-COCK-005
**Dependências:** —
**Complexidade:** M
**Status:** pending

### Descrição

Núcleo puro, sem a API do VS Code: lista de mudanças, item selecionado, item em foco e
modo (`list` quando há `.specs/`, `welcome` quando não há). É o que hoje não existe —
o estado da sidebar vive dentro do `TreeDataProvider` e não é testável isoladamente.

### Arquivos prováveis

- `src/sdd/sidebarModel.ts`, `src/test/sidebarModel.test.ts`

### Testes esperados

- TEST-COCK-005, TEST-COCK-006

### Critério de conclusão

- Move o foco item a item, respeitando os limites da lista.
- Projeto sem `.specs/` produz modo `welcome`; com `.specs/`, modo `list`.
- Nenhuma dependência da API do VS Code; TEST-COCK-005 e TEST-COCK-006 passam.

### Evidências necessárias

- Saída dos testes.

---

## TASK-COCK-016 — Sidebar como WebviewView

**Requisitos:** REQ-COCK-006
**Dependências:** TASK-COCK-015, TASK-COCK-003, TASK-COCK-009
**Complexidade:** M
**Status:** pending

### Descrição

Substituir a `TreeView` por uma `WebviewView` que implementa o mockup
`01-sidebar-cockpit` (ADR-036): cartões por mudança, badge de status, progresso.
`package.json` troca a contribuição de `view` de árvore para `webviewView`. As ações
continuam sendo **os mesmos comandos já registrados** — só o gatilho muda.

Depende de TASK-COCK-009 de propósito: a biblioteca precisa estar exercitada em painéis
reais antes do passo de maior risco (design §2).

### Arquivos prováveis

- `src/views/sidebarViewProvider.ts`, `src/webview/sidebar/`, `src/extension.ts`,
  `package.json`

### Testes esperados

- TEST-COCK-010

### Critério de conclusão

- A sidebar renderiza pelo webview seguindo o mockup 01.
- Acionar uma ação de um item executa o mesmo comando de antes, com o mesmo efeito.
- Nenhum teste existente teve expectativa alterada.

### Evidências necessárias

- Captura da sidebar; saída da suíte.

---

## TASK-COCK-017 — Teclado, seleção e ações por item na sidebar

**Requisitos:** REQ-COCK-006, NFR-COCK-004
**Dependências:** TASK-COCK-016
**Complexidade:** M
**Status:** pending

### Descrição

Reimplementar o que a `TreeView` dava pronto e a `WebviewView` não dá: foco visível
caminhando item a item pelo teclado, seleção, acionamento da ação padrão sem mouse,
rótulos para leitor de tela e o equivalente ao `reveal()` (rolar até o item alvo).

É o principal ponto de regressão da mudança (ADR-036, NFR-COCK-004) — daí ter tarefa e
e2e próprios em vez de ser conferido junto com o resto.

### Arquivos prováveis

- `src/webview/sidebar/`, `src/sdd/sidebarModel.ts`
- `src/e2e/sidebarKeyboard.test.ts`

### Testes esperados

- TEST-COCK-007, TEST-COCK-008

### Critério de conclusão

- SCN-COCK-007: o foco caminha item a item de forma visível e a ação padrão é acionável
  sem mouse.
- SCN-COCK-008: as mesmas ações de hoje são oferecidas e produzem o mesmo efeito.
- TEST-COCK-007 e TEST-COCK-008 passam na CI.

### Evidências necessárias

- Saída dos e2e; registro da navegação por teclado.

---

## TASK-COCK-018 — Boas-vindas como estado da sidebar

**Requisitos:** REQ-COCK-005, NFR-COCK-003
**Dependências:** TASK-COCK-016
**Complexidade:** M
**Status:** pending

### Descrição

Implementar o modo `welcome` da sidebar seguindo `02-welcome-onboarding`, e **remover** o
`viewsWelcome` do `package.json`. Nada abre automaticamente no editor — foi a decisão Q7,
que reconciliou Q4 com Q5.

### Arquivos prováveis

- `src/webview/sidebar/`, `package.json`
- `src/e2e/welcome.test.ts`

### Testes esperados

- TEST-COCK-009

### Critério de conclusão

- SCN-COCK-006: projeto sem `.specs/` mostra as boas-vindas na sidebar, e a ação executa
  o mesmo comando de inicialização de hoje.
- SCN-COCK-010: projeto já inicializado mostra a lista, não as boas-vindas.
- SCN-COCK-011: nenhum painel abre sozinho na ativação; TEST-COCK-009 passa.
- `viewsWelcome` removido do `package.json`.

### Evidências necessárias

- Capturas dos dois estados; saída do e2e; diff do `package.json`.

---

## TASK-COCK-019 — Contraste e legibilidade nos dois temas

**Requisitos:** NFR-COCK-001, NFR-COCK-004
**Dependências:** TASK-COCK-007, TASK-COCK-008, TASK-COCK-010, TASK-COCK-011,
TASK-COCK-012, TASK-COCK-013, TASK-COCK-014, TASK-COCK-017, TASK-COCK-018
**Complexidade:** P
**Status:** pending

### Descrição

Conferir todas as superfícies redesenhadas em tema claro e escuro, ajustando os tokens
onde o contraste não bastar. A camada de marca (violeta/coral) é acento e não pode
prejudicar a leitura em nenhum dos dois.

### Arquivos prováveis

- `src/sdd/themeTokens.ts`, `src/webview/ui/`

### Testes esperados

- Nenhum automatizado. Contraste e fidelidade visual só se verificam por revisão humana —
  registrado como `gaps` na rastreabilidade em vez de virar cobertura aparente.

### Critério de conclusão

- Cada superfície tem captura nos dois temas.
- Nenhum texto fica ilegível sobre a sua superfície em nenhum dos dois.

### Evidências necessárias

- Capturas de todas as superfícies nos temas claro e escuro.

---

## TASK-COCK-020 — Verificação de não-regressão

**Requisitos:** NFR-COCK-003
**Dependências:** TASK-COCK-019
**Complexidade:** P
**Status:** pending

### Descrição

Fechar a mudança confirmando o que ela promete não ter quebrado: suíte completa de
unidade, e2e na CI sob xvfb, e conferência de que nenhum teste teve expectativa alterada
ao longo das migrações — a regra do design §11.

### Arquivos prováveis

- Nenhum de produção; possíveis ajustes finais.

### Testes esperados

- TEST-COCK-010

### Critério de conclusão

- Suíte de unidade e e2e verdes na CI.
- O diff completo da branch não mostra nenhuma expectativa de teste existente alterada.
- Os tamanhos de bundle estão dentro dos tetos.

### Evidências necessárias

- Saída da CI; diff dos arquivos de teste demonstrando que nada foi afrouxado.

---

## Resumo

| Complexidade | Quantidade |
| --- | --- |
| P | 6 |
| M | 14 |
| G | 0 |

Total: 20 tarefas · 5 concluídas · 15 pendentes.

**Caminho crítico:** TASK-COCK-001 → TASK-COCK-002 → TASK-COCK-003 → TASK-COCK-009 →
TASK-COCK-016 → TASK-COCK-017 → TASK-COCK-019 → TASK-COCK-020

**Bloqueios ativos:** Nenhum.

**Paralelizáveis agora:** as sete migrações de painel (TASK-COCK-006, 009, 010, 011, 012,
013, 014) e a TASK-COCK-015 (sidebarModel) — a fundação está pronta.
