# Evidências — Context Guardian (0005, incremento RF-012)

Verificação no **Extension Development Host** (F5), exigida pela Definição de Pronto
(constitution Art. 10) para o que não é executável fora do editor: leitura de arquivos,
barra de status e canal de saída. TASK-CTX-005 (fecha REQ-CTX-004, NFR-CTX-002, NFR-CTX-004
no host).

> Como coletar: abrir `extensions_vscode/` no VS Code e pressionar **F5**
> ("Executar extensão"). Na janela *Extension Development Host*, seguir os passos e
> registrar (✅/❌ + observação). O código já compila e passa nos testes (58/58).

**Ambiente:** _(a preencher — ex.: Windows 11 + WSL Ubuntu; VS Code Extension Development Host)_
**Data:** _(a preencher)_
**Status:** ⏳ pendente — aguardando execução do F5.

---

## E1 — SCN-CTX-004 · Medir o contexto de uma feature

**Passos:** painel **Features** → botão direito numa feature (ex.: 0003) → **SDD: Medir
contexto**.

**Esperado:** a barra de status passa a mostrar `SDD Context: ~<n> / 200k (faixa)`; o canal
"SDD · Context Guardian" abre com a composição por arquivo, ordenada do maior para o menor, e
o cabeçalho marca o valor como **estimativa** (~4 caracteres/token).

**Resultado:** _(a preencher)_

## E2 — REQ-CTX-002 · Faixa coerente com o teto

**Passos:** observar a faixa na barra e no canal; opcionalmente reduzir
`sddClaudeKit.context.maxTokens` para forçar uma faixa mais alta e medir de novo.

**Esperado:** a faixa (normal/atenção/risco/bloqueio) corresponde à fração do teto; no teto
padrão de 200k, os documentos de uma feature ficam em "normal".

**Resultado:** _(a preencher)_

## E3 — NFR-CTX-004 · Arquivo grande sinalizado sem travar

**Passos:** criar temporariamente um arquivo grande dentro da pasta da feature (> 128 KiB,
ex.: `spec.md` inflado ou um anexo) e medir.

**Esperado:** o arquivo aparece marcado como **GRANDE**, estimado por tamanho, sem travar a UI
(a extensão não o lê por inteiro). Reverter o arquivo depois.

**Resultado:** _(a preencher)_

## E4 — NFR-CTX-002 · Robustez a ausente/binário

**Passos:** medir uma feature sem `design.md`/`tasks.md` (recém-criada) e, opcionalmente, com
um arquivo binário na pasta.

**Esperado:** os ausentes são ignorados sem erro; um binário é listado como **BINÁRIO** e não
conta para o total. Nenhuma exceção.

**Resultado:** _(a preencher)_

## E5 — NFR-CTX-001 · Estimativa honesta

**Passos:** ler o cabeçalho do canal e o texto da barra/toast.

**Esperado:** em nenhum lugar o valor é apresentado como contagem exata — sempre "~" /
"estimativa"; nada é enviado à rede.

**Resultado:** _(a preencher)_

---

## Conclusão

_(a preencher após o F5)_ — Ao confirmar E1–E5 sem divergência, TASK-CTX-003 e TASK-CTX-005
fecham e a feature caminha para VERIFIED. Registrar aqui qualquer divergência honestamente:
um relatório que declara sucesso onde houve lacuna é pior que a lacuna declarada.
