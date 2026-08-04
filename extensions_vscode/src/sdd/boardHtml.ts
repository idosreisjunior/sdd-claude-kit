// HTML do Painel SDD (Kanban + Overview) — puro. Diferente dos demais webviews
// (dashboard/spec editor, sem scripts, ADR-005), este painel USA um script com
// nonce para render client-side e atualização ao vivo por mensagens (ADR-024).
// A CSP mantém default-src 'none' e restringe style/script ao nonce. Todo texto
// de artefato é inserido via textContent no cliente (nunca innerHTML), então não
// há injeção de HTML.
import type { ChangesBoard } from './boardModel'

/** Serializa o board para dentro do <script>, neutralizando `<` (evita fechar a tag). */
function inlineJson(board: ChangesBoard): string {
  return JSON.stringify(board).replace(/</g, '\\u003c')
}

/** Gera o documento HTML do painel. `nonce` deve ser alfanumérico. */
export function renderBoardHtml(board: ChangesBoard, nonce: string): string {
  const csp = `default-src 'none'; style-src 'nonce-${nonce}'; script-src 'nonce-${nonce}';`
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta http-equiv="Content-Security-Policy" content="${csp}">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Painel SDD</title>
<style nonce="${nonce}">
  * { box-sizing: border-box; }
  body { font-family: var(--vscode-font-family); color: var(--vscode-foreground); margin: 0; padding: .75rem 1rem; }
  .overview { display: flex; align-items: baseline; gap: .4rem 1.2rem; flex-wrap: wrap; margin-bottom: .75rem; padding-bottom: .6rem; border-bottom: 1px solid var(--vscode-panel-border); }
  .ovbig { font-size: 1.5rem; font-weight: 700; }
  .ovlbl { opacity: .7; font-size: .85rem; margin-right: .6rem; }
  .topbar { display: flex; align-items: center; gap: .6rem; margin-bottom: .75rem; }
  .crumb { font-weight: 600; }
  .board { display: flex; gap: .6rem; align-items: flex-start; overflow-x: auto; padding-bottom: .5rem; }
  .col { flex: 0 0 15rem; background: var(--vscode-editorWidget-background, rgba(127,127,127,.06)); border: 1px solid var(--vscode-panel-border); border-radius: .5rem; padding: .5rem; max-height: calc(100vh - 8rem); overflow-y: auto; }
  .col.dragover { border-color: var(--vscode-focusBorder); background: var(--vscode-list-dropBackground, rgba(127,127,127,.16)); }
  .card[draggable="true"] { cursor: grab; }
  .colh { display: flex; align-items: center; justify-content: space-between; margin-bottom: .5rem; position: sticky; top: 0; }
  .coltitle { font-size: .78rem; text-transform: uppercase; letter-spacing: .04em; opacity: .85; font-weight: 600; }
  .colcount { font-size: .75rem; background: var(--vscode-badge-background); color: var(--vscode-badge-foreground); border-radius: .6rem; padding: .05rem .45rem; }
  .card { background: var(--vscode-editor-background); border: 1px solid var(--vscode-panel-border); border-radius: .45rem; padding: .5rem .55rem; margin-bottom: .5rem; }
  .ctitle { font-weight: 600; font-size: .9rem; cursor: pointer; }
  .ctitle:hover { text-decoration: underline; }
  .meta { display: flex; flex-wrap: wrap; gap: .3rem; margin: .35rem 0; }
  .chip { font-size: .72rem; opacity: .85; background: var(--vscode-badge-background); color: var(--vscode-badge-foreground); border-radius: .5rem; padding: .05rem .4rem; }
  .bar { height: .4rem; border-radius: .25rem; background: var(--vscode-panel-border); overflow: hidden; margin: .3rem 0 .15rem; }
  .bar > span { display: block; height: 100%; background: var(--vscode-progressBar-background); }
  .barlbl { font-size: .72rem; opacity: .75; }
  .muted { opacity: .65; }
  .tbtn { margin-top: .35rem; font: inherit; font-size: .78rem; cursor: pointer; color: var(--vscode-button-secondaryForeground, var(--vscode-foreground)); background: var(--vscode-button-secondaryBackground, transparent); border: 1px solid var(--vscode-panel-border); border-radius: .35rem; padding: .15rem .5rem; }
  .tbtn:hover { background: var(--vscode-button-secondaryHoverBackground, var(--vscode-list-hoverBackground)); }
</style>
</head>
<body>
  <div id="app"></div>
  <script nonce="${nonce}">
const INITIAL = ${inlineJson(board)};
const vscode = acquireVsCodeApi();
const state = { view: 'changes', changes: INITIAL, tasks: null, change: null };

function h(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text != null) e.textContent = text;
  return e;
}

function progressBar(p) {
  if (p && p.total > 0) {
    const pct = Math.round((p.done / p.total) * 100);
    const box = document.createElement('div');
    const bar = h('div', 'bar');
    const span = h('span');
    span.style.width = pct + '%';
    bar.appendChild(span);
    box.appendChild(bar);
    box.appendChild(h('div', 'barlbl', p.done + '/' + p.total + ' tarefas'));
    return box;
  }
  return h('div', 'barlbl muted', 'sem tarefas');
}

function changeCard(card) {
  const el = h('div', 'card');
  el.draggable = true;
  el.addEventListener('dragstart', function (ev) {
    ev.dataTransfer.setData('text/plain', card.id);
    ev.dataTransfer.effectAllowed = 'move';
  });
  const title = h('div', 'ctitle', card.title || card.id);
  title.title = 'Abrir dashboard';
  title.addEventListener('click', function () { vscode.postMessage({ type: 'open', id: card.id }); });
  el.appendChild(title);
  const meta = h('div', 'meta');
  meta.appendChild(h('span', 'chip', card.id));
  meta.appendChild(h('span', 'chip', card.type));
  meta.appendChild(h('span', 'chip', card.status));
  el.appendChild(meta);
  el.appendChild(progressBar(card.progress));
  const tbtn = h('button', 'tbtn', 'Tarefas ▸');
  tbtn.addEventListener('click', function () { vscode.postMessage({ type: 'tasks', id: card.id, title: card.title }); });
  el.appendChild(tbtn);
  return el;
}

function column(label, count, cards, make, dropLabel) {
  const c = h('div', 'col');
  const head = h('div', 'colh');
  head.appendChild(h('span', 'coltitle', label));
  head.appendChild(h('span', 'colcount', String(count)));
  c.appendChild(head);
  cards.forEach(function (item) { c.appendChild(make(item)); });
  if (dropLabel) {
    c.addEventListener('dragover', function (ev) { ev.preventDefault(); c.classList.add('dragover'); });
    c.addEventListener('dragleave', function () { c.classList.remove('dragover'); });
    c.addEventListener('drop', function (ev) {
      ev.preventDefault();
      c.classList.remove('dragover');
      const id = ev.dataTransfer.getData('text/plain');
      if (id) { vscode.postMessage({ type: 'move', id: id, toLabel: dropLabel }); }
    });
  }
  return c;
}

function renderChanges() {
  const root = document.getElementById('app');
  root.textContent = '';
  const ov = state.changes.overview;
  const head = h('div', 'overview');
  head.appendChild(h('div', 'ovbig', String(ov.total)));
  head.appendChild(h('div', 'ovlbl', 'mudanças'));
  head.appendChild(h('div', 'ovbig', ov.donePct + '%'));
  head.appendChild(h('div', 'ovlbl', 'concluídas (' + ov.done + ')'));
  root.appendChild(head);
  if (ov.total === 0) {
    root.appendChild(h('p', 'muted', 'Nenhuma mudança em .specs ainda.'));
    return;
  }
  const board = h('div', 'board');
  state.changes.columns.forEach(function (col) {
    board.appendChild(column(col.label, col.cards.length, col.cards, changeCard, col.label));
  });
  root.appendChild(board);
}

function taskCard(t) {
  const el = h('div', 'card');
  el.appendChild(h('div', 'ctitle', t.title || t.id));
  el.appendChild(h('span', 'chip', t.id));
  return el;
}

function renderTasks() {
  const root = document.getElementById('app');
  root.textContent = '';
  const bar = h('div', 'topbar');
  const back = h('button', 'tbtn', '◂ Voltar');
  back.addEventListener('click', function () { state.view = 'changes'; render(); });
  bar.appendChild(back);
  bar.appendChild(h('span', 'crumb', state.change || ''));
  root.appendChild(bar);
  const board = h('div', 'board');
  const cols = state.tasks ? state.tasks.columns : [];
  cols.forEach(function (col) {
    board.appendChild(column(col.label, col.cards.length, col.cards, taskCard));
  });
  root.appendChild(board);
}

function render() {
  if (state.view === 'tasks') { renderTasks(); } else { renderChanges(); }
}

window.addEventListener('message', function (e) {
  const m = e.data || {};
  if (m.type === 'board') {
    state.changes = m.board;
    if (state.view === 'changes') { render(); }
  } else if (m.type === 'tasks') {
    state.tasks = m.board;
    state.change = m.title || m.id;
    state.view = 'tasks';
    render();
  }
});

render();
  </script>
</body>
</html>`
}
