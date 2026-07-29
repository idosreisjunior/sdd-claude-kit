# Solicitação original

- **ID:** 0002-dangling-constitution-reference
- **Tipo:** bug
- **Criada em:** 2026-07-29
- **Origem:** dogfooding de `TASK-PF-016`

---

## Texto da solicitação

> Comparar os artefatos que as skills geram com os escritos à mão na Fase 0.
> Divergências são defeitos — dos templates ou das skills.

## Interpretação

A comparação sistemática de seções entre templates e artefatos da Fase 0
encontrou nove divergências. Oito são variação legítima: os artefatos da Fase 0
foram escritos **antes** dos templates existirem, e diferem em numeração de
artigos, nomes de seção e estrutura específica de um framework.

A nona é defeito real e virou este bug.

## O que esta mudança entrega

Correção da referência quebrada e teste de regressão cobrindo toda referência a
artigo no que é distribuído.

## O que esta mudança deliberadamente não entrega

Alinhamento numérico entre a constituição deste repositório e a do template.
As duas divergem legitimamente — o template prevê isso no seu Artigo 11.

## Restrições conhecidas

- A correção não pode alterar teste existente para acomodar-se.
