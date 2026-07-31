# ADR-001 — Origem dos templates de inicialização

- **Status:** Aceito
- **Data:** 2026-07-31
- **Origem:** Q2 da spec de `0001-project-foundation` — a inicialização (RF-001) deve embutir cópias próprias dos templates ou depender do plugin sdd-kit instalado?
- **Decidido em:** TASK-FOUND-009

---

## Contexto

Quando o usuário aciona "Inicializar SDD" (RF-001), a extensão precisa escrever a
estrutura `.specs` (config, índice, documentos de projeto) a partir de um conjunto
de templates. Esses templates já existem no monorepo, mantidos pelo plugin Claude
Code em `plugins/sdd-kit/templates/<idioma>/`.

A decisão está entre duas forças em tensão:

- **Fonte única da verdade.** Os templates do plugin são a referência canônica.
  Ter uma segunda cópia divergente produziria projetos inicializados pela
  extensão diferentes dos inicializados pela CLI — uma violação silenciosa de
  "a estrutura criada funciona também pelo terminal" (RF-001) e de "CLI como
  base" (PRD §7.6).

- **Robustez e independência.** A extensão precisa funcionar em Windows, Linux e
  WSL (RNF-002), possivelmente offline, e **sem** garantia de que o plugin
  sdd-kit esteja instalado — a extensão é um ponto de entrada alternativo, não um
  cliente do plugin. Descobrir o caminho de instalação de um plugin do Claude
  Code (`~/.claude/plugins/...`, versionado/hasheado) é comportamento não
  documentado, exatamente o tipo de dependência que o risco "Dependência do
  Claude Code" (PRD §21) manda evitar.

O que torna a decisão difícil: a opção mais robusta (embutir) é também a que mais
arrisca divergência; a opção que melhor preserva a fonte única (ler do plugin) é
a mais frágil em runtime.

## Decisão

**Embutir os templates no pacote da extensão (`.vsix`), tratando
`plugins/sdd-kit/templates/` como a fonte única da verdade no monorepo e
copiando-os para dentro da extensão por um passo de build (`sync-templates`).**

Em concreto:

1. A extensão lê os templates de um diretório próprio empacotado (ex.:
   `dist/templates/<idioma>/`), nunca de um caminho de instalação do plugin.
2. Esse diretório **não** é editado à mão: é gerado por um script
   `npm run sync-templates` que copia de `../plugins/sdd-kit/templates/`.
3. Um verificador em CI falha o build se a cópia embutida divergir da fonte, de
   modo que a duplicação nunca vira divergência.
4. A inicialização **não exige** o plugin sdd-kit instalado nem o Claude Code em
   execução.

## Alternativas consideradas

| Alternativa | Por que não |
| --- | --- |
| Depender do plugin sdd-kit instalado (ler os templates do diretório de plugins do Claude Code em runtime) | Caminho de instalação não é contrato público (versionado/hasheado, varia por SO e por WSL); quebra offline e quando o plugin não está instalado; acopla a extensão a comportamento não documentado (PRD §21) |
| Embutir cópias mantidas à mão, sem sincronização | Divergência inevitável entre os templates da extensão e os do plugin; projetos inicializados pela extensão deixariam de casar com os da CLI, violando RF-001 e PRD §7.6 |
| Extrair os templates para um pacote npm compartilhado, consumido por plugin e extensão | Peso desproporcional para a Fase 1: publica/gerencia um pacote antes de haver necessidade; reavaliar quando houver um terceiro consumidor (ex.: o CLI da Fase 5) |

## Consequências

**Positivas**

- A inicialização funciona offline, em Windows/Linux/WSL, sem o plugin nem o
  Claude Code presentes (RNF-002, PRD §7.6).
- Comportamento determinístico: a versão dos templates é fixada no momento do
  build do `.vsix`, sem descoberta frágil em runtime.
- Sem acoplamento ao layout de instalação de plugins do Claude Code.
- Testável: o initializer recebe um diretório de templates local e conhecido.

**Negativas**

- Os templates ficam duplicados no `.vsix`. **Mitigação:** `sync-templates` +
  verificação em CI garantem que a cópia embutida é idêntica à fonte; a cópia
  nunca é editada à mão.
- A versão dos templates é pinada no build — uma atualização dos templates do
  plugin só chega ao usuário com uma nova versão da extensão. **Mitigação:**
  registrar a versão/commit dos templates embutidos no `package.json` (ou num
  `templates.version`) e sincronizar a cada release; cabe ao mantenedor da
  extensão.

## Limite desta decisão

Esta decisão cobre **de onde vêm os templates da inicialização**, não **como** o
comando de inicialização exibe a prévia, pede confirmação ou evita sobrescrever
código — isso é a `TASK-FOUND-005`. Também não decide o mecanismo de
empacotamento do `.vsix` (`tsc` puro vs. bundler), que segue como questão
arquitetural aberta A1 em `architecture.md`.
