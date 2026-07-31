# ADR-003 — Parser de YAML das specs

- **Status:** Aceito
- **Data:** 2026-07-31
- **Origem:** questão arquitetural A4 (`architecture.md`) — parser de YAML das specs: dependência (js-yaml) vs. schema/parser próprio?
- **Decidido em:** TASK-FEAT-001

---

## Contexto

A feature 0002 precisa **ler** `.specs/index.yaml` (e, adiante, `status.yaml`) para
listar e acompanhar as mudanças. Esses arquivos:

- são **editados à mão** (o SDD prega arquivos como fonte de verdade, legíveis);
- são gerados também pela **CLI do plugin**, não só pela extensão;
- usam recursos de YAML além de pares simples (listas de mapas, escalares de
  bloco `>-`, comentários).

Um parser próprio minimalista teria que cobrir esse subconjunto de forma
confiável — e falhar em silêncio num arquivo válido porém fora do previsto seria
pior que não ler: a lista de features apareceria incompleta sem aviso.

A tensão: acoplar uma dependência de runtime (peso no `.vsix`) **contra** implementar
e manter um parser frágil.

## Decisão

**Usar `js-yaml` (dependência de runtime) para ler os YAML das specs.** A leitura
fica isolada em `src/sdd/specsIndex.ts`, pura e testável, e é **robusta por
contrato**: YAML inválido ou estrutura inesperada resultam em lista vazia, nunca
em exceção que quebre o painel (NFR-FEAT-001).

O empacotamento **inclui as dependências de produção** (`vsce package` sem
`--no-dependencies`); não se adota bundler nesta fase.

## Alternativas consideradas

| Alternativa | Por que não |
| --- | --- |
| Parser/reader próprio, sem dependência | Frágil contra YAML válido fora do subconjunto previsto; arquivos editados à mão e gerados pela CLI aumentam a variedade; risco de leitura incompleta silenciosa |
| `js-yaml` empacotado com bundler (esbuild) agora | Introduz um sistema de build novo antes de ser necessário; `js-yaml` é pequeno e incluir `node_modules` de produção basta na Fase 1 |
| Ler via um comando da CLI do plugin | Acopla a extensão à presença/execução da CLI, o que o produto evita (a extensão funciona como camada própria) |

## Consequências

**Positivas**

- Leitura robusta e padrão de YAML; sem parser artesanal para manter.
- Lógica testável fora do host (5 casos em `specsIndex.test.ts`, incluindo YAML inválido).

**Negativas**

- Vira **dependência de runtime**: o `.vsix` precisa incluí-la. **Mitigação:** o
  script `package` usa `vsce package` **sem** `--no-dependencies` (padrão inclui
  `dependencies`); qualquer empacotamento manual deve seguir o mesmo — ver
  TASK-FEAT-009. Empacotar com `--no-dependencies` quebraria a extensão em runtime.
- Pequeno aumento de tamanho do pacote. **Mitigação:** reavaliar um bundler na
  feature 0010 (publicação) se o tamanho passar a importar.

## Limite desta decisão

Cobre **ler** YAML. **Escrever** YAML (criação de feature, RF-003 / TASK-FEAT-006)
decide o formato de serialização na tarefa correspondente — `js-yaml` também
serializa, mas o layout gerado precisa casar com o dos templates da CLI.
