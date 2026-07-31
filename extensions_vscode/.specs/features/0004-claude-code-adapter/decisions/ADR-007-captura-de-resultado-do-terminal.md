# ADR-007 — Captura de resultado do Claude Code: fora deste incremento

- **Status:** Aceito
- **Data:** 2026-07-31
- **Origem:** questão arquitetural **A2** (`architecture.md` §10) — "Como o Claude Code
  Adapter captura resultado (o terminal não expõe stdout de forma estável)"; questão Q1 da
  spec de 0004.
- **Decidido em:** TASK-CC-001

---

## Contexto

O RF-011 pede, ao fim do fluxo, "capturar o resultado quando possível" (diff, testes,
saída). O PRD §13.2 coloca isso como o passo 6 ("resultado é capturado quando possível").
A arquitetura já registrava a tensão em A2: **o terminal integrado do VS Code não expõe
stdout de forma estável**. As opções para capturar são:

- **Ler o terminal integrado.** A API `Terminal` do VS Code não entrega o stdout do
  processo de forma programática e confiável; `onDidWriteTerminalData` é *proposed API*,
  indisponível em extensão publicada.
- **Pseudoterminal (`vscode.Pseudoterminal`).** Daria controle do fluxo, mas exige a
  extensão intermediar o processo do Claude Code — reimplementar o PTY, o eco e o
  redimensionamento. Frágil e caro, e muda a experiência (o usuário deixaria de falar com
  o Claude Code "de verdade").
- **`claude -p "<prompt>"` com saída para arquivo.** Modo não interativo: capturável, mas
  perde a interatividade que é o ponto de "abrir no Claude Code", e muda a UX do incremento.

Este incremento (0004) entrega **montar/copiar prompt e abrir o terminal**. A captura de
resultado pertence, no backlog, ao **Evidence + Validation Engine (feature 0008)**.

## Decisão

**A captura de resultado do terminal fica FORA do incremento 0004.** O Claude Code Adapter
deste incremento é *fire-and-forget* e **humano no controle**:

1. Compõe o prompt de uma ação SDD (comando do plugin `sdd-kit`) — lógica pura.
2. Copia o prompt para a área de transferência.
3. Abre/reutiliza um terminal integrado na raiz do workspace e inicia a CLI detectada
   (ADR-002 / `claudeCode.ts`), deixando o prompt **pronto para revisão** (digitado sem
   enviar). Quem envia a ação é o usuário.

A extensão **não** lê stdout, **não** infere sucesso/erro e **não** dispara a ação sozinha.

## Alternativas consideradas

| Alternativa | Por que não (agora) |
| --- | --- |
| Ler stdout do terminal integrado | A API estável não expõe o stdout do processo; `onDidWriteTerminalData` é proposed API, fora de extensão publicada |
| Pseudoterminal intermediando o processo | Reimplementar PTY/eco/resize é frágil e caro; muda a experiência de falar com a CLI. Reavaliar em 0008 se a captura for exigida |
| `claude -p` com arquivo de saída | Perde a interatividade que é o objetivo de "abrir no Claude Code"; vira outro modo de uso. Candidato para uma ação separada em 0008 |
| Enviar a ação automaticamente (`sendText` com Enter) | Viola "humano no controle" (constituição Art. 9); a ação SDD pode escrever arquivos. Iniciar a CLI é aceitável; disparar a ação, não |

## Consequências

**Positivas**

- Incremento entregável sem depender de 0005/0008 nem de *proposed API*.
- Preserva o humano no controle e a segurança por padrão (nada sai da máquina além do que
  o usuário enviar).
- Núcleo (compor/citar) testável fora do host.

**Negativas**

- Sem evidências automáticas do resultado neste incremento. **Mitigação:** é escopo
  declarado da feature 0008; o dashboard (0003) já aponta `evidence.md` quando existir.
- O usuário precisa pressionar Enter para enviar a ação. **Mitigação:** é intencional — o
  prompt fica pronto (digitado e copiado), a um passo do envio.

## Limite desta decisão

Cobre o **adapter do incremento 0004** (montar/copiar prompt, abrir terminal). Não decide
como a feature 0008 fará a captura — apenas registra as opções e recomenda reavaliar
`claude -p` com arquivo de saída como ação separada, preservando a ação interativa deste
incremento.
