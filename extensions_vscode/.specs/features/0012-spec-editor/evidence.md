# Evidências — Editor de especificações (0012, incremento RF-006)

Verificação no **Extension Development Host** (F5), exigida pela Definição de Pronto
(constitution Art. 10) para o que não é executável fora do editor: abrir o
CustomTextEditor, editar/salvar sem perda, e a ação no painel. TASK-EDIT-006 (fecha
EDIT-004 e EDIT-005).

> Como coletar: abrir `extensions_vscode/` no VS Code e pressionar **F5**
> ("Executar extensão"). Na janela *Extension Development Host*, seguir os passos e
> registrar (✅/❌ + observação). O código já compila e passa nos testes (49/49).

**Ambiente:** _(preencher: SO, versão do VS Code, WSL sim/não)_
**Data:** _(preencher)_

---

## E1 — SCN-EDIT-001 · Abrir a spec no editor SDD

**Passos:** painel **Features** → passar o mouse sobre uma feature (ex.: 0002) e
clicar no ícone **editar** (ação inline "SDD: Editar spec"). Alternativa: botão
direito no `spec.md` → "Reabrir com…" → "SDD: Editor de spec".

**Esperado:** o `spec.md` abre no editor SDD — textarea de Markdown à esquerda,
painel renderizado à direita.

**Resultado:** _(pendente)_

## E2 — SCN-EDIT-003 · Visão consciente de SDD

**Passos:** observar o painel renderizado.

**Esperado:** cabeçalhos como estrutura e os identificadores (REQ-*, SCN-*, TASK-*,
NFR-*) destacados.

**Resultado:** _(pendente)_

## E3 — SCN-EDIT-002 / NFR-EDIT-001 · Editar e salvar sem perda

**Passos:** editar o Markdown no textarea (ex.: adicionar uma linha), salvar
(Ctrl+S). Conferir o arquivo `spec.md` no disco (abrir no editor de texto normal ou
`git diff`).

**Esperado:** o arquivo contém exatamente o texto editado; nenhuma seção ou
identificador é perdido; o EOL do arquivo é preservado.

**Resultado:** _(pendente)_

## E4 — Sincronização de mudança externa

**Passos:** com a spec aberta no editor SDD, editar o mesmo `spec.md` por fora (no
editor de texto normal, em outra aba) e salvar.

**Esperado:** o painel renderizado do editor SDD atualiza para refletir a mudança
externa (sem recarregar a extensão).

**Resultado:** _(pendente)_

## E5 — Convivência com o editor nativo

**Passos:** abrir o `spec.md` normalmente (clique simples no painel, ou duplo-clique
no arquivo).

**Esperado:** abre o editor de texto/Markdown **nativo** (o SDD é `option`, não
sequestra a abertura padrão).

**Resultado:** _(pendente)_

---

## Conclusão

_(preencher após E1–E5: SCN-EDIT-001/002/003 confirmados no host? Se tudo passar,
EDIT-004/005/006 → done e a feature caminha para VERIFIED. Se algo falhar, abrir a
correção como tarefa e manter a feature em IN_PROGRESS.)_
