# Contexto técnico — {{PROJECT_NAME}}

> Resultado da descoberta automática. Revise antes de confiar.

Última atualização: {{DATE}} · Método: {{DISCOVERY_METHOD}}

{{guia: este documento é preenchido por /sdd-kit:init e /sdd-kit:discover. Toda
informação de que a descoberta não tem certeza deve aparecer marcada com
"> HIPÓTESE:" — ver constitution.md, Art. 2. Um contexto errado e confiante é
pior que um contexto incompleto e honesto.}}

---

## Estado atual

{{PROJECT_STATE}}

{{guia: uma frase sobre a maturidade do projeto — greenfield, em produção,
legado em manutenção. Isso muda o risco de toda mudança futura.}}

## Tipo de projeto

{{PROJECT_TYPE_DESCRIPTION}}

## Linguagens e tecnologias

| Item | Valor | Confiança |
| --- | --- | --- |
| Linguagem principal | {{MAIN_LANGUAGE}} | {{CONFIDENCE}} |
| Framework | {{FRAMEWORK}} | {{CONFIDENCE}} |
| Gerenciador de pacotes | {{PACKAGE_MANAGER}} | {{CONFIDENCE}} |
| Framework de testes | {{TEST_FRAMEWORK}} | {{CONFIDENCE}} |

{{repetir: uma linha por tecnologia detectada}}

{{guia: em "Confiança", use "detectado" quando houver evidência direta no
repositório, e "> HIPÓTESE:" quando for inferência.}}

## Estrutura de diretórios

| Caminho | Conteúdo |
| --- | --- |
| {{DIRECTORY}} | {{DIRECTORY_PURPOSE}} |

{{repetir: apenas os diretórios relevantes. Não liste a árvore inteira.}}

## Comandos

| Comando | Valor | Origem |
| --- | --- | --- |
| Build | {{BUILD_COMMAND}} | {{COMMAND_SOURCE}} |
| Teste | {{TEST_COMMAND}} | {{COMMAND_SOURCE}} |
| Lint | {{LINT_COMMAND}} | {{COMMAND_SOURCE}} |

{{guia: "Origem" é onde o comando foi encontrado — package.json, Makefile,
CI. Um comando sem origem identificável é hipótese, não detecção.

Comandos não detectados ficam como null em config.yaml. null significa NÃO
EXECUTADO, jamais "aprovado".}}

## Persistência e infraestrutura

{{PERSISTENCE}}

{{opcional: remover se o projeto não tiver banco de dados nem infraestrutura
própria}}

## Padrões de arquitetura observados

{{ARCHITECTURE_PATTERNS}}

{{guia: o que o código já faz, não o que deveria fazer. Convenções de
nomenclatura, camadas, organização por feature ou por tipo.}}

## Documentação existente

{{EXISTING_DOCS}}

## Riscos iniciais identificados

| # | Risco | Onde é tratado |
| --- | --- | --- |
| 1 | {{RISK}} | {{RISK_MITIGATION}} |

{{repetir: riscos observados durante a descoberta — ausência de testes,
dependências desatualizadas, acoplamento alto, código sem dono.

Se a descoberta não identificou riscos, diga isso explicitamente em vez de
deixar a tabela vazia.}}
