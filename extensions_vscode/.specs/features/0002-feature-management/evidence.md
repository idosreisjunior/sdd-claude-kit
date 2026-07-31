# Evidências — Gerenciamento de features (0002)

Verificação no **Extension Development Host** (F5), exigida pela Definição de Pronto
(constitution Art. 10) para o que não é executável fora do editor: renderização do
painel, clique e o formulário de criação. TASK-FEAT-008.

> Como coletar: no VS Code, abra a pasta `extensions_vscode/` e pressione **F5**
> (config "Executar extensão"). Uma segunda janela — o *Extension Development Host*
> — abre com a extensão carregada. Faça os passos abaixo nessa janela e registre o
> resultado (data, ambiente, ✅/❌ e observação).

**Ambiente:** Windows 11 + WSL (Ubuntu); VS Code — Extension Development Host (F5).
**Data:** 2026-07-31

---

## E1 — SCN-FEAT-002 · Listagem agrupada por status

**Passos:** abrir `extensions_vscode/` no host → clicar no ícone SDD na Activity Bar
→ observar a seção **Features**.

**Esperado:** as mudanças aparecem agrupadas (Rascunho, Em desenvolvimento, …); as
0001 e 0002 sob **Rascunho**; grupos sem itens não aparecem.

**Resultado:** ✅ confirmado.

## E2 — REQ-FEAT-005 (FEAT-007) · Progresso `done/total`

**Passos:** na mesma lista, observar a descrição de cada feature.

**Esperado:** cada item mostra `id · done/total` — 0001 com `6/10` e 0002 com `8/9`
(reflete os contadores dos `status.yaml`).

**Resultado:** ✅ confirmado.

## E3 — SCN-FEAT-003 · Clique abre a spec

**Passos:** clicar na feature **0002-feature-management**.

**Esperado:** abre `.specs/features/0002-feature-management/spec.md` no editor.

**Resultado:** ✅ confirmado.

## E4 — REQ-FEAT-004 (FEAT-006) · Criar feature pelo formulário

**Passos (em pasta descartável, para não alterar o índice real):**
1. No host, abrir uma pasta vazia nova (File → Open Folder).
2. Paleta (Ctrl+Shift+P) → **SDD: Inicializar projeto** → Criar. _(cria `.specs/`)_
3. Paleta → **SDD: Nova feature** → tipo `feature` → título "Cadastro de clientes"
   → aceitar o slug sugerido `cadastro-de-clientes`… ou digitar `customer-registration`
   → escopo sugerido → Criar.

**Esperado:**
- Cria `.specs/features/0001-<slug>/` com `request.md`, `status.yaml`, `spec.md` e
  `decisions/`.
- `index.yaml` ganha a entrada e `next_id` vai para `2`, **com os comentários
  preservados**.
- A nova feature aparece no painel sob **Rascunho** com `0/0`.
- "Abrir spec" abre o `spec.md` criado.

**Resultado:** ✅ confirmado — feature criada, índice atualizado e item no painel.

## E5 — Caminho de recusa (id/diretório existente)

**Passos:** repetir **SDD: Nova feature** com o **mesmo slug** da E4.

**Esperado:** mensagem de erro informando que o diretório já existe; nada é alterado.

**Resultado:** ✅ confirmado — recusa com erro, sem alteração.

---

## Conclusão

**E1–E5 ✅ (2026-07-31).** SCN-FEAT-002 e SCN-FEAT-003 confirmados no host; o
progresso `done/total` (REQ-FEAT-005) e a criação pelo formulário com o caminho de
recusa (REQ-FEAT-004) também. Nenhuma divergência. TASK-FEAT-008 concluída — todos
os critérios de aceite da feature 0002 verificados. A feature está pronta para
aprovação (`/sdd-kit:approve`).
