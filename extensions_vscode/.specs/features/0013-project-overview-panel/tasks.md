# Tarefas — Painel Projeto — resumo vivo (saúde, contexto, contadores)

Complexidade: **P** pequena (≤ meio dia) · **M** média (≈ 1 dia) · **G** grande
(deve ser dividida antes de começar).

> Plano montado a partir dos requisitos, **sem design técnico** (as skills clarify/design
> chegam na Fase 2). D-Q1 decidiu que o painel vira webview; a TASK-PROJ-001 formaliza essa
> decisão em ADR antes da implementação. As demais tarefas podem mudar quando o ADR existir.

---

## Ordem de execução

```
PROJ-001 (ADR webview) ─┐
                        ├─► PROJ-003 (HTML) ─► PROJ-004 (provider) ─► PROJ-005 (manifesto)
PROJ-002 (modelo) ──────┘                      ▲
PROJ-006 (último Doctor em memória) ───────────┘
```

Caminho crítico: **PROJ-002 → PROJ-003 → PROJ-004 → PROJ-005**.
Paralelizáveis no início: **PROJ-001, PROJ-002, PROJ-006**.

---

## TASK-PROJ-001 — ADR: painel Projeto como WebviewView

**Requisitos:** REQ-PROJ-005, NFR-PROJ-004
**Dependências:** —
**Complexidade:** P
**Status:** done

### Descrição

Registrar em ADR a decisão D-Q1: o painel `sddProject` deixa de ser `TreeView` e passa a
`WebviewView` para permitir o layout rico (cartões/barras). O ADR deve declarar o modelo de
segurança herdado do dashboard (ADR-005): CSP com nonce, sem rede, `localResourceRoots`
restrito, escape de todo texto; e delimitar o mínimo de script necessário para a interação
(acionar comandos da extensão). É trabalho de design antecipado por ausência da skill design.

### Arquivos prováveis

- `.specs/features/0013-project-overview-panel/decisions/ADR-010-painel-projeto-webview.md`

### Testes esperados

- Nenhum — é decisão/documentação. Verificável por revisão humana (registrado em `gaps`).

### Critério de conclusão

- ADR-010 escrito, com decisão, alternativas (manter TreeView) e consequências de segurança;
  referenciado no `architecture.md` §9 da extensão.

---

## TASK-PROJ-002 — Núcleo puro do modelo de resumo do projeto

**Requisitos:** REQ-PROJ-001, REQ-PROJ-002, REQ-PROJ-003, REQ-PROJ-004, NFR-PROJ-002
**Dependências:** —
**Complexidade:** M
**Status:** done

### Descrição

Módulo puro (sem API do VS Code) que monta o modelo do painel a partir de entradas já
coletadas: resumo do Doctor (contagem de erros/avisos, ou "não executado" distinto de zero —
REQ-PROJ-001), uso de contexto (última medição, ou "não medido" — REQ-PROJ-002), contadores
de mudanças por status na ordem do fluxo SDD exibindo só os presentes (REQ-PROJ-003), e a
presença de cada documento de projeto (REQ-PROJ-004). Toda entrada ausente/inválida vira um
estado informativo, nunca exceção (NFR-PROJ-002). Reutiliza tipos de `projectDoctor`,
`contextGuardian` e `specsIndex`.

### Arquivos prováveis

- `src/sdd/projectOverview.ts`

### Testes esperados

- TEST-PROJ-001 — contadores por status e ordenação pelo fluxo SDD
- TEST-PROJ-002 — entradas ausentes/inválidas produzem estado informativo, sem lançar
- TEST-PROJ-003 — Doctor "não executado" é distinto de "0 erros"; contexto "não medido"

### Critério de conclusão

- Funções puras retornam o modelo esperado nos três testes acima; nenhum import de `vscode`.

---

## TASK-PROJ-003 — Renderização HTML do webview (CSP + nonce + escape)

**Requisitos:** REQ-PROJ-005, NFR-PROJ-004, NFR-PROJ-002
**Dependências:** TASK-PROJ-001, TASK-PROJ-002
**Complexidade:** M
**Status:** done

### Descrição

Função pura que gera o HTML do painel a partir do modelo (TASK-PROJ-002): três cartões
(saúde, contexto, contadores) e uma barra proporcional ao uso de contexto sobre o teto
(REQ-PROJ-005). CSP com nonce, sem rede, todo texto escapado (NFR-PROJ-004), à semelhança de
`dashboardHtml.ts`. Estados vazios ("não executado", "não medido", índice ausente) renderizam
sem quebrar (NFR-PROJ-002).

### Arquivos prováveis

- `src/sdd/projectOverviewHtml.ts`

### Testes esperados

- TEST-PROJ-004 — HTML contém CSP com nonce, escapa texto, e a barra é proporcional ao uso
- TEST-PROJ-005 — estados vazios renderizam os rótulos informativos corretos

### Critério de conclusão

- Testes TEST-PROJ-004 e TEST-PROJ-005 passam; a função é pura (sem `vscode`).

---

## TASK-PROJ-004 — Provider WebviewView e coleta de dados

**Requisitos:** REQ-PROJ-001, REQ-PROJ-002, REQ-PROJ-003, REQ-PROJ-004, REQ-PROJ-005, NFR-PROJ-001, NFR-PROJ-003
**Dependências:** TASK-PROJ-002, TASK-PROJ-003, TASK-PROJ-006
**Complexidade:** M
**Status:** done

### Descrição

`WebviewViewProvider` para `sddProject`: coleta as entradas (último resultado do Doctor de
PROJ-006, última medição de contexto via `lastUsage`, `index.yaml`, presença dos docs), monta
o modelo (PROJ-002), renderiza (PROJ-003) e trata as mensagens do webview — rodar o Doctor,
abrir um documento, medir contexto. Somente leitura: a única escrita é a coleção de
Diagnostics quando o usuário aciona o Doctor (NFR-PROJ-001). Não roda Doctor nem varre o
repositório ao abrir (NFR-PROJ-003). Registrado em `extension.ts`, substituindo o
`registerTreeDataProvider('sddProject', …)`.

### Arquivos prováveis

- `src/views/projectViewProvider.ts`
- `src/extension.ts`

### Testes esperados

- Nenhum automatizado — integração com a API de webview do VS Code. Coberto por revisão
  manual (registrado em `gaps`); a lógica testável vive em PROJ-002/PROJ-003.

### Critério de conclusão

- Ao abrir a extensão, o painel Projeto mostra os três cartões com dados reais; o atalho de
  Doctor funciona; nenhuma escrita ocorre além da coleção de Diagnostics sob ação explícita;
  `npm run compile` e `npm run lint` limpos.

---

## TASK-PROJ-005 — Manifesto: view sddProject como webview

**Requisitos:** REQ-PROJ-005, REQ-PROJ-001
**Dependências:** TASK-PROJ-004
**Complexidade:** P
**Status:** done

### Descrição

Ajustar `package.json`: declarar a view `sddProject` como `"type": "webview"`, garantir que os
`viewsWelcome` de `sddProject` continuem válidos quando não inicializado, e expor o comando de
rodar o Doctor a partir do painel. Manter o painel `sddFeatures` como está.

### Arquivos prováveis

- `package.json`

### Testes esperados

- Nenhum — manifesto declarativo. Verificado ao carregar a extensão (revisão manual, `gaps`).

### Critério de conclusão

- A extensão carrega com o painel Projeto como webview; welcome de não inicializado ainda
  aparece; `vsce package` (ou compile) sem erro de contribuição.

---

## TASK-PROJ-006 — Manter em memória o último resultado do Doctor

**Requisitos:** REQ-PROJ-001, NFR-PROJ-003
**Dependências:** —
**Complexidade:** P
**Status:** done

### Descrição

Hoje `runDoctor` publica apenas na `DiagnosticCollection`. Guardar em memória o último resumo
(contagem de erros/avisos e se já foi executado), como `lastUsage` faz para o contexto, para o
painel poder exibi-lo sem reexecutar o diagnóstico (NFR-PROJ-003) e distinguir "não executado"
de "0 erros" (REQ-PROJ-001). Só em memória — não versionado.

### Arquivos prováveis

- `src/extension.ts`

### Testes esperados

- Nenhum automatizado direto — o cálculo do resumo é coberto por TEST-PROJ-003 (PROJ-002).
  A retenção em memória é integração, verificada por revisão manual (`gaps`).

### Critério de conclusão

- Após rodar o Doctor uma vez, o resumo fica disponível para o painel; antes da primeira
  execução, o estado é "não executado".

---

## Resumo

| Complexidade | Quantidade |
| --- | --- |
| P | 3 |
| M | 3 |
| G | 0 |

Total: 6 tarefas · 6 concluídas · 0 pendentes.

**Caminho crítico:** TASK-PROJ-002 → TASK-PROJ-003 → TASK-PROJ-004 → TASK-PROJ-005 (concluído)

**Bloqueios ativos:** nenhum. Q2 foi decidida na spec (D-Q2) e o `blocked_by` esvaziado.

**Paralelizáveis agora:** nenhum — todas as tarefas concluídas.

> Implementação concluída em 2026-07-31 (fora da ordem formal do fluxo: sem as etapas
> approve/design, indisponíveis na Fase 1, a pedido do autor). Verificação: `npm run compile`,
> `npm run lint` e `npm test` (79 testes) limpos. Estado formal segue DRAFT até approve/verify.
