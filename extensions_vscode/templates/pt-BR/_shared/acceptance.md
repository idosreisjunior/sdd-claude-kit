# Aceite: {{CHANGE_TITLE}}

- **ID:** {{CHANGE_ID}}
- **Estado:** ver `status.yaml` — a autoridade é ele

{{guia: escrito por `/sdd-kit:verify`. Um critério de aceite por linha, avaliado um a
um contra a spec. **Critério sem evidência não conta como satisfeito** — o veredito
"satisfeito" exige o texto da evidência ao lado, não a palavra sozinha. Ver
constitution.md, Art. 3, e ADR-012.}}

---

## Critérios de aceite

| # | Critério | Cenário | Veredito | Evidência |
| --- | --- | --- | --- | --- |
| {{CRITERION_NUMBER}} | {{CRITERION}} | {{SCENARIO_ID}} | {{VERDICT}} | {{EVIDENCE}} |

{{repetir: uma linha por critério de aceite de `spec.md` — nenhum a menos. Veredito é
`satisfeito`, `não satisfeito` ou `não aplicável`, e `satisfeito` só é válido com a
evidência preenchida (comando executado, saída obtida, arquivo verificado). Cenário
aponta o `SCN-*` correspondente, ou fica vazio se o critério não mapear para um.}}

---

## Resumo

{{guia: contagem por veredito — satisfeitos, não satisfeitos, não aplicáveis — e a
conclusão: a mudança só é promovida a `VERIFIED` quando não há critério "não
satisfeito". Um critério sem evidência conta como **não** satisfeito.}}
