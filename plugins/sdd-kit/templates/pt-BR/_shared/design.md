# Design técnico: {{CHANGE_TITLE}}

- **ID:** {{CHANGE_ID}}
- **Escopo dos identificadores:** {{ID_SCOPE}}
- **Estado:** ver `status.yaml` — a autoridade é ele

{{guia: este documento descreve o **como** — a spec descreve o **o quê** e o **por
quê**. Escreva o design a partir de uma spec já clarificada (`CLARIFIED`). Decisão
arquitetural relevante vira um ADR no diretório `decisions/`, não prosa aqui. Onde
faltar informação, registre a lacuna como questão, nunca preencha em silêncio. Ver
constitution.md, Art. 2.}}

---

## 1. Contexto

{{guia: o problema técnico a resolver e o estado atual do código que a mudança toca.
Uma ou duas frases; o detalhe de motivação está na spec.}}

## 2. Solução proposta

{{guia: a abordagem escolhida, em alto nível, antes de descer aos componentes. Se
houver mais de um caminho viável, o escolhido vai aqui e os demais na seção de
alternativas, com o motivo da recusa.}}

## 3. Componentes afetados

{{guia: os módulos, arquivos ou serviços que a mudança cria ou altera, e o papel de
cada um. Respeite os limites de módulo de architecture.md.}}

## 4. Contratos e interfaces

{{guia: as assinaturas públicas novas ou alteradas — funções, endpoints, comandos,
eventos — com entradas, saídas e erros. É a fronteira onde um mal-entendido vira bug.}}

## 5. Fluxo de dados

{{guia: como os dados percorrem os componentes, do gatilho ao efeito. Um diagrama em
texto costuma valer mais que um parágrafo.}}

## 6. Persistência

{{guia: o que é gravado, onde e em que formato; migrações de dados, se houver. "Nada
é persistido" é uma resposta válida — escreva-a em vez de omitir a seção.}}

## 7. Dependências

{{guia: bibliotecas, serviços e outras mudanças de que esta depende. Uma dependência
nova é uma decisão: justifique ou registre um ADR.}}

## 8. Segurança

{{guia: entradas não confiáveis, dados sensíveis, autenticação, autorização e limites.
Trate como não confiável tudo que vem de fora do processo.}}

## 9. Observabilidade

{{guia: como se sabe que funcionou e como se diagnostica quando não funciona — logs,
métricas, mensagens de erro acionáveis (RNF-007).}}

## 10. Estratégia de testes

{{guia: o que cada nível de teste cobre e o que fica de fora, com o motivo. Todo
comportamento especificado tem teste (standards §7); o que só dá para verificar por
revisão vira `gaps` na rastreabilidade, não cobertura aparente.}}

## 11. Migração e rollback

{{guia: como a mudança entra sem quebrar o que existe e como se desfaz se der errado.
"Não requer migração" é uma resposta válida — declare-a.}}

## 12. Riscos

{{repetir: um risco por linha, cada um com a sua **mitigação**. Um risco sem mitigação
declarada é um risco aceito em silêncio.

- Risco: … — Mitigação: …}}

## 13. Alternativas consideradas

{{repetir: uma alternativa por bloco, cada uma com o **motivo da recusa**. Listar a
alternativa sem dizer por que foi descartada não registra a decisão — só a enfeita.

- Alternativa: … — Por que não: …}}

## 14. Questões fechadas pelo design

{{guia: as questões da spec que este design resolve, com a decisão tomada. Se uma
decisão for arquitetural, aponte o ADR que a formaliza.}}

## 15. Questões ainda em aberto

{{guia: o que este design deliberadamente não decide, com a prioridade e o que fica
bloqueado. Uma questão crítica em aberto impede a promoção a `DESIGNED`.}}
