# Design técnico: Identidade visual do Cockpit nas telas existentes

- **ID:** 0036-cockpit-ui-redesign
- **Escopo dos identificadores:** COCK
- **Estado:** ver `status.yaml` — a autoridade é ele

---

## 1. Contexto

A camada de design system existe (`themeTokens.ts`, ADR-035) e é consumida por uma única
superfície: o wizard. As outras nove — sidebar, boas-vindas e os sete painéis de webview —
montam HTML por template-string e referenciam `--vscode-*` diretamente. O problema técnico
não é "falta CSS": é que **não há um lugar** onde um componente visual esteja definido uma
vez só, então qualquer consistência entre telas depende de disciplina manual e não
sobrevive à próxima feature.

## 2. Solução proposta

Três movimentos, nesta ordem de dependência:

1. **Fundação** — estender `esbuild.mjs` para empacotar mais de um cliente de webview e
   criar `src/webview/ui/`, a biblioteca de componentes que todos os painéis importam
   (ADR-037). Nada de usuário muda nesta etapa.
2. **Migração painel a painel** — cada superfície troca sua template-string por um cliente
   Preact que compõe os componentes da biblioteca. Uma por vez, com os testes existentes
   como rede (§11).
3. **Sidebar** — a `TreeView` dá lugar a uma `WebviewView` que reimplementa as operações
   que a plataforma dava de graça (ADR-036). É o passo de maior risco e vai por último,
   quando a biblioteca de componentes já estiver exercitada por vários painéis.

A ordem não é arbitrária: colocar a sidebar no fim significa que, se o prazo apertar, o
que fica para trás é o item de maior risco e não a base da qual todo o resto depende.

## 3. Componentes afetados

**Novos**

| Caminho | Papel |
| --- | --- |
| `src/webview/ui/` | Biblioteca de componentes Preact: `Card`, `StatusBadge`, `PanelHeader`, `EmptyState`, `Toolbar`, `StatTile` |
| `src/webview/ui/tokens.ts` | Reexporta `themeTokensCss()` e o CSS base compartilhado por todos os clientes |
| `src/webview/<painel>/` | Um diretório de cliente por painel migrado |
| `src/sdd/sidebarModel.ts` | Núcleo puro do estado da sidebar: lista, seleção, foco, estado de boas-vindas |
| `src/views/sidebarViewProvider.ts` | A `WebviewView` que substitui `FeaturesTreeProvider` |

**Alterados**

| Caminho | Mudança |
| --- | --- |
| `esbuild.mjs` | De um entrypoint para vários; teto de bundle por cliente |
| `boardHtml.ts`, `dashboardHtml.ts`, `projectOverviewHtml.ts`, `historyHtml.ts`, `metricsHtml.ts`, `validationHtml.ts`, `specEditorHtml.ts` | Deixam de montar marcação; passam a emitir só o documento (CSP, nonce, payload) e a carregar o bundle do painel |
| `package.json` | `viewsWelcome` removido (REQ-COCK-005); `views` da sidebar passa a `webviewView` |
| `extension.ts` | Registra o novo provider da sidebar |

**Intocados:** `wizard*` e `src/webview/wizard/*` — a feature 0035 está `IN_PROGRESS` com
sete tarefas abertas, e mexer lá agora produziria conflito. O wizard adota a biblioteca de
componentes numa passagem posterior, depois que a 0035 fechar.

### Derivação das superfícies sem mockup (REQ-COCK-007)

| Superfície | Deriva de | Por quê |
| --- | --- | --- |
| Histórico e decisões | `13-feature-dashboard` | O dashboard já tem o bloco de linha do tempo com entradas datadas; o histórico é esse bloco em tela cheia |
| Métricas | `13-feature-dashboard` | Reusa os *stat tiles* e a barra de progresso do dashboard, que é a única tela aprovada com números agregados |
| Relatório de validação | `12-wizard-8-verify` | A etapa Verificar já apresenta critérios de aceite e comandos de validação nos três estados — é o mesmo conteúdo |
| Editor de spec | `06-wizard-2-spec` | A etapa Especificar já lista requisitos e cenários com a hierarquia que o editor precisa |

## 4. Contratos e interfaces

**Biblioteca de componentes** — assinatura estável que os painéis consomem:

```
Card({ title?, actions?, children })
StatusBadge({ status })              // status do ciclo → cor via statusToken()
PanelHeader({ title, subtitle?, actions? })
EmptyState({ title, description, action? })
Toolbar({ children })
StatTile({ label, value, note? })    // value ausente → renderiza a nota, não "0"
```

**Documento de webview** — cada painel emite o mesmo esqueleto:

```
renderPanelHtml({ payload, nonce, scriptUri }): string
```

`payload` é serializado num `<script type="application/json">` e lido por
`textContent`/`JSON.parse` no cliente — nunca inserido como HTML (NFR-COCK-002).

**Sidebar (ADR-036)** — mensagens webview → extensão:

| Mensagem | Efeito |
| --- | --- |
| `{type:'select', id}` | Marca o item como selecionado; espelha `TreeView.selection` |
| `{type:'invoke', id, command}` | Executa um comando já registrado, com o nó da mudança |
| `{type:'init'}` | Executa a inicialização do SDD (estado de boas-vindas) |

Extensão → webview: `{type:'state', items, selectedId, mode:'list'|'welcome'}`.

## 5. Fluxo de dados

```
.specs/ (fonte de verdade)
   │  leitura robusta (borda)
   ▼
núcleo puro  (sidebarModel, boardModel, dashboardModel, …)
   │  payload serializado
   ▼
renderPanelHtml  ──►  documento com CSP+nonce
   │                        │ carrega
   │                        ▼
   │                  bundle do painel (Preact)
   │                        │ importa
   │                        ▼
   │                  src/webview/ui/  (componentes)
   ▼
postMessage ──► borda ──► comandos existentes ──► .specs/
```

A direção de dependência do `architecture.md` §2 é preservada: `views → core → arquivos`.
Os componentes de `src/webview/ui/` importam **apenas tipos** dos módulos de `src/sdd/` —
um import de valor arrasta `js-yaml` para o bundle, erro já cometido e corrigido na 0035.

## 6. Persistência

Nada de novo é persistido. As superfícies continuam lendo `.specs/` e gravando pelos
mesmos caminhos de hoje (`statusWriter`, `applyTransition`). O estado efêmero de UI
(coluna recolhida, filtro, item selecionado) segue em `vscode.setState` do webview, como
o Board já faz.

## 7. Dependências

Nenhuma dependência nova. `esbuild` e `preact` já estão em `devDependencies` desde a 0035
(ADR-034); esta mudança apenas amplia o alcance de ambas. O `.vsix` não ganha
`node_modules` novos — o bundle é gerado no `prepublish`.

## 8. Segurança

Sem mudança de postura, e a superfície de risco **aumenta em quantidade**: passam a ser
dez documentos de webview em vez de um. Cada um mantém `default-src 'none'`, `style-src` e
`script-src` com nonce, sem acesso a rede, e todo texto vindo de `.specs/` — títulos,
descrições, mensagens de histórico — entra no bloco de dados JSON com `<` neutralizado,
nunca como HTML.

`renderPanelHtml` ser **um único ponto** por onde todos os painéis passam é o que torna
isso verificável: um teste sobre essa função cobre os dez, em vez de dez testes que podem
divergir.

## 9. Observabilidade

O redesenho não introduz operação que possa falhar em silêncio. As falhas possíveis são
de leitura (`.specs/` ausente ou ilegível), já tratadas: viram estado vazio explicativo, e
não exceção. O bundle de cada painel tem teto de tamanho no `esbuild.mjs`, e estourá-lo
falha o build com a causa provável nomeada — o mesmo mecanismo introduzido na 0035.

## 10. Estratégia de testes

| Nível | Cobre |
| --- | --- |
| Unidade (`node --test`) | Núcleo puro novo (`sidebarModel`); `renderPanelHtml` (CSP, nonce, escape do payload); os componentes que tenham lógica (`StatTile` com valor indisponível, `StatusBadge` com status desconhecido) |
| Unidade (guarda) | Um teste que varre os módulos de painel e falha se algum referenciar `--vscode-*` para cor de conteúdo (REQ-COCK-001, SCN-COCK-002) — é o critério de aceite virando teste |
| E2E (`vscode-test`, xvfb na CI) | Sidebar: navegação por teclado, seleção e acionamento de ação por item (SCN-COCK-007/008); nenhum painel abre sozinho (SCN-COCK-011) |
| Revisão humana | Fidelidade visual aos mockups e contraste nos dois temas — vira `gaps` na rastreabilidade, não cobertura aparente |

**Fica de fora, declaradamente:** o DOM renderizado dentro de um webview não é alcançável
pelo host da extensão. Nenhum teste automatizado pode afirmar "a view listou os
requisitos" — limite já registrado na 0035 e que continua valendo aqui.

## 11. Migração e rollback

A migração é **incremental por painel**, e cada painel é um passo completo e reversível:

```
para cada painel P:
  1. criar src/webview/P/ com o cliente Preact usando src/webview/ui/
  2. reduzir PHtml.ts a documento + payload + <script src>
  3. rodar a suíte: os testes de P devem passar SEM alteração de expectativa
  4. se um teste exigir mudança de expectativa → é regressão de comportamento,
     não ajuste de teste. Reverter o passo e investigar.
```

O critério do passo 4 é o que impede a migração de virar reescrita disfarçada: os testes
existentes (225 de unidade, mais os e2e) são o contrato do comportamento atual, e
alterá-los para acomodar a migração destruiria a única rede que temos.

**Rollback:** cada painel migrado é um commit isolado e revertível sem tocar nos demais —
os painéis não dependem uns dos outros, só da biblioteca de componentes. A sidebar
(ADR-036) é o único passo que altera contribuição no `package.json`; reverter exige
restaurar a entrada de `views` junto com o código.

**Ponto sem retorno:** a remoção do `viewsWelcome` e a troca da `TreeView` mudam o
`package.json`. Enquanto não estiverem verificadas, convivem com o código antigo em
branch, não em `main`.

## 12. Riscos

- **Risco:** a sidebar em webview perde acessibilidade que a `TreeView` dava pronta
  (teclado, leitor de tela, seleção). — **Mitigação:** REQ-COCK-006 transforma isso em
  requisito verificável com dois cenários e e2e próprio; a sidebar é o **último** passo,
  então o risco é assumido com a base já estável e pode ser abortado sem perder o resto.
- **Risco:** migrar sete painéis testados introduz regressão silenciosa nas
  funcionalidades do Board (arrastar, filtro, feed, ordenação, colapso). — **Mitigação:**
  a regra do passo 4 (§11): teste que exige mudança de expectativa é regressão, não
  ajuste. O Board migra primeiro, por ser o de maior cobertura.
- **Risco:** dez bundles inflam o `.vsix` e o tempo de build. — **Mitigação:** teto de
  tamanho por bundle no `esbuild.mjs`, falhando o build; componentes compartilhados em
  chunk comum quando o esbuild permitir.
- **Risco:** o layout das quatro superfícies sem mockup ser decidido a esmo. —
  **Mitigação:** a tabela de derivação em §3 nomeia a origem de cada uma antes da
  implementação (REQ-COCK-007).
- **Risco:** conflito com a 0035, que está `IN_PROGRESS` nos mesmos diretórios. —
  **Mitigação:** `wizard*` fora do escopo desta mudança; a adoção da biblioteca pelo
  wizard fica para depois que a 0035 fechar.

## 13. Alternativas consideradas

- **Alternativa:** só trocar o CSS, mantendo template-strings. — **Por que não:** era a
  opção Q2-b, recusada pelo usuário. Tecnicamente atenderia REQ-COCK-001, mas não
  REQ-COCK-002: sem marcação compartilhada, "componente com definição única" fica limitado
  a folha de estilo, e a consistência volta a depender de disciplina.
- **Alternativa:** manter a `TreeView` e redesenhar só o que a API permite. — **Por que
  não:** era a opção Q1-a, recusada. Preservaria a acessibilidade de graça, mas a sidebar
  nunca corresponderia ao mockup `01`.
- **Alternativa:** migrar tudo de uma vez, num único passo. — **Por que não:** perde a
  capacidade de isolar a origem de uma regressão e torna o rollback tudo-ou-nada. O
  incremento por painel custa mais commits e devolve diagnosticabilidade.
- **Alternativa:** um único bundle para todos os painéis. — **Por que não:** todo painel
  carregaria o código de todos os outros; um erro em qualquer um derruba os dez. Um bundle
  por painel isola falha e tamanho.
- **Alternativa:** adotar a biblioteca no wizard já nesta mudança. — **Por que não:** a
  0035 está `IN_PROGRESS` com sete tarefas abertas nos mesmos arquivos.

## 14. Questões fechadas pelo design

| Questão | Decisão | Onde |
| --- | --- | --- |
| Q1 | Sidebar vira `WebviewView`, reimplementando teclado, seleção, ações por item e revelar-item | **ADR-036** |
| Q2 | Os sete painéis migram para esbuild + Preact, estendendo o alcance do ADR-034 | **ADR-037** |
| Q3 | Biblioteca interna em `src/webview/ui/`, com a lista de componentes em §4 | **ADR-037** |
| Q4, Q7 | Boas-vindas como estado da sidebar; `viewsWelcome` removido do `package.json` | §3, ADR-036 |
| Q5 | Nenhuma mudança de comportamento; a regra do passo 4 (§11) é o mecanismo que garante | §11 |
| Q6 | Cada superfície sem mockup tem a origem nomeada | §3, tabela de derivação |

## 15. Questões ainda em aberto

Nenhuma questão bloqueante. Dois pontos ficam deliberadamente para a etapa de tarefas,
por serem de granularidade e não de arquitetura:

- **Ordem exata dos painéis na migração** depois do Board. A regra está dada (do mais
  coberto por teste para o menos), mas a sequência final sai do plano de tarefas.
- **Chunk comum entre bundles.** Se o esbuild permitir compartilhar a biblioteca de
  componentes entre os dez bundles sem complicar o carregamento sob CSP, vale; senão,
  cada bundle carrega sua cópia (poucos KB). Decisão de implementação, medível no build.
