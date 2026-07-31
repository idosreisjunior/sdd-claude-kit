# ADR-004 — Criação de feature na extensão: escopo e serialização

- **Status:** Aceito
- **Data:** 2026-07-31
- **Origem:** questão Q1 (`spec.md`) — como o formulário de criação aloca id/slug e serializa o YAML de forma idêntica à CLI?
- **Decidido em:** TASK-FEAT-006

---

## Contexto

A skill `/sdd-kit:new` cria uma mudança fazendo três coisas que exigem **juízo de
linguagem** (um LLM): traduzir a descrição em pt-BR para um slug em inglês, inferir
o tipo (feature/bug/refactor/change) e **rascunhar a spec** — objetivo, contexto e
requisitos — a partir de um pedido em uma linha.

A extensão VS Code não tem um LLM à disposição no formulário. Se ela tentar imitar
esse comportamento, vai fazê-lo mal: um slug mal traduzido é permanente (dele deriva
o escopo dos identificadores) e uma spec com requisitos inventados viola o Art. 2 da
constituição ("nunca preencha a lacuna em silêncio").

Ao mesmo tempo, a mudança criada precisa ser **lida sem erro pela CLI** (REQ-FEAT-004,
NFR-FOUND-003). Dois arquivos YAML entram em jogo:

- `status.yaml` — arquivo novo, com comentários e aspas específicas nos campos de data;
- `index.yaml` — arquivo **existente**, com comentários e a entrada a ser acrescentada.

`js-yaml` (ADR-003) serializa YAML, mas `dump()` **descarta os comentários**, reordena
chaves e muda o estilo de aspas. Fazer `load()`→`dump()` do `index.yaml` destruiria o
cabeçalho comentado do arquivo e produziria um layout diferente do dos templates da CLI
— exatamente o que o ADR-003 deixou em aberto ("o layout gerado precisa casar com o dos
templates da CLI").

A tensão: **imitar a CLI (e errar nas partes que exigem um LLM)** contra **fazer só a
parte determinística bem-feita e delegar o resto**.

## Decisão

**O formulário da extensão é um scaffolder determinístico, não um substituto da skill
`/sdd-kit:new`.** Ele faz o que é mecânico e delega ao Claude Code (`/sdd-kit:spec`) o
que exige juízo.

1. **Slug e escopo são entradas do usuário**, não traduções automáticas. O formulário
   pede o slug (em inglês) e o escopo de identificadores; aplica o mesmo saneamento
   determinístico da skill (minúsculas, transliteração de acentos, espaços/`_`→`-`,
   remoção de `[^a-z0-9-]`, colapso de hifens, limite de 40) e valida o slug contra
   `^[a-z0-9]+(-[a-z0-9]+)*$` e o escopo contra `^[A-Z][A-Z0-9]*$`. Sugere um escopo
   padrão (primeira palavra do slug em maiúsculas), mas o usuário confirma.

2. **Alocação de id idêntica à skill (§5):** lê `next_id` do `index.yaml`, reconcilia
   com os nomes de diretório em `features/bugs/refactors/changes/archive`, e **para com
   erro** se algum id no disco for `>= next_id` (índice defasado por branches paralelos).
   Nunca escolhe um número por conta própria; nunca sobrescreve um diretório existente.

3. **Serialização por substituição de template, nunca por `dump()`.** O `status.yaml`
   nasce da substituição dos marcadores do template embutido (`{{CHANGE_ID}}`,
   `{{CHANGE_TYPE}}`, `{{CHANGE_TITLE}}`, `{{DATE}}`, `{{CREATION_REASON}}`) — reproduz o
   template da CLI byte a byte. A entrada do `index.yaml` é inserida por **edição textual
   cirúrgica**: acrescenta o bloco da mudança ao final da lista `changes:` (campos na
   ordem `id, type, title, status, path, created, updated`, datas entre aspas) e
   incrementa a linha `next_id`, **preservando** os comentários e o formato do arquivo.

4. **Arquivos criados são os mesmos da skill:** `request.md`, `status.yaml`, `spec.md`
   (do template do tipo) e o diretório `decisions/`. `tasks.md` e `traceability.yaml`
   **não** são criados aqui — vêm de `/sdd-kit:tasks`.

5. **A spec é instalada como template, não rascunhada.** Os marcadores mecânicos
   (`{{CHANGE_TITLE}}`, `{{CHANGE_ID}}`, `{{ID_SCOPE}}`) são substituídos; os blocos de
   requisito e `{{guia}}` permanecem para o usuário completar via `/sdd-kit:spec`. O
   `request.md` recebe o texto original **literal** do formulário.

## Alternativas consideradas

| Alternativa | Por que não |
| --- | --- |
| Formulário rascunha a spec (imita `/sdd-kit:new`) | Exige um LLM; sem ele, inventaria requisitos — viola Art. 2. Traduzir o slug e inferir o tipo também são juízo de linguagem |
| Serializar `index.yaml` com `js-yaml.dump()` | `dump()` descarta comentários, reordena chaves e muda aspas; o resultado não casa com o template da CLI (ADR-003) |
| Delegar a criação inteira ao Claude Code (chamar a skill) | Acopla FEAT-006 ao adapter 0004 (ainda não existe) e à presença do Claude Code; o produto quer a extensão como camada própria |
| Auto-derivar o escopo do slug | `FOUND` (de "foundation") e `FEAT` (de "feature-management") são abreviações humanas, não deriváveis mecanicamente |

## Consequências

**Positivas**

- A parte determinística (id, `status.yaml`, entrada do índice) é confiável e testável
  fora do host; a CLI lê o resultado sem erro.
- Preserva comentários e layout do `index.yaml` — o diff de criar uma feature é mínimo.
- Segue o precedente de FOUND-005: a extensão "instala templates"; o preenchimento
  profundo é delegado, não simulado.

**Negativas**

- A spec criada pelo formulário é **menos completa** que a de `/sdd-kit:new` (template
  cru vs. rascunho). **Mitigação:** o relatório de criação direciona explicitamente ao
  `/sdd-kit:spec` (Claude Code) para detalhar requisitos; `request.md` guarda o pedido.
- Marcadores `{{…}}` permanecem em `spec.md`/`request.md`. **Mitigação:** é deliberado e
  documentado; só os arquivos lidos por máquina (`status.yaml`, entrada do índice) têm
  garantia de completude.
- A edição textual do `index.yaml` é mais frágil que um round-trip. **Mitigação:** a
  inserção é coberta por testes (lista vazia, lista com itens, `next_id` incrementado) e
  a leitura de volta usa `js-yaml`, que reprova um arquivo corrompido.

## Limite desta decisão

Cobre a **criação determinística** de uma mudança pelo formulário. Não cobre o
rascunho inteligente da spec (delegado a `/sdd-kit:spec`), nem a inferência de tipo
(o usuário escolhe no formulário), nem a verificação de UI/FS no host — registrada
como evidência por TASK-FEAT-008 (F5).
