# Design técnico: {{CHANGE_TITLE}}

- **ID:** {{CHANGE_ID}}
- **Escopo dos identificadores:** {{ID_SCOPE}}
- **Estado:** ver `status.yaml` — a autoridade é ele

{{guia: este documento descreve o **como**. O **o quê** e o **porquê** vivem na
spec — não os repita aqui. Cada seção nasce como lacuna: preencha o que se
aplica e diga explicitamente o que não se aplica, com o motivo. Nunca apague uma
seção nem preencha uma lacuna com um palpite. Ver constitution.md, Art. 2.}}

---

## Visão da solução

> _A preencher no design._

{{guia: a ideia central da solução em poucas frases — a abordagem escolhida e
por quê, ligada aos requisitos da spec.}}

## Componentes afetados

> _A preencher no design._

{{guia: módulos, arquivos e limites tocados. O que é novo, o que muda, o que é
reusado.}}

## Fluxo de dados

> _A preencher no design._

{{guia: como a informação entra, é transformada e sai. Um diagrama em texto ou
uma sequência de passos.}}

## Contratos

> _A preencher no design._

{{guia: as interfaces entre componentes — tipos, formatos, invariantes. O que
cada lado promete e o que exige.}}

## APIs

> _A preencher no design._

{{guia: endpoints, comandos ou funções públicas expostas ou consumidas. Assine
entradas e saídas. "Não se aplica" é resposta válida — declare.}}

## Banco de dados

> _A preencher no design._

{{guia: esquema, migrações, índices, integridade. "Não se aplica" é resposta
válida — declare.}}

## Segurança

> _A preencher no design._

{{guia: superfície de ataque, autenticação, autorização, dados sensíveis,
segredos. Onde o humano precisa estar no controle (constituição, Art. 9).}}

## Tratamento de erros

> _A preencher no design._

{{guia: falhas previstas e a resposta a cada uma. O caminho de erro é onde os
defeitos moram — não o deixe implícito.}}

## Observabilidade

> _A preencher no design._

{{guia: logs, métricas, sinais que permitem saber que funciona — e diagnosticar
quando não funciona.}}

## Testes

> _A preencher no design._

{{guia: a estratégia de teste — o que é núcleo puro testável fora do host, o que
exige integração, o que fica como revisão manual (registre em `gaps`).}}

## Migração

> _A preencher no design._

{{guia: como sair do estado atual para o novo sem quebrar o que já existe. "Não
se aplica" é resposta válida — declare.}}

## Rollback

> _A preencher no design._

{{guia: como desfazer com segurança se algo der errado. "Não se aplica" é
resposta válida — declare.}}

## Riscos

> _A preencher no design._

{{guia: o que pode dar errado no design em si, e a mitigação de cada risco.}}

## Alternativas consideradas

> _A preencher no design._

{{guia: as abordagens descartadas e por quê. Uma decisão arquitetural relevante
vira um ADR em `decisions/`. Alternativas que quase venceram são as que alguém
vai propor de novo — registre-as.}}
