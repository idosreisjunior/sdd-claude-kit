# Evidências — Project Doctor (0006, incremento RF-002)

Verificação no **Extension Development Host** (F5), exigida pela Definição de Pronto
(constitution Art. 10) para o que não é executável fora do editor: leitura do disco e
publicação na Diagnostics API. TASK-PD-005 (fecha REQ-PD-002, NFR-PD-001 no host).

> Como coletar: abrir `extensions_vscode/` no VS Code e pressionar **F5**
> ("Executar extensão"). Na janela *Extension Development Host*, seguir os passos e
> registrar (✅/❌ + observação). O código já compila e passa nos testes (65/65).

**Ambiente:** _(a preencher — ex.: Windows 11 + WSL Ubuntu; VS Code Extension Development Host)_
**Data:** _(a preencher)_
**Status:** ⏳ pendente — aguardando execução do F5.

---

## E1 — SCN-PD-006 · Diagnóstico aparece no Problems

**Passos:** no painel **Projeto** (Activity Bar SDD), clicar no botão **Diagnosticar projeto**
(ícone de pulso, `view/title`) — ou paleta → **SDD: Diagnosticar projeto**.

**Esperado:** o painel Problems abre; num projeto SDD saudável, aparece no máximo um
informativo (Claude Code não detectado, se for o caso). Nenhum erro/aviso indevido.

**Resultado:** _(a preencher)_

## E2 — SCN-PD-002 · Mudança sem status.yaml

**Passos:** renomear temporariamente o `status.yaml` de uma mudança (ex.: 0006) e rodar de novo.

**Esperado:** um **erro** "Mudança 0006-... sem status.yaml.", ancorado ao caminho do
`status.yaml`, com sugestão de criar em DRAFT. Reverter o nome depois.

**Resultado:** _(a preencher)_

## E3 — SCN-PD-003 · Status divergente

**Passos:** editar o `status:` no `index.yaml` de uma mudança para diferir do `status.yaml` e
rodar de novo.

**Esperado:** um **aviso** "status divergente… index.yaml diz X, status.yaml diz Y", ancorado
ao `index.yaml`. Reverter depois.

**Resultado:** _(a preencher)_

## E4 — SCN-PD-004 · Diretório órfão

**Passos:** criar um diretório `.specs/features/0099-ghost/` (vazio) e rodar de novo.

**Esperado:** um **aviso** de diretório não registrado no índice. Remover o diretório depois.

**Resultado:** _(a preencher)_

## E5 — SCN-PD-006 · Rodar de novo não duplica; nada é alterado

**Passos:** acionar "Diagnosticar projeto" duas vezes seguidas; conferir o Git status.

**Esperado:** os itens do Problems não duplicam (a coleção é limpa e repovoada); `git status`
não mostra nenhuma alteração feita pelo Doctor (somente leitura, NFR-PD-001).

**Resultado:** _(a preencher)_

---

## Conclusão

_(a preencher após o F5)_ — Ao confirmar E1–E5 sem divergência, TASK-PD-003 e TASK-PD-005
fecham e a feature caminha para VERIFIED. Registrar aqui qualquer divergência honestamente:
um relatório que declara sucesso onde houve lacuna é pior que a lacuna declarada.
