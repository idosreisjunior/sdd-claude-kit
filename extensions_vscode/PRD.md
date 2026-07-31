# PRD — SDD Claude Kit para Visual Studio Code

**Produto:** SDD Claude Kit — VS Code Extension
**Versão do documento:** 1.0
**Data:** 31 de julho de 2026
**Responsável pelo produto:** Ismael Júnior
**Modelo:** Open source com possibilidade de recursos premium
**Repositório-base:** `idosreisjunior/sdd-claude-kit`

---

## 1. Resumo executivo

O SDD Claude Kit para VS Code será uma extensão que adicionará uma interface visual ao fluxo de desenvolvimento orientado por especificações — Spec-Driven Development, ou SDD.

A extensão funcionará como um cockpit para organizar e acompanhar o ciclo completo de desenvolvimento:

**Ideia → Research → PRD → Especificação → Design técnico → Tarefas → Implementação → Testes → Evidências → Validação → Pull Request**

O produto não substituirá o Claude Code. Ele será uma camada de organização, controle, visualização e automação sobre o Claude Code, o terminal, os arquivos `.specs`, o Git e o código do projeto.

O principal objetivo é tornar o desenvolvimento com agentes de IA mais previsível, rastreável e eficiente, reduzindo problemas como:

* perda de contexto;
* implementações fora do escopo;
* sessões excessivamente longas;
* consumo desnecessário de tokens;
* ausência de documentação;
* dificuldade para acompanhar o progresso;
* falta de evidências de que os requisitos foram atendidos;
* alterações em arquivos não relacionados à tarefa;
* dificuldade para medir produtividade e economia gerada pela IA.

---

## 2. Visão do produto

Transformar o VS Code em um ambiente visual de desenvolvimento orientado por especificações, no qual o desenvolvedor consiga controlar o que será construído, quais informações serão enviadas ao modelo, quais tarefas foram concluídas e quais evidências comprovam a aderência da implementação.

A extensão deverá permitir que o usuário trabalhe com IA de forma estruturada, sem depender exclusivamente de grandes prompts ou longas sessões no terminal.

### Proposta de valor

> Desenvolver com Claude Code usando especificações, contexto controlado, tarefas pequenas, rastreabilidade e evidências verificáveis.

---

## 3. Problema

Ferramentas de desenvolvimento assistidas por IA conseguem gerar código rapidamente, mas apresentam dificuldades quando utilizadas em projetos grandes ou durante sessões prolongadas.

Os principais problemas são:

1. O modelo perde detalhes importantes ao longo da sessão.
2. O contexto cresce sem controle e aumenta o consumo de tokens.
3. O agente pode alterar arquivos não relacionados à demanda.
4. Requisitos ficam dispersos entre mensagens, documentos e código.
5. Não existe uma visão clara do progresso da implementação.
6. É difícil saber quais requisitos já foram atendidos.
7. Testes podem ser criados sem relação direta com critérios de aceite.
8. O desenvolvedor não consegue medir facilmente o ganho de produtividade.
9. O histórico das decisões fica preso na conversa do agente.
10. A implementação pode ser considerada concluída sem evidências suficientes.

O SDD Claude Kit resolve parte desses problemas por meio de comandos, agentes, templates, hooks e arquivos estruturados. Entretanto, o uso predominantemente pelo terminal pode dificultar a adoção por desenvolvedores menos familiarizados com o fluxo ou por equipes que precisam acompanhar visualmente o projeto.

---

## 4. Objetivos

### 4.1 Objetivo principal

Criar uma extensão para VS Code que permita gerenciar visualmente projetos desenvolvidos com SDD Claude Kit e Claude Code.

### 4.2 Objetivos específicos

* Facilitar a criação e manutenção de especificações.
* Organizar o desenvolvimento por features.
* Manter rastreabilidade entre requisitos, tarefas, código, testes e evidências.
* Controlar o tamanho do contexto enviado ao Claude Code.
* Dividir implementações grandes em tarefas menores.
* Exibir o progresso de cada feature.
* Evitar alterações fora do escopo.
* Registrar decisões técnicas importantes.
* Medir consumo de tokens, tempo e produtividade.
* Integrar o fluxo de especificações ao Git e ao GitHub.
* Tornar o SDD acessível a desenvolvedores que preferem uma interface visual.
* Preservar a compatibilidade com o fluxo atual via terminal.

---

## 5. Não objetivos

A primeira versão não terá como objetivo:

* substituir o Claude Code;
* criar um novo modelo de linguagem;
* oferecer um editor de código próprio;
* substituir Git ou GitHub;
* executar deploy em produção;
* gerenciar infraestrutura completa;
* funcionar como uma IDE independente;
* garantir tecnicamente que um modelo nunca ultrapasse seu limite de contexto;
* oferecer gerenciamento completo de projetos no nível de Jira, Azure DevOps ou Linear;
* armazenar código-fonte em servidores próprios do produto.

---

## 6. Público-alvo

### 6.1 Desenvolvedor individual

Utiliza Claude Code para desenvolver projetos pessoais, produtos SaaS, automações ou projetos open source.

**Necessidades:**

* organizar ideias;
* gerar especificações;
* evitar perda de contexto;
* acompanhar tarefas;
* controlar tokens;
* validar o que foi implementado.

### 6.2 Tech lead

Coordena desenvolvedores e precisa garantir que o código gerado por IA siga requisitos e padrões técnicos.

**Necessidades:**

* revisar especificações;
* visualizar progresso;
* identificar bloqueios;
* acompanhar decisões;
* verificar evidências;
* impedir mudanças fora do escopo.

### 6.3 Equipe de desenvolvimento

Utiliza IA em diferentes partes do projeto e precisa manter consistência entre os trabalhos realizados.

**Necessidades:**

* padronização;
* templates compartilhados;
* revisão;
* rastreabilidade;
* colaboração;
* histórico de decisões.

### 6.4 Empresas que adotam desenvolvimento com IA

Precisam de governança, controle de custos e métricas sobre a utilização de agentes.

**Necessidades:**

* métricas de produtividade;
* auditoria;
* controle de contexto;
* relatórios;
* políticas de segurança;
* gerenciamento de times.

---

## 7. Princípios do produto

### 7.1 Spec first

Nenhuma implementação relevante deve começar sem uma especificação mínima.

### 7.2 Contexto mínimo necessário

O agente deve receber apenas os arquivos, requisitos e informações necessários para executar a tarefa atual.

### 7.3 Tarefas pequenas

Features grandes devem ser divididas em tarefas menores, verificáveis e independentes sempre que possível.

### 7.4 Evidência antes de conclusão

Uma tarefa não deve ser considerada concluída somente porque o agente afirmou que terminou.

### 7.5 Humano no controle

O usuário deve visualizar, revisar e aprovar as principais decisões.

### 7.6 CLI como base

Os arquivos e comandos devem continuar funcionando sem a interface da extensão.

### 7.7 Arquivos como fonte de verdade

As especificações devem permanecer no repositório, em formato legível, versionável e independente de serviços externos.

---

## 8. Fluxo principal

Cada feature seguirá preferencialmente o fluxo:

1. Solicitação
2. Research
3. Clarificações
4. Especificação
5. Aprovação
6. Design técnico
7. Geração de tarefas
8. Implementação
9. Testes
10. Coleta de evidências
11. Validação
12. Pull Request
13. Conclusão

O fluxo poderá ser adaptado de acordo com o tamanho e a complexidade da feature.

---

## 9. Estrutura de uma feature

Cada feature deverá possuir uma pasta própria dentro de `.specs`.

Exemplo:

```text
.specs/
├── constitution.md
├── architecture.md
├── patterns.md
├── settings.yaml
└── features/
    └── 001-authentication/
        ├── request.md
        ├── research.md
        ├── spec.md
        ├── clarifications.md
        ├── design.md
        ├── tasks.md
        ├── evidence.md
        ├── validation.md
        └── status.yaml
```

### Documentos principais

**request.md**
Registra a solicitação original e o problema que precisa ser resolvido.

**research.md**
Registra pesquisas, referências técnicas, limitações, alternativas e descobertas.

**spec.md**
Contém requisitos funcionais, regras, critérios de aceite e restrições.

**clarifications.md**
Registra perguntas, respostas, premissas e decisões tomadas antes da implementação.

**design.md**
Descreve a solução técnica, componentes, fluxos, integrações e impactos.

**tasks.md**
Apresenta a decomposição da implementação em tarefas executáveis.

**evidence.md**
Armazena testes executados, capturas, logs, arquivos alterados e outras evidências.

**validation.md**
Compara a implementação com os requisitos e critérios de aceite.

**status.yaml**
Mantém o estado estruturado da feature.

---

## 10. Status das features

A extensão deverá suportar os seguintes status:

* Draft
* Em Research
* Clarificando
* Aguardando aprovação
* Aprovada
* Em desenvolvimento
* Bloqueada
* Em validação
* Concluída
* Cancelada

Cada mudança de status deverá registrar:

* data e hora;
* usuário responsável;
* status anterior;
* novo status;
* motivo ou observação;
* commit relacionado, quando disponível.

---

# 11. Requisitos funcionais

## RF-001 — Inicialização do projeto

A extensão deverá identificar se o projeto possui o SDD Claude Kit configurado.

Quando não estiver configurado, deverá oferecer uma ação para:

* criar a pasta `.specs`;
* instalar templates;
* criar arquivos de constituição, arquitetura e padrões;
* criar configurações iniciais;
* detectar o Claude Code;
* detectar o Git;
* validar a estrutura do projeto.

### Critérios de aceite

* O usuário consegue iniciar o SDD em um projeto existente.
* Nenhum arquivo de código é sobrescrito.
* A extensão mostra previamente os arquivos que serão criados.
* A estrutura criada funciona também pelo terminal.

---

## RF-002 — Project Doctor

A extensão deverá analisar a saúde do projeto e identificar:

* arquivos obrigatórios ausentes;
* especificações incompletas;
* tarefas sem critérios de aceite;
* referências para arquivos inexistentes;
* features sem status;
* divergências entre tarefas e especificação;
* documentos desatualizados;
* arquivos `.specs` inválidos;
* configuração incorreta do Claude Code;
* ausência de Git;
* branches ou alterações pendentes que possam gerar risco.

O resultado deverá ser apresentado em um painel semelhante ao sistema de Problems do VS Code.

---

## RF-003 — Criação de feature

O usuário deverá conseguir criar uma feature por meio de um formulário.

Campos:

* título;
* descrição;
* problema;
* objetivo;
* valor de negócio;
* prioridade;
* tipo da demanda;
* dependências;
* arquivos ou módulos relacionados;
* restrições;
* observações.

A extensão deverá:

1. gerar um identificador numérico;
2. criar a pasta da feature;
3. criar os documentos iniciais;
4. registrar o status como Draft;
5. exibir a feature na árvore lateral.

---

## RF-004 — Gerenciamento visual de features

A barra lateral deverá apresentar:

* visão do projeto;
* constituição;
* arquitetura;
* padrões;
* configurações;
* lista de features;
* status;
* prioridade;
* progresso;
* bloqueios;
* tarefas pendentes.

O usuário deverá poder filtrar por:

* status;
* prioridade;
* responsável;
* data;
* tag;
* módulo;
* feature concluída ou pendente.

---

## RF-005 — Dashboard da feature

Cada feature deverá possuir um dashboard contendo:

* objetivo;
* valor de negócio;
* status;
* progresso geral;
* quantidade de requisitos;
* quantidade de critérios de aceite;
* quantidade de tarefas;
* tarefas concluídas;
* bloqueios;
* última atividade;
* arquivos relacionados;
* commits relacionados;
* testes executados;
* evidências;
* histórico;
* consumo estimado de tokens;
* tempo estimado e tempo utilizado.

---

## RF-006 — Editor de especificações

A extensão deverá oferecer edição visual e edição Markdown para:

* solicitação;
* research;
* especificação;
* clarificações;
* design técnico;
* tarefas;
* evidências;
* validação.

O usuário poderá alternar entre:

* formulário estruturado;
* Markdown;
* visualização renderizada;
* comparação de versões.

---

## RF-007 — Research assistido

O usuário deverá poder iniciar uma etapa de research antes da especificação.

O research poderá analisar:

* estrutura do projeto;
* arquivos relacionados;
* dependências;
* padrões existentes;
* documentação local;
* riscos;
* soluções já implementadas;
* APIs e integrações relevantes.

A extensão deverá permitir revisar o material coletado antes de incorporá-lo à especificação.

---

## RF-008 — Clarificação da especificação

A extensão deverá analisar a especificação e identificar:

* requisitos ambíguos;
* critérios de aceite ausentes;
* conflitos;
* regras incompletas;
* casos extremos;
* dependências não definidas;
* decisões técnicas prematuras;
* riscos de segurança;
* impactos em dados.

As respostas deverão ser registradas em `clarifications.md`.

---

## RF-009 — Geração do design técnico

A partir da especificação aprovada, a extensão deverá gerar ou auxiliar na geração do design técnico.

O documento deverá contemplar:

* visão da solução;
* componentes afetados;
* fluxo de dados;
* contratos;
* APIs;
* banco de dados;
* segurança;
* tratamento de erros;
* observabilidade;
* testes;
* migração;
* rollback;
* riscos;
* alternativas consideradas.

---

## RF-010 — Geração de tarefas

A extensão deverá decompor o design em tarefas pequenas.

Cada tarefa deverá possuir:

* identificador;
* título;
* descrição;
* arquivos prováveis;
* dependências;
* requisitos relacionados;
* critérios de conclusão;
* testes esperados;
* complexidade;
* status;
* evidências necessárias.

A extensão deverá impedir ou alertar sobre tarefas excessivamente grandes.

---

## RF-011 — Execução pelo Claude Code

A extensão deverá integrar-se ao Claude Code por meio do terminal do VS Code.

Ações disponíveis:

* abrir feature no Claude Code;
* copiar prompt da feature;
* executar research;
* gerar especificação;
* clarificar especificação;
* gerar design;
* gerar tarefas;
* implementar próxima tarefa;
* validar tarefa;
* validar feature;
* revisar código;
* gerar evidências.

Antes da execução, a extensão deverá exibir:

* objetivo da ação;
* arquivos que serão enviados;
* tamanho estimado do contexto;
* limite configurado;
* instruções utilizadas;
* tarefa ativa.

---

## RF-012 — Context Guardian

O Context Guardian será responsável por controlar o contexto usado em cada execução.

Deverá:

* estimar o tamanho do contexto;
* identificar arquivos desnecessários;
* sugerir resumos;
* priorizar documentos importantes;
* impedir inclusão acidental de arquivos grandes;
* detectar arquivos binários;
* separar tarefas quando o contexto estiver excessivo;
* registrar o contexto utilizado;
* alertar sobre aproximação do limite;
* permitir limites diferentes por modelo.

Faixas sugeridas:

* até 70%: normal;
* entre 70% e 85%: atenção;
* entre 85% e 95%: risco;
* acima de 95%: bloquear ou solicitar ação do usuário.

O limite deverá ser configurável. O usuário poderá utilizar, por exemplo, um teto operacional de 200 mil tokens, mesmo quando o modelo permitir um contexto maior.

---

## RF-013 — Context packs

A extensão deverá permitir criar conjuntos reutilizáveis de contexto.

Exemplos:

* autenticação;
* banco de dados;
* frontend;
* padrões de API;
* testes;
* segurança;
* arquitetura;
* observabilidade.

Cada context pack poderá conter:

* arquivos;
* trechos;
* regras;
* documentação;
* resumos;
* referências.

---

## RF-014 — Detecção de mudanças fora do escopo

Após cada implementação, a extensão deverá comparar:

* arquivos planejados;
* arquivos efetivamente modificados;
* requisitos da tarefa;
* diff do Git.

A extensão deverá alertar quando:

* arquivos não previstos forem alterados;
* houver remoção de código não solicitada;
* uma tarefa modificar módulos não relacionados;
* o diff ultrapassar um limite configurado;
* forem introduzidas novas dependências;
* arquivos sensíveis forem alterados.

---

## RF-015 — Rastreabilidade

A extensão deverá permitir navegar entre:

* requisito;
* critério de aceite;
* tarefa;
* arquivo;
* linha de código;
* teste;
* commit;
* evidência;
* Pull Request.

Cada requisito deverá possuir um identificador único.

Exemplo:

```text
REQ-001 → TASK-003 → auth-service.ts → auth-service.test.ts → commit abc123
```

---

## RF-016 — Acceptance Evidence

A extensão deverá coletar e organizar evidências da implementação.

Tipos de evidência:

* testes automatizados;
* resultado de lint;
* resultado de build;
* cobertura;
* capturas de tela;
* logs;
* resposta de API;
* consultas SQL;
* diff de arquivos;
* commits;
* validação manual;
* checklist.

Uma tarefa somente poderá ser marcada como concluída sem evidência quando o usuário fizer uma confirmação explícita.

---

## RF-017 — Validação da feature

A extensão deverá comparar a implementação final com:

* requisitos;
* critérios de aceite;
* design;
* tarefas;
* testes;
* evidências.

A validação deverá classificar cada requisito como:

* atendido;
* parcialmente atendido;
* não atendido;
* não testado;
* não aplicável.

O relatório deverá destacar pendências e divergências.

---

## RF-018 — Integração com Git

A extensão deverá identificar:

* branch atual;
* arquivos alterados;
* commits;
* diferenças;
* conflitos;
* arquivos não rastreados.

A extensão poderá sugerir:

* nome da branch;
* mensagem de commit;
* divisão de commits;
* arquivos que pertencem à tarefa;
* atualização da documentação.

Nenhum commit deverá ser realizado automaticamente sem autorização explícita.

---

## RF-019 — Integração com GitHub

Em uma etapa posterior ao MVP, a extensão deverá permitir:

* criar issue a partir da feature;
* associar issue existente;
* criar branch;
* criar Pull Request;
* gerar descrição do PR;
* incluir requisitos e evidências;
* acompanhar revisão;
* importar comentários;
* atualizar o status da feature.

---

## RF-020 — Histórico e decisões

A extensão deverá manter um histórico de:

* alterações na especificação;
* aprovações;
* mudanças de status;
* execuções do Claude Code;
* contexto utilizado;
* decisões técnicas;
* tarefas concluídas;
* validações;
* erros;
* ações manuais.

Decisões importantes poderão ser registradas como ADRs — Architecture Decision Records.

---

## RF-021 — Métricas de produtividade

A extensão deverá medir, quando tecnicamente possível:

* tempo entre criação e conclusão da feature;
* tempo por etapa;
* número de tarefas;
* tarefas reabertas;
* quantidade de interações com o agente;
* tokens de entrada;
* tokens de saída;
* custo estimado;
* arquivos alterados;
* linhas adicionadas e removidas;
* testes criados;
* percentual de requisitos validados;
* quantidade de mudanças fora do escopo;
* falhas de build;
* retrabalho;
* tempo manual estimado;
* tempo economizado estimado.

As métricas de economia deverão ser apresentadas como estimativas, deixando clara a metodologia utilizada.

---

## RF-022 — Relatórios

A extensão deverá permitir gerar relatórios por:

* feature;
* projeto;
* período;
* desenvolvedor;
* equipe;
* modelo;
* tipo de tarefa.

Formatos:

* visualização no VS Code;
* Markdown;
* JSON;
* CSV;
* PDF em versões futuras.

---

## RF-023 — Templates

O usuário deverá poder utilizar templates para:

* aplicações web;
* APIs;
* microsserviços;
* análise de dados;
* SQL;
* inteligência artificial;
* aplicativos móveis;
* correção de bugs;
* refatoração;
* migração;
* integração;
* documentação.

As organizações poderão criar templates próprios em versões futuras.

---

## RF-024 — SQL Guard

O SQL Guard deverá revisar consultas SQL e identificar:

* ausência de filtros;
* risco de full scan;
* joins incorretos;
* duplicação de registros;
* divisão por zero;
* casts inseguros;
* tratamento inadequado de valores nulos;
* funções incompatíveis;
* riscos de custo;
* risco de alteração ou exclusão de dados;
* ausência de rollback.

Este módulo poderá ser disponibilizado depois da primeira versão do MVP.

---

## RF-025 — Criação de MCPs

Em uma etapa futura, a extensão poderá oferecer um assistente para criação de servidores MCP.

O fluxo deverá ajudar a definir:

* objetivo;
* ferramentas;
* recursos;
* schemas;
* autenticação;
* permissões;
* testes;
* documentação;
* publicação.

---

# 12. Requisitos não funcionais

## RNF-001 — Desempenho

* A extensão não deverá bloquear o editor durante análises.
* Processamentos demorados deverão ser executados de forma assíncrona.
* A árvore de features deverá carregar progressivamente.
* O monitoramento de arquivos deverá evitar consumo excessivo de CPU.

## RNF-002 — Compatibilidade

* Windows;
* Linux;
* macOS;
* VS Code;
* ambientes WSL;
* projetos locais;
* repositórios Git.

## RNF-003 — Segurança

* Nenhum código deverá ser enviado para serviços externos sem ação ou configuração explícita.
* Segredos deverão ser mascarados.
* Arquivos `.env`, chaves e credenciais deverão ser bloqueados por padrão.
* Comandos destrutivos deverão exigir confirmação.
* As permissões da extensão deverão ser mínimas.

## RNF-004 — Privacidade

No modo local:

* as especificações permanecerão no projeto;
* as métricas serão armazenadas localmente;
* não haverá telemetria obrigatória;
* o usuário poderá desativar toda coleta;
* os dados enviados ao Claude Code seguirão a configuração do próprio usuário.

## RNF-005 — Auditabilidade

As ações relevantes deverão produzir registros verificáveis, especialmente:

* comandos executados;
* arquivos utilizados;
* arquivos alterados;
* aprovações;
* validações;
* alterações de status.

## RNF-006 — Extensibilidade

A arquitetura deverá permitir novos módulos, validadores, templates e provedores de IA sem reescrever o núcleo da extensão.

## RNF-007 — Acessibilidade

* suporte à navegação por teclado;
* compatibilidade com temas claro e escuro;
* contraste adequado;
* textos alternativos;
* ícones acompanhados por descrições;
* suporte básico a leitores de tela.

---

# 13. Interface do produto

## 13.1 Activity Bar

A extensão deverá adicionar um ícone próprio à barra lateral do VS Code.

Seções:

```text
SDD CLAUDE KIT

▾ Projeto
  Visão geral
  Constituição
  Arquitetura
  Padrões
  Configurações

▾ Features
  Draft
  Em desenvolvimento
  Bloqueadas
  Em validação
  Concluídas

▾ Contexto
  Context Guardian
  Context Packs
  Histórico

▾ Qualidade
  Project Doctor
  Evidências
  Validação

▾ Métricas
  Tokens
  Tempo
  Produtividade
  Custos
```

## 13.2 Tela da feature

A tela principal da feature deverá apresentar:

* cabeçalho;
* status;
* prioridade;
* progresso;
* requisitos;
* tarefas;
* critérios de aceite;
* arquivos relacionados;
* evidências;
* histórico;
* ações rápidas.

Ações principais:

* executar Research;
* clarificar;
* gerar design;
* gerar tarefas;
* implementar próxima tarefa;
* abrir no Claude Code;
* copiar prompt;
* validar;
* gerar relatório.

## 13.3 Indicador de contexto

O VS Code deverá exibir na barra de status:

```text
SDD Context: 74% | 148k / 200k
```

Ao clicar, o usuário visualizará:

* composição do contexto;
* arquivos maiores;
* arquivos obrigatórios;
* arquivos opcionais;
* conteúdo resumido;
* sugestões de redução.

---

# 14. Experiência do usuário

## Jornada 1 — Novo projeto

1. O usuário instala a extensão.
2. Abre um projeto.
3. A extensão detecta que o SDD não está configurado.
4. O usuário seleciona “Inicializar SDD”.
5. A extensão cria a estrutura.
6. O Project Doctor valida o projeto.
7. O usuário cria a primeira feature.

## Jornada 2 — Criar uma feature

1. O usuário seleciona “Nova feature”.
2. Informa o problema e o objetivo.
3. A extensão cria os arquivos.
4. O usuário executa Research.
5. A extensão sugere clarificações.
6. O usuário aprova a especificação.
7. O design e as tarefas são gerados.
8. A feature passa para “Aprovada”.

## Jornada 3 — Implementar uma tarefa

1. O usuário seleciona a próxima tarefa.
2. A extensão monta o contexto.
3. O Context Guardian analisa o tamanho.
4. O usuário revisa os arquivos selecionados.
5. A ação é aberta no Claude Code.
6. O código é implementado.
7. A extensão analisa o diff.
8. Os testes são executados.
9. As evidências são registradas.
10. A tarefa é concluída.

## Jornada 4 — Validar a feature

1. Todas as tarefas são concluídas.
2. A extensão executa a validação.
3. Cada requisito é comparado com código, testes e evidências.
4. Divergências são apresentadas.
5. O usuário resolve as pendências.
6. A feature é marcada como concluída.
7. A extensão gera a descrição do Pull Request.

---

# 15. MVP

O MVP deverá comprovar que é possível utilizar o SDD Claude Kit visualmente dentro do VS Code.

## Funcionalidades obrigatórias do MVP

1. Inicialização da estrutura `.specs`.
2. Árvore lateral do projeto.
3. Criação de features.
4. Visualização dos documentos da feature.
5. Edição de `spec.md`, `design.md`, `tasks.md` e `status.yaml`.
6. Gerenciamento de status.
7. Dashboard da feature.
8. Geração e execução de prompts no Claude Code.
9. Botão “Abrir no Claude Code”.
10. Botão “Copiar prompt da feature”.
11. Progresso de tarefas.
12. Project Doctor básico.
13. Context Guardian básico.
14. Estimativa de tokens.
15. Detecção de arquivos alterados.
16. Rastreabilidade entre requisitos e tarefas.
17. Validação básica da feature.
18. Registro local das atividades.
19. Compatibilidade com Windows, Linux e WSL.
20. Documentação para instalação e utilização.

---

# 16. Funcionalidades posteriores ao MVP

## Fase 2 — Qualidade e controle

* Acceptance Evidence;
* Context Packs;
* validação avançada;
* rastreabilidade com código e testes;
* SQL Guard;
* métricas de produtividade;
* comparação entre estimativa e execução;
* histórico visual;
* integração avançada com Git.

## Fase 3 — Colaboração

* integração com GitHub;
* criação de issues e Pull Requests;
* templates compartilhados;
* revisão de especificações;
* comentários;
* aprovação por responsáveis;
* painel da equipe;
* sincronização opcional.

## Fase 4 — Plataforma

* painel web;
* gerenciamento de organizações;
* políticas de contexto;
* dashboards executivos;
* custos por equipe;
* métricas por projeto;
* criação assistida de MCPs;
* marketplace de templates;
* integrações com outras ferramentas;
* suporte a diferentes agentes e modelos.

---

# 17. Priorização MoSCoW

## Must have

* estrutura `.specs`;
* criação de features;
* editor de documentos;
* tarefas;
* status;
* integração com Claude Code;
* Context Guardian básico;
* Project Doctor básico;
* diff de arquivos;
* rastreabilidade;
* validação básica.

## Should have

* métricas de tokens;
* evidências;
* templates;
* histórico;
* geração de design;
* clarificações assistidas;
* integração Git.

## Could have

* GitHub;
* painel web;
* times;
* SQL Guard;
* criação de MCPs;
* marketplace;
* relatórios executivos.

## Won’t have no MVP

* armazenamento remoto obrigatório;
* deploy automático;
* IDE própria;
* substituição do Claude Code;
* gerenciamento completo de projetos corporativos.

---

# 18. Modelo de monetização

## Community — Gratuito e open source

* gerenciamento local de features;
* arquivos `.specs`;
* templates básicos;
* integração com Claude Code;
* Project Doctor básico;
* Context Guardian básico;
* acompanhamento de tarefas;
* validação local.

## Pro — Assinatura individual

* métricas avançadas;
* relatórios;
* Context Packs avançados;
* análise histórica;
* estimativa de custos;
* templates premium;
* validações adicionais;
* automações Git e GitHub;
* suporte prioritário.

## Team — Assinatura por usuário ou equipe

* projetos compartilhados;
* revisão e aprovação;
* políticas organizacionais;
* dashboards de produtividade;
* gestão de templates;
* métricas por equipe;
* controle de custos;
* auditoria;
* integrações corporativas.

## Enterprise

* instalação privada;
* SSO;
* controle de acesso;
* políticas de segurança;
* retenção configurável;
* suporte dedicado;
* relatórios corporativos;
* integrações personalizadas;
* modelos privados.

O núcleo do fluxo SDD deverá permanecer utilizável gratuitamente para favorecer adoção, contribuições e crescimento da comunidade.

---

# 19. Métricas de sucesso

## Adoção

* instalações no VS Code Marketplace;
* usuários ativos mensais;
* projetos inicializados;
* features criadas;
* repositórios utilizando `.specs`;
* estrelas e forks no GitHub.

## Engajamento

* features concluídas por usuário;
* tarefas executadas pela extensão;
* utilização do Context Guardian;
* utilização do Project Doctor;
* quantidade de validações;
* frequência de retorno.

## Qualidade

* percentual de requisitos com evidências;
* redução de tarefas reabertas;
* redução de mudanças fora do escopo;
* redução de falhas após validação;
* aumento da cobertura de testes;
* percentual de features concluídas sem divergências.

## Eficiência

* redução média de contexto por execução;
* tokens economizados;
* tempo entre especificação e conclusão;
* número de interações necessárias por tarefa;
* percentual de prompts reutilizados;
* tempo economizado estimado.

## Negócio

* conversão do plano gratuito para o Pro;
* receita recorrente mensal;
* retenção;
* cancelamentos;
* quantidade de equipes;
* custo de operação por usuário.

---

# 20. Critérios de sucesso do MVP

O MVP será considerado validado quando:

1. Um usuário conseguir instalar a extensão pelo VS Code.
2. Um projeto puder ser inicializado sem utilizar comandos manuais.
3. Uma feature puder ser criada e organizada dentro de `.specs`.
4. O usuário conseguir gerar especificação, design e tarefas.
5. Uma tarefa puder ser enviada ao Claude Code com contexto controlado.
6. A extensão conseguir mostrar os arquivos modificados.
7. O usuário conseguir registrar evidências.
8. A implementação puder ser validada contra os requisitos.
9. O fluxo continuar funcionando sem a extensão, utilizando apenas os arquivos e a CLI.
10. Pelo menos 70% dos usuários de teste conseguirem concluir o fluxo sem ajuda externa.

---

# 21. Riscos

## Dependência do Claude Code

Mudanças no funcionamento da CLI podem afetar a integração.

**Mitigação:** criar uma camada adaptadora e evitar dependência de comportamentos não documentados.

## Medição de tokens imprecisa

Nem sempre será possível obter a quantidade exata de tokens utilizados.

**Mitigação:** diferenciar valores reais, quando disponíveis, de estimativas locais.

## Crescimento excessivo do escopo

O produto pode tentar competir simultaneamente com IDEs, gerenciadores de projetos e plataformas de IA.

**Mitigação:** manter o foco no ciclo SDD e na rastreabilidade.

## Complexidade da interface

Muitos painéis podem tornar a extensão difícil de utilizar.

**Mitigação:** experiência progressiva, com modo básico e recursos avançados opcionais.

## Segurança

Prompts podem incluir credenciais ou arquivos sensíveis.

**Mitigação:** filtros, lista de exclusão, detecção de segredos e revisão do contexto antes da execução.

## Confiança excessiva na validação por IA

O agente pode declarar que um requisito foi atendido incorretamente.

**Mitigação:** exigir evidências objetivas e diferenciar validação automática de aprovação humana.

## Métricas interpretadas incorretamente

Linhas de código e tokens economizados não representam isoladamente produtividade.

**Mitigação:** usar um conjunto equilibrado de indicadores e explicar as limitações.

---

# 22. Arquitetura conceitual

A extensão poderá ser dividida nos seguintes módulos:

```text
VS Code Extension
├── Project Explorer
├── Feature Manager
├── Spec Editor
├── Workflow Engine
├── Claude Code Adapter
├── Context Guardian
├── Project Doctor
├── Traceability Engine
├── Evidence Manager
├── Validation Engine
├── Git Adapter
├── Metrics Collector
├── Template Engine
└── Local Storage
```

### Fonte de verdade

Os arquivos do projeto deverão continuar sendo a fonte principal de verdade.

O armazenamento interno do VS Code deverá ser utilizado apenas para:

* preferências;
* cache;
* métricas locais;
* estado temporário;
* dados que não precisam ser versionados.

---

# 23. Configurações iniciais

Exemplo de configuração:

```yaml
project:
  name: sdd-claude-kit
  language: pt-BR

workflow:
  require_spec_approval: true
  require_evidence: true
  allow_skip_research: true

context:
  max_tokens: 200000
  warning_threshold: 0.70
  risk_threshold: 0.85
  block_threshold: 0.95
  exclude:
    - node_modules/**
    - dist/**
    - build/**
    - coverage/**
    - .env
    - "**/*.key"
    - "**/*.pem"

git:
  detect_out_of_scope_changes: true
  require_clean_branch: false

metrics:
  enabled: true
  telemetry: false
  store_locally: true
```

---

# 24. Backlog inicial

## Épico 1 — Estrutura do projeto

* detectar instalação;
* inicializar `.specs`;
* validar arquivos;
* carregar configurações;
* implementar watcher.

## Épico 2 — Gerenciamento de features

* criar feature;
* listar features;
* alterar status;
* calcular progresso;
* abrir documentos.

## Épico 3 — Interface

* Activity Bar;
* árvore do projeto;
* dashboard;
* editor visual;
* comandos;
* barra de status.

## Épico 4 — Claude Code

* detectar CLI;
* abrir terminal;
* montar prompt;
* copiar prompt;
* executar ações;
* capturar resultado quando possível.

## Épico 5 — Context Guardian

* contar tokens;
* selecionar arquivos;
* aplicar exclusões;
* mostrar composição;
* emitir alertas;
* sugerir redução.

## Épico 6 — Project Doctor

* validar estrutura;
* identificar documentos ausentes;
* verificar tarefas;
* verificar requisitos;
* apresentar diagnósticos.

## Épico 7 — Git e rastreabilidade

* analisar diff;
* identificar arquivos alterados;
* relacionar tarefas;
* detectar mudanças fora do escopo;
* associar commits.

## Épico 8 — Evidências e validação

* registrar testes;
* armazenar evidências;
* criar matriz de rastreabilidade;
* validar critérios;
* gerar relatório.

## Épico 9 — Métricas

* registrar sessões;
* estimar tokens;
* medir duração;
* calcular progresso;
* gerar dashboard local.

## Épico 10 — Publicação

* documentação;
* ícone;
* página no Marketplace;
* exemplos;
* projeto de demonstração;
* testes de compatibilidade;
* pipeline de publicação.

---

# 25. Definição de pronto

Uma funcionalidade será considerada pronta quando:

* estiver relacionada a um requisito;
* possuir critérios de aceite;
* tiver testes adequados;
* não introduzir erros de lint ou build;
* possuir documentação;
* tiver evidências registradas;
* não alterar arquivos fora do escopo sem justificativa;
* funcionar nos ambientes suportados;
* passar pelo Project Doctor;
* tiver aprovação humana quando necessária.

---

# 26. Posicionamento

O SDD Claude Kit para VS Code não será apenas uma interface para prompts.

Seu posicionamento deverá ser:

> Uma plataforma de governança e produtividade para desenvolvimento orientado por especificações com agentes de IA.

Diferenciais principais:

* arquivos locais e versionáveis;
* integração direta com o fluxo do desenvolvedor;
* contexto controlado;
* rastreabilidade;
* evidências;
* validação de aderência ao escopo;
* métricas de produtividade;
* funcionamento independente da interface;
* base open source.

---

# 27. Visão de longo prazo

A visão de longo prazo é transformar o SDD Claude Kit em um ecossistema aberto para desenvolvimento com agentes, formado por:

* framework SDD;
* CLI;
* extensão VS Code;
* painel web opcional;
* templates;
* agentes especializados;
* Context Guardian;
* Project Doctor;
* Acceptance Evidence;
* SQL Guard;
* Metric Contract;
* gerador de MCPs;
* integrações GitHub;
* recursos para times;
* marketplace de templates e extensões.

O ecossistema deverá permitir que qualquer equipe transforme uma ideia em uma implementação testada e rastreável, utilizando IA sem perder controle sobre contexto, qualidade, custo e escopo.



