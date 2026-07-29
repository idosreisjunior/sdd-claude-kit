# ADR-005 — Sem telemetria no MVP

- **Status:** Aceito
- **Data:** 2026-07-29
- **Origem:** PRD §28, §30

## Contexto

O PRD define métricas de uso (specs criadas, features arquivadas, percentual de requisitos rastreados, projetos em modo strict). Coletá-las automaticamente exigiria enviar dados do ambiente de desenvolvimento do usuário para um serviço externo.

O framework opera sobre o código-fonte e as especificações do usuário — material frequentemente confidencial.

## Decisão

O framework **não coleta telemetria**. Nenhum componente faz requisição de rede.

## Alternativas consideradas

| Alternativa | Por que não |
| --- | --- |
| Telemetria opt-in | Ainda exige infraestrutura de coleta, política de privacidade e confiança; custo alto para o valor no MVP. |
| Telemetria opt-out | Inaceitável para uma ferramenta que lê código-fonte proprietário. |
| Relatório local que o usuário envia manualmente | Possível no futuro; não é necessário agora. |

## Consequências

**Positivas:** confiança; sem infraestrutura para manter; sem política de privacidade a redigir; sem superfície de exfiltração de dados; adoção mais fácil em ambientes corporativos.

**Negativas:** as métricas de uso do PRD §28 não são observáveis diretamente. **Mitigação:** usar sinais públicos (estrelas, forks, issues, PRs) e feedback qualitativo da comunidade.

**Regra derivada (constituição Art. 9):** nenhum componente do framework faz I/O de rede. Isso é verificável deterministicamente e deve virar um teste automatizado.
