# Solicitação original

- **ID:** 0001-project-foundation
- **Tipo:** feature
- **Criada em:** 2026-07-31
- **Origem:** decomposição do PRD (Épico 1 §24, RF-001) durante a estruturação do projeto

---

## Texto da solicitação

> Criar o projeto da extensão do VS Code a partir do PRD, usando o SDD Claude
> Kit para estruturar e organizar o projeto e as tarefas.

## Interpretação

A fundação do produto: o esqueleto executável da extensão VS Code e o mecanismo
de inicialização do SDD em um projeto (RF-001, Épico 1). É a base sobre a qual as
demais features do MVP (0002–0010) se apoiam — sem ativação, Activity Bar,
diagnóstico do workspace e inicialização de `.specs`, nada mais funciona.

## O que esta mudança entrega

- Esqueleto TypeScript que ativa no VS Code, registra a Activity Bar (Projeto e
  Features) e o indicador de contexto na status bar.
- Diagnóstico do workspace: detecção de `.specs`, Git e Claude Code.
- Comando de inicialização que cria a estrutura `.specs` sem sobrescrever código,
  exibindo antes os arquivos que serão criados.

## O que esta mudança deliberadamente não entrega

- Listagem/criação de features, dashboard, editor de specs — features 0002/0003.
- Integração de execução com o Claude Code — feature 0004.
- Context Guardian, Project Doctor, métricas — features 0005/0006/0009.
  Aqui só existem os *pontos de entrada* (comandos e status bar) como shell.

## Restrições conhecidas

- Deve funcionar em Windows, Linux e WSL (RNF-002).
- A estrutura criada precisa continuar utilizável pela CLI, sem a extensão
  (PRD §7.6).
- Nenhum arquivo de código do usuário pode ser sobrescrito (RF-001).
