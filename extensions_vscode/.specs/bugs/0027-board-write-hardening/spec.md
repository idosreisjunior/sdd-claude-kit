# Bug: Endurecimento da escrita do Painel SDD (integridade)

- **ID:** 0027-board-write-hardening
- **Escopo dos identificadores:** BUG27
- **Estado:** ver `status.yaml` — a autoridade é ele

---

## Objetivo

Corrigir as lacunas de integridade da escrita introduzida em 0026 (arrastar-para-transicionar), para
honrar o contrato de escrita **não destrutiva** (NFR-DND-002) e de transição **entre colunas**
(REQ-DND-001), com testes de regressão.

## Contexto

Ver `request.md` — cinco defeitos de borda no `statusWriter`/`boardPanel`, apontados na revisão do
0026: CRLF perdido, comentário inline descartado, transição parcial, escrita não-atômica entre os
dois arquivos, e drop na própria coluna.

## Requisitos

### REQ-BUG27-001 — Escrita preserva o arquivo (fim de linha + comentário inline)

Ao trocar `status:` e acrescentar `history:`, o writer deve preservar o **fim de linha** original
(LF/CRLF) e um eventual **comentário inline** na linha `status:` — em `status.yaml` e em `index.yaml`.

#### SCN-BUG27-001 — CRLF preservado

DADO um `status.yaml`/`index.yaml` com finais de linha CRLF
QUANDO o writer o altera
ENTÃO a saída mantém CRLF, sem introduzir LF solto.

#### SCN-BUG27-002 — Comentário inline preservado

DADO uma linha `status: X  # nota`
QUANDO o writer troca o valor
ENTÃO a saída é `status: Y  # nota` (valor trocado, comentário mantido); no `index.yaml`, a entrada
com comentário inline também é atualizada.

### REQ-BUG27-002 — Sem transição parcial

O writer só altera o documento se **ambos** `status:` (topo) e `history:` existirem; caso contrário,
devolve o texto inalterado.

#### SCN-BUG27-003 — Documento incompleto fica intacto

DADO um `status.yaml` sem `history:` (ou sem `status:` de topo)
QUANDO o writer é chamado
ENTÃO o texto é devolvido inalterado (nem `status` nem `history` mudam).

### REQ-BUG27-003 — Escrita all-or-nothing entre os dois arquivos

O painel deve exigir `status.yaml` **e** `index.yaml` antes de escrever qualquer um; se a escrita do
índice falhar, o `status.yaml` é restaurado.

#### SCN-BUG27-004 — Falha no índice restaura o status

DADO uma transição em que a escrita do `index.yaml` falha
QUANDO ela ocorre
ENTÃO o `status.yaml` é restaurado ao conteúdo original e um erro é reportado.

### REQ-BUG27-004 — Drop na própria coluna é no-op

#### SCN-BUG27-005 — Mesma coluna não transiciona

DADO um cartão no estado X, cuja coluna (grupo) é G
QUANDO o cartão é solto na coluna G
ENTÃO nenhuma transição ocorre.

---

## Critérios de aceite

- [ ] CRLF e comentário inline preservados em `status.yaml` e `index.yaml` (REQ-BUG27-001,
      SCN-BUG27-001/002).
- [ ] Documento sem `history:`/`status:` fica intacto (REQ-BUG27-002, SCN-BUG27-003).
- [ ] Escrita all-or-nothing; falha no índice restaura o status (REQ-BUG27-003, SCN-BUG27-004).
- [ ] Drop na própria coluna não transiciona (REQ-BUG27-004, SCN-BUG27-005).
- [ ] Regressões cobertas por teste; o grafo embutido tem teste completo contra divergência.

---

## Questões pendentes

Nenhuma.
