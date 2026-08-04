# Feature: Testes E2E / integração no host do VS Code

- **ID:** 0023-e2e-tests
- **Escopo dos identificadores:** E2E
- **Estado:** ver `status.yaml` — a autoridade é ele

---

## Objetivo

Dar à extensão uma camada de **testes de integração (E2E)** que roda dentro de uma instância real do
VS Code, exercitando a **borda** (ativação, comandos, diagnósticos) que a suíte unitária — por
convenção (standards §6/§7) — deixa para revisão manual.

## Contexto

Os testes atuais rodam com `node --test` sobre `out/test/`: exercitam só a **lógica de domínio pura**
(sem a API do VS Code). Toda a borda — `activate`, registro de comandos, `DiagnosticCollection`,
webviews, custom editor — é verificada por **revisão manual**, e cada feature de 0014 a 0022
registrou isso como `gaps` em `traceability.yaml`. Falta uma camada que prove, num host real, que a
extensão **ativa** e que o que o `package.json` declara **existe em runtime**.

O incremento 1 é **smoke**: o mínimo que dá o maior sinal — ativação, paridade de comandos, e um
fluxo não-interativo com saída observável (SQL Guard → diagnósticos; Project Doctor executa). Não
cobre comandos interativos (QuickPick/modais), webviews nem o custom editor — isso exige stubs e é
mais frágil, ficando para incrementos futuros.

## Escopo

### Incluído

- Harness de teste de integração no **Extension Development Host** (`@vscode/test-electron` via
  `@vscode/test-cli`), separado da suíte unitária.
- Testes **smoke**: ativação; paridade comandos declarados (`package.json`) vs. registrados
  (runtime); um fluxo não-interativo (SQL Guard e Project Doctor).
- Integração no **CI** (Linux, sob `xvfb`).

### Não incluído

- Comandos **interativos** (QuickPick, `showWarningMessage` modal) via stubs, **webviews** e o
  **custom editor** — incrementos futuros.
- Substituir a suíte unitária — a E2E é complementar; `npm test` continua `node --test`.

---

## Decisões de escopo (2026-08-03)

| # | Decisão | Efeito |
| --- | --- | --- |
| D-Q1 | Escopo **smoke**: ativação + paridade de comandos + um fluxo não-interativo (SQL Guard, Project Doctor). | REQ-E2E-002/003. |
| D-Q2 | A suíte E2E vive **fora** de `out/test` (em `src/e2e` → `out/e2e`); `npm test` não a executa. | REQ-E2E-001; NFR-E2E-001. |
| D-Q3 | O runner e o *layout* (test-cli/electron + Mocha), o wiring de CI (`xvfb`) e as fixtures são **de design** → ADR-022. | REQ-E2E-001. |

---

## Requisitos funcionais

> Origem: a estratégia de teste (standards §6/§7) e o acúmulo de `gaps` de borda das features
> 0014–0022. Esta é uma feature de **qualidade interna**; não materializa um RF de usuário do PRD.

### REQ-E2E-001 — Harness de integração no host real, isolado da suíte unitária

A extensão deve ter uma suíte de testes de integração que roda dentro de uma instância real do VS
Code (Extension Development Host), acionável por um script dedicado, **sem interferir** na suíte
unitária (`npm test` / `node --test` continua exercitando só `out/test`).

#### SCN-E2E-001 — Suíte E2E acionável e isolada

DADO o projeto compilado
QUANDO se aciona o script de teste E2E dedicado
ENTÃO a suíte roda no host do VS Code, e `npm test` (unitário) continua verde sem executar os testes
E2E.

### REQ-E2E-002 — Smoke de ativação e paridade de comandos

A suíte deve **ativar** a extensão e verificar que **todos** os comandos `sddClaudeKit.*` declarados
no `package.json` estão registrados em runtime.

#### SCN-E2E-002 — Extensão ativa

DADO o host do VS Code iniciado
QUANDO a extensão é ativada
ENTÃO `extension.isActive` é verdadeiro, sem erro na ativação.

#### SCN-E2E-003 — Paridade de comandos

DADO a extensão ativa
QUANDO se consultam os comandos registrados
ENTÃO todo comando `sddClaudeKit.*` declarado em `contributes.commands` do `package.json` está
presente em runtime.

### REQ-E2E-003 — Smoke de um fluxo não-interativo com saída observável

A suíte deve exercitar pelo menos um fluxo real de ponta a ponta com resultado observável, sem
interação do usuário.

#### SCN-E2E-004 — SQL Guard publica diagnósticos

DADO um documento `.sql` com `DELETE FROM t` (sem WHERE) aberto no editor
QUANDO se executa o comando `sddClaudeKit.sqlGuard`
ENTÃO há pelo menos um diagnóstico posicional publicado para aquele documento.

#### SCN-E2E-005 — Project Doctor executa sem lançar

DADO um workspace com uma estrutura `.specs` de fixture
QUANDO se executa o comando `sddClaudeKit.runDoctor`
ENTÃO o comando conclui sem lançar exceção.

---

## Requisitos não funcionais

### NFR-E2E-001 — Sem interferência na suíte unitária

A suíte E2E vive fora de `out/test`; `node --test ./out/test` não a executa. A base de testes
unitários permanece rápida e sem dependência do host.

### NFR-E2E-002 — Determinística e headless no CI

A suíte roda em Linux sob `xvfb` no CI; a única dependência de rede é o download do VS Code de teste
feito pelo próprio runner. Sem `flakiness` por estado externo.

### NFR-E2E-003 — Sem segredos nem I/O externo da extensão

Os testes não usam `gh`, a CLI do Claude Code, nem acionam rede própria da extensão (RNF-003/004).

---

## Critérios de aceite

- [ ] Existe uma suíte E2E que roda no host do VS Code por um script dedicado, isolada da unitária
      (REQ-E2E-001, SCN-E2E-001; NFR-E2E-001).
- [ ] A suíte ativa a extensão e confirma a paridade de todos os comandos `sddClaudeKit.*`
      (REQ-E2E-002, SCN-E2E-002/003).
- [ ] A suíte exercita um fluxo não-interativo com saída observável — SQL Guard publica diagnóstico
      e Project Doctor executa sem lançar (REQ-E2E-003, SCN-E2E-004/005).
- [ ] O CI roda a suíte E2E em Linux sob `xvfb`; sem segredos nem I/O externo da extensão
      (NFR-E2E-002/003).

---

## Questões pendentes

As questões de escopo (Q1/Q2) foram decididas — ver **Decisões de escopo**. Permanece a Q3, de
**design**, que não impede a spec de sair de DRAFT:

| # | Questão | Bloqueia | Prioridade |
| --- | --- | --- | --- |
| Q3 | Runner e *layout* (test-cli/electron + Mocha vs. runner próprio), wiring de CI (`xvfb` no job existente vs. job separado) e forma das fixtures. Decisão de design → ADR. | design | média |

## Hipóteses assumidas

> HIPÓTESE: O runner é `@vscode/test-cli` + `@vscode/test-electron` com Mocha (padrão oficial atual),
> com os testes em `src/e2e` → `out/e2e` — a confirmar em Q3 no design (ADR-022).

> HIPÓTESE: O CI roda a E2E como um passo adicional no job `extension` existente, em `ubuntu`, sob
> `xvfb-run` — a confirmar em Q3 no design.
