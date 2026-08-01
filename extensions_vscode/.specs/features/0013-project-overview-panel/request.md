# Solicitação original

- **ID:** 0013-project-overview-panel
- **Tipo:** feature
- **Criada em:** 2026-07-31
- **Origem:** Conversa com o usuário na extensão VS Code (pedido de enriquecer a interface gráfica)

---

## Texto da solicitação

> Enriquecer o painel "Projeto" da Activity Bar. Hoje ele é apenas uma lista de 5 links de arquivo (Visão, Constituição, Arquitetura, Padrões, Config). Quero transformá-lo num resumo vivo do projeto: um cabeçalho de saúde a partir do Project Doctor (0006) — quantidade de erros/avisos estruturais com atalho para rodar o diagnóstico; o estado do Context Guardian (0005) — uso estimado de tokens vs. teto e faixa; contadores agregados de mudanças por status (a partir do index.yaml); e os links de documentos de projeto existentes agrupados abaixo. Somente leitura, sem inventar dados; robusto a arquivos ausentes. Escopo: PROJ.

## Interpretação

O painel `Projeto` (view `sddProject`) hoje é um `TreeDataProvider` que devolve cinco
nós estáticos de link (`projectTreeProvider.ts`). O pedido é que ele passe a mostrar,
acima desses links, um resumo agregado do estado do projeto, reaproveitando dados que
outras features já produzem: o Project Doctor (feature 0006, RF-002) e o Context Guardian
(feature 0005, RF-012). O painel continua somente leitura — não edita arquivos nem executa
validações por conta própria — e os dados exibidos vêm sempre de fontes reais em disco;
onde não houver dado, o painel diz "sem dados", nunca inventa.

## O que esta mudança entrega

Um painel `Projeto` reorganizado em seções: (1) saúde estrutural do Doctor, (2) estado do
contexto do Guardian, (3) contadores de mudanças por status a partir de `index.yaml`, e
(4) os links de documentos de projeto, preservados. Robusto a arquivos ausentes ou
inválidos.

## O que esta mudança deliberadamente não entrega

- **Edição de documentos no painel** — continua sendo função do editor de spec (feature
  0012) e do editor de texto; o painel só navega e resume.
- **Execução de lint/test/build ou de CI** — o painel não dispara validação do projeto;
  no máximo oferece o atalho para rodar o Doctor, que já é uma ação existente.
- **Telemetria ou coleta de métricas** — fora de escopo (ver RNF-004); métricas são a
  feature 0009.

## Restrições conhecidas

- Somente leitura sobre `.specs/` e o workspace (NFR-PROJ-001).
- Não deve encarecer a abertura do painel: sem varrer o repositório inteiro nem ler
  arquivos grandes ao renderizar (herda a disciplina do Context Guardian, NFR-CTX-004).
- Reaproveita os núcleos puros já existentes de 0005 (`contextGuardian.ts`) e 0006
  (`projectDoctor.ts`) em vez de duplicar lógica.
