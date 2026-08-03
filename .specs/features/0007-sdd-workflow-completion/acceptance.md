# Aceite: Completar o fluxo SDD (0007-sdd-workflow-completion)

- **ID:** 0007-sdd-workflow-completion
- **Estado:** ver `status.yaml` — a autoridade é ele

Os treze critérios de aceite de `spec.md`, avaliados um a um com evidência de **execução real**
(via `claude -p`), 2026-08-02. Critério sem evidência não conta como satisfeito (ADR-012).

Nota de método: os cenários de **recusa** (SCN-SWC-008/012/015) foram exercitados com o estado de
entrada montado como fixture — legítimo, porque a skill correta **não escreve nada** ao recusar, e o
que se verifica é a recusa. O **ato humano de aprovação** do `approve` foi fornecido pelo agente na
chamada `-p`: valida a mecânica; a garantia de que só um humano aprova é estrutural
(`disable-model-invocation: true`).

---

## Critérios de aceite

| # | Critério | Veredito | Evidência |
| --- | --- | --- | --- |
| 1 | As seis skills existem e são invocáveis | satisfeito | `claude plugin details sdd-kit` lista as 10 skills; as 6 novas foram invocadas no percurso e2e. |
| 2 | Percurso `DRAFT → ARCHIVED` sem edição manual de `status.yaml` | satisfeito | Toy `integer-sum-command`: os 8 estados no `history`, só com skills (SWC-017). |
| 3 | Cada skill recusa origem inválida, sem alterar arquivo (SCN-SWC-010/012) | satisfeito | `design` de `DRAFT` recusa (hash inalterado); `approve` de `DRAFT` recusa; `implement` com `approval:null`+`require_approval:true` recusa (SCN-SWC-012, hash inalterado, 0 código). |
| 4 | Toda promoção acrescenta `history` sem reescrever; `status` = última (SCN-SWC-016) | satisfeito | e2e: uma entrada por transição, anteriores intactas, `status` coincide após cada skill. |
| 5 | Transição fora do grafo recusada sem alterar o arquivo (SCN-SWC-007) | satisfeito | `approve` de `DRAFT → APPROVED` recusa, listando as transições válidas; `status.yaml` inalterado. |
| 6 | `status.yaml` válido contra o schema após cada skill | satisfeito | Validado por AJV após cada passo do e2e — VÁLIDO em todos. |
| 7 | `approve` grava date/by/revision; negada deixa `approval: null` (SCN-SWC-003/011) | satisfeito | Aprovação gravou os três campos (`revision` = `sha256(spec.md)[:12]`); negação deixou `null`, `PLANNED`, sem history nova. |
| 8 | `implement` respeita dependências (SCN-SWC-013) | satisfeito | `implement TASK-CUST-003` (dep pendente) recusa nomeando `TASK-CUST-001`; 0 código. |
| 9 | `traceability` preenchido após `implement`; `verify` recusa órfãos (SCN-SWC-017/008) | satisfeito | e2e: `implementation` preenchido com arquivos/testes; `verify` com item órfão recusa promover e preserva `status.yaml`/`index.yaml` (SCN-SWC-008). |
| 10 | `verify` reporta a saída real; sem sucesso para comando ausente/sem testes | satisfeito | `verify` do toy rodou os testes, executou o CLI como evidência, distinguiu *aprovada* de *não configurada*. |
| 11 | `archive` não sobrescreve destino existente (SCN-SWC-015) | satisfeito | Com o destino ocupado, `archive` recusa; origem e destino inalterados (hash idêntico). |
| 12 | Textos em pt-BR e cada `SKILL.md` declara os arquivos que lê (NFR-SWC-001/002) | satisfeito | Auditoria (SWC-016): as 10 skills em pt-BR, todas com a seção "Arquivos que esta skill lê", nenhum glob amplo. |
| 13 | `npm run lint`, `npm test`, `npm run build` saem com êxito (NFR-SWC-003) | satisfeito | Ver `validation.md`: os três exit 0; `test` com 305 testes executados. |

---

## Resumo

**13 de 13 critérios satisfeitos, com evidência.** Nenhum ficou "não satisfeito". Os três defeitos
encontrados durante a verificação foram corrigidos (ADR-014, promoção via `Write`, ADR-015). Os
cenários de erro não exigidos por nenhum critério mas listados em `traceability.yaml` `gaps`
(SCN-SWC-019/022/027/028, cancelamento SCN-SWC-021) seguem como lacuna declarada — não bloqueiam a
promoção, e a mitigação de cada uma está registrada. A mudança está pronta para `VERIFIED`.
