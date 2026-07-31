# ADR-008 — Contagem de tokens: heurística local, rotulada como estimativa

- **Status:** Aceito
- **Data:** 2026-07-31
- **Origem:** questão arquitetural **A3** (`architecture.md` §10) — "Estratégia de contagem
  de tokens (heurística local vs. tokenizer real)"; questão Q1 da spec de 0005.
- **Decidido em:** TASK-CTX-001

---

## Contexto

O Context Guardian (RF-012) precisa de um número de tokens para classificar o contexto nas
faixas do PRD (§13.3). Há três caminhos:

- **Heurística local** — estimar por comprimento do texto (ex.: ~4 caracteres por token).
  Determinística, instantânea, sem dependências. É uma **aproximação**.
- **Tokenizer real** (ex.: `tiktoken`/BPE) — mais preciso, mas: (a) o tokenizer exato do
  Claude não é público e varia por modelo; (b) traria uma dependência nativa/pesada ao
  `.vsix` (tensão com a questão A1 de empacotamento); (c) ainda seria uma estimativa do que
  o Claude Code de fato carrega.
- **Número real do Claude Code** — só existiria após a execução e por captura de sessão, que
  o ADR-007 (feature 0004) colocou fora do escopo atual.

O PRD já registra o risco "medição de tokens imprecisa" e manda **diferenciar estimativas de
valores reais**. As restrições do produto (RNF-003 sem rede, RNF-004 sem telemetria) reforçam
uma solução **local**.

## Decisão

**Usar uma heurística local, determinística, sempre rotulada como estimativa.** A estimativa
é proporcional ao comprimento do texto (`estimateTokens(text) = ceil(chars / 4)` como ponto
de partida), calculada offline, sem tokenizer nativo e sem rede. Todo lugar que exibe o valor
o marca como **estimativa** (nunca "tokens exatos").

Arquivos **binários** não são estimados (não são texto de contexto útil e enviesariam a
contagem): são detectados e sinalizados, não somados. Arquivos **grandes** são sinalizados
pelo tamanho (`stat`), sem serem lidos por inteiro (NFR-CTX-004).

## Alternativas consideradas

| Alternativa | Por que não (agora) |
| --- | --- |
| Tokenizer BPE real (tiktoken) | Tokenizer do Claude não é público e varia por modelo; dependência nativa pesada (tensiona A1); ainda seria estimativa do que o modelo carrega |
| Número real via captura de sessão | Depende de captura de resultado, fora de escopo por ADR-007 (0004) |
| Contar palavras em vez de caracteres | Menos estável entre idiomas e para código; caracteres/4 é a heurística usual e simples |

## Consequências

**Positivas**

- Instantânea, offline, sem dependência nova — coerente com RNF-003/RNF-004 e com A1.
- Determinística e testável fora do host (núcleo puro).
- Honesta: sempre estimativa, alinhada ao risco do PRD.

**Negativas**

- Imprecisa por natureza. **Mitigação:** rótulo "estimativa" em toda exibição; a
  classificação em faixas tolera erro (o objetivo é alertar de aproximação do teto, não
  cobrar exatidão).
- A constante `chars/4` pode não valer para todo conteúdo. **Mitigação:** isolada em uma
  função pura, fácil de calibrar; um tokenizer melhor pode substituí-la sem mudar a interface.

## Limite desta decisão

Cobre a **estimativa do incremento 0005**. Não fecha a porta para um tokenizer melhor nem
para o número real vindo do Claude Code (feature futura / evolução de 0008); apenas fixa que,
por ora, a contagem é uma **heurística local rotulada como estimativa**.
