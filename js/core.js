const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const yi = y => y - START_YEAR;
const bump = (c, k, v, lo = 0, hi = 100) => { c[k] = clamp(c[k] + v, lo, hi); };
const TIER_W = { free: 1.6, standard: 1, premium: 0.75 };
const TIER_REV = { free: 0.5, standard: 1, premium: 1.6 };

function rand(s) {
  s.rs = (s.rs + 0x6d2b79f5) | 0;
  let t = Math.imul(s.rs ^ (s.rs >>> 15), 1 | s.rs);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const pick = (s, arr) => arr[Math.floor(rand(s) * arr.length)];
const chance = (s, p) => rand(s) < p;

function money(v) {
  const a = Math.abs(v), sg = v < 0 ? '-' : '';
  if (a >= 1e6) return `${sg}$${(a / 1e6).toFixed(2)}T`;
  if (a >= 1000) return `${sg}$${(a / 1000).toFixed(1)}B`;
  return `${sg}$${a.toFixed(a < 10 ? 1 : 0)}M`;
}

function newWorld() {
  return {
    rate: 3, index: 100, hype: 1, algo: 1, wage: 1, priceShock: 1, demand: 1, dataCost: 1,
    trust: 50, shortage: 0.2, exportControl: false, regLevel: 0, gridStress: 0, recession: 0,
    copyrightHeat: 0, frontierE: 1,
  };
}

function makeCompany(o) {
  return {
    id: o.id, name: o.name, type: o.type, status: 'active', founded: o.founded ?? START_YEAR,
    cash: o.cash, stake: o.stake ?? 1, valuation: 0, lastValuation: 0, revenue: 0, cogs: 0, net: 0, lastNet: 0,
    researchers: o.researchers, engineers: o.engineers, sales: o.sales ?? 0, morale: o.morale ?? 60,
    execs: { cfo: false, cro: false }, starAbility: 0,
    fleet: { ...(o.fleet ?? {}) }, rentedClusters: 0, boughtYear: 0, dcs: [...(o.dcs ?? [])], pendingDC: [],
    data: { q: o.data, licensed: 0 }, rep: o.rep, safety: o.safety, dist: o.dist,
    flagship: null, training: null, postBonus: 0, algo: 1, licensed: false,
    products: [], pricing: 'standard', gov: 0, lobbyUntil: 0, lawsuits: 0,
    rounds: [], raisedYear: -1, debt: 0, public: false, ipoYear: 0, lossYears: 0, open: false, partner: 0,
    commitments: [], growth: o.growth ?? 0, growthRes: o.growthRes ?? 0, targets: [...(o.targets ?? [])], discount: 1,
    mods: { ...DEFAULT_MODS, ...(o.mods ?? {}) },
  };
}

function curGen(y) { return GPU_GENS.filter(g => g.year <= y).at(-1); }
function clusterPrice(y, w, m = 1) { return curGen(y).price * w.priceShock * m; }
function totalClustersOf(c) { return Object.values(c.fleet).reduce((a, b) => a + b, 0); }
function flagCapOf(c) { return c.flagship ? c.flagship.cap : 0; }
function avgPowerFactor(c) { return c.dcs.length ? c.dcs.reduce((t, id) => t + REGIONS.find(r => r.id === id).power / 0.06, 0) / c.dcs.length : 1; }
function capacityMW(c) { return c.mods.noMW ? Infinity : c.dcs.length * DC_BLOCK_MW; }
function perfTotal(c, y) { return Object.entries(c.fleet).reduce((t, [g, n]) => t + n * GPU_GENS[g - 1].perf, 0) + c.rentedClusters * curGen(y).perf; }
function polishOf(c) { return Math.min(10, c.engineers / 10); }
function weightOf(c) { return (flagCapOf(c) + polishOf(c)) ** 2 * (0.5 + c.dist / 100) * TIER_W[c.pricing]; }
function valuationOf(c, w) {
  const team = 3 + c.researchers * 2 + c.engineers * 0.3 + c.starAbility * 80;
  const tech = flagCapOf(c) ** 2 * 0.2;
  return Math.max(0, (team + tech + Math.max(0, c.revenue) * (c.public ? 9 : 6)) * w.hype * (w.index / 100) * c.mods.hype);
}

function grossRevenue(s, cs) {
  const w = s.w, pool = TAM[yi(s.year)] * w.demand * (0.8 + w.trust / 500), g = Object.fromEntries(cs.map(c => [c.id, 0]));
  for (const sid of Object.keys(SEGMENTS)) {
    const sellers = cs.filter(c => c.products.includes(sid)), tot = sellers.reduce((t, c) => t + weightOf(c), 0);
    if (tot) for (const c of sellers) g[c.id] += pool * SEGMENTS[sid].share * weightOf(c) / tot * TIER_REV[c.pricing];
  }
  return g;
}

function revenueOf(s, c, product) {
  const y = s.year, w = s.w;
  const core = product * (1 - c.partner - c.mods.parent) * (c.open ? 0.85 : 1) * c.mods.revenue;
  const enterprise = c.flagship ? c.sales * TAM[yi(y)] * 0.0004 * (flagCapOf(c) / 100) * (c.execs.cro ? 1.2 : 1) : 0;
  const gov = c.gov >= y ? 40 * Math.pow(1.2, yi(y)) : 0;
  const lease = c.mods.lease * totalClustersOf(c) * clusterPrice(y, w) * 0.1;
  const grants = c.mods.grants ? c.mods.grants + c.rep / 25 : 0;
  return core + enterprise + gov + lease + grants;
}

function costsOf(s, c) {
  const y = s.year, w = s.w, burn = c.mods.burn, heads = c.researchers + c.engineers + c.sales;
  const payroll = (c.researchers * 0.35 + c.engineers * 0.2 + c.sales * 0.15) * w.wage * burn + (c.execs.cfo ? 0.6 : 0) + (c.execs.cro ? 0.5 : 0);
  const energy = totalClustersOf(c) * 0.4 * avgPowerFactor(c);
  const rent = c.rentedClusters * clusterPrice(y, w, 0.35) * (1 + w.shortage);
  const data = c.data.q * 0.02 * w.dataCost + c.data.licensed * 0.05;
  const interest = c.debt * (w.rate + 4) / 100;
  const overhead = (2 + heads * 0.01) * burn;
  const commit = c.commitments.filter(k => k.until >= y).reduce((t, k) => t + k.amount, 0);
  const compliance = w.regLevel >= 2 && c.lobbyUntil < y ? c.revenue * 0.02 * (w.regLevel - 1) : 0;
  return payroll + energy + rent + data + interest + overhead + commit + compliance;
}

function companyById(s, id) { return id === 'me' ? s.me : s.rivals.find(r => r.id === id); }
function activeRivals(s) { return s.rivals.filter(r => r.status === 'active'); }
function active(s) { return [s.me, ...activeRivals(s)]; }
function pickRival(s) { const a = activeRivals(s); return a.length ? pick(s, a) : null; }
function rankOf(s) { return active(s).sort((a, b) => b.valuation - a.valuation).indexOf(s.me) + 1; }
function frontierOf(s) { return active(s).reduce((b, c) => (flagCapOf(c) > flagCapOf(b) ? c : b), s.me); }
