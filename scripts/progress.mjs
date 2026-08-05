#!/usr/bin/env node
// Painel de progresso do SDD Claude Kit — lê a FONTE DA VERDADE e emite um HTML.
//
// Por que gerar em vez de manter uma lista à mão: uma lista escrita à mão envelhece no
// primeiro commit e passa a mentir com aparência de relatório. Aqui todo número vem de
// `.specs/**/tasks.md` e `.specs/**/status.yaml`, então o painel não tem como divergir do
// repositório — no máximo fica desatualizado, e o `--watch` resolve isso.
//
//   node scripts/progress.mjs            gera uma vez
//   node scripts/progress.mjs --watch    regenera a cada mudança em .specs/
//
// Saída: sdd-progress.html na raiz (ignorado pelo Git — é artefato derivado).
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync, watch } from 'node:fs'
import { join, dirname, relative } from 'node:path'

const ROOT = join(dirname(new URL(import.meta.url).pathname), '..')
const OUT = join(ROOT, 'sdd-progress.html')

// Projetos SDD reais. O fixture de e2e é dado de teste, não trabalho — fica de fora, e
// incluí-lo inflaria os totais com uma mudança que não existe.
const PROJECTS = [
  { name: 'Plugin sdd-kit', dir: '.specs' },
  { name: 'Extensão VS Code', dir: 'extensions_vscode/.specs' },
  { name: 'Exemplo node-api', dir: 'examples/node-api/.specs' },
]

const STATUS_ORDER = [
  'IN_PROGRESS',
  'APPROVED',
  'PLANNED',
  'DESIGNED',
  'CLARIFIED',
  'DRAFT',
  'BLOCKED',
  'VERIFIED',
  'ARCHIVED',
  'CANCELLED',
]

/** Cor por status do ciclo, espelhando themeTokens.ts (STATUS_TOKENS). */
const STATUS_COLOR = {
  DRAFT: '#6B7684',
  CLARIFIED: '#4C9BF0',
  DESIGNED: '#7C6BF0',
  PLANNED: '#E0A33A',
  APPROVED: '#38BDC9',
  IN_PROGRESS: '#E0823A',
  BLOCKED: '#E05A5A',
  VERIFIED: '#3FB86B',
  ARCHIVED: '#49525E',
  CANCELLED: '#49525E',
}

const TASK_COLOR = { done: '#3FB86B', in_progress: '#E0823A', blocked: '#E05A5A', pending: '#6B7684' }

function read(path) {
  try {
    return readFileSync(path, 'utf8')
  } catch {
    return undefined
  }
}

/** Extrai um escalar de topo do YAML sem dependência — evita exigir js-yaml na raiz. */
function yamlScalar(text, key) {
  const m = new RegExp(`^${key}:\\s*"?([^"\\n#]+)"?\\s*$`, 'm').exec(text ?? '')
  return m ? m[1].trim() : undefined
}

/** Tarefas de um tasks.md: id, título, status e complexidade. */
function parseTasks(md) {
  const tasks = []
  let current
  for (const raw of (md ?? '').split('\n')) {
    const line = raw.replace(/\r$/, '')
    const head = /^##\s+(TASK-[A-Z0-9]+-\d+)\s*—?\s*(.*)$/.exec(line)
    if (head) {
      current = { id: head[1], title: head[2].trim(), status: 'pending', complexity: '' }
      tasks.push(current)
      continue
    }
    if (!current) continue
    // O status no repositório aparece em três formas: `done`, `**done** — 2026-07-29`
    // (negrito e data) e `pending (nota entre parênteses)`. A primeira versão deste parser
    // pegava o token cru e classificava `**done**` como desconhecido — 17 tarefas somiam
    // silenciosamente do painel, e os totais não fechavam. Normaliza: só a palavra.
    const st = /^\*\*Status:\*\*\s*[*_`\s]*([a-zA-Z_]+)/.exec(line)
    if (st) current.status = st[1].toLowerCase()
    const cx = /^\*\*Complexidade:\*\*\s*(\S+)/.exec(line)
    if (cx) current.complexity = cx[1]
  }
  return tasks
}

/** Percorre um diretório de projeto e devolve as mudanças com suas tarefas. */
function scanProject(project) {
  const base = join(ROOT, project.dir)
  if (!existsSync(base)) return null
  const changes = []
  for (const kind of ['features', 'bugs', 'refactors', 'changes']) {
    const dir = join(base, kind)
    if (!existsSync(dir)) continue
    for (const entry of readdirSync(dir)) {
      const changeDir = join(dir, entry)
      if (!statSync(changeDir).isDirectory()) continue
      const statusYaml = read(join(changeDir, 'status.yaml'))
      const tasks = parseTasks(read(join(changeDir, 'tasks.md')))
      changes.push({
        id: entry,
        kind,
        title: yamlScalar(statusYaml, 'title') ?? entry,
        status: yamlScalar(statusYaml, 'status') ?? 'DRAFT',
        approved: /^approval:\s*$/m.test(statusYaml ?? ''),
        tasks,
        path: relative(ROOT, changeDir),
      })
    }
  }
  changes.sort((a, b) => {
    const d = STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status)
    return d !== 0 ? d : a.id.localeCompare(b.id)
  })
  return { ...project, changes }
}

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

/**
 * Conta por status. Status fora dos quatro conhecidos cai em `other` e é REPORTADO no
 * painel — some silenciosamente seria pior do que aparecer como desconhecido, porque um
 * total que não fecha é a única pista de que o parser tem um buraco.
 */
function countBy(tasks) {
  const c = { done: 0, in_progress: 0, pending: 0, blocked: 0, other: 0 }
  for (const t of tasks) {
    if (t.status in c && t.status !== 'other') c[t.status] += 1
    else c.other += 1
  }
  return c
}

function bar(counts, total) {
  if (total === 0) return '<div class="bar empty"><span>sem tarefas planejadas</span></div>'
  const seg = (k) =>
    counts[k] ? `<i class="seg ${k}" style="width:${(counts[k] / total) * 100}%"></i>` : ''
  return `<div class="bar">${seg('done')}${seg('in_progress')}${seg('blocked')}${seg('pending')}</div>`
}

function renderChange(ch) {
  const counts = countBy(ch.tasks)
  const total = ch.tasks.length
  const pct = total ? Math.round((counts.done / total) * 100) : 0
  const tasks = ch.tasks
    .map(
      (t) => `<li class="task ${t.status}">
          <span class="dot"></span>
          <code>${esc(t.id)}</code>
          <span class="t-title">${esc(t.title)}</span>
          ${t.complexity ? `<span class="cx">${esc(t.complexity)}</span>` : ''}
          <span class="t-status">${esc(t.status)}</span>
        </li>`,
    )
    .join('\n')
  return `<details class="change" ${['IN_PROGRESS', 'APPROVED'].includes(ch.status) ? 'open' : ''}>
      <summary>
        <span class="chip" style="background:${STATUS_COLOR[ch.status] ?? '#6B7684'}">${esc(ch.status)}</span>
        <code class="cid">${esc(ch.id)}</code>
        <span class="c-title">${esc(ch.title)}</span>
        <span class="counts">${counts.done}/${total}${total ? ` · ${pct}%` : ''}</span>
      </summary>
      ${bar(counts, total)}
      ${total ? `<ul class="tasks">\n${tasks}\n      </ul>` : '<p class="none">Nenhuma tarefa planejada — a mudança ainda não passou por <code>/sdd-kit:tasks</code>.</p>'}
      <p class="path">${esc(ch.path)}</p>
    </details>`
}

function render(projects, stamp) {
  const all = projects.flatMap((p) => p.changes.flatMap((c) => c.tasks))
  const g = countBy(all)
  const gTotal = all.length
  const active = projects
    .flatMap((p) => p.changes)
    .filter((c) => ['IN_PROGRESS', 'APPROVED'].includes(c.status))

  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="refresh" content="10">
<title>SDD — progresso</title>
<style>
:root {
  --bg:#0E1116; --surface:#161B22; --raised:#1B2230; --border:#263041;
  --text:#E6EDF3; --muted:#9AA7B4; --accent:#7C6BF0; --accent2:#9C8CFF; --link:#4C9BF0;
  --done:${TASK_COLOR.done}; --prog:${TASK_COLOR.in_progress}; --pend:${TASK_COLOR.pending}; --blocked:${TASK_COLOR.blocked};
}
@media (prefers-color-scheme: light) {
  :root { --bg:#F6F8FA; --surface:#FFFFFF; --raised:#F0F3F6; --border:#D6DDE5; --text:#1B2230; --muted:#5A6672; }
}
* { box-sizing:border-box; }
body { margin:0; padding:1.5rem 1.25rem 3rem; background:var(--bg); color:var(--text);
  font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif; line-height:1.5; }
.wrap { max-width:64rem; margin:0 auto; }
h1 { font-size:1.3rem; margin:0 0 .2rem; }
.sub { color:var(--muted); font-size:.85rem; margin:0 0 1.5rem; }
.sub b { color:var(--accent2); }
.totals { display:flex; flex-wrap:wrap; gap:.6rem; margin-bottom:1.25rem; }
.tile { flex:1 1 8rem; background:var(--surface); border:1px solid var(--border); border-radius:.6rem; padding:.7rem .85rem; }
.tile .n { display:block; font-size:1.6rem; font-weight:700; line-height:1.1; }
.tile .l { display:block; font-size:.72rem; color:var(--muted); margin-top:.15rem; }
.tile.done .n { color:var(--done); } .tile.prog .n { color:var(--prog); } .tile.pend .n { color:var(--pend); }
.bar { display:flex; height:.5rem; border-radius:.25rem; overflow:hidden; background:var(--border); margin:.5rem 0 .7rem; }
.bar .seg { display:block; height:100%; }
.bar .seg.done { background:var(--done); } .bar .seg.in_progress { background:var(--prog); }
.bar .seg.pending { background:var(--pend); opacity:.45; } .bar .seg.blocked { background:var(--blocked); }
.bar.empty { align-items:center; justify-content:center; background:transparent; border:1px dashed var(--border); height:auto; padding:.2rem; }
.bar.empty span { font-size:.7rem; color:var(--muted); }
h2 { font-size:.8rem; text-transform:uppercase; letter-spacing:.06em; color:var(--muted); margin:1.75rem 0 .6rem; }
.change { background:var(--surface); border:1px solid var(--border); border-radius:.6rem; padding:.6rem .8rem; margin-bottom:.5rem; }
.change summary { display:flex; align-items:center; gap:.6rem; cursor:pointer; list-style:none; flex-wrap:wrap; }
.change summary::-webkit-details-marker { display:none; }
.chip { font-size:.62rem; font-weight:700; letter-spacing:.04em; padding:.12rem .45rem; border-radius:.8rem; color:#fff; }
.cid { font-size:.76rem; color:var(--link); }
.c-title { flex:1 1 auto; min-width:0; font-size:.88rem; }
.counts { font-size:.78rem; color:var(--muted); font-variant-numeric:tabular-nums; }
.tasks { list-style:none; margin:0; padding:0; display:flex; flex-direction:column; gap:.15rem; }
.task { display:flex; align-items:center; gap:.5rem; font-size:.78rem; padding:.18rem .3rem; border-radius:.3rem; }
.task:hover { background:var(--raised); }
.task .dot { width:.55rem; height:.55rem; border-radius:50%; flex-shrink:0; background:var(--pend); }
.task.done .dot { background:var(--done); } .task.in_progress .dot { background:var(--prog); }
.task.blocked .dot { background:var(--blocked); }
.task code { font-size:.72rem; color:var(--muted); }
.task.done code, .task.done .t-title { opacity:.6; }
.t-title { flex:1 1 auto; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.cx { font-size:.64rem; border:1px solid var(--border); border-radius:.25rem; padding:0 .25rem; color:var(--muted); }
.t-status { font-size:.64rem; text-transform:uppercase; letter-spacing:.03em; color:var(--muted); min-width:5rem; text-align:right; }
.path { font-size:.68rem; color:var(--muted); margin:.5rem 0 0; opacity:.6; }
.none { font-size:.78rem; color:var(--muted); margin:.4rem 0 0; }
.warn { color:#E05A5A; font-size:.8rem; font-weight:600; }
.foot { margin-top:2rem; font-size:.72rem; color:var(--muted); }
</style>
</head>
<body>
<div class="wrap">
  <h1>SDD Claude Kit — progresso</h1>
  <p class="sub">Gerado de <code>.specs/**/tasks.md</code> e <code>status.yaml</code> · atualiza sozinho a cada 10 s ·
    <b>${stamp}</b></p>

  <div class="totals">
    <div class="tile done"><span class="n">${g.done}</span><span class="l">tarefas concluídas</span></div>
    <div class="tile prog"><span class="n">${g.in_progress}</span><span class="l">em andamento</span></div>
    <div class="tile pend"><span class="n">${g.pending}</span><span class="l">pendentes</span></div>
    <div class="tile"><span class="n">${gTotal}</span><span class="l">tarefas no total</span></div>
    <div class="tile"><span class="n">${active.length}</span><span class="l">mudanças ativas</span></div>
    ${g.other ? `<div class="tile"><span class="n">${g.other}</span><span class="l">status não reconhecido</span></div>` : ''}
  </div>
  ${
    g.done + g.in_progress + g.pending + g.blocked + g.other === gTotal
      ? ''
      : '<p class="warn">Os totais não fecham — o parser deste painel tem um buraco.</p>'
  }
  ${bar(g, gTotal)}

  ${projects
    .map(
      (p) => `<h2>${esc(p.name)} — ${p.changes.length} mudança(s)</h2>
  ${p.changes.map(renderChange).join('\n  ')}`,
    )
    .join('\n')}

  <p class="foot">Mudança em <b>IN_PROGRESS</b> ou <b>APPROVED</b> abre expandida.
    Regenerar: <code>node scripts/progress.mjs</code> · acompanhar: <code>--watch</code>.</p>
</div>
</body>
</html>`
}

function build() {
  const projects = PROJECTS.map(scanProject).filter(Boolean)
  const stamp = new Date().toLocaleString('pt-BR')
  writeFileSync(OUT, render(projects, stamp))
  const all = projects.flatMap((p) => p.changes.flatMap((c) => c.tasks))
  const c = countBy(all)
  return `${OUT} · ${all.length} tarefas (${c.done} done, ${c.in_progress} em andamento, ${c.pending} pendentes)`
}

console.log(build())

if (process.argv.includes('--watch')) {
  console.log('observando .specs/… (Ctrl+C para sair)')
  let timer
  for (const p of PROJECTS) {
    const dir = join(ROOT, p.dir)
    if (!existsSync(dir)) continue
    watch(dir, { recursive: true }, () => {
      clearTimeout(timer)
      timer = setTimeout(() => console.log(build()), 300) // agrupa rajadas de escrita
    })
  }
}
