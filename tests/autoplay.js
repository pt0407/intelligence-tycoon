const { Worker, isMainThread, parentPort } = require('worker_threads');
const os = require('os');
const fs = require('fs');
const { load } = require('./lib/load');
const { makeBot } = require('./lib/bot');

function play(E, bot, path, scenario, seed) {
  const t0 = process.hrtime.bigint();
  const s = E.newGame(path, 'Auto', seed, scenario);
  let turns = 0;
  while (!s.over && turns < 40) { bot(s); E.endYear(s); turns++; }
  const ms = Number(process.hrtime.bigint() - t0) / 1e6;
  const finite = [s.me.cash, s.me.valuation, s.me.revenue, s.me.stake].every(Number.isFinite);
  return {
    path, scenario, seed, title: s.verdict.title, rank: E.rankOf(s), of: E.active(s).length,
    valuation: s.me.valuation, year: s.year, goals: Object.keys(s.goalsDone).length, finite, ms, turns,
  };
}

function parseArgs(argv) {
  const out = { paths: null, scenarios: null, seeds: 4, json: null, threads: Math.max(1, Math.min(os.cpus().length, 8)) };
  for (const a of argv.slice(2)) {
    const [k, v] = a.replace(/^--/, '').split('=');
    if (k === 'paths') out.paths = v.split(',');
    else if (k === 'scenarios') out.scenarios = v.split(',');
    else if (k === 'seeds') out.seeds = Number(v);
    else if (k === 'json') out.json = v;
    else if (k === 'threads') out.threads = Number(v);
  }
  return out;
}

function summarize(results) {
  const byPath = {};
  for (const r of results) {
    const p = (byPath[r.path] ??= { runs: 0, titles: {}, ranks: [], logVal: [], nonFinite: 0, goals: 0, ms: 0 });
    p.runs++; p.titles[r.title] = (p.titles[r.title] ?? 0) + 1;
    if (r.title !== 'Bankrupt') p.ranks.push(r.rank / r.of);
    p.logVal.push(Math.log10(Math.max(1, r.valuation)));
    if (!r.finite) p.nonFinite++;
    p.goals += r.goals; p.ms += r.ms;
  }
  const median = a => { if (!a.length) return NaN; const s = [...a].sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; };
  const pctOrDash = v => (Number.isFinite(v) ? Math.round(v * 100) : '-');
  return Object.entries(byPath).map(([path, p]) => ({
    path, runs: p.runs, bankrupt: p.titles.Bankrupt ?? 0, medianRankPct: pctOrDash(median(p.ranks)),
    medianValuation: 10 ** median(p.logVal), goalsPerRun: +(p.goals / p.runs).toFixed(2), nonFinite: p.nonFinite,
    msPerRun: +(p.ms / p.runs).toFixed(1), titles: p.titles,
  }));
}

function printTable(rows, total, wall) {
  const money = v => (v >= 1e6 ? `$${(v / 1e6).toFixed(2)}T` : v >= 1e3 ? `$${(v / 1e3).toFixed(1)}B` : `$${v.toFixed(0)}M`);
  const head = ['path', 'runs', 'bankrupt', 'median rank %', 'median value', 'goals/run', 'non-finite', 'ms/run'];
  const lines = rows.map(r => [r.path, r.runs, r.bankrupt, r.medianRankPct, money(r.medianValuation), r.goalsPerRun, r.nonFinite, r.msPerRun]);
  const widths = head.map((h, i) => Math.max(h.length, ...lines.map(l => String(l[i]).length)));
  const fmt = cols => cols.map((c, i) => String(c).padEnd(widths[i])).join('  ');
  console.log(fmt(head));
  console.log(widths.map(w => '-'.repeat(w)).join('  '));
  lines.forEach(l => console.log(fmt(l)));
  console.log(`\n${total} games in ${(wall / 1000).toFixed(2)}s wall time (${(wall / total).toFixed(1)} ms per game across workers)`);
}

if (isMainThread) {
  const args = parseArgs(process.argv);
  const E = load();
  const paths = args.paths ?? Object.keys(E.PATHS);
  const scenarios = args.scenarios ?? Object.keys(E.SCENARIOS);
  const jobs = [];
  for (const path of paths) for (const scenario of scenarios) for (let seed = 1; seed <= args.seeds; seed++) jobs.push({ path, scenario, seed });
  const results = [];
  const t0 = Date.now();
  let next = 0;
  const workers = Array.from({ length: Math.min(args.threads, jobs.length) }, () => new Promise((resolve, reject) => {
    const w = new Worker(__filename);
    const feed = () => { if (next < jobs.length) w.postMessage(jobs[next++]); else { w.terminate(); resolve(); } };
    w.on('message', msg => { if (msg.result) results.push(msg.result); feed(); });
    w.on('error', reject);
  }));
  Promise.all(workers).then(() => {
    const wall = Date.now() - t0;
    const rows = summarize(results);
    printTable(rows, results.length, wall);
    const bad = results.filter(r => !r.finite);
    if (bad.length) console.log(`\nNON-FINITE RUNS: ${bad.map(r => `${r.path}/${r.scenario}/${r.seed}`).join(', ')}`);
    if (args.json) fs.writeFileSync(args.json, JSON.stringify({ rows, results }, null, 2));
    process.exitCode = bad.length ? 1 : 0;
  });
} else {
  const E = load();
  const bot = makeBot(E);
  parentPort.on('message', job => parentPort.postMessage({ result: play(E, bot, job.path, job.scenario, job.seed) }));
  parentPort.postMessage({ ready: true });
}
