# Política de segurança

## Versões suportadas

O projeto está em Fase 0 (fundação). Ainda não há releases. Quando houver, apenas a última versão menor receberá correções de segurança.

| Versão | Suporte |
| --- | --- |
| `0.x` (pré-release) | Melhor esforço |

## Reportando uma vulnerabilidade

**Não abra uma issue pública para vulnerabilidades.**

Use o [GitHub Security Advisories](https://docs.github.com/pt/code-security/security-advisories/guidance-on-reporting-and-writing-information-about-vulnerabilities/privately-reporting-a-security-vulnerability) do repositório (aba *Security* → *Report a vulnerability*), ou envie um e-mail para **idosreisjunior@gmail.com**.

Inclua: descrição da vulnerabilidade, passos de reprodução, impacto estimado, versão afetada e sistema operacional.

**Compromisso de resposta:** confirmação de recebimento em até 5 dias úteis; avaliação inicial em até 15 dias.

## Modelo de segurança do framework

O SDD Claude Kit executa dentro do Claude Code, no seu ambiente local. Ele **não** possui serviço próprio, banco de dados remoto ou telemetria ([PRD §30, ADR-005](./PRD.md#30-decisões-técnicas-iniciais)).

### Superfície de risco

| Componente | Risco | Mitigação |
| --- | --- | --- |
| **Hooks** | Executam código automaticamente em eventos do Claude Code | Desativados por padrão (`security.hooks_enabled: false`). Todo comando executado é documentado. |
| **Comandos de validação** | `validation.commands` vem do `config.yaml` do projeto | Tratados como **entrada não confiável**. No modo strict, exigem confirmação conforme `security.allow_shell_commands`. |
| **Scripts** | Leem e escrevem em `.specs` | Restritos ao diretório `.specs` e a caminhos declarados em `paths`. |
| **Modo strict** | Pode bloquear operações de edição | Opt-in explícito. Sempre desativável. |
| **`.specs` no Git** | Specs são versionadas e podem vazar dados | O framework nunca deve gravar segredos em `.specs`. Ver abaixo. |

### Regras invioláveis

1. Nenhum segredo, credencial ou token deve ser armazenado em `.specs`.
2. O framework não envia dados para nenhum serviço controlado pelo projeto.
3. Hooks que bloqueiam ações ou executam comandos são **opcionais** e desativados por padrão.
4. Comandos de shell perigosos exigem aprovação explícita do usuário.
5. Todo comando que o framework possa executar é documentado antes de estar disponível.

### Sua responsabilidade

- Revise `.specs/config.yaml` antes de aceitar um repositório de terceiros — `validation.commands` executa comandos na sua máquina.
- Não cole segredos em specs, requisitos ou ADRs. Use referências (`AUTH_SECRET via variável de ambiente`).
- Ative hooks apenas depois de ler o que eles executam.

## Escopo

**Dentro do escopo:** execução de código não intencional via hooks, scripts ou templates; escapes de caminho para fora de `.specs`/`paths`; vazamento de segredos gravados pelo framework; escalonamento de privilégios por meio da configuração.

**Fora do escopo:** vulnerabilidades do próprio Claude Code (reporte à Anthropic); vulnerabilidades no código que o Claude gera para o seu projeto; configurações inseguras criadas manualmente pelo usuário.
