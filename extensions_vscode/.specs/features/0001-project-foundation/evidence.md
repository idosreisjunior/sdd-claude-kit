# Evidências — Fundação do projeto e inicialização (0001)

Verificação no **Extension Development Host** (F5), exigida pela Definição de Pronto
(constitution Art. 10) para o que não é executável fora do editor: ativação, render
da Activity Bar, indicador na status bar, comando de inicialização e o watcher.
Fecha TASK-FOUND-002, -005 e -006 (e registra o gate -008).

> Como coletar: abrir `extensions_vscode/` no VS Code e pressionar **F5**
> ("Executar extensão"). Na janela *Extension Development Host*, seguir os passos e
> registrar (✅/❌ + observação).

**Ambiente:** Windows 11 + WSL (Ubuntu); VS Code — Extension Development Host (F5).
**Data:** 2026-07-31

---

## Bloco A — projeto já inicializado (abrir `extensions_vscode/`)

### H1 — SCN-FOUND-001 · Ativação e Activity Bar
**Passos:** observar a Activity Bar após a janela abrir.
**Esperado:** aparece o container **SDD Claude Kit** com as seções **Projeto** e
**Features**.
**Resultado:** ✅ confirmado.

### H2 — SCN-FOUND-002 · Projeto reconhecido como inicializado
**Passos:** abrir a seção **Projeto**.
**Esperado:** o projeto é tratado como inicializado; a seção lista os documentos de
`.specs/project` (vision, constitution, context, architecture, glossary, standards).
**Resultado:** ✅ confirmado.

### H3 — SCN-FOUND-006 · Indicador de contexto na status bar
**Passos:** olhar a status bar (canto inferior direito).
**Esperado:** exibe `SDD Context: — / 200k` (teto de `sddClaudeKit.context.maxTokens`,
valor usado como `—` até a feature 0005).
**Resultado:** ✅ confirmado.

---

## Bloco B — projeto não inicializado (abrir uma pasta vazia nova)

### H4 — SCN-FOUND-003 · Oferece "Inicializar" e oculta o indicador
**Passos:** File → Open Folder numa pasta vazia; abrir a seção **Projeto**.
**Esperado:** a seção mostra a ação/tela de boas-vindas **Inicializar SDD**; o
indicador de contexto na status bar fica **oculto**.
**Resultado:** ✅ confirmado.

### H5 — SCN-FOUND-004 · Inicializar com prévia
**Passos:** Paleta (Ctrl+Shift+P) → **SDD: Inicializar projeto**.
**Esperado:** um modal lista os arquivos que serão criados (`.specs/config.yaml`,
`index.yaml`, os 6 docs de projeto); após **Criar**, a estrutura `.specs` é criada e
nenhum arquivo de código existente é alterado.
**Resultado:** ✅ confirmado.

### H6 — FOUND-006 · Watcher atualiza sem reload
**Passos:** logo após H5, observar a seção Projeto/Features **sem** recarregar a
janela. (Opcional: apagar `.specs/config.yaml` e observar a volta da tela de
boas-vindas.)
**Esperado:** a tela de boas-vindas some e as seções passam a refletir o projeto
inicializado **sem reload**; apagar `config.yaml` reverte para "Inicializar".
**Resultado:** ✅ confirmado.

### H7 — SCN-FOUND-005 · Recusar sobrescrita
**Passos:** Paleta → **SDD: Inicializar projeto** de novo (projeto já inicializado).
**Esperado:** mensagem "já está inicializado"; nenhum arquivo é sobrescrito.
**Resultado:** ✅ confirmado.

---

## Gate de build — TASK-FOUND-008 (não depende do host)

`npm install` feito; `npm run compile`, `npm run lint` e `npm test` executados.

**Resultado (2026-07-31):** ✅ `compile` exit 0 · `lint` exit 0 · `test` 34/34
(a suíte inclui os testes da fundação: detection 5, claudeCode 7, initTemplates 4).
Critério de aceite "compile e lint passam após install" satisfeito.

---

## Conclusão

**H1–H7 ✅ (2026-07-31), sem divergência.** SCN-FOUND-001..006 confirmados no host:
ativação e Activity Bar, projeto reconhecido, indicador de contexto, tela de
boas-vindas, inicialização com prévia sem tocar em código, watcher sem reload e
recusa de sobrescrita. Com o gate FOUND-008 (build) verde, TASK-FOUND-002, -005,
-006 e -008 estão concluídas — 10/10 tarefas, todos os critérios de aceite
verificados. A feature caminhou para VERIFIED e está aprovada (ver `status.yaml`).
