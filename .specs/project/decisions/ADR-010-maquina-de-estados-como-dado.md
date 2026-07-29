# ADR-010 — A máquina de estados é dado, com fonte única

- **Status:** Aceito
- **Data:** 2026-07-29
- **Origem:** questão Q1 de `0007-sdd-workflow-completion`
- **Decidido em:** refinamento da `0007`

## Contexto

O grafo de transições válidas já existe em **três lugares**, escrito à mão em cada um:

| Onde | Forma |
| --- | --- |
| `.specs/project/architecture.md` §3 | Tabela em Markdown |
| `plugins/sdd-kit/skills/tasks/SKILL.md` | Tabela parcial, só as linhas que a skill usa |
| `tests/specs-invariants.test.ts` | Constante `TRANSICOES` em TypeScript |

Nenhuma das três deriva das outras. Uma emenda ao grafo exige lembrar dos três, e o teste — que deveria ser a rede de proteção — valida contra a **sua própria cópia**, não contra a autoridade. Se eu editar `architecture.md` e esquecer o teste, ele continua verde enquanto o framework diverge da spec.

`REQ-SWC-007` exige que a máquina de estados seja implementada. A pergunta é se ela vive como prosa dentro de cada skill ou como dado verificável.

## Decisão

**Fonte única, declarativa, em `plugins/sdd-kit/schemas/workflow.json`.**

O arquivo declara os estados, as transições válidas e quais são terminais. Todos os consumidores passam a derivar dele:

| Consumidor | Como usa |
| --- | --- |
| Skills | Consultam via `${CLAUDE_PLUGIN_ROOT}/schemas/workflow.json` antes de transicionar |
| Testes | Carregam o arquivo em vez de redeclarar a tabela |
| Validador (Fase 4) | Aplica mecanicamente |
| `architecture.md` §3 | Passa a **documentar** o arquivo, deixando de ser a autoridade |

Dado, não código: um grafo de transições não tem comportamento. JSON é legível sem runtime, valida por schema, e não esbarra na proibição de dependências do [ADR-007](./ADR-007-scripts-do-plugin-em-javascript.md).

## Alternativas consideradas

| Alternativa | Por que não |
| --- | --- |
| **Prosa em cada skill** (situação atual) | Torna `REQ-SWC-007` não testável e garante divergência: já são três cópias com uma feature entregue |
| **Módulo JS em `scripts/`** | Funciona, mas transforma dado em código sem ganho — e obriga quem lê o grafo a ler JavaScript |
| **Manter em `architecture.md` e derivar dali** | Parsear tabela Markdown é frágil; um documento para humanos vira formato de máquina por acidente |
| **Deixar para a Fase 4** | O grafo já está triplicado hoje. Adiar aumenta o número de cópias a reconciliar |

## Consequências

**Positivas**

- `REQ-SWC-007` passa a ser testável: o teste carrega a mesma fonte que as skills.
- Emendar o grafo vira uma edição, não três.
- O validador da Fase 4 herda a autoridade pronta.
- `BLOCKED` e `CANCELLED` — hoje incompletos no grafo, questão Q3 — ganham um lugar definido para serem especificados.

**Negativas**

- Mais um arquivo a manter em sincronia com `architecture.md`. **Mitigação:** um teste que compare a tabela do documento com o JSON, falhando quando divergirem. Vira tarefa de `0007`.
- Skills continuam repetindo trechos do grafo por legibilidade. **Mitigação:** o `SKILL.md` deve marcar a repetição como cópia de conveniência e apontar o arquivo como autoridade.

## Limite desta decisão

**Um arquivo de dados não faz uma skill obedecer.** Skills são instrução em linguagem natural; o JSON não as impede de aplicar uma transição inválida.

O que ele muda é que a desobediência passa a ser **detectável**: um `status.yaml` com transição fora do grafo falha na validação, em vez de depender de alguém notar. A aplicação mecânica chega com os hooks da Fase 4.
