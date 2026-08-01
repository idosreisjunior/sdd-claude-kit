# Arquitetura — sdd-claude-kit-vscode

Versão: 1.0 · Atualizado em: 2026-07-31

> Derivada do PRD §22 (arquitetura conceitual), §9 (estrutura de feature) e
> §13 (interface). A autoridade de produto é o PRD.

---

## 1. Visão geral

Extensão de editor que orquestra artefatos locais. Os **arquivos do projeto**
(`.specs/`, código, Git) são a fonte de verdade; o armazenamento interno do VS
Code guarda apenas preferências, cache, métricas locais e estado temporário
(PRD §22).

```
                 VS Code (host da extensão)
                          │
                 ┌────────┴────────┐
                 │   extension.ts   │  ativa, registra UI e comandos
                 └────────┬────────┘
        ┌─────────────────┼─────────────────┐
        ▼                 ▼                 ▼
   Views (UI)        Workflow Engine     Adapters
   Activity Bar      (fluxo SDD)         ├─ Claude Code (terminal)
   status bar                            ├─ Git
                                         └─ Local Storage
        │                                        │
        └──────────► .specs/  ◄──────────────────┘
              (fonte de verdade, versionada)
```

## 2. Componentes e responsabilidades

Módulos do PRD §22, mapeados ao backlog (`index.yaml`):

| Componente | Responsabilidade | Não faz | Feature |
| --- | --- | --- | --- |
| Project Explorer / Detector | Diagnosticar workspace, detectar `.specs`, Git, Claude Code | Não escreve `.specs` | 0001 |
| Feature Manager | Criar/listar features, status, progresso | Não edita conteúdo dos docs | 0002 |
| Spec Editor | Edição visual + Markdown dos documentos | Não decide requisitos | 0003 |
| Workflow Engine | Conduzir o fluxo SDD (request→…→validation) | Não executa o modelo | 0002/0003 |
| Claude Code Adapter | Montar/copiar prompt, abrir terminal, executar ações | Não substitui o Claude Code | 0004 |
| Context Guardian | Estimar contexto, selecionar arquivos, alertar | Não garante o limite do modelo | 0005 |
| Project Doctor | Validar estrutura e apontar problemas | Não corrige sozinho | 0006 |
| Traceability + Git Adapter | Diff, fora de escopo, requisito→teste→commit | Não faz commit sem autorização | 0007 |
| Evidence + Validation Engine | Coletar evidências, validar aderência | Não conclui sem evidência | 0008 |
| Metrics Collector | Tokens, tempo, produtividade (locais) | Sem telemetria obrigatória | 0009 |
| Template Engine | Templates de spec/design/tarefas | — | 0003/0010 |

### Regra de dependência

A UI e os adapters dependem do núcleo (Workflow/estado); o núcleo **não** conhece
a API do VS Code diretamente onde puder ser evitado, para permanecer testável. A
dependência aponta para dentro: `views → core → arquivos`. Nenhum componente
grava fora de `.specs/` (exceto o Git Adapter agindo sobre o repositório, sempre
com autorização explícita).

## 3. Fluxos principais

### Fluxo SDD de uma feature (PRD §8)

```
Solicitação → Research → Clarificações → Especificação → Aprovação
  → Design → Tarefas → Implementação → Testes → Evidências → Validação → PR
```

### Execução de ação no Claude Code (PRD §13.2, RF-011)

```
1. usuário escolhe uma ação (ex.: "implementar próxima tarefa")
2. Context Guardian monta e mede o contexto (arquivos + instruções)
3. extensão exibe objetivo, arquivos, tamanho estimado e limite
4. usuário revisa e confirma
5. ação é aberta no terminal do Claude Code
6. resultado (diff, testes) é capturado quando possível
```

## 4. Contratos

- **Arquivos `.specs`** seguem os schemas do plugin sdd-kit
  (`config.schema.json`, `status.schema.json`). A extensão lê e escreve nesse
  formato — é o contrato com a CLI.
- **Comandos do VS Code** expostos por `sddClaudeKit.*` (ver package.json).
- **Configuração** sob a chave `sddClaudeKit.*` (ver PRD §23).

## 5. Persistência

Nenhum banco. Estado versionável vive em `.specs/`; estado não versionável
(cache, métricas locais, preferências) vive no storage do VS Code
(`ExtensionContext.workspaceState`/`globalState`).

## 6. Segurança

- Nenhum código é enviado a serviço externo sem ação/config explícita (RNF-003).
- `.env`, chaves e credenciais são bloqueados por padrão do contexto (PRD §23).
- Segredos mascarados; comandos destrutivos exigem confirmação.
- Permissões da extensão mínimas.

## 7. Observabilidade

Registro local de ações relevantes (RNF-005): comandos executados, arquivos
utilizados/alterados, aprovações, validações, mudanças de status. Sem telemetria
obrigatória (RNF-004).

## 8. Limites explícitos

- Os arquivos do projeto são a fonte de verdade; o storage do VS Code nunca a
  substitui.
- Nenhum commit automático sem autorização explícita (RF-018).
- Nenhuma tarefa é concluída sem evidência, salvo confirmação explícita do
  usuário (RF-016).
- Toda decisão arquitetural relevante vira um ADR em `.specs/project/decisions/`.

## 9. Decisões arquiteturais

Decisões de projeto ficam em `.specs/project/decisions/`; decisões nascidas
dentro de uma feature ficam na pasta `decisions/` da feature.

| ADR | Decisão | Status | Onde |
| --- | --- | --- | --- |
| ADR-001 | Templates da inicialização embutidos no `.vsix`, com sync do plugin como fonte única | Aceito | `features/0001-project-foundation/decisions/` |
| ADR-002 | Detectar o Claude Code varrendo o `PATH` (sem executar processo), com override configurável | Aceito | `features/0001-project-foundation/decisions/` |
| ADR-003 | Ler os YAML das specs com `js-yaml` (dependência de runtime), empacotando as dependências | Aceito | `features/0002-feature-management/decisions/` |
| ADR-007 | Captura de resultado do terminal fica fora do incremento 0004 (adapter *fire-and-forget* + humano no controle); captura é escopo de 0008 | Aceito | `features/0004-claude-code-adapter/decisions/` |
| ADR-008 | Contagem de tokens por heurística local (~4 caracteres/token), rotulada como estimativa; sem tokenizer nativo nem rede | Aceito | `features/0005-context-guardian/decisions/` |
| ADR-009 | Project Doctor apresenta via Diagnostics API (painel Problems), com núcleo de diagnóstico puro | Aceito | `features/0006-project-doctor/decisions/` |

## 10. Questões arquiteturais em aberto

| # | Questão | Impacto | Quando decidir |
| --- | --- | --- | --- |
| A1 | Empacotamento: `tsc` puro vs. `esbuild`/bundler | Tamanho do .vsix e tempo de build | Antes da feature 0010 (publicação) |
| ~~A2~~ | ~~Como o Claude Code Adapter captura resultado~~ **RESOLVIDA por ADR-007** (0004): captura fica FORA do incremento 0004 — adapter *fire-and-forget* + humano no controle; captura de resultado é escopo da feature 0008 | — | — |
| ~~A3~~ | ~~Estratégia de contagem de tokens~~ **RESOLVIDA por ADR-008** (0005): heurística local (~4 caracteres/token), rotulada como estimativa; sem tokenizer nativo nem rede | — | — |
| ~~A4~~ | ~~Parser de YAML/Markdown das specs~~ **RESOLVIDA por ADR-003** (js-yaml, leitura robusta) | — | — |
