# Instalação

O SDD Claude Kit é um plugin do Claude Code. Este repositório é o marketplace.

**Requisito:** Claude Code instalado. Nada mais — o plugin não tem dependências e não exige `npm install`.

---

## Instalar

Dentro de uma sessão do Claude Code:

```
/plugin marketplace add idosreisjunior/sdd-claude-kit
/plugin install sdd-kit@sdd-claude-kit
```

Ou pelo terminal:

```bash
claude plugin marketplace add idosreisjunior/sdd-claude-kit
claude plugin install sdd-kit@sdd-claude-kit
```

## Verificar

```bash
claude plugin details sdd-kit
```

Saída esperada:

```
SDD Claude Kit (sdd-kit) 0.1.0
  Spec-Driven Development para Claude Code: transforma solicitações em
  linguagem natural em especificações, tarefas e rastreabilidade versionadas
  em .specs, ao lado do código.
  Source: sdd-kit@sdd-claude-kit

Component inventory
  Skills (10) init, new, spec, tasks, clarify, design, approve, implement, verify, archive
  Agents (0)
  Hooks (0)
  MCP servers (0)
  LSP servers (0)

Projected token cost
  Always-on:   ~2.5k tok  added to every session
```

Dez skills. Se aparecerem menos, algo deu errado na instalação.

### Custo de contexto

Os **~2,5k tokens sempre ativos** são as descrições das dez skills, presentes em toda sessão para que o Claude saiba que elas existem. O corpo de cada skill — cerca de 4k tokens — só é carregado quando ela é invocada.

## Instalar a partir de um clone local

Útil para testar modificações antes de enviar um PR:

```bash
git clone https://github.com/idosreisjunior/sdd-claude-kit.git
claude plugin marketplace add ./sdd-claude-kit
claude plugin install sdd-kit@sdd-claude-kit
```

> **O `./` é obrigatório.** `claude plugin marketplace add .` é rejeitado com
> `Invalid marketplace source format`. O comando aceita `./caminho`, `owner/repo` ou uma URL.

## Desinstalar

```bash
claude plugin uninstall sdd-kit@sdd-claude-kit
claude plugin marketplace remove sdd-claude-kit
```

O diretório `.specs/` do seu projeto **permanece**. É Markdown e YAML: legível e editável sem o plugin, e continua fazendo sentido no Git depois que você desinstalar.

---

## O que o plugin faz na sua máquina

| | |
| --- | --- |
| Acessa a rede | **Não.** Nenhum componente faz I/O de rede — há teste automatizado verificando isso |
| Coleta telemetria | **Não.** Nenhuma |
| Escreve fora de `.specs/` | Não, exceto arquivos que você confirmar |
| Instala hooks | **Não.** Hooks são opt-in e chegam na Fase 4 |
| Executa comandos de shell | Não nesta fase |

Os comandos em `.specs/config.yaml` (`validation.commands`) são tratados como **entrada não confiável**. Revise esse arquivo antes de aceitar um repositório de terceiros: é ele que diz quais comandos o framework executaria.

Ver a [política de segurança](../../SECURITY.md).

---

## Estado atual

Dez das treze skills já estão no plugin — quatro prontas e seis em validação:

| Skill | Estado |
| --- | --- |
| `/sdd-kit:init` | ✅ Fase 1 — pronta |
| `/sdd-kit:new` | ✅ Fase 1 — pronta |
| `/sdd-kit:spec` | ✅ Fase 1 — pronta |
| `/sdd-kit:tasks` | ✅ Fase 1 — pronta |
| `clarify`, `design`, `approve`, `implement`, `verify`, `archive` | 🚧 Fase 2 — escritas e invocáveis, **em validação por execução real** |
| `review`, `discover`, `status` | Fase 2 — planejadas ([ROADMAP](../../ROADMAP.md)) |

As seis skills da Fase 2 já respondem ao serem invocadas e passam pela validação estrutural do plugin, mas ainda **não** foram certificadas por execução real ponta a ponta — trate-as como experimentais até o fluxo `DRAFT → ARCHIVED` ser validado. Ver o [ROADMAP](../../ROADMAP.md).

O modo `strict` também é da Fase 4. Configurá-lo agora faz as skills informarem que ele não está implementado e operarem como `guided` — elas **não** fingem bloqueio.

---

## Problemas comuns

**`Invalid marketplace source format`** — falta o `./` no caminho local.

**As skills não aparecem** — confirme com `claude plugin list` que o plugin está `enabled`. Se você editou o plugin, rode `/reload-plugins` ou reinicie a sessão.

**`/sdd-kit:new` diz que o projeto não foi inicializado** — rode `/sdd-kit:init` primeiro. `new` não cria `.specs/` por conta própria, porque `init` faz um diagnóstico e pede revisão, e pular isso produziria uma configuração que ninguém conferiu.

---

## Verificação destas instruções

Os comandos de instalação, verificação e desinstalação foram **executados** durante o desenvolvimento (`TASK-PF-003`), numa máquina onde o plugin não estava instalado, e o estado foi revertido em seguida. As saídas acima são reais.

> **Não verificado:** o caminho `claude plugin marketplace add idosreisjunior/sdd-claude-kit` só funciona depois que o repositório for publicado no GitHub. Até lá, use o clone local.
