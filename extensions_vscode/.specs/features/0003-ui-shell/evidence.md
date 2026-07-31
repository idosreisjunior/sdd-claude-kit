# Evidências — Dashboard da feature (0003, incremento RF-005)

Verificação no **Extension Development Host** (F5), exigida pela Definição de Pronto
(constitution Art. 10) para o que não é executável fora do editor: abrir o webview,
render dos dados, e a ação no painel. TASK-UI-006 (fecha UI-004 e UI-005).

> Como coletar: abrir `extensions_vscode/` no VS Code e pressionar **F5**
> ("Executar extensão"). Na janela *Extension Development Host*, seguir os passos e
> registrar (✅/❌ + observação). O código já compila e passa nos testes (42/42).

**Ambiente:** Windows 11 + WSL (Ubuntu); VS Code — Extension Development Host (F5).
**Data:** 2026-07-31

---

## D1 — SCN-UI-001 · Abrir o dashboard

**Passos:** abrir `extensions_vscode/` no host → painel **Features** → passar o
mouse sobre uma feature (ex.: 0002) e clicar no ícone **dashboard** (ação inline),
ou botão direito → **SDD: Abrir dashboard**.

**Esperado:** abre um painel (webview) com o dashboard da feature.

**Resultado:** ✅ confirmado.

## D2 — SCN-UI-002 · Conteúdo correto

**Passos:** observar o dashboard da 0002.

**Esperado:** cabeçalho (id · tipo · status VERIFIED), objetivo, progresso `9/9`,
contagens (requisitos, cenários, critérios, tarefas, testes, arquivos), e o
histórico de transições — batendo com os artefatos.

**Resultado:** ✅ confirmado.

## D3 — SCN-UI-001 · Reuso do painel

**Passos:** com o dashboard da 0002 aberto, acionar "Abrir dashboard" na 0002 de novo.

**Esperado:** o painel existente é revelado (não abre um segundo painel).

**Resultado:** ✅ confirmado.

## D4 — REQ-UI-003 · Campos pendentes

**Passos:** observar a seção "Ainda não disponível".

**Esperado:** tokens/tempo (feature 0005), commits (0007), evidências, validação
(0008) aparecem como pendentes, sem quebrar o dashboard.

**Resultado:** ✅ confirmado.

## D5 — SCN-UI-003 · Robustez

**Passos:** abrir o dashboard de uma feature sem `traceability.yaml` (ex.: uma
recém-criada pelo formulário) — ou a 0001, que tem todos os artefatos.

**Esperado:** o dashboard mostra o que há e marca as contagens sem fonte como
indisponíveis; não fica em branco nem lança erro.

**Resultado:** ✅ confirmado.

---

## Conclusão

**D1–D5 ✅ (2026-07-31), sem divergência.** SCN-UI-001/002/003 confirmados no host:
abrir o dashboard, conteúdo correto (progresso e contagens batendo com os
artefatos), reuso do painel por feature, campos pendentes marcados, e robustez a
artefato ausente. TASK-UI-004, -005 e -006 concluídas — 7/7 tarefas, todos os
critérios de aceite do incremento verificados. A feature caminhou para VERIFIED.
