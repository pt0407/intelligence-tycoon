const fs = require('fs');
const path = require('path');

const FILES = ['data.js', 'core.js', 'systems.js', 'events.js', 'actions.js', 'turn.js', 'api.js'];
const dir = path.join(__dirname, '..', 'js');
const Engine = new Function(FILES.map(f => fs.readFileSync(path.join(dir, f), 'utf8')).join('\n') + '\nreturn { ...Engine, flagCapOf, totalClustersOf, active, money, effCompute, curGen, activeRivals, rankOf };')();

const { flagCapOf, totalClustersOf, active } = Engine;
const PATH_IDS = ['lab', 'garage', 'bigtech', 'open', 'hardware', 'robotics'];
const SHOW = [2016, 2019, 2022, 2025, 2028, 2031, 2035];
const fmt = v => {
  const a = Math.abs(v), sg = v < 0 ? '-' : '';
  if (a >= 1e6) return `${sg}$${(a / 1e6).toFixed(2)}T`;
  if (a >= 1000) return `${sg}$${(a / 1000).toFixed(1)}B`;
  return `${sg}$${a.toFixed(1)}M`;
};

function bot(s) {
  const opts = () => Engine.options(s);
  const reserve = Math.max(10, -s.me.net * 1.2);
  const can = k => { const o = opts().find(x => (x.key === k || x.key.startsWith(k + ':')) && !x.locked && (x.cost <= 0 || x.cost <= s.me.cash - reserve)); return o || null; };
  const rules = [
    () => opts().filter(o => o.group === 'Products' && !o.locked && o.key.startsWith('launch') && o.cost <= s.me.cash).sort((a, b) => a.cost - b.cost)[0],
    () => (!s.me.training && totalClustersOf(s.me) + s.me.rentedClusters >= 1 ? opts().find(o => o.key === 'train:medium' && !o.locked && (!s.me.flagship || o.cost <= s.me.cash - reserve)) || opts().find(o => o.key === 'train:small' && !o.locked && o.cost <= s.me.cash) || null : null),
    () => (!s.me.flagship ? can('finetune') : null),
    () => (!s.me.execs.cfo && s.me.revenue > 100 ? direct('cfo') : null),
    () => direct('raise'),
    () => direct('ipo'),
    () => (!s.me.flagship && s.me.cash > 15 ? can('buy') || (s.me.cash > 100 ? can('rent') : null) : null),
    () => (s.me.cash > 80 ? can('buy') : null),
    () => (s.me.cash > 120 && s.me.pendingDC.length === 0 ? can('build:us') || can('build:tx') : null),
    () => (s.me.cash > 25 ? can('hireRes') : null),
    () => (s.me.cash > 20 ? can('hireEng') : null),
    () => (s.me.rounds.length >= 1 && s.me.cash > 50 ? can('hireSales') : null),
    () => (s.me.flagship && s.me.cash > 30 ? can('post') : null),
    () => (s.me.safety < 50 && s.me.cash > 30 ? can('safetyTeam') : null),
    () => (s.me.cash < 10 && s.me.debt === 0 ? can('borrow') : null),
    () => (s.me.products.length >= 2 && s.me.pricing === 'standard' && s.me.cash > 60 ? can('tier:premium') : null),
    () => can('open'),
    () => (s.w.regLevel >= 3 && s.me.cash > 10 ? can('license_app') : null),
    () => (s.me.cash > 30 ? can('sprint') : null),
    () => (s.me.cash > 60 ? can('star') : null),
    () => (s.me.cash > 300 ? can('acquire') : null),
    () => (s.me.cash > 60 ? can('brand') : null),
  ];
  const direct = k => opts().find(o => o.key === k && !o.locked) || null;
  let progressed = true, guard = 0;
  while (s.ap > 0 && progressed && guard++ < 30) {
    progressed = false;
    for (const rule of rules) {
      const o = rule();
      if (!o) continue;
      if (Engine.act(s, o.key) === null) { progressed = true; break; }
    }
  }
}

function runPath(pathId, seed, doNothing = false) {
  const s = Engine.newGame(pathId, 'Test Co', seed);
  const rows = [];
  while (!s.over) {
    if (!doNothing) bot(s);
    const r = Engine.endYear(s);
    if (SHOW.includes(r.year) || s.over) {
      rows.push(`${r.year} cash ${fmt(s.me.cash).padStart(9)} val ${fmt(s.me.valuation).padStart(9)} cap ${String(Math.round(flagCapOf(s.me))).padStart(3)} rev ${fmt(s.me.revenue).padStart(9)} rank ${String(r.after.rank).padStart(2)}/${active(s).length} ${s.me.public ? 'PUBLIC' : 'private'} prods ${s.me.products.length} clusters ${totalClustersOf(s.me)} res ${Math.round(s.me.researchers)} morale ${Math.round(s.me.morale)} rate ${r.after.rate.toFixed(1)}`);
    }
  }
  return { rows, verdict: s.verdict, s };
}

const seeds = [1, 2, 3, 4];
let bad = 0;
for (const p of PATH_IDS) {
  const results = seeds.map(seed => runPath(p, seed));
  results.forEach(({ verdict, s }, i) => {
    const finite = [s.me.cash, s.me.valuation, s.me.revenue, s.me.stake].every(Number.isFinite);
    if (!finite) bad++;
    console.log(`${p} seed ${seeds[i]}: ${verdict.title} | ${verdict.text} | goals ${Object.keys(s.goalsDone).length}/3${finite ? '' : ' NON-FINITE'}`);
  });
  console.log(results[0].rows.join('\n'));
}
const base = runPath('lab', 1, true);
console.log(`do-nothing lab: ${base.verdict.title} | ${base.verdict.text}`);
console.log(`non-finite runs: ${bad}`);
