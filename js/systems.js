function unlockOf(c, sid) { return c.mods.unlock[sid] ?? SEGMENTS[sid].unlock; }
const allocBase = y => 60 * Math.pow(1.45, yi(y));
function allocLeft(c, w, y) { return Math.max(0, Math.floor(allocBase(y) * (1 - 0.6 * w.shortage) * c.mods.alloc) - c.boughtYear); }
function queueYears(s, region) { return region.queue + (s.w.gridStress > 0 ? 1 : 0); }
function dcCost(region, s) { return facilityPerMW(s.year) * MW_PER_BLOCK * (1 + region.permit * (1 + s.w.regLevel * 0.3)); }
function exportBlocked(s, c, p) { return s.w.exportControl && p.vendor === 'NVIDIA' && p.year >= 2024 && !c.mods.gov; }
function starMult(c) { return 1 + 0.06 * c.starAbility; }
function dataFactor(c) { return 0.6 + c.data.q / 250; }
function effCompute(s, c, share) {
  return perfTotal(c) * share * dataFactor(c) * s.w.algo * c.algo * starMult(c) * (1 + c.researchers / 25) * c.mods.talent;
}
function capOf(s, E) { return 100 * (1 - Math.exp(-E / (0.8 * s.w.frontierE))); }
function trainCost(s, c, size) { return TRAIN[size].share * ownedMW(c) * energyRate(c, s.w) + c.researchers * 0.05; }

function resolveTraining(s, c, news) {
  const size = c.training;
  if (!size) return;
  c.training = null;
  const w = s.w, mine = c === s.me, frontierRun = size === 'frontier';
  const blocked = frontierRun && ((w.regLevel >= 3 && !c.licensed) || (w.regLevel >= 2 && c.safety < 50));
  if (blocked) { if (mine) news.push('Regulators blocked the frontier run. Get licensed or raise safety above 50.'); return; }
  const cap = Math.min(100, capOf(s, effCompute(s, c, TRAIN[size].share)));
  if (c.flagship && cap < flagCapOf(c)) { if (mine) news.push(`${TRAIN[size].name} did not beat ${c.flagship.name}. Kept the old flagship.`); return; }
  const version = (c.flagship?.version ?? 0) + 1;
  c.flagship = { cap, version, name: `${MODEL_FAMILIES[(version - 1) % MODEL_FAMILIES.length]}-${version}`, year: s.year, open: false };
  if (mine) news.push(`Released ${c.flagship.name} at capability ${Math.round(cap)}.`);
}

function starMoves(s, news) {
  for (const st of s.stars) {
    if (st.owner) {
      const o = companyById(s, st.owner);
      if (o && chance(s, (1 - o.morale / 100) * 0.06)) { st.owner = null; news.push(`${st.name} leaves ${o.name} and becomes a free agent.`); }
    } else if (chance(s, 0.15)) {
      const r = pickRival(s);
      if (r && r.cash > 120) { st.owner = r.id; r.cash -= 15; news.push(`${r.name} lands ${st.name}.`); }
    }
  }
}

function syncStars(s) {
  for (const c of [s.me, ...s.rivals]) c.starAbility = s.stars.filter(st => st.owner === c.id).reduce((t, st) => t + st.ability, 0);
}

function moraleStep(c) {
  const target = 50 + clamp((c.valuation / Math.max(1, c.lastValuation) - 1) * 40, -25, 25) + (c.lastNet > 0 ? 5 : -5) - c.lossYears * 5;
  bump(c, 'morale', clamp((target - c.morale) * 0.3, -10, 10));
}

function attrition(c) {
  const lost = c.researchers * clamp((60 - c.morale) / 400, 0, 0.12);
  c.researchers -= lost;
  return lost;
}

const CONTROL = 0.49, VOLUME_CAP = 0.25, STAKE_SLICE = 0.05, DIVIDEND_SHARE = 0.3;
const held = (s, rid) => s.me.investments[rid] ?? 0;
const stakeVol = s => (s.yr.stakeVol ??= {});

function stakeBlock(s, rid) {
  const r = companyById(s, rid);
  if (!r || r.status !== 'active' || r.valuation <= 0) return 'Not for sale';
  if ((stakeVol(s)[rid] ?? 0) + STAKE_SLICE > VOLUME_CAP + 1e-9) return 'This year\'s shares are sold out';
  return null;
}

function bidBlock(s, rid) {
  const r = companyById(s, rid);
  if (held(s, rid) < CONTROL - 1e-9) return `Needs ${Math.round(CONTROL * 100)} percent of ${r.name} first`;
  if ((r.blockedUntil ?? 0) > s.year) return `${r.name} is not talking this year`;
  if (s.offers.some(o => o.target === rid && o.status === 'open')) return 'An offer is already on the table';
  return dealBlock(s, rid);
}

function resolveOffers(s, news) {
  for (const o of s.offers.filter(x => x.status === 'open' && x.respondYear <= s.year)) {
    const r = companyById(s, o.target);
    if (!r || r.status !== 'active') { o.status = 'void'; continue; }
    r.ask ??= 0.9 + rand(s) * 0.25;
    if (o.price >= r.valuation * r.ask && s.me.cash > 0) {
      o.status = 'accepted';
      scheduleDeal(s, 'acquire', r, o.price);
      news.push(`${r.name} accepts your offer of ${money(o.price)}. Closes next year.`);
    } else {
      o.status = 'rejected';
      r.blockedUntil = s.year + 1;
      news.push(`${r.name} rejects your offer of ${money(o.price)} and will not talk this year.`);
    }
  }
}

function payDividends(s, news) {
  let total = 0;
  s.lastDividend = 0;
  for (const [rid, pct] of Object.entries(s.me.investments)) {
    const r = companyById(s, rid);
    if (!r || r.status !== 'active' || r.net <= 0) continue;
    total += pct * r.net * DIVIDEND_SHARE;
  }
  if (total > 0) { s.me.cash += total; s.lastDividend = total; news.push(`Dividends from your stakes: +${money(total)}.`); }
}

function scheduleDeal(s, type, r, price) {
  const paid = Math.min(Math.max(0, s.me.cash), price);
  s.me.cash -= paid;
  if (type === 'acquire') s.me.stake *= 1 - (price - paid) / s.me.valuation;
  r.status = 'pending';
  s.deals.push({ type, target: r.id, name: r.name, price, paid, closeYear: s.year + 1, status: 'pending' });
  return `Signed a deal for ${r.name}. Closes in ${s.year + 1}.`;
}

function closeDeals(s, news) {
  for (const d of s.deals.filter(x => x.status === 'pending' && x.closeYear <= s.year)) {
    const r = companyById(s, d.target), m = s.me;
    if (!r || r.status !== 'pending') { d.status = 'failed'; m.cash += d.paid; news.push(`The ${d.name} deal falls through. Cash is returned.`); continue; }
    d.status = 'closed';
    if (d.type === 'buycompute') {
      for (const [g, n] of Object.entries(r.fleet)) m.fleet[g] = (m.fleet[g] ?? 0) + n;
      r.fleet = {}; r.status = 'active';
      news.push(`Racks from ${d.name} are now in your fleet.`);
      continue;
    }
    m.researchers += r.researchers;
    m.morale = clamp(m.morale - (d.type === 'acquire' ? 8 : 3), 0, 100);
    if (d.type === 'acquihire') { r.researchers = 0; r.status = 'dead'; news.push(`${d.name} winds down after its team joins you.`); continue; }
    m.engineers += r.engineers; m.sales += r.sales;
    for (const [g, n] of Object.entries(r.fleet)) m.fleet[g] = (m.fleet[g] ?? 0) + n;
    for (const sid of r.products) if (!m.products.includes(sid)) { m.products.push(sid); s.stats.launched[sid] = s.stats.launched[sid] ?? s.year; }
    r.status = 'acquired';
    news.push(`Acquisition of ${d.name} closes. Integration costs morale.`);
  }
}

function ipoReady(s, c) { return !c.public && c.execs.cfo && c.revenue >= 500 && s.w.index >= 100 && c.rounds.length >= 2; }

function antitrustBlocks(s, target) {
  return Object.keys(SEGMENTS).some(sid => {
    const tot = active(s).filter(c => c.products.includes(sid)).reduce((t, c) => t + weightOf(c), 0);
    const mine = [s.me, target].filter(c => c.products.includes(sid)).reduce((t, c) => t + weightOf(c), 0);
    return s.me.products.includes(sid) && target.products.includes(sid) && tot > 0 && mine / tot > 0.4;
  });
}

function spawnStartup(s, extra = {}) {
  const sids = Object.keys(SEGMENTS).filter(k => SEGMENTS[k].unlock <= 50);
  const r = makeCompany({
    id: `r${s.rivals.length}`, name: `${pick(s, NAME_PREFIXES)} ${pick(s, NAME_SUFFIXES)}`, type: 'Startup', founded: s.year,
    cash: 30, researchers: 8, engineers: 8, fleet: { a100: 5 }, dcs: [], data: 45, rep: 30, safety: 40, dist: 10, morale: 65,
    growth: 0.4, growthRes: 0.1, targets: [pick(s, sids)], mods: { talent: 0.95 + rand(s) * 0.15, noMW: true }, ...extra,
  });
  r.status = 'active';
  r.valuation = valuationOf(r, s.w);
  s.rivals.push(r);
  return r;
}

function aiTurn(s, r, news) {
  const y = s.year, w = s.w, p = bestNvidia(r, y);
  const cost = p.rackM * w.priceShock * (1 + 0.5 * w.memTight);
  const pace = y >= HISTORY_END ? 0.25 : 1;
  const n = Math.min(allocLeft(r, w, y), Math.max(1, Math.round(totalRacksOf(r) * r.growth * pace)), Math.floor(Math.max(0, r.cash) * 0.4 / cost));
  if (n > 0) { r.fleet[p.id] = (r.fleet[p.id] ?? 0) + n; r.cash -= n * cost; r.boughtYear += n; }
  if (!r.training && totalRacksOf(r) > 0) r.training = r.cash > 30 ? 'medium' : 'small';
  r.researchers *= 1 + r.growthRes;
  for (const sid of r.targets) {
    if (!r.products.includes(sid) && flagCapOf(r) >= unlockOf(r, sid) && r.cash > SEGMENTS[sid].launch * 2 && chance(s, 0.6)) { r.products.push(sid); r.cash -= SEGMENTS[sid].launch; }
  }
  if (r.cash < 40 && r.valuation > 0 && r.raisedYear < y) { r.cash += r.valuation * 0.1; r.raisedYear = y; }
  if (!r.public && r.revenue >= 1000 && chance(s, 0.4)) { r.public = true; r.ipoYear = y; r.cash += r.valuation * 0.12; }
  if (r.cash > 600 && chance(s, 0.1)) {
    const t = activeRivals(s).find(x => x !== r && !x.real && x.valuation < r.valuation * 0.1 && !antitrustBlocks(s, x));
    if (t) {
      t.status = 'acquired';
      r.researchers += t.researchers; r.engineers += t.engineers;
      for (const sid of t.products) if (!r.products.includes(sid)) r.products.push(sid);
      r.cash -= t.valuation * 0.9;
      news.push(`${r.name} acquires ${t.name}.`);
    }
  }
}
