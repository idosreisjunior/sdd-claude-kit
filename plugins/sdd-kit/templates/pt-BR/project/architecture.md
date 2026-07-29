# Arquitetura — {{PROJECT_NAME}}

Versão: 1.0 · Atualizado em: {{DATE}}

{{guia: este documento descreve a arquitetura DO SEU PROJETO, não a do SDD
Claude Kit. Ele existe para que uma mudança futura saiba onde encostar e onde
não encostar.

Mantenha-o curto. Um documento de arquitetura que ninguém lê porque tem
quarenta páginas não protege nada.}}

---

## 1. Visão geral

{{SYSTEM_OVERVIEW}}

```
{{ARCHITECTURE_DIAGRAM}}
```

{{guia: um diagrama em texto simples costuma bastar. Mostre os componentes e
o sentido das dependências.}}

## 2. Componentes e responsabilidades

| Componente | Responsabilidade | Não faz |
| --- | --- | --- |
| {{COMPONENT}} | {{RESPONSIBILITY}} | {{NON_RESPONSIBILITY}} |

{{repetir: uma linha por componente principal}}

{{guia: a coluna "Não faz" é a mais valiosa. É ela que impede o componente de
crescer sem limite.}}

### Regra de dependência

{{DEPENDENCY_RULE}}

{{guia: em que sentido as dependências podem apontar. Exemplo: "domínio não
conhece infraestrutura; a dependência aponta sempre para dentro". Sem essa
regra escrita, toda revisão de PR vira uma discussão nova.}}

## 3. Fluxos principais

### {{FLOW_NAME}}

```
{{FLOW_STEPS}}
```

{{repetir: apenas os fluxos que uma pessoa nova precisa entender para trabalhar
no sistema. Dois ou três costumam bastar.}}

## 4. Contratos

{{CONTRACTS}}

{{guia: APIs públicas, formatos de mensagem, esquemas de banco — o que outros
sistemas dependem e que você não pode quebrar sem aviso.}}

## 5. Persistência

{{PERSISTENCE_DESIGN}}

{{opcional: remover se não houver}}

## 6. Segurança

{{SECURITY_DESIGN}}

{{guia: autenticação, autorização, dados sensíveis, limites de confiança. Onde
está a fronteira entre o que é confiável e o que não é.}}

## 7. Observabilidade

{{OBSERVABILITY}}

{{opcional: logs, métricas, tracing, alertas}}

## 8. Limites explícitos

- {{EXPLICIT_BOUNDARY}}

{{repetir: regras que nenhuma mudança pode violar sem um ADR. Exemplos: "nenhum
componente acessa o banco diretamente, exceto a camada de repositório";
"nenhuma chamada de rede no caminho de renderização".}}

## 9. Decisões arquiteturais

Registradas em `.specs/project/decisions/`.

| ADR | Decisão | Status |
| --- | --- | --- |
| {{ADR_ID}} | {{ADR_TITLE}} | {{ADR_STATUS}} |

{{repetir: uma linha por ADR. Remova a tabela se ainda não houver nenhum.}}

## 10. Questões arquiteturais em aberto

| # | Questão | Impacto | Quando decidir |
| --- | --- | --- | --- |
| A1 | {{OPEN_QUESTION}} | {{IMPACT}} | {{WHEN}} |

{{guia: registrar o que ainda não foi decidido vale tanto quanto registrar o que
foi. Cada questão vira um ADR quando for resolvida.

Se não houver questões em aberto, diga isso — uma seção vazia parece esquecimento.}}
