# Bug: Referência a artigo inexistente da constituição no template de config

- **ID:** 0002-dangling-constitution-reference
- **Escopo dos identificadores:** DCR
- **Status:** DRAFT
- **Severidade:** baixa

---

## Comportamento observado

`plugins/sdd-kit/templates/pt-BR/config.yaml` contém:

```yaml
    # null significa NÃO DETECTADO. A verificação deve reportar "não executado",
    # jamais "aprovado" — ver constitution.md, Art. 13.
```

Mas a constituição gerada por `/sdd-kit:init` tem **11 artigos**. `Art. 13` não existe no projeto do usuário — a referência não aponta para lugar nenhum.

O defeito está presente num artefato realmente gerado: `examples/node-api/.specs/config.yaml` linha 43 aponta para `Art. 13`, e `examples/node-api/.specs/project/constitution.md` termina no Artigo 11.

## Comportamento esperado

A referência aponta para o artigo que contém a regra citada. Na constituição gerada, "Definition of Done" — que estabelece que validação não executada nunca é reportada como aprovada — é o **Artigo 10**.

## Regra violada

`REQ-PF-008` — templates padronizados. Um template que gera referência quebrada não produz artefato consistente.

Indiretamente, o próprio Artigo 10 da constituição gerada: a regra que o comentário cita é a que fica inacessível.

## Reprodução

1. Executar `/sdd-kit:init` em qualquer projeto.
2. Abrir `.specs/config.yaml` e localizar o comentário em `validation.commands`.
3. Seguir a referência para `.specs/project/constitution.md`.
4. Constatar que o documento vai até o Artigo 11.

**Frequência:** determinística — toda execução de `init`.
**Ambiente:** qualquer.
**Primeira ocorrência conhecida:** `TASK-PF-005`, quando o template de `config.yaml` foi escrito.

## Impacto

Baixo. É um comentário de documentação, não comportamento executável — nada quebra, nada é computado errado.

O custo real é de confiança: quem seguir a referência para entender por que `lint: null` importa não encontra a regra, num framework cujo argumento central é que decisões ficam registradas e rastreáveis.

---

## Causa raiz

O template de `config.yaml` foi escrito em `TASK-PF-005` consultando a constituição **deste repositório**, que tem 14 artigos porque inclui regras específicas do projeto (separação entre geração e validação, portabilidade, dogfooding). A constituição **do template** tem 11.

O mesmo número aponta para artigos diferentes nos dois documentos:

| Nº | Constituição deste repositório | Constituição gerada |
| --- | --- | --- |
| 10 | Portabilidade e formatos abertos | **Definition of Done** |
| 13 | **Definition of Done** | *(não existe)* |

Nenhuma verificação cobria referências cruzadas entre artefatos distribuídos — foi o dogfooding de `TASK-PF-016` que expôs.

## Escopo da correção

### Incluído

- Corrigir a referência no template de `config.yaml` para `Art. 10`.
- Corrigir o artefato já gerado em `examples/node-api/.specs/config.yaml`.
- Teste de regressão cobrindo **toda** referência a artigo no que é distribuído.

### Não incluído

- Renumerar a constituição deste repositório para casar com a do template. As duas divergem legitimamente: a do projeto tem regras próprias, exatamente como o template prevê no Artigo 11. Alinhar os números por conveniência esconderia que são documentos diferentes.
- Trocar referências numéricas por títulos. Seria mais robusto, mas é mudança de convenção em `standards.md` e exige decisão própria — registrado como questão pendente.

---

## Cenários de regressão

### SCN-DCR-001 — Toda referência a artigo existe na constituição gerada

DADO qualquer arquivo distribuído no plugin — template ou `SKILL.md`
QUANDO ele citar `Art. N` ou `Artigo N`
ENTÃO `N` deve existir em `templates/<idioma>/project/constitution.md`.

### SCN-DCR-002 — A referência aponta para a regra citada

DADO o comentário sobre `null` em `validation.commands`
QUANDO a referência for seguida na constituição gerada
ENTÃO o artigo encontrado deve ser "Definition of Done".

---

## Critérios de aceite

- [ ] Existe um teste que **falha antes da correção e passa depois**.
- [ ] Os cenários de regressão acima passam.
- [ ] Nenhum teste existente foi alterado para acomodar a correção.
- [ ] `examples/node-api/.specs/config.yaml` deixa de conter a referência quebrada.

---

## Questões pendentes

| # | Questão | Bloqueia | Prioridade |
| --- | --- | --- | --- |
| Q1 | Referências a artigos deveriam citar o título em vez do número? Números quebram quando a constituição de um projeto diverge da do template — e divergir é o comportamento esperado, previsto no Artigo 11. | — | Média |

## Hipóteses assumidas

Nenhuma. A causa raiz foi confirmada por inspeção dos dois documentos.

---

## Correção aplicada

Aplicada em 2026-07-29, durante `TASK-PF-016`.

| Arquivo | Mudança |
| --- | --- |
| `plugins/sdd-kit/templates/pt-BR/config.yaml` | `Art. 13` → `Art. 10` |
| `examples/node-api/.specs/config.yaml` | `Art. 13` → `Art. 10` |
| `tests/docs.test.ts` | Teste de regressão `SCN-DCR-001` e `SCN-DCR-002` |

**Verificação por mutação:** os três testes novos **falharam antes** da correção
e passaram depois. Nenhum teste existente foi alterado.

O teste cobre mais que o defeito pontual: percorre todo arquivo distribuído —
templates e `SKILL.md` — e verifica que cada `Art. N` citado existe na
constituição **gerada**, não na deste repositório. Havia 26 referências válidas
e uma quebrada.

A mudança permanece em `DRAFT`: `verify` e `archive`, que fechariam o ciclo,
são skills da Fase 2.
