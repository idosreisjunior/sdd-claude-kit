# Visão — SDD Claude Kit

## Por que este projeto existe

Claude Code consegue gerar e modificar grandes volumes de código. Em projetos complexos, quando todo o desenvolvimento acontece apenas em conversas, o resultado se degrada: requisitos ficam espalhados por sessões, decisões se perdem, implementações começam antes de a regra de negócio estar clara e ninguém consegue dizer qual código atende a qual requisito.

## O que queremos

Permitir que desenvolvedores usem Claude Code de forma **previsível, organizada e rastreável**, mantendo especificações, decisões, tarefas e critérios de aceite versionados junto ao código.

## Para quem

| Perfil | Dor principal |
| --- | --- |
| Desenvolvedor individual | Manter o Claude focado e retomar o trabalho depois |
| Desenvolvedor em projeto existente | Adicionar funcionalidade sem quebrar o legado |
| Líder técnico | Padronizar o processo e revisar antes da implementação |
| Mantenedor open source | Padronizar propostas e relacionar issue → spec → PR |

## Como

Uma camada de governança entre a intenção do usuário e a implementação do Claude, distribuída como plugin do Claude Code, com as especificações vivendo em `.specs/` — Markdown e YAML, no Git, ao lado do código.

## Como saberemos que funcionou

- Um desenvolvedor consegue executar o fluxo completo `init → … → archive` sem suporte externo.
- É possível responder "qual código e qual teste atendem a este requisito?" em segundos.
- Retomar um projeto após semanas não exige reler o histórico de conversas.
- O processo não é abandonado por ser burocrático demais — o modo `advisory` continua sendo usado.

## O que este projeto não é

Não é uma IDE. Não substitui o Claude Code. Não é SaaS. Não substitui Jira, Linear ou GitHub Projects. Não hospeda código. Não coleta telemetria.

## Tensão central a administrar

Rigor suficiente para gerar rastreabilidade real, **sem** transformar cada mudança pequena em burocracia. Toda decisão de produto deve ser avaliada contra essa tensão. Quando em dúvida, escolha o caminho que mantém o framework opcional e gradual.
