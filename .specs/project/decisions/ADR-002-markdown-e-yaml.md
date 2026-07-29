# ADR-002 — Especificações em Markdown e YAML

- **Status:** Aceito
- **Data:** 2026-07-29
- **Origem:** PRD §30

## Contexto

As especificações precisam ser legíveis por humanos, editáveis sem ferramentas próprias, versionáveis no Git com diffs úteis e processáveis por scripts determinísticos. Esses dois públicos — humano e programa — têm necessidades diferentes.

## Decisão

Separar por finalidade:

| Formato | Usado para |
| --- | --- |
| **Markdown** | Documentos de leitura humana: `request.md`, `spec.md`, `design.md`, `tasks.md`, `acceptance.md`, `validation.md`, ADRs, documentos de `project/`. |
| **YAML** | Dados estruturados lidos por scripts: `config.yaml`, `index.yaml`, `status.yaml`, `traceability.yaml`. |
| **JSON Schema** | Definição e validação da forma dos arquivos YAML. |

## Alternativas consideradas

| Alternativa | Por que não |
| --- | --- |
| Tudo em Markdown com front matter | Rastreabilidade e estados viram texto livre difícil de validar deterministicamente (viola a constituição Art. 11). |
| Tudo em JSON | Ilegível e ineditável na prática para documentos longos; diffs ruins. |
| Banco de dados local (SQLite) | Viola RNF-004 (portabilidade) e a exigência de specs legíveis sem o plugin. |
| TOML no lugar de YAML | Menos familiar no ecossistema de dev tools; suporte a estruturas aninhadas mais desconfortável. |

## Consequências

**Positivas:** specs legíveis e editáveis sem o plugin; diffs de Git significativos; validação determinística possível sobre os arquivos YAML; sem dependência de runtime para ler as specs.

**Negativas:** duas fontes de informação sobre a mesma mudança (ex.: status da tarefa em `tasks.md` e em `traceability.yaml`) podem divergir. **Mitigação:** o validador (`validate-specs`) deve tratar divergência entre Markdown e YAML como erro, e o YAML é a fonte autoritativa em caso de conflito.

YAML tem armadilhas conhecidas (`no` → `false`, versões como número). Todo valor sensível deve ser citado.
