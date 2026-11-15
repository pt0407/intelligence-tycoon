const fs = require('fs');
const path = require('path');

const FILES = ['data.js', 'core.js', 'systems.js', 'events.js', 'progress.js', 'names.js', 'missions.js', 'actions.js', 'turn.js', 'api.js'];
const dir = path.join(__dirname, '..', 'js');
const real = fs.readFileSync(path.join(__dirname, '..', 'data', 'real.js'), 'utf8');
const Engine = new Function(real + '\n' + FILES.map(f => fs.readFileSync(path.join(dir, f), 'utf8')).join('\n') + '\nreturn { ...Engine, flagCapOf, totalRacksOf, active, money, effCompute, activeRivals, rankOf, PLATFORMS };')();
const { flagCapOf, totalRacksOf, active, money } = Engine;

const PATH_IDS = ['lab', 'garage', 'bigtech', 'open', 'hardware', 'robotics'];
const SHOW = [2016, 2020, 2026, 2030, 2035];

function bot(s) {
  const opts = () => Engine.options(s);
  const reserve = Math.max(10, -s.me.net * 1.2);
  const direct = k => opts().find(o => o.key === k && !o.locked) || null;
  const newestBuy = () => opts().filter(o => o.key.startsWith('buy:') && !o.locked && o.cost <= s.me.cash - reserve).sort((a, b) => (platOfKey(b) - platOfKey(a)))[0] || null;
  const platOfKey = o => PLAT_YEAR(o.target);
  const rules = [
    () => opts().filter(o => o.group === 'Products' && !o.locked && o.key.startsWith('launch') && o.cost <= s.me.cash).sort((a, b) => a.cost - b.cost)[0],
    () => (!s.me.training && totalRacksOf(s.me) >= 1 ? opts().find(o => o.key === 'train:medium' && !o.locked && (!s.me.flagship || o.cost <= s.me.cash - reserve)) || opts().find(o => o.key === 'train:small' && !o.locked && o.cost <= s.me.cash) || null : null),
    () => (!s.me.flagship ? direct('finetune') : null),
    () => (!s.me.execs.cfo && s.me.revenue > 100 ? direct('cfo') : null),
    () => direct('raise'),
    () => direct('ipo'),
    () => (s.me.cash > 60 ? newestBuy() : null),
    () => (!s.me.flagship && s.me.cash > 100 ? opts().filter(o => o.key.startsWith('rent:') && !o.locked).sort((a, b) => platOfKey(b) - platOfKey(a))[0] : null),
    () => (s.me.cash > 300 && s.me.pendingDC.length === 0 ? direct('build:us') || direct('build:tx') : null),
    () => (s.me.cash > 25 ? direct('hireRes') : null),
    () => (s.me.cash > 20 ? direct('hireEng') : null),
    () => (s.me.flagship && s.me.cash > 30 ? direct('post') : null),
    () => (s.me.safety < 50 && s.me.cash > 30 ? direct('safetyTeam') : null),
    () => (s.me.products.length >= 2 && s.me.pricing === 'standard' && s.me.cash > 60 ? direct('tier:premium') : null),
    () => (s.me.cash > 30 ? direct('sprint') : null),
    () => (s.me.cash > 60 ? direct('star') : null),
    () => (s.me.cash > 300 ? direct('acquire') : null),
    () => (s.me.cash > 60 ? direct('brand') : null),
  ];
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

const PLAT_YEAR = id => (id ? (Engine.PLATFORMS || []).find(p => p.id === id)?.year ?? 0 : 0);

function runPath(pathId, seed, doNothing = false) {
  const s = Engine.newGame(pathId, 'Test Co', seed, process.env.SCENARIO || 'base');
  const rows = [];
  while (!s.over) {
    if (!doNothing) bot(s);
    const r = Engine.endYear(s);
    if (SHOW.includes(r.year) || s.over) {
      rows.push(`${r.year} cash ${money(s.me.cash).padStart(9)} val ${money(s.me.valuation).padStart(9)} cap ${String(Math.round(flagCapOf(s.me))).padStart(3)} rev ${money(s.me.revenue).padStart(9)} rank ${String(r.after.rank).padStart(2)}/${active(s).length} ${s.me.public ? 'PUBLIC' : 'private'} prods ${s.me.products.length} racks ${totalRacksOf(s.me)} res ${Math.round(s.me.researchers)}`);
    }
  }
  return { rows, verdict: s.verdict, s };
}

const seeds = [1, 2];
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
