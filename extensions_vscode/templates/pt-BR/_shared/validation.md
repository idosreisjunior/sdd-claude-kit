# Validação: {{CHANGE_TITLE}}

- **ID:** {{CHANGE_ID}}
- **Estado:** ver `status.yaml` — a autoridade é ele

{{guia: escrito por `/sdd-kit:verify`. Registra o resultado de cada comando de
`validation.commands` (config.yaml). A regra que este documento existe para impor:
**evidência de execução, não código de saída** — um comando que sai com 0 sem
executar nada não é aprovação. Ver ADR-012 e constitution.md, Art. 10.}}

---

## Comandos de validação

{{repetir: um bloco por comando de `validation.commands` (lint, test, build, …).}}

### {{COMMAND_NAME}}

- **Estado:** {{VALIDATION_STATE}}
- **Comando exato:** `{{COMMAND}}`
- **Testes executados:** {{TEST_COUNT}}
- **Saída obtida:**

```
{{COMMAND_OUTPUT}}
```

{{guia: `Estado` é **um** dos três, nunca um genérico "passou":

| Estado | Quando | Efeito |
| --- | --- | --- |
| `não configurada` | o comando é `null` em config.yaml | não bloqueia (Art. 10: exigência insatisfazível sem a ferramenta) |
| `executada sem efeito` | rodou, mas zero testes/nenhum efeito verificável | **bloqueia** quando `require_tests: true` |
| `aprovada` | rodou e produziu efeito verificável | não bloqueia |

`Testes executados` vem de relatório estruturado quando o runner suporta
(`vitest --reporter=json`, `jest --json`, `pytest --json-report`, `go test -json`).
Quando não for possível determinar, escreva **"não foi possível confirmar execução"** —
que, sob `require_tests: true`, **bloqueia**, exatamente como zero testes. Não
confirmado não é aprovado. `Saída obtida` é o texto real, não um resumo.}}

---

## Conclusão

{{guia: a mudança só é promovida a `VERIFIED` quando nenhum comando está `executada
sem efeito` sob `require_tests: true` e nenhum falhou. Um comando `não configurada`
não bloqueia, mas fica registrado. Liste aqui o que impede a promoção, se algo impedir.}}
