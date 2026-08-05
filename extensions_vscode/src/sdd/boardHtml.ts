// HTML do Painel SDD (Kanban + Overview) — puro. Diferente dos demais webviews
// (dashboard/spec editor, sem scripts, ADR-005), este painel USA um script com
// nonce para render client-side e atualização ao vivo por mensagens (ADR-024).
// A CSP mantém default-src 'none' e restringe style/script ao nonce. Todo texto
// de artefato é inserido via textContent no cliente (nunca innerHTML), então não
// há injeção de HTML.
import type { ChangesBoard, FeedItem } from './boardModel'

/** Serializa dados para dentro do <script>, neutralizando `<` (evita fechar a tag). */
function inlineJson(value: unknown): string {
  return JSON.stringify(value).replace(/</g, '\\u003c')
}

/** Gera o documento HTML do painel. `nonce` deve ser alfanumérico. */
export function renderBoardHtml(board: ChangesBoard, nonce: string, feed: FeedItem[] = []): string {
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
  .toolbar { display: flex; flex-wrap: wrap; gap: .5rem; align-items: center; margin-bottom: .65rem; }
  .search { flex: 1 1 14rem; min-width: 9rem; font: inherit; padding: .3rem .5rem; border-radius: .4rem; border: 1px solid var(--vscode-input-border, var(--vscode-panel-border)); background: var(--vscode-input-background); color: var(--vscode-input-foreground); }
  .search::placeholder { color: var(--vscode-input-placeholderForeground); }
  .chips { display: flex; flex-wrap: wrap; gap: .3rem; }
  .fchip { font: inherit; font-size: .78rem; cursor: pointer; padding: .18rem .55rem; border-radius: .6rem; border: 1px solid var(--vscode-panel-border); background: transparent; color: var(--vscode-foreground); }
  .fchip.on { background: var(--vscode-badge-background); color: var(--vscode-badge-foreground); border-color: transparent; }
  .sortsel { font: inherit; font-size: .8rem; padding: .2rem .4rem; border-radius: .35rem; border: 1px solid var(--vscode-panel-border); background: var(--vscode-dropdown-background, var(--vscode-input-background)); color: var(--vscode-dropdown-foreground, var(--vscode-foreground)); }
  .feedbtn { margin-left: auto; }
  .feed { display: flex; flex-direction: column; gap: .4rem; max-width: 48rem; }
  .feeditem { border: 1px solid var(--vscode-panel-border); border-radius: .45rem; padding: .45rem .6rem; }
  .feedhead { display: flex; align-items: center; gap: .5rem; }
  .feedid { font-weight: 600; cursor: pointer; }
  .feedid:hover { text-decoration: underline; }
  .feedhead .d { opacity: .6; font-size: .8rem; margin-left: auto; }
  .feedreason { opacity: .8; font-size: .85rem; margin-top: .25rem; }
  .morebtn { margin-top: .5rem; }
</style>
</head>
<body>
  <div id="app"></div>
  <script nonce="${nonce}">
const INITIAL = ${inlineJson(board)};
const INITIAL_FEED = ${inlineJson(feed)};
const vscode = acquireVsCodeApi();
const state = { view: 'changes', changes: INITIAL, feed: INITIAL_FEED, tasks: null, change: null, filter: { query: '', types: [] }, sort: 'id-asc', feedOrder: 'desc', feedFilter: { query: '', statuses: [] }, feedShown: 20 };

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

// Espelha cardMatchesFilter (boardModel.ts) — busca por id/título + tipo (ADR-026).
function cardMatches(card) {
  const q = state.filter.query.trim().toLowerCase();
  const okType = state.filter.types.length === 0 || state.filter.types.indexOf(card.type) !== -1;
  const okQuery = q === '' || card.id.toLowerCase().indexOf(q) !== -1 || (card.title || '').toLowerCase().indexOf(q) !== -1;
  return okType && okQuery;
}

// Espelha sortBoardCards (boardModel.ts) — id/título/progresso (ADR-028).
function sortCards(cards, key) {
  const pct = function (c) { return c.progress && c.progress.total > 0 ? c.progress.done / c.progress.total : -1; };
  const arr = cards.slice();
  arr.sort(function (a, b) {
    if (key === 'id-desc') { return a.id < b.id ? 1 : a.id > b.id ? -1 : 0; }
    if (key === 'title') { return a.title.localeCompare(b.title, 'pt-BR'); }
    if (key === 'progress') { const d = pct(b) - pct(a); return d !== 0 ? d : (a.id < b.id ? -1 : a.id > b.id ? 1 : 0); }
    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
  });
  return arr;
}

function presentTypes() {
  const seen = {};
  state.changes.columns.forEach(function (col) {
    col.cards.forEach(function (c) { seen[c.type] = true; });
  });
  return Object.keys(seen).sort();
}

// Tipos a exibir como chips: os presentes no board + os selecionados que já não
// aparecem (para o usuário poder limpá-los).
function typesForChips() {
  const seen = {};
  presentTypes().forEach(function (t) { seen[t] = true; });
  state.filter.types.forEach(function (t) { seen[t] = true; });
  return Object.keys(seen).sort();
}

function renderChips(chipsEl) {
  chipsEl.textContent = '';
  typesForChips().forEach(function (type) {
    const on = state.filter.types.indexOf(type) !== -1;
    const chip = h('button', 'fchip', type);
    chip.setAttribute('aria-pressed', on ? 'true' : 'false');
    if (on) { chip.classList.add('on'); }
    chip.addEventListener('click', function () {
      const i = state.filter.types.indexOf(type);
      const nowOn = i === -1;
      if (nowOn) { state.filter.types.push(type); } else { state.filter.types.splice(i, 1); }
      chip.classList.toggle('on', nowOn);
      chip.setAttribute('aria-pressed', nowOn ? 'true' : 'false');
      renderBoardArea();
    });
    chipsEl.appendChild(chip);
  });
}

function buildToolbar() {
  const bar = h('div', 'toolbar');
  const search = document.createElement('input');
  search.type = 'search';
  search.className = 'search';
  search.placeholder = 'Buscar por id ou título...';
  search.setAttribute('aria-label', 'Buscar mudanças por id ou título');
  search.value = state.filter.query;
  search.addEventListener('input', function () { state.filter.query = search.value; renderBoardArea(); });
  bar.appendChild(search);
  const chips = h('div', 'chips');
  renderChips(chips);
  bar.appendChild(chips);
  const sortSel = document.createElement('select');
  sortSel.className = 'sortsel';
  sortSel.setAttribute('aria-label', 'Ordenar o quadro');
  [['id-asc', 'Id ↑'], ['id-desc', 'Id ↓'], ['title', 'Título A–Z'], ['progress', 'Progresso']].forEach(function (o) {
    const opt = document.createElement('option');
    opt.value = o[0];
    opt.textContent = o[1];
    if (state.sort === o[0]) { opt.selected = true; }
    sortSel.appendChild(opt);
  });
  sortSel.addEventListener('change', function () { state.sort = sortSel.value; renderBoardArea(); });
  bar.appendChild(sortSel);
  const feedBtn = h('button', 'tbtn feedbtn', 'Atividade ▸');
  feedBtn.addEventListener('click', function () { state.view = 'activity'; render(); });
  bar.appendChild(feedBtn);
  return bar;
}

// Espelha feedItemMatches (boardModel.ts) — busca id/título + status (ADR-029).
function feedMatches(item) {
  const q = state.feedFilter.query.trim().toLowerCase();
  const okStatus = state.feedFilter.statuses.length === 0 || state.feedFilter.statuses.indexOf(item.status) !== -1;
  const okQuery = q === '' || item.id.toLowerCase().indexOf(q) !== -1 || (item.title || '').toLowerCase().indexOf(q) !== -1;
  return okStatus && okQuery;
}

function feedStatuses() {
  const seen = {};
  state.feed.forEach(function (i) { seen[i.status] = true; });
  state.feedFilter.statuses.forEach(function (s) { seen[s] = true; });
  return Object.keys(seen).sort();
}

function renderFeedChips(chipsEl) {
  chipsEl.textContent = '';
  feedStatuses().forEach(function (status) {
    const on = state.feedFilter.statuses.indexOf(status) !== -1;
    const chip = h('button', 'fchip', status);
    chip.setAttribute('aria-pressed', on ? 'true' : 'false');
    if (on) { chip.classList.add('on'); }
    chip.addEventListener('click', function () {
      const i = state.feedFilter.statuses.indexOf(status);
      const nowOn = i === -1;
      if (nowOn) { state.feedFilter.statuses.push(status); } else { state.feedFilter.statuses.splice(i, 1); }
      chip.classList.toggle('on', nowOn);
      chip.setAttribute('aria-pressed', nowOn ? 'true' : 'false');
      state.feedShown = 20;
      renderFeedArea();
    });
    chipsEl.appendChild(chip);
  });
}

function feeditemRow(it) {
  const row = h('div', 'feeditem');
  const head = h('div', 'feedhead');
  head.appendChild(h('span', 'badge', it.status));
  const id = h('span', 'feedid', it.id);
  id.title = 'Abrir dashboard';
  id.addEventListener('click', function () { vscode.postMessage({ type: 'open', id: it.id }); });
  head.appendChild(id);
  head.appendChild(h('span', 'd', it.date));
  row.appendChild(head);
  if (it.reason) { row.appendChild(h('div', 'feedreason', it.reason)); }
  return row;
}

function renderActivity() {
  const root = document.getElementById('app');
  root.textContent = '';
  const bar = h('div', 'topbar');
  const back = h('button', 'tbtn', '◂ Quadro');
  back.addEventListener('click', function () { state.view = 'changes'; render(); });
  bar.appendChild(back);
  bar.appendChild(h('span', 'crumb', 'Atividade'));
  const orderBtn = h('button', 'tbtn', state.feedOrder === 'asc' ? 'Mais antigos ↑' : 'Mais recentes ↓');
  orderBtn.setAttribute('aria-label', 'Alternar a ordem do feed');
  orderBtn.addEventListener('click', function () {
    state.feedOrder = state.feedOrder === 'asc' ? 'desc' : 'asc';
    orderBtn.textContent = state.feedOrder === 'asc' ? 'Mais antigos ↑' : 'Mais recentes ↓';
    state.feedShown = 20;
    renderFeedArea();
  });
  bar.appendChild(orderBtn);
  root.appendChild(bar);

  const fbar = h('div', 'toolbar');
  const search = document.createElement('input');
  search.type = 'search';
  search.className = 'search';
  search.placeholder = 'Filtrar o feed por id ou título...';
  search.setAttribute('aria-label', 'Filtrar o feed por id ou título');
  search.value = state.feedFilter.query;
  search.addEventListener('input', function () { state.feedFilter.query = search.value; state.feedShown = 20; renderFeedArea(); });
  fbar.appendChild(search);
  const chips = h('div', 'chips');
  renderFeedChips(chips);
  fbar.appendChild(chips);
  root.appendChild(fbar);

  const area = document.createElement('div');
  area.id = 'feedarea';
  root.appendChild(area);
  renderFeedArea();
}

// Só a área do feed (mantém a barra e o foco da busca nas atualizações ao vivo).
function renderFeedArea() {
  const area = document.getElementById('feedarea');
  if (!area) { return; }
  area.textContent = '';
  if (!state.feed || state.feed.length === 0) {
    area.appendChild(h('p', 'muted', 'Sem atividade registrada.'));
    return;
  }
  let items = state.feedOrder === 'asc' ? state.feed.slice().reverse() : state.feed;
  items = items.filter(feedMatches);
  if (items.length === 0) {
    area.appendChild(h('p', 'muted', 'Nenhuma atividade corresponde ao filtro.'));
    return;
  }
  const list = h('div', 'feed');
  items.slice(0, state.feedShown).forEach(function (it) { list.appendChild(feeditemRow(it)); });
  area.appendChild(list);
  if (items.length > state.feedShown) {
    const more = h('button', 'tbtn morebtn', 'Carregar mais (' + (items.length - state.feedShown) + ')');
    more.addEventListener('click', function () { state.feedShown += 20; renderFeedArea(); });
    area.appendChild(more);
  }
}

function renderChanges() {
  const root = document.getElementById('app');
  root.textContent = '';
  root.appendChild(buildToolbar());
  const area = document.createElement('div');
  area.id = 'boardarea';
  root.appendChild(area);
  renderBoardArea();
}

// Só a área do board (mantém a barra de ferramentas e o foco da busca nas
// atualizações ao vivo).
function renderBoardArea() {
  const area = document.getElementById('boardarea');
  if (!area) { return; }
  area.textContent = '';
  const ov = state.changes.overview;
  const cols = state.changes.columns
    .map(function (col) { return { label: col.label, cards: sortCards(col.cards.filter(cardMatches), state.sort) }; })
    .filter(function (col) { return col.cards.length > 0; });
  const shown = cols.reduce(function (n, col) { return n + col.cards.length; }, 0);

  const head = h('div', 'overview');
  head.appendChild(h('div', 'ovbig', String(ov.total)));
  head.appendChild(h('div', 'ovlbl', 'mudanças'));
  head.appendChild(h('div', 'ovbig', ov.donePct + '%'));
  head.appendChild(h('div', 'ovlbl', 'concluídas (' + ov.done + ')'));
  if (shown !== ov.total) {
    head.appendChild(h('div', 'ovbig', String(shown)));
    head.appendChild(h('div', 'ovlbl', 'exibidas'));
  }
  area.appendChild(head);

  if (ov.total === 0) {
    area.appendChild(h('p', 'muted', 'Nenhuma mudança em .specs ainda.'));
    return;
  }
  if (cols.length === 0) {
    area.appendChild(h('p', 'muted', 'Nenhuma mudança corresponde ao filtro.'));
    return;
  }
  const board = h('div', 'board');
  cols.forEach(function (col) {
    board.appendChild(column(col.label, col.cards.length, col.cards, changeCard, col.label));
  });
  area.appendChild(board);
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
  if (state.view === 'tasks') { renderTasks(); }
  else if (state.view === 'activity') { renderActivity(); }
  else { renderChanges(); }
}

window.addEventListener('message', function (e) {
  const m = e.data || {};
  if (m.type === 'board') {
    state.changes = m.board;
    if (m.feed) { state.feed = m.feed; }
    if (state.view === 'changes') {
      if (document.getElementById('boardarea')) {
        renderBoardArea();
        const chipsEl = document.querySelector('.chips');
        if (chipsEl) { renderChips(chipsEl); } // novos tipos aparecem sem tocar na busca
      } else {
        render();
      }
    } else if (state.view === 'activity') {
      if (document.getElementById('feedarea')) {
        renderFeedArea();
        const fc = document.querySelector('.chips');
        if (fc) { renderFeedChips(fc); } // novos status aparecem sem tocar na busca
      } else {
        renderActivity();
      }
    }
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
