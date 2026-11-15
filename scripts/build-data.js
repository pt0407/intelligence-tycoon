const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const STATUSES = new Set(['reported', 'estimate', 'game-estimate']);

function problems(d) {
  const sources = new Set(d.sources.map(s => s.id));
  const out = [];
  const src = (where, id) => { if (!sources.has(id)) out.push(`${where}: unknown source "${id}"`); };
  const status = (where, s) => { if (!STATUSES.has(s)) out.push(`${where}: status must be one of ${[...STATUSES].join(', ')}`); };
  const finite = (where, ...vs) => vs.forEach(v => { if (!Number.isFinite(v)) out.push(`${where}: non-numeric value ${v}`); });

  d.hardware.platforms.forEach(p => { src(`platform ${p.id}`, p.source); status(`platform ${p.id}`, p.status); finite(`platform ${p.id}`, p.tf, p.rackM, p.kw, p.mem, p.year); });
  d.power.regions.forEach(r => { src(`region ${r.id}`, r.source); status(`region ${r.id}`, r.status); finite(`region ${r.id}`, r.usdPerMWh); });
  Object.keys(d.power.queueYears).forEach(k => finite(`queue ${k}`, d.power.queueYears[k]));
  d.facility.usdMPerMW && Object.entries(d.facility.usdMPerMW).forEach(([y, v]) => finite(`facility ${y}`, v));
  status('facility', d.facility.status); src('facility', d.facility.source);
  status('market', d.market.status); src('market', d.market.source);
  if (d.market.tamUsdM.length !== d.market.years.length) out.push('market: tam and years differ in length');
  finite('market', ...d.market.tamUsdM);
  for (const [k, v] of Object.entries(d.capex)) if (k.endsWith('Usd')) finite(`capex ${k}`, v);
  if (d.capex.bigFourSource) src('capex', d.capex.bigFourSource);

  d.companies.forEach(c => {
    const w = `company ${c.id}`;
    c.sources.forEach(id => src(w, id));
    if (c.real && !Object.keys(c.val).length) out.push(`${w}: real company without a valuation anchor`);
    if (!c.start) out.push(`${w}: missing start state`);
    if (c.start && c.startStatus !== 'game-estimate') out.push(`${w}: start state must be labelled game-estimate`);
    if (c.valStatus === undefined && Object.keys(c.val).length) out.push(`${w}: valuation anchors need valStatus`);
    [...Object.values(c.val), ...Object.values(c.rev || {})].forEach(v => finite(w, v));
    (c.rounds || []).forEach(r => { src(`${w} round`, r.source); finite(`${w} round`, r.year, r.amountUsdM); });
  });
  return out;
}

module.exports = { problems };

if (require.main === module) {
  const json = JSON.parse(fs.readFileSync(path.join(root, 'data', 'real.json'), 'utf8'));
  const bad = problems(json);
  if (bad.length) { console.error(bad.join('\n')); process.exit(1); }
  const out = `// Generated from data/real.json by scripts/build-data.js. Do not edit by hand.\nconst REAL = ${JSON.stringify(json, null, 1)};\n`;
  fs.writeFileSync(path.join(root, 'data', 'real.js'), out);
  console.log(`wrote data/real.js (${json.companies.length} companies, ${json.hardware.platforms.length} platforms, ${json.sources.length} sources)`);
}
