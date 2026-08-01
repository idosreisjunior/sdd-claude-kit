# Evidências — Claude Code Adapter (0004, incremento RF-011)

Verificação no **Extension Development Host** (F5), exigida pela Definição de Pronto
(constitution Art. 10) para o que não é executável fora do editor: clipboard, terminal e
detecção da CLI. TASK-CC-005 (fecha REQ-CC-002, REQ-CC-003, NFR-CC-001 no host).

> Como coletar: abrir `extensions_vscode/` no VS Code e pressionar **F5**
> ("Executar extensão"). Na janela *Extension Development Host*, seguir os passos e
> registrar (✅/❌ + observação). O código já compila e passa nos testes (53/53).

**Ambiente:** _(a preencher — ex.: Windows 11 + WSL Ubuntu; VS Code Extension Development Host)_
**Data:** _(a preencher)_
**Status:** ⏳ pendente — aguardando execução do F5.

---

## E1 — SCN-CC-002 · Copiar o prompt

**Passos:** painel **Features** → botão direito numa feature (ex.: 0002) → **SDD: Abrir no
Claude Code** → escolher uma ação (ex.: "Detalhar a especificação") → colar (Ctrl+V) num editor.

**Esperado:** a área de transferência contém `/sdd-kit:spec 0002-feature-management` e a
mensagem informa o prompt copiado.

**Resultado:** _(a preencher)_

## E2 — SCN-CC-003 · Abrir no Claude Code com a CLI detectada

**Passos:** com o Claude Code instalado (ou `sddClaudeKit.claudeCode.path` configurado),
repetir a ação e observar o terminal `SDD · Claude Code`.

**Esperado:** o terminal abre na raiz do workspace, inicia a CLI e **deixa o prompt digitado
sem enviá-lo** (o cursor fica na linha com o `/sdd-kit:…`, aguardando Enter).

**Resultado:** _(a preencher)_

## E3 — NFR-CC-001 · A ação não é enviada automaticamente

**Passos:** após E2, confirmar que nada foi executado até pressionar Enter manualmente.

**Esperado:** o Claude Code só recebe a ação quando o usuário pressiona Enter; a extensão
não a dispara.

**Resultado:** _(a preencher)_

## E4 — SCN-CC-005 · Degradação sem a CLI

**Passos:** esvaziar `sddClaudeKit.claudeCode.path` e garantir que `claude` não está no PATH
(ou apontar a config para um caminho inexistente) → repetir a ação.

**Esperado:** o prompt é copiado, uma mensagem orienta a configurar/instalar a CLI, e nenhum
erro é lançado (nenhum terminal com CLI é aberto).

**Resultado:** _(a preencher)_

## E5 — Reuso do terminal

**Passos:** acionar a ação duas vezes seguidas na mesma feature.

**Esperado:** o mesmo terminal `SDD · Claude Code` é reutilizado (não abre um segundo); na
segunda vez a CLI não é reiniciada, apenas o novo prompt é digitado.

**Resultado:** _(a preencher)_

---

## Conclusão

_(a preencher após o F5)_ — Ao confirmar E1–E5 sem divergência, TASK-CC-003 e TASK-CC-005
fecham e a feature caminha para VERIFIED. Registrar aqui qualquer divergência honestamente:
um relatório que declara sucesso onde houve lacuna é pior que a lacuna declarada.
