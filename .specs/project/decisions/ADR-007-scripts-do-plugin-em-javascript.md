# ADR-007 — Scripts do plugin em JavaScript com JSDoc; CLI em TypeScript compilado

- **Status:** Aceito
- **Data:** 2026-07-29
- **Origem:** questão Q6 de `0001-plugin-foundation`; questão A1 de `architecture.md`; decisão pendente registrada em [ADR-004](./ADR-004-typescript.md)
- **Decidido em:** `TASK-PF-011`

## Contexto

[ADR-004](./ADR-004-typescript.md) escolheu TypeScript para scripts e CLI, mas deixou explicitamente em aberto **como** os scripts embarcados no plugin seriam entregues: TypeScript compilado para JS, ou JS puro.

A resposta depende de uma restrição da plataforma apurada em `TASK-PF-001`:

- Plugins de marketplace são **copiados para um cache** (`~/.claude/plugins/cache`) exatamente como estão no repositório.
- **Não existe passo de instalação nem de build.** Nada executa `npm install` ou `tsc` quando o usuário instala o plugin.
- O padrão documentado para instalar dependências é um hook `SessionStart`. Mas hooks são **opt-in e desativados por padrão** — Artigo 9 da constituição e RNF-003. Depender de hook para o framework funcionar contradiria a própria política de segurança do projeto.

Ou seja: o que estiver em `plugins/sdd-kit/scripts/` precisa rodar **como está**, sem build e sem dependências instaladas.

A CLI (Fase 5) não tem essa restrição: é um pacote npm, e pacotes npm têm passo de build normal.

## Decisão

Separar por canal de distribuição, porque a restrição é diferente em cada um:

| Onde | Linguagem | Tipagem | Build |
| --- | --- | --- | --- |
| `plugins/sdd-kit/scripts/` | **JavaScript** (ESM) | JSDoc, verificada por `tsc --checkJs` | Nenhum |
| `packages/cli/` (Fase 5) | **TypeScript** | Nativa | `tsc`, no `prepublish` |

A CLI importa os scripts do plugin em vez de duplicar a lógica ([ADR-003](./ADR-003-cli-opcional.md)). TypeScript consome JS com tipos vindos de JSDoc sem fricção.

Os scripts do plugin **não podem ter dependências de runtime**. Parsing de YAML e validação de schema, quando forem necessários na Fase 4, usam a biblioteca padrão do Node ou código vendorizado — nunca `node_modules`.

## Alternativas consideradas

| Alternativa | Por que não |
| --- | --- |
| **TypeScript compilado, com `dist/` commitado** | Exige lembrar de recompilar a cada mudança; source e build divergem em silêncio. Pior: o usuário instala e audita código gerado, não o que os mantenedores escreveram — ruim para uma ferramenta que executa na máquina dele e cujo `SECURITY.md` promete transparência |
| **TypeScript com runtime (`tsx`, `bun`)** | Exige instalação na máquina do usuário. Elimina a barreira-zero de entrada que o [ADR-003](./ADR-003-cli-opcional.md) protege |
| **Build via hook `SessionStart`** | Contradiz o Artigo 9: hooks são opt-in. O framework não pode depender de algo que o usuário deve ligar |
| **TypeScript em tudo, sem scripts no plugin** | Empurraria toda validação para a CLI e a tornaria obrigatória — exatamente o que o [ADR-003](./ADR-003-cli-opcional.md) recusa |

## Consequências

**Positivas**

- O que o usuário lê é o que executa. Auditável sem build reverso.
- Zero passo de instalação: o plugin funciona assim que é copiado.
- Sem risco de divergência entre fonte e artefato — não há artefato.
- A tipagem de [ADR-004](./ADR-004-typescript.md) é preservada: `tsc --checkJs` valida JSDoc com o mesmo compilador e o mesmo rigor.

**Negativas**

- JSDoc é mais verboso que sintaxe TypeScript, especialmente em genéricos. **Mitigação:** os scripts do plugin são validadores pequenos e de baixa complexidade de tipos; o código com tipos elaborados vive na CLI, onde TypeScript é nativo.
- Duas linguagens no mesmo repositório. **Mitigação:** a fronteira é o diretório, não o arquivo — `plugins/` é JS, `packages/` é TS, e `standards.md` registra a regra.
- Proibir dependências de runtime nos scripts do plugin significa escrever à mão o que uma biblioteca resolveria. **Mitigação:** é o custo de não exigir instalação, e limita a superfície de supply chain de uma ferramenta que roda no ambiente de desenvolvimento do usuário.

## Limite desta decisão

Isto **não** decide como a Fase 4 fará parsing de YAML sem dependências. Node não traz parser de YAML na biblioteca padrão, e escrever um completo é inviável.

Os caminhos plausíveis — subconjunto de YAML suficiente para os arquivos do framework, biblioteca vendorizada e auditada, ou deixar o parsing a cargo da CLI opcional — precisam ser avaliados quando o validador for especificado. A restrição "sem dependências de runtime" está registrada aqui; a forma de cumpri-la, não.
