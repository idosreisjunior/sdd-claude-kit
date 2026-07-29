# Guia de contribuição

Obrigado pelo interesse em contribuir com o **SDD Claude Kit**.

Este projeto é construído com o próprio método que propõe: **a especificação vem antes do código**. Contribuições que alteram comportamento precisam de uma spec.

## Antes de começar

1. Leia o [PRD](./PRD.md) — especialmente §5 (não objetivos) e §25 (roadmap).
2. Leia a [constituição do projeto](./.specs/project/constitution.md) — são as regras invioláveis.
3. Leia o [código de conduta](./CODE_OF_CONDUCT.md).

## Tipos de contribuição

| Tipo | Precisa de spec? | Caminho |
| --- | --- | --- |
| Correção de typo, link quebrado, formatação | Não | PR direto |
| Correção de bug com comportamento já especificado | Não (registre em `.specs/bugs/`) | Issue → PR |
| Nova funcionalidade ou mudança de comportamento | **Sim** | Issue → spec → design → tarefas → PR |
| Mudança arquitetural | **Sim + ADR** | Issue → discussão → ADR → PR |
| Novo exemplo ou tradução | Não | PR direto |

## Fluxo para uma nova funcionalidade

```
Issue descrevendo o problema
   ↓
Spec em .specs/features/NNNN-nome/spec.md   (requisitos + cenários + critérios de aceite)
   ↓
Design em design.md                          (+ ADR, se houver decisão arquitetural)
   ↓
Tarefas em tasks.md                          (pequenas, com dependências explícitas)
   ↓
Aprovação de um mantenedor                   (status APPROVED)
   ↓
Implementação, uma tarefa por vez
   ↓
Verificação + rastreabilidade atualizada
   ↓
Pull Request
```

Use os templates em `plugins/sdd-kit/templates/` quando estiverem disponíveis (Fase 1).

## Convenções

### Identificadores

`REQ-*` requisito · `NFR-*` requisito não funcional · `SCN-*` cenário · `TASK-*` tarefa · `TEST-*` teste · `ADR-*` decisão arquitetural. Formato: `PREFIXO-ESCOPO-NNN` (ex.: `REQ-AUTH-001`).

### Idioma

- Documentação e specs: **pt-BR** (traduções para `en` são bem-vindas em `docs/en/`).
- Código, identificadores, nomes de arquivo e mensagens de commit: **inglês**.

### Commits

[Conventional Commits](https://www.conventionalcommits.org/):

```
feat(skills): add init skill
fix(validator): detect duplicated requirement ids
docs(pt-BR): add installation guide
spec(0002-cli): add technical design
```

### Branches

`feat/<escopo>`, `fix/<escopo>`, `docs/<escopo>`, `spec/<id>`.

## Definition of Done

Uma contribuição só está pronta quando ([PRD §32](./PRD.md#32-definition-of-done)):

- [ ] Código implementado
- [ ] Testes relacionados aprovados
- [ ] Lint aprovado
- [ ] Build aprovado (quando aplicável)
- [ ] Documentação atualizada
- [ ] Rastreabilidade atualizada
- [ ] Critérios de aceite avaliados
- [ ] Sem erros críticos de validação
- [ ] Tarefa relacionada a uma especificação
- [ ] Mudanças de arquitetura documentadas em ADR

## Pull Requests

- Um PR por tarefa ou por conjunto pequeno e coeso de tarefas.
- Referencie a spec e as tarefas no corpo do PR (`Spec: 0001-plugin-foundation`, `Tasks: TASK-PF-003`).
- Descreva hipóteses assumidas.
- PRs que mudam comportamento sem spec aprovada serão devolvidos com um pedido de spec — não é rejeição, é o processo.

## Reportando bugs e segurança

- Bugs: abra uma issue com passos de reprodução, versão do Claude Code e sistema operacional.
- Vulnerabilidades: **não** abra issue pública. Siga a [política de segurança](./SECURITY.md).

## Ambiente de desenvolvimento

Requer **Node.js ≥ 20**.

```bash
git clone https://github.com/idosreisjunior/sdd-claude-kit.git
cd sdd-claude-kit
npm install
```

| Comando | O que faz |
| --- | --- |
| `npm run lint` | ESLint sobre o código do repositório |
| `npm run build` | `tsc --noEmit` — verificação de tipos |
| `npm test` | Vitest |
| `npm run validate-plugin` | Valida os manifestos com o CLI oficial do Claude Code |

> `npm test` usa `--passWithNoTests` enquanto não há testes escritos. O exit 0 significa "nada a executar", **não** "tudo passou". A flag sai quando os primeiros testes existirem.

### Linguagens

Ver [ADR-007](./.specs/project/decisions/ADR-007-scripts-do-plugin-em-javascript.md). A fronteira é o diretório:

| Diretório | Linguagem | Motivo |
| --- | --- | --- |
| `plugins/sdd-kit/scripts/` | JavaScript com JSDoc | Plugins são copiados como estão, sem build nem `npm install` |
| `packages/cli/` | TypeScript | Pacote npm tem etapa de build normal |

Scripts do plugin **não podem ter dependências de runtime** — nada de `node_modules` no que é distribuído pelo marketplace.

### Testando o plugin localmente

```bash
claude plugin marketplace add ./     # o `./` é obrigatório
claude plugin install sdd-kit@sdd-claude-kit
claude plugin details sdd-kit
```

Para reverter: `claude plugin uninstall sdd-kit@sdd-claude-kit && claude plugin marketplace remove sdd-claude-kit`.

## Licença das contribuições

Ao contribuir, você concorda em licenciar sua contribuição sob a [Apache 2.0](./LICENSE).
