# Solicitação original

- **ID:** 0027-board-write-hardening
- **Tipo:** bug
- **Criada em:** 2026-08-04
- **Origem:** /sdd-kit:new (a partir da revisão do CodeRabbit no PR do 0026)

---

## Texto da solicitação

> Aplicar as correções pertinentes apontadas na revisão do 0026: a escrita do painel
> (`statusWriter`/`boardPanel`) tem lacunas de integridade — não preserva CRLF nem comentário inline
> na linha `status:`, pode gravar uma transição parcial (só `status:` ou só `history:`), não é
> all-or-nothing entre `status.yaml` e `index.yaml`, e permite soltar um cartão na própria coluna.

## Interpretação

A feature 0026 (arrastar-para-transicionar) cumpre o essencial, mas viola em bordas o contrato de
**escrita não destrutiva** (NFR-DND-002) e o de transição **entre colunas** (REQ-DND-001):

1. **CRLF** — o writer divide por `\r?\n` mas junta com `\n`, reescrevendo os finais de linha de um
   arquivo Windows.
2. **Comentário inline** — trocar `status:` descartava um eventual `# comentário` na mesma linha; no
   `index.yaml`, a linha com comentário inline nem casava (índice ficaria defasado).
3. **Transição parcial** — se faltasse `history:` ou o `status:` de topo, o writer mudava só um deles.
4. **All-or-nothing** — o painel escrevia `status.yaml` antes de ler `index.yaml`; se o índice
   faltasse ou falhasse, o estado mudava e o índice ficava defasado.
5. **Mesma coluna** — soltar um cartão na coluna do próprio estado disparava uma transição (ex.:
   APPROVED → IN_PROGRESS) sem movimento visual entre colunas.

## O que esta correção entrega

- `statusWriter` preserva o fim de linha (LF/CRLF) e o comentário inline do `status:`; só altera se
  **ambos** `status:` e `history:` existirem.
- `boardPanel` exige os dois arquivos antes de escrever e restaura o `status.yaml` se a escrita do
  índice falhar; ignora drop na coluna do estado atual.
- Testes de regressão para cada caso.

## Fora de escopo

- Comentários de código em inglês (apontado pela revisão): a convenção deste repositório é
  **comentários em pt-BR** (todo o código existente é assim); identificadores e nomes seguem em
  inglês. Não alterado.
