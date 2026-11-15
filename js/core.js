const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const yi = y => y - START_YEAR;
const bump = (c, k, v, lo = 0, hi = 100) => { c[k] = clamp(c[k] + v, lo, hi); };
const TIER_W = { free: 1.6, standard: 1, premium: 0.75 };
const TIER_REV = { free: 0.5, standard: 1, premium: 1.6 };
const sumVals = o => Object.values(o).reduce((a, b) => a + b, 0);

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
    copyrightHeat: 0, frontierE: 1, energyShock: 1, mult: 1, memTight: 0.2,
  };
}

function makeCompany(o) {
  return {
    id: o.id, name: o.name, type: o.type, status: 'active', founded: o.founded ?? START_YEAR, real: !!o.real, anchors: o.anchors ?? null,
    cash: o.cash, stake: o.stake ?? 1, valuation: 0, lastValuation: 0, revenue: 0, cogs: 0, net: 0, lastNet: 0,
    researchers: o.researchers, engineers: o.engineers, sales: o.sales ?? 0, morale: o.morale ?? 60,
    execs: { cfo: false, cro: false }, starAbility: 0,
    fleet: { ...(o.fleet ?? {}) }, rented: {}, leased: { ...(o.leased ?? {}) }, boughtYear: 0, dcs: (o.dcs ?? []).map(d => ({ ...d })), pendingDC: [],
    customPlatforms: [], asic: null, ppa: false, ads: false, sovereign: false, investments: {},
    data: { q: o.data, licensed: 0 }, rep: o.rep, safety: o.safety, dist: o.dist,
    flagship: null, training: null, algo: 1, licensed: false,
    products: [], pricing: 'standard', gov: 0, lobbyUntil: 0, lawsuits: 0,
    rounds: [], raisedYear: -1, debt: 0, public: !!o.public, ipoYear: o.ipoYear ?? 0, lossYears: 0, open: false, partner: 0,
    commitments: [], growth: o.growth ?? 0, growthRes: o.growthRes ?? 0, targets: [...(o.targets ?? [])], discount: 1,
    mods: { ...DEFAULT_MODS, ...(o.mods ?? {}) },
  };
}

function platOf(c, id) { return PLATFORMS.find(p => p.id === id) ?? c.customPlatforms.find(p => p.id === id); }
function platformsFor(c, y) { return [...PLATFORMS, ...c.customPlatforms].filter(p => p.year <= y); }
function buyablePlatforms(c, y) { return platformsFor(c, y).filter(p => !p.cloudOnly); }
function bestNvidia(c, y) { return buyablePlatforms(c, y).filter(p => p.vendor === 'NVIDIA').at(-1); }
function flagCapOf(c) { return c.flagship ? c.flagship.cap : 0; }
function totalRacksOf(c, kind = 'all') {
  const o = sumVals(c.fleet), r = sumVals(c.rented);
  return kind === 'owned' ? o : kind === 'rented' ? r : o + r;
}
function ownedMW(c) { return [...Object.entries(c.fleet), ...Object.entries(c.leased)].reduce((t, [id, n]) => t + n * platOf(c, id).kw / 1000, 0); }
function capacityMW(c) { return c.mods.noMW ? Infinity : c.dcs.reduce((t, d) => t + d.mw, 0); }
function energyRate(c, w) {
  const mw = c.dcs.reduce((t, d) => t + d.mw, 0);
  const price = mw ? c.dcs.reduce((t, d) => t + d.mw * REGIONS.find(r => r.id === d.region).price, 0) / mw : 60;
  return 0.01095 * price * (c.ppa ? 0.7 : 1) * w.energyShock;
}
function facilityPerMW(y) { return y < 2022 ? 12 : y < 2024 ? 16 : 20; }
function perfTotal(c) {
  return [...Object.entries(c.fleet), ...Object.entries(c.rented)].reduce((t, [id, n]) => t + n * platOf(c, id).tf * RACK_GPUS, 0);
}
function polishOf(c) { return Math.min(10, c.engineers / 10); }
function weightOf(c) { return (flagCapOf(c) + polishOf(c)) ** 2 * (0.5 + c.dist / 100) * TIER_W[c.pricing]; }
function valuationOf(c, w) {
  const team = 3 + c.researchers * 2 + c.engineers * 0.3 + c.starAbility * 80;
  const tech = flagCapOf(c) ** 2 * 0.2;
  return Math.max(0, (team + tech + Math.max(0, c.revenue) * (c.public ? 15 : 20)) * w.hype * (w.index / 100) * c.mods.hype * w.mult);
}

function anchorAt(map, y, before) {
  if (!map) return null;
  if (map[y] !== undefined) return map[y];
  const ks = Object.keys(map).map(Number).sort((a, b) => a - b);
  if (y < ks[0]) return before;
  if (y > ks[ks.length - 1]) return map[ks[ks.length - 1]];
  const i = ks.findIndex(k => k > y), a = ks[i - 1], b = ks[i], t = (y - a) / (b - a);
  return Math.exp(Math.log(map[a]) + t * (Math.log(map[b]) - Math.log(map[a])));
}
function inHistory(c, y) { return c.real && c.anchors && y <= HISTORY_END; }

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
  const core = product * (1 - c.partner - c.mods.parent) * (c.open ? 0.85 : 1) * c.mods.revenue * (c.ads && c.products.includes('chat') ? 1.06 : 1);
  const enterprise = c.flagship ? c.sales * TAM[yi(y)] * 0.0004 * (flagCapOf(c) / 100) * (c.execs.cro ? 1.2 : 1) : 0;
  const gov = c.gov >= y ? 40 * Math.pow(1.2, yi(y)) : 0;
  const lease = c.mods.lease * Object.entries(c.fleet).reduce((t, [id, n]) => t + n * platOf(c, id).rackM, 0) * 0.1 + Object.entries(c.leased).reduce((t, [id, n]) => t + n * platOf(c, id).rackM * 0.7, 0);
  const grants = c.mods.grants ? c.mods.grants + c.rep / 25 : 0;
  return core + enterprise + gov + lease + grants;
}

function costsOf(s, c) {
  const y = s.year, w = s.w, burn = c.mods.burn, heads = c.researchers + c.engineers + c.sales;
  const payroll = (c.researchers * 0.35 + c.engineers * 0.2 + c.sales * 0.15) * w.wage * burn + (c.execs.cfo ? 0.6 : 0) + (c.execs.cro ? 0.5 : 0);
  const energy = ownedMW(c) * energyRate(c, w);
  const rent = Object.entries(c.rented).reduce((t, [id, n]) => t + n * platOf(c, id).rackM * 0.75 * (1 + w.shortage) * w.priceShock, 0);
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
