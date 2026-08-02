# ADR-019 — SQL Guard: diagnósticos no editor + comando na paleta/menu de contexto

- **Status:** Aceito
- **Data:** 2026-08-02
- **Origem:** questões **Q3** (superfície da análise) e **Q4** (gatilho) da spec de 0020-sql-guard.
- **Decidido em:** TASK-SQL-001

---

## Contexto

O SQL Guard (RF-024) analisa o SQL do **editor ativo** (D-Q2) e produz achados **posicionais** —
cada risco aponta um trecho do SQL. Duas decisões de superfície/UX:

- **Q3 — Como apresentar.** A extensão tem três padrões: **diagnósticos no Problems** (Project
  Doctor 0006, análise de tarefas 0018), **webview de relatório** (validação 0008 / métricas 0009) e
  **canal de saída** (Escopo 0007). Como os achados têm posição no SQL que o usuário está editando,
  a apresentação clicável e inline é a que melhor serve.
- **Q4 — Como acionar.** Diferente das demais features, o insumo é o **editor SQL**, não uma feature
  do painel Features — então o gatilho não pode ser uma ação de item de feature.

## Decisão

**Q3 — Diagnósticos no editor/Problems.** O **núcleo puro** (`sqlGuard.ts`) devolve os achados com
`{ kind, message, line }`; a **borda** os traduz para `vscode.Diagnostic` sobre o documento do
editor ativo, numa `DiagnosticCollection` própria ("SQL Guard") — squiggle inline + painel Problems,
clicável, como o Project Doctor (0006/ADR-009) e a análise de tarefas (0018/ADR-018). Sem webview a
manter; o núcleo fica testável fora do host.

**Q4 — Comando na paleta e no menu de contexto do editor.** Um comando **"SQL Guard: analisar SQL"**
disponível na **paleta** e no **menu de contexto do editor** quando o documento é SQL
(`when: editorLangId == sql`). Analisa a **seleção** se houver, senão o documento inteiro (D-Q2).
Não há entrada em `view/item/context` — SQL não é feature.

## Alternativas consideradas

| Alternativa | Por que não |
| --- | --- |
| **Q3: Webview de relatório** (0008/0009) | Bom para um relatório, mas perde o squiggle inline e a navegação até a posição — o achado é "conserte aqui", que o diagnóstico dá de graça |
| **Q3: Canal de saída** (0007) | Simples, mas sem localização clicável nem marcação inline; o pior para corrigir no lugar |
| **Q4: Ação no painel Features** | SQL não é uma mudança `.specs`; forçar o Guard para o item de feature confundiria o modelo (a feature não "tem" SQL) |
| **Q4: Rodar ao salvar/digitar** (onDidChange) | Análise contínua é ruído e custo em cada tecla/salvamento; o RF-024 pede revisar sob demanda. Fica como evolução, não incremento 1 |

## Consequências

**Positivas**

- Achados posicionais clicáveis no editor; padrão já validado (0006/0018); núcleo puro testável.
- Sem webview a manter; consistente com os analisadores existentes.
- O comando por editor não interfere no painel Features.

**Negativas**

- Os diagnósticos ficam num documento que pode ser um buffer sem arquivo (SQL colado). **Mitigação:**
  a `DiagnosticCollection` é indexada pela URI do documento ativo; some quando o documento fecha, e é
  recomputada ao acionar de novo.
- O usuário precisa acionar o comando (não é automático). **Mitigação:** é intencional (RF-024 = revisar
  sob demanda); acionamento contínuo fica como evolução futura.

## Limite desta decisão

Decide **a superfície** (diagnósticos no editor/Problems) e **o gatilho** (comando na paleta e no menu
de contexto do editor SQL). **Não** define o texto exato das mensagens (TASK-SQL-002/003), **não**
implementa análise contínua, e **não** amplia o conjunto de verificações além do decidido em D-Q1.
