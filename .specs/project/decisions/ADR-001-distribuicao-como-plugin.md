# ADR-001 — Distribuição como plugin do Claude Code

- **Status:** Aceito
- **Data:** 2026-07-29
- **Origem:** PRD §30

## Contexto

O SDD Claude Kit precisa ser instalado e usado dentro do Claude Code. As opções de distribuição eram: plugin nativo do Claude Code, pacote npm com instruções de configuração manual, ou template de repositório copiado pelo usuário.

## Decisão

Distribuir inicialmente como **plugin do Claude Code**, publicado a partir deste repositório GitHub via `.claude-plugin/marketplace.json`.

## Alternativas consideradas

| Alternativa | Por que não |
| --- | --- |
| Pacote npm com setup manual | Exige que o usuário edite `CLAUDE.md` e configure hooks à mão; alta fricção e alta chance de configuração inconsistente. |
| Template de repositório | Não atende projetos existentes (PRD §7.5); atualizações não chegam a quem já copiou. |
| Extensão de IDE | Fora do escopo (PRD §5); não é onde o Claude Code executa. |

## Consequências

**Positivas:** instalação simplificada; suporte nativo a skills, agentes e hooks; versionamento e atualização pelo GitHub; sem dependência de runtime instalado para o uso básico.

**Negativas:** acoplamento ao formato de plugin do Claude Code, que pode mudar (PRD §29, risco 5). Mitigação: versionamento semântico, camada de abstração entre skills e scripts, e testes de compatibilidade.

**Implicação:** a CLI (Fase 5) deve reutilizar os mesmos scripts, nunca duplicar lógica.
