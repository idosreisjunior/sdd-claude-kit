# SDD Cockpit — Contrato de estilo dos mockups

Documento normativo para gerar os mockups SVG. Todas as telas seguem **exatamente**
estas tokens, o mesmo `<defs>` e os mesmos padrões de componente, para lerem como um
único sistema. Os mockups são **dark-first** (combina com o padrão do VS Code e com o
`galleryBanner` escuro da extensão). Na implementação real as cores mapeiam para
variáveis `--vscode-*` (ver seção "Mapeamento para o tema do VS Code").

## Canvas

| Tipo de tela | viewBox |
| --- | --- |
| Painel cheio (área do editor) | `0 0 1280 832` |
| Sidebar (Activity Bar view) | `0 0 360 760` |
| Folha de design system | `0 0 1280 940` |

Fundo do canvas: `#0E1116`. Cada painel cheio tem uma **barra superior** (altura 56) e,
quando é o wizard, uma **trilha de etapas** (stepper) logo abaixo.

## Cores (hex fixos nos mockups)

```
Canvas app bg        #0E1116
Surface (card)       #161B22
Surface raised       #1B2230
Surface hover        #212A38
Border subtle        #263041   (1px, uso padrão de borda)
Border strong        #313C4E
Text primary         #E6EDF3
Text secondary       #9AA7B4
Text dim             #6B7684
Accent violeta       #7C6BF0   (marca; gradiente → #9C8CFF)
Accent violeta hover #8E7EF5
Claude/IA coral      #E08256   (ações "com o Claude Code"; gradiente → #F0A07A)
Success              #3FB86B
Warning              #E0A33A
Danger               #F0655A
Info                 #4C9BF0
```

Cores do ciclo de vida (status) — usadas em chips, pontos e barras:

```
DRAFT        #6B7684   CLARIFIED  #4C9BF0   DESIGNED  #7C6BF0   PLANNED   #E0A33A
APPROVED     #38BDC9   IN_PROGRESS #E0823A  VERIFIED  #3FB86B   ARCHIVED  #49525E
```

Chip de status = retângulo `rx=999`, preenchimento na cor do status a ~16% (use o hex
com sufixo de opacidade via `fill-opacity="0.16"` num rect na cor, e texto na cor cheia).

## Tipografia

`font-family="'Inter','Segoe UI',system-ui,-apple-system,sans-serif"`

| Papel | size | weight | outras |
| --- | --- | --- | --- |
| Display | 26 | 700 | títulos de tela |
| H1 | 18 | 700 | |
| Section caps | 11 | 600 | `letter-spacing=".09em"`, UPPERCASE, fill `#6B7684` |
| Body | 13 | 400/500 | |
| Caption | 11 | 400 | fill `#9AA7B4` |
| Micro | 10 | 500 | chips, contadores |

## Raios e espaçamento

Grid base 8px. Card `rx=12`. Botão `rx=8`. Chip `rx=999`. Input `rx=8`. Padding do
painel 24. Padding do card 16.

## `<defs>` compartilhado (colar idêntico em TODA tela)

```svg
<defs>
  <linearGradient id="gViolet" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#7C6BF0"/><stop offset="1" stop-color="#9C8CFF"/>
  </linearGradient>
  <linearGradient id="gCoral" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#E08256"/><stop offset="1" stop-color="#F0A07A"/>
  </linearGradient>
  <linearGradient id="gCanvas" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#0F131A"/><stop offset="1" stop-color="#0C0F14"/>
  </linearGradient>
  <filter id="soft" x="-20%" y="-20%" width="140%" height="140%">
    <feDropShadow dx="0" dy="6" stdDeviation="14" flood-color="#000000" flood-opacity="0.35"/>
  </filter>
  <filter id="softsm" x="-40%" y="-40%" width="180%" height="180%">
    <feDropShadow dx="0" dy="2" stdDeviation="5" flood-color="#000000" flood-opacity="0.30"/>
  </filter>
</defs>
```

## Componentes (padrões de marcação)

**Card**
```svg
<rect x="" y="" width="" height="" rx="12" fill="#161B22" stroke="#263041"/>
```
Card em destaque (ativo): stroke `#7C6BF0`, adicionar `filter="url(#softsm)"`.

**Section caps (rótulo de seção)**
```svg
<text ... font-size="11" font-weight="600" letter-spacing="1" fill="#6B7684">REQUISITOS</text>
```

**Botão primário**
```svg
<rect x="" y="" width="150" height="36" rx="8" fill="url(#gViolet)"/>
<text ... font-size="13" font-weight="600" fill="#FFFFFF" text-anchor="middle">Rótulo</text>
```

**Botão secundário**
```svg
<rect ... rx="8" fill="none" stroke="#313C4E"/>
<text ... fill="#E6EDF3" ...>Rótulo</text>
```

**Botão IA (com o Claude Code)** — sempre com o glifo de brilho (sparkle) à esquerda do texto.
```svg
<rect ... rx="8" fill="url(#gCoral)"/>
<!-- sparkle: --> <path d="M X Y ..." fill="#FFFFFF"/>
<text ... fill="#FFFFFF" font-weight="600">Preencher com o Claude Code</text>
```
Glifo sparkle (4 pontas), centrado em (cx,cy), escala ~7px:
`M cx,cy-7 L cx+2,cy-2 L cx+7,cy L cx+2,cy+2 L cx,cy+7 L cx-2,cy+2 L cx-7,cy L cx-2,cy-2 Z`

**Chip de status**
```svg
<rect x="" y="" width="" height="20" rx="10" fill="#4C9BF0" fill-opacity="0.16"/>
<circle cx="" cy="" r="3" fill="#4C9BF0"/>
<text ... font-size="10" font-weight="600" fill="#4C9BF0">CLARIFIED</text>
```

**Barra de progresso** (track + fill)
```svg
<rect x="" y="" width="W" height="6" rx="3" fill="#263041"/>
<rect x="" y="" width="W*pct" height="6" rx="3" fill="url(#gViolet)"/>
```

**Anel de progresso** (usado nos cards do board): círculo track `stroke="#263041"` +
arco `stroke="url(#gViolet)"` com `stroke-dasharray`/`stroke-dashoffset`, `stroke-linecap="round"`,
raio 16, `stroke-width` 4, girado `transform="rotate(-90 cx cy)"`.

**Nó do stepper** (trilha de etapas)
- concluído: `<circle r="13" fill="url(#gViolet)"/>` + check branco (`M -4,0 l 3,3 l 6,-7` stroke branco 2).
- atual: `<circle r="13" fill="#161B22" stroke="#7C6BF0" stroke-width="2"/>` + `<circle r="4" fill="#7C6BF0"/>`.
- futuro: `<circle r="13" fill="#161B22" stroke="#313C4E" stroke-width="2"/>` + número em `#6B7684`.
- conector: linha `stroke="#263041"` (concluída: `#7C6BF0`).

**Left rail (trilho de ícones da Activity Bar)** — coluna 56px, fundo `#0C0F14`, ícones
stroke `#6B7684` 1.6; ativo com barra vertical `#7C6BF0` à esquerda e ícone `#E6EDF3`.

## Ícones (glifos stroke, sem fonte de ícone)

Traço `stroke` 1.6, `fill="none"`, `stroke-linecap="round"`, `stroke-linejoin="round"`,
`stroke="#9AA7B4"` (ou a cor do contexto). Biblioteca mínima: doc, sparkle, plus, search,
filtro (funil), gauge/velocímetro, colunas (kanban), play, flask/verify, git-branch,
check-circle, relógio (histórico), engrenagem. Desenhe simples e legível a 20–24px.

## As 8 etapas do wizard (nomes canônicos)

`1 Solicitar · 2 Especificar · 3 Clarificar · 4 Desenhar · 5 Tarefas · 6 Aprovar ·
7 Implementar · 8 Verificar` — seguidas de **Arquivar** como estado terminal. Espelha o
fluxo do CLAUDE.md: `new → spec → clarify → design → tasks → approve → implement →
verify → archive`.

## Mapeamento para o tema do VS Code (implementação)

Na implementação real, cada cor-mock vira uma variável de tema para respeitar claro/escuro:

| Mock | Variável VS Code |
| --- | --- |
| Surface `#161B22` | `--vscode-editorWidget-background` |
| Border `#263041` | `--vscode-panel-border` |
| Text primary | `--vscode-foreground` |
| Text dim | `--vscode-descriptionForeground` |
| Accent violeta | `--vscode-button-background` / `--vscode-focusBorder` |
| Barra de progresso | `--vscode-progressBar-background` |
| Chip bg | `--vscode-badge-background` |

O violeta e o coral são a **camada de marca** do SDD Cockpit, aplicada por cima do tema
como acento (gradientes e destaques), sem quebrar a leitura em temas claros.
