# Visão — sdd-claude-kit-vscode

> Derivada do PRD (`PRD.md`, §2, §3, §4, §26). A autoridade é o PRD.

## Por que este projeto existe

Ferramentas de desenvolvimento assistidas por IA geram código rápido, mas se
perdem em projetos grandes e sessões longas: contexto cresce sem controle,
requisitos se dispersam entre mensagens e código, arquivos fora do escopo são
alterados, e a implementação é dada como concluída sem evidência. O SDD Claude
Kit já resolve parte disso via CLI — mas o uso predominante pelo terminal
dificulta a adoção e o acompanhamento visual.

## O que queremos

Transformar o VS Code em um ambiente visual de desenvolvimento orientado por
especificações, no qual o desenvolvedor controla o que será construído, o que é
enviado ao modelo, o que já foi concluído e quais evidências comprovam a
aderência da implementação — sem depender de grandes prompts ou sessões longas.

## Para quem

| Perfil | Dor principal |
| --- | --- |
| Desenvolvedor individual | Organizar ideias, evitar perda de contexto, controlar tokens, validar o implementado |
| Tech lead | Revisar specs, ver progresso, impedir mudanças fora do escopo, verificar evidências |
| Equipe de desenvolvimento | Padronização, templates compartilhados, rastreabilidade, histórico de decisões |
| Empresas adotando IA | Governança, controle de custos, métricas e auditoria |

## Como

Uma camada de organização, controle, visualização e automação **sobre** o Claude
Code, o terminal, os arquivos `.specs`, o Git e o código — não um substituto do
Claude Code. Detalhe técnico em `architecture.md`.

## Como saberemos que funcionou

- Um usuário instala a extensão e inicializa um projeto sem comandos manuais.
- Uma feature é criada, especificada, decomposta em tarefas e validada contra
  requisitos, tudo pela interface.
- O fluxo continua funcionando **sem** a extensão, apenas com os arquivos e a CLI.
- (PRD §20) Pelo menos 70% dos usuários de teste concluem o fluxo sem ajuda.

## O que este projeto não é

- Não substitui o Claude Code, o Git/GitHub, nem é uma IDE independente (PRD §5).
- Não é um gerenciador de projetos no nível de Jira/Linear/Azure DevOps.
- Não garante tecnicamente que o modelo nunca ultrapasse seu limite de contexto.
- Não armazena código-fonte em servidores próprios.

## Tensão central a administrar

Amplitude do produto **contra** foco no ciclo SDD. O PRD lista 25 requisitos e um
ecossistema de longo prazo (§27); o risco explícito (§21) é competir ao mesmo
tempo com IDEs, gerenciadores de projeto e plataformas de IA. A mitigação é
manter o foco no ciclo SDD e na rastreabilidade, com experiência progressiva
(modo básico + avançado opcional).
