---
name: design
description: Produz o design técnico de uma mudança a partir de uma spec clarificada. Gera design.md a partir do template, registra as decisões arquiteturais como ADRs no diretório de decisões, e promove a mudança de CLARIFIED para DESIGNED. Descreve o como — o o quê e o porquê ficam na spec. Recusa desenhar sobre uma spec com questões críticas em aberto. Use quando o usuário pedir /sdd-kit:design, quiser o design técnico de uma mudança já clarificada, ou registrar uma decisão arquitetural.
when_to_use: Gatilhos — "/sdd-kit:design", "fazer o design técnico", "desenhar a solução", "registrar um ADR". Exige uma mudança em CLARIFIED, sem questão crítica em aberto.
argument-hint: "<id-da-mudança>"
disable-model-invocation: false
allowed-tools: Read Glob Grep
disallowed-tools: Edit NotebookEdit
---

# /sdd-kit:design — desenhar a solução

Transforma uma spec clarificada em um design técnico revisável, com as decisões arquiteturais registradas como ADRs.

`disable-model-invocation: false` é deliberado: `design` produz um documento revisável e não age sobre nenhuma decisão irreversível. Ver ADR-008.

## A regra que governa esta skill

**O design descreve o como; a spec descreve o o quê e o porquê.** Se você está escrevendo requisitos aqui, está no documento errado — volte para `/sdd-kit:spec`. E **decisão arquitetural relevante vira um ADR**, não um parágrafo perdido dentro do `design.md`: uma decisão sem rastro próprio é indistinguível de uma suposição (Art. 5), e é o Artigo 8 que exige interromper e registrar diante de uma escolha arquitetural.

## Modo de governança

Leia `workflow.mode` de `.specs/config.yaml` antes de agir.

| Modo | Comportamento desta skill |
| --- | --- |
| `advisory` | Informa o design proposto e as decisões; **nunca** bloqueia nem exige confirmação |
| `guided` *(padrão)* | Recusa desenhar fora de `CLARIFIED` e pede confirmação antes de promover a `DESIGNED` |
| `strict` | **Ainda não implementado na Fase 1.** Informe isso ao usuário e opere como `guided` |

Nunca finja um bloqueio que não existe. Dizer que o modo `strict` impediu algo, quando ele não está implementado, é pior que não ter o modo — cria confiança em uma proteção ausente.

## Arquivos que esta skill lê

| Quando | O quê |
| --- | --- |
| Sempre | `.specs/config.yaml` — idioma e modo |
| Sempre | `<dir-da-mudança>/spec.md` — os requisitos e os cenários a atender |
| Sempre | `<dir-da-mudança>/status.yaml` — estado atual, para avaliar a transição |
| Se existir | `.specs/project/architecture.md` — limites de módulo e a estrutura a respeitar |
| Se existir | `.specs/project/context.md` — o contexto técnico do projeto |

**Não leia as specs de outras mudanças** (NFR-SWC-002, Art. 7). O design é sobre esta mudança e o projeto, não sobre o que outras estão fazendo.

---

## Procedimento

### 1. Verificar a pré-condição

O argumento é o identificador. Leia `status.yaml`. Se o estado **não** for `CLARIFIED`, **recuse** e não escreva nada:

```
✖ [design] A mudança não está clarificada
  Estado atual: DRAFT        Exigido: CLARIFIED
  Correção: resolva as questões com /sdd-kit:clarify antes de desenhar.
```

Recusa não é aviso: **nenhum arquivo é escrito** — nem `design.md`, nem `status.yaml` (`SCN-SWC-010`). Desenhar sobre uma spec com questão crítica em aberto produz um design que será refeito quando a questão for respondida.

### 2. Gerar o esqueleto do design

Crie `<dir-da-mudança>/design.md` a partir do template `${CLAUDE_PLUGIN_ROOT}/templates/pt-BR/_shared/design.md`. Preencha as seções a partir da spec e dos documentos de projeto. Onde faltar informação, registre a lacuna como questão em aberto — não invente.

Regras do template:
- A seção de **alternativas consideradas** exige o **motivo da recusa**, não só a lista.
- A seção de **riscos** exige uma **mitigação por risco**.
- **Nenhum `{{` pode sobrar** no arquivo final.

### 3. Registrar as decisões arquiteturais como ADRs

Cada decisão arquitetural relevante vira um `ADR-NNN` em `<dir-da-mudança>/decisions/`, com contexto, decisão, alternativas (com o motivo da recusa) e consequências. A numeração de ADR é **global e sequencial** no projeto — continue a partir do maior existente, nunca reutilize.

O `design.md` referencia o ADR pelo identificador; a decisão mora no ADR.

### 4. Promover a `DESIGNED`

Verifique que `CLARIFIED → DESIGNED` é válida no grafo (`${CLAUDE_PLUGIN_ROOT}/schemas/workflow.json`) e **acrescente** uma entrada a `history` com `reason` não vazio, sem reescrever as anteriores. Ordem de escrita: `design.md` e os ADRs, depois `status.yaml`, `.specs/index.yaml` por último.

### 5. Reportar

```
✔ Design gerado — 0002-customer-registration

  Seções preenchidas   15
  ADRs criados         1   (ADR-014)
  Questões em aberto    0

  Status: CLARIFIED → DESIGNED

  Próximo passo:
    /sdd-kit:tasks 0002-customer-registration
```

Se ficou alguma questão em aberto no design, diga isso antes do resumo — um design com lacuna crítica não deveria promover.

---

## Erros

```
✖ [design] Template não encontrado
  Arquivo: ${CLAUDE_PLUGIN_ROOT}/templates/pt-BR/_shared/design.md
  Correção: verifique a instalação do plugin.
```
