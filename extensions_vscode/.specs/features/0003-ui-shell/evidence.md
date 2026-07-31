# Evidências — Dashboard da feature (0003, incremento RF-005)

Verificação no **Extension Development Host** (F5), exigida pela Definição de Pronto
(constitution Art. 10) para o que não é executável fora do editor: abrir o webview,
render dos dados, e a ação no painel. TASK-UI-006 (fecha UI-004 e UI-005).

> Como coletar: abrir `extensions_vscode/` no VS Code e pressionar **F5**
> ("Executar extensão"). Na janela *Extension Development Host*, seguir os passos e
> registrar (✅/❌ + observação). O código já compila e passa nos testes (42/42).

**Ambiente:** _(preencher: SO, versão do VS Code, WSL sim/não)_
**Data:** _(preencher)_

---

## D1 — SCN-UI-001 · Abrir o dashboard

**Passos:** abrir `extensions_vscode/` no host → painel **Features** → passar o
mouse sobre uma feature (ex.: 0002) e clicar no ícone **dashboard** (ação inline),
ou botão direito → **SDD: Abrir dashboard**.

**Esperado:** abre um painel (webview) com o dashboard da feature.

**Resultado:** _(pendente)_

## D2 — SCN-UI-002 · Conteúdo correto

**Passos:** observar o dashboard da 0002.

**Esperado:** cabeçalho (id · tipo · status VERIFIED), objetivo, progresso `9/9`,
contagens (requisitos, cenários, critérios, tarefas, testes, arquivos), e o
histórico de transições — batendo com os artefatos.

**Resultado:** _(pendente)_

## D3 — SCN-UI-001 · Reuso do painel

**Passos:** com o dashboard da 0002 aberto, acionar "Abrir dashboard" na 0002 de novo.

**Esperado:** o painel existente é revelado (não abre um segundo painel).

**Resultado:** _(pendente)_

## D4 — REQ-UI-003 · Campos pendentes

**Passos:** observar a seção "Ainda não disponível".

**Esperado:** tokens/tempo (feature 0005), commits (0007), evidências, validação
(0008) aparecem como pendentes, sem quebrar o dashboard.

**Resultado:** _(pendente)_

## D5 — SCN-UI-003 · Robustez

**Passos:** abrir o dashboard de uma feature sem `traceability.yaml` (ex.: uma
recém-criada pelo formulário) — ou a 0001, que tem todos os artefatos.

**Esperado:** o dashboard mostra o que há e marca as contagens sem fonte como
indisponíveis; não fica em branco nem lança erro.

**Resultado:** _(pendente)_

---

## Conclusão

_(preencher após D1–D5: SCN-UI-001/002/003 confirmados no host? Se tudo passar,
UI-004/005/006 → done e a feature caminha para VERIFIED. Se algo falhar, abrir a
correção como tarefa e manter a feature em IN_PROGRESS.)_
