# Solicitação original

- **ID:** 0022-mcp-creation-assistant
- **Tipo:** feature
- **Criada em:** 2026-08-02
- **Origem:** PRD da extensão, RF-025 — Criação de MCPs (pós-MVP)

---

## Texto da solicitação

> Em uma etapa futura, a extensão poderá oferecer um assistente para criação de
> servidores MCP. O fluxo deverá ajudar a definir: objetivo; ferramentas;
> recursos; schemas; autenticação; permissões; testes; documentação; publicação.

## Interpretação

O RF-025 pede um **assistente** que ajude o desenvolvedor a **definir** um servidor
MCP (Model Context Protocol) percorrendo os nove aspectos listados. O verbo é
"ajudar a definir" — o texto pede condução/estruturação da decisão, não afirma que
a extensão deve gerar um servidor MCP funcional, executar testes ou publicar por
conta própria. Como e onde essas definições são capturadas (documento revisável,
scaffold de código, delegação ao Claude Code) **não está no texto** e é a principal
lacuna a resolver — registrada como questão, não presumida.

## O que esta mudança entrega

Conduzir o usuário pelos nove aspectos de um servidor MCP (objetivo, ferramentas,
recursos, schemas, autenticação, permissões, testes, documentação, publicação),
capturando as decisões num artefato revisável. O recorte fino (mecanismo, formato
da saída, gatilho) depende das questões em aberto.

## O que esta mudança deliberadamente não entrega

- **Gerar um servidor MCP funcional / executar testes / publicar automaticamente** —
  o texto diz "ajudar a definir"; ir além disso seria expansão por completude. Fica
  como questão (Q2/Q3), não como requisito presumido.
- **Gerenciar MCPs existentes** (listar, editar, remover) — não está no texto.

## Restrições conhecidas

- Coerência com os padrões da extensão: núcleo puro + borda fina; ações "assistidas"
  já existentes (research/design/clarify) delegam ao Claude Code (padrão híbrido).
- Sem rede própria / sem executar processos sem confirmação (constituição, Art. 8/9).
- Pós-MVP: sem prioridade sobre o fluxo SDD principal.
